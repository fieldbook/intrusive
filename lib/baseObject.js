// This is a base prototype for objects to inherit from if they don't extend
// Backbone prototypes like View. It provides the 'extendable' interface, and
// has a baked-in underscore property.
//
// You can also specify a propertyNames method, which should return an array
// of names to pull from the options hash passed to the constructor. (this is
// a method rather than a bare array so that you can easily extend it and add
// on to the parent prototype's list)

// For some reason, browserify is pulling baseObject before objectUnderscore via BookSocket,
// causing errors here if we don't explicitly rerequire it.
// [Ada Cohen @ 2016-01-14 10:03:49]
require('./objectUnderscore');
var superExtendable = require('./superExtendable');
var gettable = require('./gettable');
var singletonable = require('./singletonable');

// Check that the constructor was called with `new`
function badConstructorCall(obj) {
  return obj === this;
}

function BaseObject(options) {
  if (badConstructorCall(this)) {
    throw new Error('Constructor called without "new"');
  }

  this.options = options || {};
  this.pickProperties();
  this.cid = this.cid || _.uniqueId(this.constructorName);
  this.initialize.apply(this, arguments);
}

_.extend(BaseObject.prototype, {
  initialize: function () {},

  constructorName: 'baseObject',

  pickProperties: function (options) {
    options = options || this.options || {};
    var names = this._.result('propertyNames') || [];

    // We do this loop instead of _.pick because otherwise we'd have to
    // munge arguments, and V8 will deoptimize. Since this gets called very often
    // we do not want it to deopt.
    // [Spencer @ 2015-05-29 14:30:37]
    var self = this;
    names.forEach(function (name) {
      var val = options[name];
      if (val == null) return;
      self[name] = val;
    })
  },

  propertyNames: function () {
    return [];
  },
})

// Make an accessor for a property that calls _.result to normalize the value
BaseObject.resultify = function (propName) {
  return function () {
    return this._.result(propName); // jscs: nestedThisOk
  }
}

// Sugar for simple property names inheritance
// Assumes that propertyNames is a context independent pure function
BaseObject.addProperties = function (varArgs) {
  var parentProto = this.super_.prototype;
  var parentNames = _.result(parentProto, 'propertyNames', []);
  this.prototype.propertyNames = parentNames.concat(_.toArray(arguments));
  return this;
}

superExtendable(BaseObject);
gettable(BaseObject);
singletonable(BaseObject);

var originalExtend = BaseObject.extend;

module.exports = BaseObject;

// A helper function to wrap anonymous hashes in a base object.
//
// We jump through some hoops here to avoid running the constructor code so
// that we don't have to have a cid or an options property on the resulting
// object (so things like obj._.keys() will return expected values)
BaseObject.wrapObject = function (obj) {
  var baseObject = Object.create(BaseObject.prototype);

  _.extend(baseObject, obj);
  return baseObject;
};

// Setup O to be a shortcut for creating base objects
global.O = BaseObject.wrapObject;
