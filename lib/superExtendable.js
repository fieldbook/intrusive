// Mixin to enhance a constructor's `extend` method to make calling super
// methods easier.
//
// Adds superExtend to the constructor, which works like extend, only you give
// it a function which will be passed a `sup` argument, which is the parent
// prototype. Thus you can do:
//
//   sup.someMethod.apply(this, arguments)
//
// to get the equivalent of
//
//   Parent.prototype.someMethod.apply(this, arguments)
//
// If the constructor is not already extendable, it will have that mixin
// applied automatically.

var extendable = require('./extendable');

var superExtend = function (optionsFunc) {
  var sup = this.prototype;
  var options = optionsFunc(sup);
  return this.extend(options);
}

module.exports = function (constructor) {
  if (constructor.extend == null) extendable(constructor);
  constructor.superExtend = superExtend;
  return constructor;
}
