// This is a (simplified) Backbone-style extend function. You add it to constructors so that other
// constructors can easily inherit from them. E.g., if you have a general Model, and you want to be
// able to define User and Record as constructors that extend Model, you do:
//
// var extendable = prequire('server/utils/extend');
// extendable(Model);
// var User = Model.extend({...});
//
// ... just like with Backbone base constructors.

var postExtendHookable = require('./postExtendHookable');

var util = require('util');

var extend = function (options) {
  var parent = this;
  var child = function () { return parent.apply(this, arguments); }; // jscs: nestedThisOk
  if (options.constructorName) child.name = options.constructorName;

  _.extend(child, parent); // Allows sub classes to be extendable
  util.inherits(child, parent);
  _.extend(child.prototype, options);

  return child;
}

var extendable = function (constructor) {
  constructor.extend = extend;
  return postExtendHookable(constructor);
}

module.exports = extendable;
