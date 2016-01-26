var Q = require('q');

var QPromise = Q.makePromise;

// Alias provided by newer Q versions
Q.Promise = Q.promise;

// In node context (not browser) we need to be sure that Q.defer preserves the
// domain context of the requests.  We've seen issues with this with using
// Q.defer.  So we re-bind defer to return an object that will resolved will
// force the domain context to be correct
if (global.process) {
  var oldDefer = Q.defer;
  Q.defer = function () {
    var deferred = oldDefer();

    ['resolve', 'reject']._.each(function (method) {
      var oldMethod = deferred[method];
      if (process.domain) {
        deferred[method] = process.domain.bind(function () {
          oldMethod.apply(deferred, arguments);
        })
      }
    })

    return deferred;
  }
}

// Then immediate will avoid crossing a tick boundary if the promise is already
// fulfilled
QPromise.prototype.thenImmediate = function (fulfilled, rejected, progressed) {
  if (progressed) throw new Error('thenImmediate does not handle progressed')
  if (this.isFulfilled() && fulfilled) {
    try {
      return Q(fulfilled(this.inspect().value));
    } catch (error) {
      return Q.reject(error);
    }
  }

  return QPromise.prototype.then.apply(this, arguments);
}

// Provided by later versions of Q
QPromise.prototype.tap = QPromise.prototype.tap || function (callback) {
  callback = Q(callback);

  return this.then(function (value) {
    return callback.fcall(value).thenResolve(value);
  });
};

// Convenience method for getting a deep property from a promise.
// Pass a dot-separated path.
QPromise.prototype.getPath = QPromise.prototype.getPath || function (path) {
  var parts = path.split('.');
  var result = this;
  parts._.each(function (part) {
    result = result.get(part);
  })

  return result;
}

// Negate promise, assuming it's a boolean
QPromise.prototype.not = function () {
  return this.then(function (bool) {
    return !bool;
  })
}

// Invoke a soak on a promise
QPromise.prototype.soak = function (varargs) {
  var args = arguments;
  return this.then(function (result) {
    var wrapped = _(result);
    return wrapped.soak.apply(wrapped, args);
  })
}

// Invoke a soak on a promise
QPromise.prototype.soak = function (varargs) {
  var args = arguments;
  return this.then(function (result) {
    var wrapped = _(result);
    return wrapped.soak.apply(wrapped, args);
  })
}

function autoAsync(cb) {
  if (cb.constructor.name === 'GeneratorFunction') return cb.async();
  return cb;
}

// Override Q.all so that it can take multiple arguments (instead of having to wrap them in an array)
var originalQAll = Q.all;
Q.all = function () {
  var args = arguments;
  if (args.length === 1) return originalQAll.apply(Q, arguments);
  args = _(args).toArray();
  return originalQAll.call(Q, args);
}

Q.anyTrue = function (arr) {
  return Q.all.apply(this, arguments).then(function (results) {
    return results._.any();
  })
}

// Map over an array and then Q.all the result
Q.map = function (arr, cb) {
  cb = autoAsync(cb);
  return Q.all(_.map(arr, cb));
}

// Map over an array in serial (wait for each element to finish before the next starts)
// Returns a promise for an array containing the results
Q.serialMap = function (arr, cb) {
  cb = autoAsync(cb);
  var promise = Q();
  var results = [];
  _.each(arr, function (item, index) {
    promise = promise.then(function () {
      return Q(cb(item, index)).then(function (result) {
        results.push(result);
      })
    })
  })

  return promise.then(function () {
    return results;
  });
}

// Makes an object from a set of keys on a given object. The keys can be values
// or functions, and if functions, can return values of promises. Everything
// gets resolved and finalized. This method returns a promise for the final
// hash of values.
//
// Passed object may also be a promise for an object to resolve.

Q.resolveObject = function (obj, keys) {
  var args = arguments;
  return Q(obj).then(function (obj) {
    if (args.length === 1) {
      keys = _.keys(obj);
    } else {
      keys = _.rest(args)._.flatten();
    }

    var values = keys.map(function (key) { return _.result(obj, key); });
    return Q.all(values).then(function (values) {
      return _.object(keys, values);
    })
  })
}
