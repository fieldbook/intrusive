// Allow a new syntax for postfix conditionals through the If pseudofunction
//
// Examples:
//
//  Expression:
//   view.render(), If(view.needsRender)
//
//  throw/return statement with operand:
//   throw new Error('Out of bounds'), If(i > arr.length);
//   return false, If(this.disabled);
//
//  return without operand
//   return If(noChange);
//
// In all cases, Unless may be used as a negated If
//
// Note that there is no postfix if for `break` or `continue` statements.

module.exports = function (babel) {
  var t = babel.types;

  var calleePattern = /^(If|Unless)$/;

  // Get consequent and normalize it to a statement
  var getConsequentStatement = function (path) {
    var consequent = getConsequent(path);
    if (t.isExpression(consequent)) {
      consequent = t.expressionStatement(consequent);
    }
    return consequent;
  }

  // Statement that will be replaced with the if statement
  var getOuterStatement = function (path) {
    var inspector = inspectorForPath(path);
    return inspector.outerPath(path);
  }

  // Raw consequent (not necessarily a statement)
  var getConsequent = function (path) {
    var inspector = inspectorForPath(path);
    return inspector.consequent(path);
  }

  var grandparentPath = function (path) {
    return path.parentPath.parentPath;
  }

  var assertValidSequence = function (node) {
    var err = function () {
      throw new Error('Postfix if/unless must be last expression in a two-expression sequence');
    }
    if (node.expressions.length !== 2) {
      err();
    }

    var firstExpression = node.expressions[0];
    if (t.isCallExpression(firstExpression) && calleePattern.test(firstExpression.callee.name)) {
      err();
    }
  }

  // Get the inspector which will answer questions about the path
  var inspectorForPath = function (path) {
    var inspector = nodeInspectors.find(inspector => inspector.test(path));
    if (!inspector) throw new Error('No inspector matched the node');
    return inspector;
  }

  var bareReturnInspector = {
    test: function (path) {
      return path.parent.type === 'ReturnStatement';
    },

    consequent: function (path) {
      return t.returnStatement();
    },

    outerPath: function (path) {
      return path.parentPath;
    },
  };

  var unaryCompletionInspector = {
    test: function (path) {
      var sequence = path.parent;
      if (!t.isSequenceExpression(sequence)) return false;

      assertValidSequence(sequence);

      // Grandparent must be return or throw statement
      var grandparent = grandparentPath(path).node;
      var grandparentPattern = /^(Return|Throw)Statement$/;
      if (!grandparentPattern.test(grandparent.type)) return false;

      return true;
    },

    consequent: function (path) {
      var grandparent = grandparentPath(path);
      var sequence = path.parent;
      var argument = sequence.expressions[0];
      return t[grandparent.node.type](argument);
    },

    outerPath: function (path) {
      return grandparentPath(path);
    },
  };

  var expressionInspector = {
    test: function (path) {
      var sequence = path.parent;
      if (!t.isSequenceExpression(sequence)) return false;
      assertValidSequence(sequence);

      if (!t.isExpressionStatement(grandparentPath(path).node)) return false;
      return true;
    },

    consequent: function (path) {
      var sequence = path.parent;
      return sequence.expressions[0];
    },

    outerPath: function (path) {
      return grandparentPath(path);
    },
  };

  var nodeInspectors = [
    bareReturnInspector,
    unaryCompletionInspector,
    expressionInspector,
  ];

  return {
    visitor: {
      CallExpression: function (path) {
        var callee = path.node.callee;

        if (callee.type !== 'Identifier') return;
        if (!calleePattern.test(callee.name)) return;

        var args = path.node.arguments;
        if (args.length > 1) throw new Error('If/Unless must have single argument for condition');

        var condition = args[0];

        // Only difference for an Unless is that the condition is negated.
        if (callee.name === 'Unless') {
          condition = t.unaryExpression('!', condition)
        }

        var consequent = getConsequentStatement(path);
        var ifStatement = t.ifStatement(condition, consequent);

        var outerStatement = getOuterStatement(path);
        outerStatement.replaceWith(ifStatement);
      },
    },
  }
}
