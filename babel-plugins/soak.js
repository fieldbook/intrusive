// Soak unary pseudo-operator.
// Overrides the unary "+~" to produce a null checked member chain, including method calls

module.exports = function (babel) {
  const t = babel.types;

  const tpl = {
    member: babel.template(`
      (
        OBJ = OBJECT,
        OBJ == null
          ? undefined
          : OBJ[NAME]
      )
    `),

    // Soak a callee, handling the case where it evaluates to null
    func: babel.template(`
      (
        FN = CALLEE,
        FN == null
          ? __soakNoop
          : FN
      )
    `),

    // Soak a potential method (a callee that is a member expression)
    // If the method doesn't exist, gives a noop, otherwise binds the method
    // to the object
    method: babel.template(`
      (
        OBJ = OBJECT,
        FN = OBJ == null
          ? __soakNoop
          : OBJ[NAME],

        FN == null
          ? __soakNoop
          : FN.bind(OBJ)
      )
    `),
  }

  // All member expressions are converted to computed expressions
  // so we need to convert names into strings
  function getMemberName(memberNode) {
    if (memberNode.computed) {
      return memberNode.property;
    } else {
      return t.stringLiteral(memberNode.property.name);
    }
  }

  // Convert a member expression into a soak
  function soakFromMember(memberNode, temps) {
    // Soak the left side of the member expression
    let object = createSoakNode(memberNode.object, temps);
    let memberName = getMemberName(memberNode);

    return tpl.member({
      OBJ: temps.object,
      OBJECT: object,
      NAME: memberName,
    }).expression;
  }

  // Create a soak from a member expression that is a callee
  // Creates a new expression which binds the method property to its soaked object
  function soakFromCalleeMember(memberNode, temps) {
    let object = createSoakNode(memberNode.object, temps);
    let memberName = getMemberName(memberNode);

    return tpl.method({
      OBJ: temps.object,
      FN: temps.property,
      OBJECT: object,
      NAME: memberName,
    }).expression
  }

  // Convert a call expresson into a soak
  function soakFromCall(callNode, temps) {
    let {callee} = callNode;
    // Special case the callee if it's a member
    if (t.isMemberExpression(callee)) {
      callee = soakFromCalleeMember(callee, temps);
    } else {
      callee = createSoakNode(callee, temps);
    }

    let soakedFn = tpl.func({
      OBJ: temps.object,
      FN: temps.property,
      CALLEE: callee,
    }).expression;

    return t.callExpression(soakedFn, callNode.arguments);
  }

  // Recursively convert a node into one that checks nulls
  function createSoakNode(node, temps) {
    if (t.isMemberExpression(node)) {
      return soakFromMember(node, temps)
    } else if (t.isCallExpression(node)) {
      return soakFromCall(node, temps);
    } else {
      // Pass through anything else; no soak to be done on identifiers for
      // example
      return node;
    }
  }

  // Create temporary variables, and return their identifiers
  // This includes:
  //   object, which is generally the left side of a member expression (save off results to preserve side effects)
  //   property, which is the right side of a member expression (see above)
  function createTemps(path) {
    let temps = {};
    temps.object = path.scope.generateUidIdentifier('obj');
    temps.property = path.scope.generateUidIdentifier('prop');

    path.scope.push({id: temps.object});
    path.scope.push({id: temps.property});

    return temps;
  }

  return {
    visitor: {
      UnaryExpression(path, state) {
        let {node} = path;

        // Check correct operator
        if (node.operator !== '+') return;

        let plusArgument = node.argument;

        // Argument must be a unary ~
        if (!t.isUnaryExpression(plusArgument, {operator: '~'})) return;

        // Checkpoint: This is a soak node, so we should transform it
        let targetNode = plusArgument.argument;

        // Create temporary variables
        let temps = createTemps(path)

        let replacementNode = createSoakNode(targetNode, temps);
        path.replaceWith(replacementNode);
      },
    },
  };
};
