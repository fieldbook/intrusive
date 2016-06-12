// Replace non-lvalue instances of foo._ with _(foo) This removes the need for the
// objectUnderscore (except for debugging, or possibly runtime evaluation),
// and also means that null checks are often not necessary.
//
// This requires the global runtime function provided by 'dot-underscore-runtime'

module.exports = function (babel) {
  var t = babel.types;
  return {
    visitor: {
      MemberExpression: function (path) {
        if (path.node.computed) return; // do not apply to foo['_']
        if (path.node.property.name !== '_') return;
        if (t.isAssignmentExpression(path.parent) && // do not apply to foo._ = bar
          path.parent.left === path.node) {
          return;
        }

        // Replace `obj._` with `global._getUnderscore(obj)`
        var obj = path.node.object;
        var replacement = t.callExpression(
          t.memberExpression(// callee
            t.identifier('global'), // object
            t.identifier('_getUnderscore'), // property
            false // computed
          ),
          [obj] // arguments
        );

        path.replaceWith(replacement);
      },
    }
  }
}
