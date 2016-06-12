var enableObjectUnderscore = exports.enableObjectUnderscore = function (underscore) {
  // Add underscore property to all objects
  Object.defineProperty(Object.prototype, '_', {
    configurable: true,
    get: function () {
      return underscore(this); // jscs: nestedThisOk
    },

    set: function (val) {
      var self = this;
      // Setting the value will remove the underscore accessor
      // (in fact, it redefines it as an accessor that behaves like a normal property)
      //
      // This reduces compatibility issues with libraries (for example webdriver) that actually
      // want to set an underscore property on objects.
      Object.defineProperty(self, '_', {enumerable: true, writable: true, value: val, configurable: true});
    }
  })

  // We need to save off the underscore object so we can set it explicitly on the global object
  // (otherwise it will be overridden by the object prototype for reasons that are not entirely clear)
  // [Ada Cohen @ 2016-01-14 08:59:30]

  Object.defineProperty(global, '_', {
    get: underscore.constant(underscore),
    set: underscore.noop,
  })
}

if (!process.env.INTRUSIVE_NO_OBJECT_UNDERSCORE) {
  enableObjectUnderscore(require('underscore'));
}
