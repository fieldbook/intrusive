// Sugar for defined properties.
// Pass a hash mapping property names to methods, soak strings, or arrays of the form
// [<soak string>, <arg1>, <arg2>...]

var methods = {
  addGetters: function (getters) {
    var constructor = this;

    var descriptors = _.mapObject(getters, function (getter, name) {
      if (_.isString(getter)) getter = [getter];

      if (_.isArray(getter)) {
        var soaker = _.soaker.apply(_, getter);
        getter = function () {
          return soaker(this); // jscs: nestedThisOk
        }
      }

      return {
        set: function () {
          throw new Error('Cannot set read-only property "' + name + '"')
        },
        get: getter,
      }
    })

    Object.defineProperties(constructor.prototype, descriptors);
    return this;
  },

  forwardProperties: function (baseKey, varkeys) {
    var keys = _.tail(arguments);
    var getters = {};
    _.each(keys, function (key) {
      getters[key] = baseKey + '.' + key;
    })

    this.addGetters(getters);
    return this;
  },
}

module.exports = function (constructor) {
  _.defaults(constructor, methods);
  return constructor;
}
