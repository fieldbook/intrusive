// Mixin to override a constructor's extend method with one that allows attaching post-extend hooks

var postExtendHookable = module.exports = function (ctor) {
  var originalExtend = ctor.extend;

  ctor.extend = function () {
    var parent = this;
    var child = originalExtend.apply(parent, arguments);

    if (parent._postExtend) {
      _.each(parent._postExtend, function (hookFn) {
        child = hookFn(parent, child) || child;
      })
    }

    return child;
  }

  ctor.registerPostExtendHook = function (hookFn) {
    var self = this;
    self._postExtend = self._postExtend || [];
    self._postExtend.push(hookFn);
  }

  return ctor;
}
