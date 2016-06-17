// Adds syntax for defaulting nullish values (null or undefined).
// Usage:
//   Single value
//     IfUnset, foo = 'bar';
//
//   Multiple values:
//     IfUnset, foo = 'bar', baz = 'qux';
//
//  Member expressions:
//     IfUnset, foo.bar = 'baz'
//
//  Note that you cannot use this macro on the arguments array.

module.exports = function (babel) {
  var t = babel.types;

  var handleNode = function (path) {
    var firstExpression = path.node.expressions[0];
    if (!t.isIdentifier(firstExpression)) return;
    if (firstExpression.name !== 'IfUnset') return;

    var makeBlock = function (expressions) {
      return t.blockStatement(expressions.map(makeExpression))
    }

    var makeExpression = function (assignment) {
      if (!t.isAssignmentExpression(assignment)) throw new Error('IfUnset with non-assignment');
      if (assignment.operator !== '=') throw new Error('IfUnset with operator other than =');

      var left = assignment.left;
      var right = assignment.right;

      // Member expressions are special case because of side effects
      if (t.isMemberExpression(left)) {
        return makeSafeStatement(left, right);
      }

      // Non-member expressions are simple
      return makeConditionalAssignment(left, right);
    }

    var makeConditionalAssignment = function (left, right) {
      return t.ifStatement(
        makeNullTest(left),
        makeAssignmentStatement(left, right)
      )
    }

    // Saves off the object side of a member expression in a temporary variable,
    // to prevent additional side effects
    var makeSafeStatement = function (memberExpr, right) {
      var tempObjectId = path.scope.generateUidIdentifier('memberObject');
      var declarators = [t.variableDeclarator(tempObjectId, memberExpr.object)]
      var computed = memberExpr.computed;

      var safeProperty = memberExpr.property;

      // If the property is computed, then it may also have side effects, so save it off too
      if (computed) {
        safeProperty = path.scope.generateUidIdentifier('memberProperty');
        declarators.push(t.variableDeclarator(safeProperty, memberExpr.property));
      }

      var safeMember = t.memberExpression(tempObjectId, safeProperty, computed);
      return t.blockStatement([
        t.variableDeclaration('var', declarators),
        makeConditionalAssignment(safeMember, right)
      ])
    }

    var makeNullTest = function (left) {
      return t.binaryExpression('==', left, t.nullLiteral())
    }

    var makeAssignmentStatement = function (left, right) {
      return t.expressionStatement(t.assignmentExpression('=', left, right));
    }

    // Wrap the block of expressions in an iife (because we must return an expression)
    path.replaceWith(t.callExpression(
      t.functionExpression(null, [], makeBlock(path.node.expressions.slice(1))),
      []
    ));
  }

  return {
    visitor: {SequenceExpression: handleNode}
  }
}
