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
//  Care is taken to prevent duplicated side effects, so
//    IfUnset, foo().bar[baz()] = qux()
//  is guaranteed to call foo, baz, and qux only once each.
//  If bar is an accessor, its accessor method will also be called only once.
//
//  Note that you cannot use this macro on the arguments array.

// Technical notes:
//
// For simple assignments, where the left side of the assignment is an identifier:
//    IfUnset, foo = bar;
//  The transformation is simple:
//    if (foo == null) foo = bar;
//
//  If the left side of an assignment is a member expression:
//    IfUnset, foo.bar.baz = qux;
//  It is assumed that the left side may have side effects. It's important that no more
//  side effects occur than the original code implies, so the transformation
//    if (foo.bar.baz == null) foo.bar.baz = qux;
//  is not acceptable. Instead, we store in a temporary variable:
//    var memberObject = foo.bar;
//    if (memberObject.baz == null) memberObject.baz = qux;
//
//  Finally, if the left side of the assignment is a computed member expression:
//    IfUnset, foo[bar.baz()] = qux;
//  then again, the property expression `bar.baz()` may have side effects, so again
//  a temporary variable is used:
//     var memberProperty = bar.baz();
//     var memberObject = foo;
//     if (memberObject[memberProperty] == null) memberObject[memberProperty] = qux;
//
//  The IfUnset sequence is handled as an expression, so its transformed output
//  is an iife, but that iife has no return value. So:
//     var x = (IfUnset, a = 1)
//  is valid, and will result in x being undefined.

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
        makeConditionalAssignment(safeMember, right),
      ])
    }

    var makeNullTest = function (left) {
      return t.binaryExpression('==', left, t.nullLiteral())
    }

    var makeAssignmentStatement = function (left, right) {
      return t.expressionStatement(t.assignmentExpression('=', left, right));
    }

    // Wrap the block of expressions in a bound iife (because we must return an expression)
    path.replaceWith(t.callExpression(
      t.memberExpression(
        t.functionExpression(null, [], makeBlock(path.node.expressions.slice(1))),
        t.identifier('call')
      ),
      [t.thisExpression()]
    ));
  }

  return {
    visitor: {SequenceExpression: handleNode},
  }
}
