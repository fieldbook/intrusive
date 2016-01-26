module.exports = function () {};

module.exports.prototype.getOptionName = function () {
  return 'restrictNestedThis';
};

module.exports.prototype.configure = function (options) {
  this.allowedNames = options.allowedThisFunctions;
  this.allowedGrandparents = options.allowedGrandparents;
  this.allowedConstructors = options.allowedConstructors;
};

module.exports.prototype.check = function (file, errors) {
  var allowedNames = this.allowedNames;
  var allowedGrandparents = this.allowedGrandparents;
  var allowedConstructors = this.allowedConstructors;

  var comments = {};
  file.getComments().forEach(function (comment) {
    comments[comment.loc.start.line] = comment;
  })

  file.iterateNodesByType('ThisExpression', function (node) {
    // Check that the node is inside a function
    var parentFunction = nearestFunctionParent(node);
    if (!parentFunction) {
      errors.add('"this" used outside of function', node.loc.start);
      return;
    }

    if (hasSuppressionComment(node, comments)) return;

    // Check if we're in a nested function
    var grandparentFunction = nearestFunctionParent(parentFunction);
    if (!grandparentFunction) return; // this is always fine in a top level function

    var grandparentCalleeName = calleeNameForArgument(grandparentFunction);
    if (allowedGrandparents.indexOf(grandparentCalleeName) !== -1) return;

    var parent = node.parentNode;

    // Check that if parent is an assignment
    if (parent.type === 'VariableDeclarator') return; // allowed in assignment

    // Check if the function is bound
    if (isBoundFunction(parentFunction)) return; // allowed in bound function

    // Check if the function is an argument to an allowed function
    var calleeName = calleeNameForArgument(parentFunction);
    if (allowedNames.indexOf(calleeName) !== -1) return;

    if (hasAllowedConstructor(node, allowedConstructors)) return;

    errors.add('"this" can only be used in a variable declaration in nested functions', node.loc.start);
  });
};

function hasSuppressionComment(node, comments) {
  var line = node.loc.start.line;
  if (line in comments) {
    var comment = comments[line]

    // If it matches "jscs: nestedThisOk"
    return /^\s*jscs:\s+nestedThisOk\s*$/.test(comment.value);
  }

  return false;
}

function hasAllowedConstructor(node, allowedConstructors) {
  var functionCount = 0;
  var constructor = findAncestor(node, function (ancestor) {
    if (nodeIsFunction(ancestor)) {
      functionCount++;
    }

    return ancestor.type === "NewExpression" && functionCount < 2
  })

  var name = calleeNameForCall(constructor);
  return allowedConstructors.indexOf(name) !== -1;
}

function findAncestor(node, test) {
  var parent = node.parentNode;
  if (!parent) return null;
  if (test(parent)) return parent;
  return findAncestor(parent, test);
}

function nearestFunctionParent(node) {
  return findAncestor(node, nodeIsFunction)
}

function nodeIsFunction(node) {
  return ['FunctionExpression', 'FunctionDeclaration'].indexOf(node.type) !== -1;
}

function isBoundFunction(node) {
  if (node.type !== 'FunctionExpression') return false;
  var outsideFunction = false;
  var bindAncestor = findAncestor(node, function (node) {
    if (outsideFunction) return false;
    if (nodeIsFunction(node)) {
      outsideFunction = true;
      return false;
    }
    if (node.type !== 'MemberExpression') return false;
    return node.property && node.property.name === 'bind';
  })
  return bindAncestor !== null;
}

function calleeNameForArgument(argumentNode) {
  var outsideFunction = false;
  var callAncestor = findAncestor(argumentNode, function (node) {
    if (outsideFunction) return false;
    if (nodeIsFunction(node)) {
      outsideFunction = true;
      return false;
    }
    return node.type === 'CallExpression';
  })

  if (!callAncestor) return false;

  return calleeNameForCall(callAncestor);
}

function calleeNameForCall(callNode) {
  if (!callNode) return false;

  var callee = callNode.callee;
  if (!callee) return null;
  var node = callee;
  while (callee.property) {
    callee = callee.property;
  }
  return callee.name;
}
