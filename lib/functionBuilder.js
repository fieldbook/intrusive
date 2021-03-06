var BaseObject = require('./baseObject');
require('./proto/index');

var ArgumentsSlicer = require('./argumentsSlicer');

// FunctionBuilder is a toolset for manipulating functions by either calling
// methods on a function object or by using the supplied FB global.
//
// You can call each of the transforms on either a function itself like so:
//   function () { return 4 }.q();
//
// Or by using the FB object and calling func like so:
//   FB.q().func(function () { return 4  });
//
// This allows you to choose if you want the transform to appear at the
// beginning of the function declaration or the end.
//
// When an argument to a builder is another function, you can pass it a
// string, which will be treated as a method name on the calling context.
//  (when implementing custom functions, you must enable this behavior by calling the passed function
//   using FunctionBuilder.makeApplier(fn, context).apply(fn, arguments)) or FunctionBuilder.applyFn(fn, context, args)
//   (prefer the former if you have an arguments object, since it won't deopt in v8)
//
// Available transforms:
//   q - Forces the function to return a promise.  This way inside the function
//       you can just return values, and have them wrapped in a Q():
//         function () { return 5 }.q()() === Q(5) // True
//
//   qThen - Take the result of the function and chain a promise handler onto it
//           implicitly applies the q transform
//   qFail, qSpread, qFinally, qTap, qDone - see above
//
//   async - Pass the function through Q.async (errors if not a generator function)
//           Example:
//            var onePromise = Q(1), twoPromise = Q(2);
//            var f = function * (x, y) {return (yield x) + (yield y)}
//            f(onePromise, twoPromise).then(console.log)
//              --> 3
//
//   pairsOrAttrs - Leave all but the last argument alone. If there is exactly
//                  one remaining argument, use it as the final argument.
//                  Otherwise, use the remaining arguments as alternating
//                  keys and values to construct an object as the final argument
//                  (This uses fn.length to get the argument count, so make sure to make
//                  your function header like function (a, b, c, attrs)
//
//   limitRecursion - Give a depth limit for how many times a function may recurse into itself
//
//   wrap    - Wrap a method with another function.  For instance:
//             options.success = options.success.wrap(function (originalSuccess) {})
//
//   memoizeMethod - Memoize a method, with the memo cache scoped to a particular object.
//             A method with a name of the form `memoMethod<number>` will be attached the callee object
//             If the hash function returns an object, it will be JSON stringified
//             The memoized function will have a `clear` method, which can be used to clear the cache
//             If you neeed to memoize a non-method function, you should not use this method, because
//             you will very likely cause a memory leak. Use _.memoize instead.
//
//             To call the clear, function you need to pass it the appropriate
//             context.  This is a strange api, but one that we can't find a
//             better way around. So for example of you have memoized a
//             "getValue" method, you would need to call clear like so:
//
//             obj.getValue.clear.call(obj);
//
//   withResult - Chain another function on to the original, taking the result
//                as the first argument, and the arguments array as the second.
//                For example:
//                  var foo = function(x) { return x + 5; }.withResult(function(result, args) {
//                    return [result, args[0]];
//                  });
//                  foo(10);
//              --> [15, 10]
//
//   chainable - Make the function always return `this` so it can be used in chainde calls à la jQuery
//
//   bindApply - like bind, but pass arguments as a single array, like someFunction.bindApply(this, [foo, bar, baz])
//
// Custom transforms:
//   You can register custom transforms close to where they are used.  The
//   transform will be available globally, so consider naming and if the
//   transforms should just be places in the FunctionBuilder prototype
//
//   Example: To implement a transform that forced a given return value, you
//   could do this:
//
//   var FunctionBuilder = prequire('common/functionBuilder');
//   FunctionBuilder.register('forceReturn', function (fn, forced) {
//     return function () {
//       fn.apply(this, arguments);
//       return forced
//     }
//   }
//
//   Then it could be used like so:
//
//   var log = function () { console.log('foo') }.forceReturn(5);
//   log() === 5 // true
//

