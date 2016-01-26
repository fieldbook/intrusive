// Proxify is a meta programming helper that will proxy all methods from a
// targetConstructor onto another constructor, adding methods to the
// proxyConstructor that calls them.  Forwards to a particular propertyName on
// the proxyConstructor.  Does nothing if that property is not defined.
//
// USE CASE
//
// Say you wanted all of a ProxyRecord class to support all the methods onj
// Record, where the ProxyRecord object has a property called 'record' that is
// an actual Record object. You could call proxify like this:
//
// proxify(ProxyRecord, Record, 'record');
//
// And now ProxyRecord has a forwarder for every method in Record, that
// forwards to record.calledMethod.
//
// Note that on the proxyConstructor you can define methods you want to
// intercept just be defining them on the prototype before calling proxify.
//

/* jshint forin:false */

var proxify = function (proxyConstructor, targetConstructor, propertyName) {
  function addProxyMethod(methodName) {
    proxyConstructor.prototype[methodName] = function () {
      var forwardTo = this[propertyName]; // jscs: nestedThisOk
      if (!forwardTo) return;
      return forwardTo[methodName].apply(forwardTo, arguments);
    }
  }

  for (var name in targetConstructor.prototype) {
    if (!_.isFunction(targetConstructor.prototype[name])) continue;
    if (proxyConstructor.prototype[name]) continue;
    addProxyMethod(name);
  }
}

/* jshint forin:true */

module.exports = proxify;
