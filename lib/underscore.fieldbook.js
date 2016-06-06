var util = require('util');

// Helpers for soak caching
//
// It turns out that the majority of overhead in executing soaks is in
// processing the path string, so this allows us to save off that work.
//
// Everything is done with lower level bare constructors (instead of
// BaseObject or extendable), to avoid constructor overhead. Soak is
// called so often that small overhead increases add up considerably
// [Spencer @ 2015-05-29 14:30:30]
function ParsedSoak(path) {
  var pathComponents;

  if (_.isString(path)) {
    pathComponents = path.split('.');
  } else {
    pathComponents = path;
  }

  this.nodes = pathComponents.map(makeSoakNode);
}

ParsedSoak.prototype.run = function (_obj, args, forceCall) {
  var obj = _obj;
  var lastObj;
  var nodes = this.nodes;

  for (var i = 0; i < nodes.length; i++) {
    if (obj == null) break;
    lastObj = obj;

    var node = nodes[i];
    obj = node.run(obj);
  }

  var shouldCall = forceCall || args.length
  if (obj && shouldCall) {
    return obj.apply(lastObj, args);
  } else {
    return obj;
  }
}

ParsedSoak.cache = {};

function makeSoakNode(pathComponent) {
  var parts = pathComponent.split('()');
  if (parts.length === 2) {
    return new FunctionSoakNode(parts[0]);
  } else if (parts[0][0] === '@') {
    return new GetterSoakNode(parts[0]);
  } else {
    return new ValueSoakNode(parts[0]);
  }
}

function SoakNode(key) {
  this.key = key;
}

function FunctionSoakNode(key) {
  SoakNode.apply(this, arguments);
}

function GetterSoakNode(key) {
  key = key.slice(1); // chop off @ sign
  SoakNode.apply(this, arguments);
}

function ValueSoakNode(key) {
  SoakNode.apply(this, arguments);
}

util.inherits(FunctionSoakNode, SoakNode);
util.inherits(ValueSoakNode, SoakNode);
util.inherits(GetterSoakNode, SoakNode);

FunctionSoakNode.prototype.run = function (obj) {
  return obj[this.key] && obj[this.key]();
}

GetterSoakNode.prototype.run = function (obj) {
  return obj.get(this.key);
}

ValueSoakNode.prototype.run = function (obj) {
  return obj[this.key];
}