var FunctionBuilder = module.exports = BaseObject.extend({
  q: function (fn) {
    return function () {
      var self = this;
      var args = arguments;
      return Q().thenImmediate(function () { // ensures that errors are wrapped
        return fn.apply(self, args);
      })
    }
  },

  qDone: function (fn) {
    return function (fn) {
      var self = this;
      var args = arguments;
      return Q().thenImmediate(function () {
        return fn.apply(self, args).done(); // eslint-disable-line fieldbook/taboo-members
      })
    }
  },

  pairsOrAttrs: function (fn) {
    var argCount = getOriginal(fn).length;
    var headArgs = argCount - 1;
    var headSlicer = ArgumentsSlicer.make(0, headArgs);
    var restSlicer = ArgumentsSlicer.make(headArgs);

    return function () {
      var self = this;
      var args = headSlicer.apply(null, arguments);

      var keysAndValues = restSlicer.apply(null, arguments);
      var attrs;
      if (keysAndValues.length === 1) { // Called with object
        attrs = keysAndValues[0];
      } else {
        keysAndValues = _.partition(keysAndValues, function (val, index) {
          return (index % 2) === 0;
        })
        attrs = _.object(keysAndValues[0], keysAndValues[1]);
      }

      return fn.apply(self, args.concat([attrs]));
    }
  },

  limitRecursion: function (fn, limit) {
    return _.limitRecursion(limit, fn);
  },

  wrap: function (originalFn, wrapperFn) {
    var slicer = ArgumentsSlicer.unshift([originalFn]);
    return function () {
      var args = slicer.apply(null, arguments);
      return applyFn(wrapperFn, this, args); // eslint-disable-line fieldbook/no-nested-this
    }
  },

  after: function (originalFn, afterFn) {
    return function () {
      var result = originalFn.apply(this, arguments); // eslint-disable-line fieldbook/no-nested-this
      makeApplier(afterFn, this).apply(null, arguments); // eslint-disable-line fieldbook/no-nested-this
      return result;
    }
  },

  before: function (originalFn, beforeFn) {
    return function () {
      makeApplier(beforeFn, this).apply(null, arguments); // eslint-disable-line fieldbook/no-nested-this
      return originalFn.apply(this, arguments); // eslint-disable-line fieldbook/no-nested-this
    }
  },

  withResult: function (originalFn, chainedFn) {
    return function () {
      var self = this;
      var result = originalFn.apply(self, arguments);
      return applyFn(chainedFn, self, [result, ArgumentsSlicer.toArray.apply(null, arguments)]);
    }
  },

  chainable: function (fn) {
    return function () {
      var self = this;
      fn.apply(self, arguments);
      return self;
    }
  },

  bindApply: function (fn, context, argsArray) {
    var bindArgs = [context].concat(argsArray);
    return fn.bind.apply(fn, bindArgs)
  },

  async: function (fn) {
    if (fn.constructor.name !== 'GeneratorFunction') {
      throw new Error("fn.async requires that fn is a generator (make sure async is the first transformation in the chain)");
    }

    return Q.async(fn);
  },

  memoizeMethod: function (originalFn, hashFn) {
    var memoMethodKey = _.uniqueId('memoMethod');
    if (hashFn) {
      var originalHashFn = hashFn
      hashFn = function () {
        var self = this;
        var hash = makeApplier(originalHashFn, self).apply(null, arguments);
        if (_.isObject(hash) || _.isArray(hash)) return JSON.stringify(hash);
        return hash;
      }
    }
    var memoFn = function () {
      var self = this;

      if (!self[memoMethodKey]) {
        var memoFn = _.memoize(originalFn, hashFn);
        Object.defineProperty(self, memoMethodKey, {
          get: function () {
            return memoFn;
          },

          set: function (val) {
            memoFn = val;
          },

          enumerable: false,
          configurable: true,
        })
      }

      return self[memoMethodKey].apply(self, arguments);
    }

    memoFn.clear = function () {
      var self = this;
      if (self === memoFn) throw new Error('Must call clear on memoFn with correct object context, i.e. this.method.clear.call(this)');
      self[memoMethodKey] = null;
    }

    return memoFn;
  },

  // Be sure to add any new transforms to the documentation at the top of this
  // file
})

// Like apply, but fn can be a method name
var applyFn = FunctionBuilder.applyFn = function (fn, context, args) {
  return makeApplier(fn, context).apply(null, args);
}

// Make a function that you can call apply on, may be a function or a method
// name (used to prevent deoptimization from arguments usage)
//
// Use like: makeApplier(fnOrName, this).apply(null, arguments);
var makeApplier = FunctionBuilder.makeApplier = function (fn, context) {
  if (_.isString(fn)) fn = context[fn];
  return function () {
    return fn.apply(context, arguments);
  }
}

// Promise method transforms
_.each(['then', 'fail', 'spread', 'finally', 'tap'], function (promiseMethod) {
  FunctionBuilder.prototype['q' + promiseMethod.capitalize()] = function (fn, callback) {
    fn = fn.q();

    return function () {
      var self = this;
      return fn.apply(self, arguments)[promiseMethod](function () {
        return makeApplier(callback, self).apply(null, arguments);
      });
    }
  }
})

var builder = new FunctionBuilder();

// Some builders need to examine the original function to determine their behavior.
// That won't work if what they're looking at is a wrapped function, so we always attach
// the original and pass it down the chain of wrappers
var decorateWithOriginal = function (newFn, oldFn) {
  var original = getOriginal(oldFn);
  newFn.original = original;
  return newFn;
}

var getOriginal = function (fn) {
  // no original on fn means fn *is* the originalDone
  return fn.original || fn;
}

Object.defineProperty(global, 'FB', {
  get: function () {
    return new ChainedBuilder();
  },
})

var functionPrototype = Function.prototype;
var addToFunctionPrototype = function (name) {
  functionPrototype[name] = function () {
    var fn = this;
    var args = ArgumentsSlicer.unshift([fn]).apply(null, arguments);
    return decorateWithOriginal(builder[name].apply(builder, args), fn);
  }
}

var ChainedBuilder = BaseObject.extend({
  initialize: function () {
    this.transformers = [];
  },

  func: function (fn) {
    return _.reduce(this.transformers, function (func, transform) {
      var name = transform.name;
      var args = transform.args;

      return decorateWithOriginal(builder[name].apply(builder, [func].concat(args)), func);
    }, fn)
  },
})

var addToChainBuilder = function (name) {
  ChainedBuilder.prototype[name] = function () {
    var self = this;
    self.transformers.push({name: name, args: ArgumentsSlicer.toArray.apply(null, arguments)});
    return self;
  };
}

_.each(FunctionBuilder.prototype, function (fn, name) {
  addToFunctionPrototype(name);
  addToChainBuilder(name);
})

FunctionBuilder.register = function (name, fn) {
  FunctionBuilder.prototype[name] = fn;
  addToFunctionPrototype(name);
  addToChainBuilder(name);
}
