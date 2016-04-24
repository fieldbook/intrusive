// Create a property on an object that will only be populated when it is first accessed.
// Once created, it will become an ordinary object property (not accessor based).
//
// The property is bound to the object passed, so if you add a lazy property to a prototype,
// it will still be attached to the prototype once an instance accesses it.

var makeLazyProperty = module.exports = function (object, name, getter) {
  Object.defineProperty(object, name, {
    configurable: true,
    get: function () {
      // Create the value at time of access
      var value = getter.call(object);
      // Convert into non-accessor property
      object[name] = value;
      return value;
    },

    set: function (value) {
      // Remove defined property
      delete object[name];
      // Set directly
      object[name] = value;
    },
  })
}