_.mixin({
  // Like compact, but only filters undefined and null, not other falsey values
  compactNullish: function (arr) {
    return _.reject(arr, function (val) { return val == null });
  },

  // Note: this will not preserve prototypes or Date objects, y also not work
  // on RegExp objects
  deepClone: function (object) {
    return JSON.parse(JSON.stringify(object));
  },

  // Concats all arguments together, allows _.concat(array, obj, otherArray)
  concat: function () {
    return [].concat.apply([], arguments);
  },

  // Resolve property path, soaking up null and undefined along the path.
  //  path can be dot separated string or array of property names
  //  Functions without arguments can be called by including empty parentheses (including mid-path)
  //
  //  Additional arguments can be passed, in which case they will be passed as function arguments to the resolved path.
  //
  //  As a convenience, terms prefixed with @ will be passed to get
  //  e.g. foo.@cat === foo && foo.get('cat')

  soak: function (_obj, _path) {
    var obj = _obj;
    var path = _path;

    if (obj == null) return obj;

    var self = this;
    var key, args = [];
    for (var i = 2; i < arguments.length; i++) {
      args.push(arguments[i]);
    }

    var parsedSoak = _.getParsedSoak(path);
    return parsedSoak.run(obj, args);
  },

  // Like soak, but the last argument is an array of arguments, and always results in a function call
  soakApply: function (obj, path, args) {
    var parsedSoak = _.getParsedSoak(path);
    return parsedSoak.run(obj, args, true);
  },

  soakCall: function (obj, path, varargs) {
    var args = arguments._.tail(2);
    return _.soakApply(obj, path, args);
  },

  // Create a function that applies a soak to the passed object
  // Example:
  //   var a = {b: Math.PI};
  //   var f = _.soaker('b.toFixed', 3);
  //   f(a);
  // => 3.142

  soaker: function (path, vargs) {
    var args = _.rest(arguments);
    var parsedSoak = _.getParsedSoak(path);

    return function (obj) {
      return parsedSoak.run(obj, args);
    }
  },

  // Helper for parsed soak creation/caching
  getParsedSoak: function (path) {
    // Make cache key so that array paths can't collide with string paths in the cache
    var cacheKey = _.isString(path) ? path : JSON.stringify(path);

    var parsedSoak = ParsedSoak.cache[cacheKey];
    if (!parsedSoak) {
      parsedSoak = ParsedSoak.cache[cacheKey] = new ParsedSoak(path);
    }

    return parsedSoak;
  },

  // Like pluck, but with soak's path resolution and null propagation.
  pluckSoak: function (arr, path, vargs) {
    var soakerArgs = _.rest(arguments);
    var soaker = _.soaker.apply(_, soakerArgs);
    return _.map(arr, soaker);
  },

  // Like filter, but with soak's path resolution and null propagation
  filterSoak: function (arr, path, vargs) {
    var soakerArgs = _.rest(arguments);
    var soaker = _.soaker.apply(_, soakerArgs);
    return _.filter(arr, soaker);
  },

  // Map using a method (or method name); binds automatically and also *only* passes the item from the array,
  // preventing unexpected additional arguments.
  mapMethod: function (arr, obj, method) {
    if (!_.isFunction(method)) {
      method = obj[method];
    }

    var fn = function (item) {
      return method.call(obj, item);
    }

    return _.map(arr, fn);
  },

  // Uniq using a map to achieve linear time
  uniqString: function (arr, mappingFn, context) {
    var seen = {};
    var cb = _.iteratee(mappingFn, context);
    return _.filter(arr, function (value) {
      var mappedValue = cb(value);
      if (seen[mappedValue]) return false;
      seen[mappedValue] = true;
      return true;
    })
  },

  // Similar to slice, but different edge behavior.
  // If start and stop are out of bounds, the returned array will be padded with undefineds.
  // Start and stop semantics are same as range (include start, don't include stop).
  getRange: function (arr, start, stop) {
    return start._.range(stop).map(function (i) { return arr[i]; });
  },

  // Create an iterator function that iterates over a range
  rangeIterator: function (start, stop, step) {
    step = step || 1;
    return function (iterator) {
      for (var i = start; i < stop; i += step) {
        iterator(i);
      }
    }
  },

  iterateRange: function (start, stop, step, fn) {
    if (arguments.length === 3) {
      fn = step;
      step = 1;
    }
    var iterator = _.rangeIterator(start, stop, step);
    iterator(fn);
  },

  // Array access (useful within chains)
  at: function (arr, index) {
    return arr[index];
  },

  // return true if str begins with prefix
  hasPrefix: function (str, prefix) {
    if (prefix == null) return false;
    if (str == null) return false;
    return str.substring(0, prefix.length) === prefix
  },

  // like _.contains, but optimized for sorted arrays
  containsSorted: function (arr, target) {
    return _.indexOf(arr, target, true) !== -1;
  },

  // Only works on two arrays, and second array must be sorted
  differenceSorted: function (a, b) {
    return _.filter(a, function (item) {
      return !_.containsSorted(b, item);
    })
  },

  // constrain a value to a [min, max] inclusive range
  clamp: function (val, min, max) {
    if (arguments.length === 2) {
      max = min;
      min = 0;
    }
    return Math.max(min, Math.min(val, max));
  },

  // Convert an object with array values to an array of objects with those values
  transposeObject: function (obj) {
    var keys = Object.keys(obj);
    var result = [];
    keys.forEach(function (key) {
      obj[key].forEach(function (val, index) {
        var resultObject = result[index] || (result[index] = {});
        resultObject[key] = val;
      })
    })
    return result;
  },

  // Turn an MxN 2D array into an NxM 2D array
  transpose: function (arrayOfArrays) {
    return _.zip.apply(_, arrayOfArrays);
  },

  // Simple sum over an array
  sum: function (arr) {
    return _.reduce(arr, function (a, b) { return a + b }, 0);
  },

  // Debug helper wraps a function to log its return value before returning
  logResult: function (tag, fn) {
    if (_.isFunction(tag)) {
      fn = tag;
      tag = 'Result';
    }
    tag += ': '
    return function () {
      var result = fn.apply(this, arguments);
      console.log(tag, result);
      return result;
    };
  },

  // Helper to wrap a value and log it before returning it
  passThruLog: function (val) {
    console.log(val);
    return val;
  },

  // Take a list of properties from `source` and put them on `obj`
  pickFrom: function (obj, source, key1, key2, keyN) {
    var keys = _(arguments).toArray().slice(2);
    return _.extend(obj, _.pick(source, keys));
  },

  // Pick indexes from an array
  pickArray: function (arr, indexes) {
    return indexes.map(function (i) {
      return arr[i];
    })
  },

  // create a wrapped function with a limited number of recursion levels,
  // throwing an error if that limit is exceeded
  limitRecursion: function (limit, fn) {
    var count = 0;
    return function () {
      count++;
      if (count > limit) {
        throw new Error('Recursion limit (' + limit + ') exceeded');
      }
      var result = fn.apply(this, arguments);
      count--;
      return result;
    }
  },

  // find first index where element matches query
  findIndexWhere: function (arr, attrs) {
    return _.findIndex(arr, _.matches(attrs));
  },

  // Always throw an error
  thrower: function (message) {
    return function () {
      throw new Error(message);
    }
  },

  // Bind every function on obj to obj
  bindAllFunctions: function (obj) {
    _.bindAll.apply(_, [obj].concat(_.functions(obj)));
    return obj;
  },

  // Wrap a function but put a debugger statement before it
  debugBefore: function (fn) {
    return function () {
      /* jshint -W087 */ // Allow debugger statement here
      debugger;
      /* jshint +W087 */ // Disallow debugger statements
      return fn.apply(this, arguments);
    }
  },

  // Create a wrapper function that breaks after a certain depth of recursion
  debugOnRecurseLevel: function (level, fn) {
    return function () {
      level--;
      if (!level) {
        /* jshint -W087 */ // Allow debugger statement here
        debugger;
        /* jshint +W087 */ // Disallow debugger statements
      }
      var result = fn.apply(this, arguments);
      level++;
      return result;
    }
  },

  // Wrap a value and provide a condition function to decide whether to invoke the debugger before returning the result.
  // can also pass a string as the constructor, like '> 5', which will be eval'd
  debugIf: function (value, condition) {
    condition = condition || '';
    if (_.isString(condition)) {
      /* jshint -W054 */
      condition = new Function('v', 'return v' + condition);
      /* jshint +W054 */
    }
    /* jshint -W087 */
    if (condition(value)) debugger;
    /* jshint +W087 */
    return value;
  },

  // Attach an accessor to debug the next time a given property is set on obj
  debugProperty: function (obj, propertyName, debugGet) {
    // Use the closure to store the value
    var value = obj[propertyName];
    Object.defineProperty(obj, propertyName, {
      get: function () {
        if (debugGet) {
          /* jshint -W087 */
          debugger;
          /* jshint +W087 */
        }

        return value;
      },

      set: function (newValue) {
        /* jshint -W087 */
        debugger;
        /* jshint +W087 */
        value = newValue;
      },
    })
  },

  stencil: function (str, data) {
    if (!str) return null;
    return _.template(str)(data);
  },

  // Turn an array into an object for testing membership
  makeSet: function (arr) {
    var set = {};
    if (!arr) return set;
    _.each(arr, function (key) {
      set[key] = true;
    })

    return set;
  },

  // Just an alias for pick that makes it more explicit
  filterObject: function (obj, fn, context) {
    return _.pick.apply(_, arguments);
  },

  // Return a new function that takes an `args` argument and applies the
  // original function with those arguments.
  // Useful zipping multiple arrays and passing them as arguments to an iterator.
  spread: function (fn) {
    return function (args) {
      var self = this;
      return fn.apply(self, args);
    }
  },

  // Ensure that a subobject exists and then return it
  // e.g.
  // a = {foo: {x: 'qux'} bar: 1}
  // b = {bar: 2}
  // _.ensureChild(a, 'foo').y = 'baz'; a.foo --> {x: 'qux', y: 'baz'}
  // _.ensureChild(b, 'foo').y = 'gralt'; b.foo --> {y: 'gralt'}
  ensureChild: function (obj, childName, defaultValue) {
    if (defaultValue == null) defaultValue = {};
    if (obj[childName] == null) obj[childName] = defaultValue;
    return obj[childName];
  },

  // Take a path (an array of strings) and ensure that the object hierarchy exists for
  // the entire path. If `defaultEndValue` is provided, it will be used for the
  // end point.
  // e.g.
  // a = {foo: {x: 'qux'}, bar: 1}
  // _.ensurePath(a, 'foo.bar.baz.qux', []); a.foo --> {bar: {baz: {qux: []}}}
  ensurePath: function (obj, path, defaultEndValue) {
    var lastChild = _.last(path);
    path = _.chain(path).initial().each(function (childName) {
      obj = _.ensureChild(obj, childName);
    })

    obj = _.ensureChild(obj, lastChild, defaultEndValue);
    return obj;
  },

  // Like reduce, but memo is an object (which can be omitted)
  // and the return value of the callback is unused
  // Useful for building an object out of an array of keys, for example
  reduceToObject: function (list, obj, iteratee) {
    if (arguments.length < 3) {
      iteratee = obj;
      obj = {};
    }

    return _.reduce(list, function (obj, val) {
      iteratee(obj, val);
      return obj;
    }, obj)
  },

  // Like fn.apply but for constructors
  // Taken from http://stackoverflow.com/a/8843181
  applyConstructor: function (Ctor, args) {
    var bindArgs = [null].concat(args); // 'this' arg is ignored when bind result is called with new
    // Bind the constructor to the arguments given, and then call the bound constructor with new
    var Bound = (Function.prototype.bind.apply(Ctor, bindArgs));
    return new Bound();
  },

  // Like fn.apply, but flipped, so you call on the object and pass the method
  // name and an array of arguments.
  applyMethod: function (obj, methodName, args) {
    return obj[methodName].apply(obj, args);
  },
});

// Add stencil adapter directly on String
// jshint freeze:false
String.prototype.stencil = function (data) {
  return this._.stencil(data);
}
// jshint freeze:true

_.templateSettings.interpolate = /\{\{(.+?)\}\}/g;

// For chaining, convert an underscore object into jQuery array
// (will terminate the chain automatically)
Object.defineProperty(_.prototype, '$', {
  get: function () {
    return $(this.value());
  }
})

// Wrap elements of an array with jquery
Object.defineProperty(_.prototype, 'map$', {
  get: function () {
    var arr = this.value();
    var result = arr.map($);
    if (this._chain) {
      return result._.chain();
    } else {
      return result;
    }
  }
})
