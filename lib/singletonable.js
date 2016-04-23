// Add lazy singletons to Constructors. This adds a makeSingleton class
// method, which will create a singleton property of the given name, passing
// the remaining arguments to the constructor.
//
// The singleton is constructed on first access, through
// Object.defineProperty. This defers initialization, simplifying dependency
// management.

module.exports = function (Constructor) {
  Constructor.makeSingleton = function (name, varargs) {
    // Singleton should be of whatever makeSingleton was called on, not
    // necessarily what was passed to singletonable()
    var Child = this;
    varargs = arguments._.tail();

    // Storage for the the singleton object, once it is created
    var singleton;
    Object.defineProperty(Child, name, {
      get: function () {
        if (!singleton) singleton = _.applyConstructor(Child, varargs)
        return singleton;
      },
    })
  }
}
