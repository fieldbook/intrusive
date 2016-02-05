require('./init');
var FunctionBuilder = require('../lib/functionBuilder');

describe('Function Builder', function () {
  var testFn = function (name, args, testAction, func) {
    // Only care about the first word of the name (allows for differentiated describes)
    var builderName = name.split(/\b/, 1)[0];
    describe('when using ' + name, function () {
      var postfixFn, prefixFn;
      before(function () {
        var fn = func || function (x) {
          return x
        };

        postfixFn = fn[builderName].apply(fn, args);

        var builder = FB;
        prefixFn = builder[builderName].apply(builder, args).func(fn);
      })

      describe('as postfix', function () {
        testAction(function () {
          return postfixFn;
        });
      })

      describe(' as prefix', function () {
        testAction(function () {
          return prefixFn
        });
      })
    })
  }

  testFn('q', [], function (getter) {
    var fn;
    before(function () {
      fn = getter();
    })

    it('should return q object when using q()', function () {
      return expect(Q.isPromise(fn(4))).to.be.true
    })

    it('should resolve to input', function () {
      return expect(fn(4)).eventually.to.equal(4);
    })
  })

  testFn('qThen', [function (x) { return x + 1;}], function (getter) {
    var fn;
    before(function () {
      fn = getter();
    })

    it('should return a promise', function () {
      return expect(Q.isPromise(fn(4))).to.be.true
    })

    it('should resolve to input + 1', function () {
      return expect(fn(4)).eventually.to.equal(5);
    })
  })

  describe('with qTap', function () {
    var count;
    testFn('qTap', [function (x) { count = x }], function (getter) {
      var fn, result;
      before(function () {
        fn = getter();
      })

      beforeEach(function () {
        count = 0;
        return (result = fn(4));
      })

      it('should return a promise', function () {
        return expect(Q.isPromise(result)).to.be.true;
      })

      it('should resolve to input', function () {
        return expect(result).eventually.to.equal(4);
      })

      it('should have the side effect', function () {
        return expect(count).equal(4);
      })
    })
  })

  testFn('qFail', [function (x) { return true; }], function (getter) {
    var fn;
    before(function () {
      fn = getter();
    })

    it('should return a promise', function () {
      return expect(Q.isPromise(fn(4))).to.be.true
    })

    it('should resolve to true', function () {
      return expect(fn(4)).eventually.to.be.true;
    })
  }, function (x) {
    throw new Error('BOOM');
  })

  describe('with qFinally', function () {
    var hadSideEffect;
    testFn('qFinally', [function (x) { hadSideEffect = true }], function (getter) {
      var fn, result;
      before(function () {
        fn = getter();
      })

      beforeEach(function () {
        hadSideEffect = false;
        return (result = fn(4));
      })

      it('should return a promise', function () {
        return expect(Q.isPromise(result)).to.be.true;
      })

      it('should resolve to input', function () {
        return expect(result).eventually.to.equal(4);
      })

      it('should have the side effect', function () {
        return expect(hadSideEffect).true;
      })
    })
  })

  testFn('qSpread', [function (a, b, c) { return a + b + c;}], function (getter) {
    var fn;
    before(function () {
      fn = getter();
    })

    it('should return a promise', function () {
      return expect(Q.isPromise(fn(['d', 'o', 'g']))).to.be.true
    })

    it('should resolve to concatted characters', function () {
      return expect(fn(['d', 'o', 'g'])).eventually.to.equal('dog');
    })
  })

  testFn('pairsOrAttrs with only attrs argument', [], function (getter) {
    var fn;
    before(function () {
      fn = getter();
    })

    it('should return an empty object when there are no args', function () {
      return expect(fn()).deep.equal({});
    })

    it('should handle alternating keys and values', function () {
      return expect(fn('foo', 'bar', 'baz', 'qux')).deep.equal({foo: 'bar', baz: 'qux'});
    })

    it('should handle an object', function () {
      return expect(fn({foo: 'bar', baz: 'qux'})).deep.equal({foo: 'bar', baz: 'qux'});
    })
  }, function (attrs) {
    return attrs;
  })

  testFn('pairsOrAttrs with additional head argument', [], function (getter) {
    var fn;
    before(function () {
      fn = getter();
    })

    it('should return handle no args', function () {
      return expect(fn(1)).deep.equal({other: 1});
    })

    it('should handle alternating keys and values', function () {
      return expect(fn(1, 'foo', 'bar', 'baz', 'qux')).deep
        .equal({foo: 'bar', baz: 'qux', other: 1});
    })

    it('should handle an object', function () {
      return expect(fn(1, {foo: 'bar', baz: 'qux'})).deep
        .equal({foo: 'bar', baz: 'qux', other: 1});
    })
  }, function (other, attrs) {
    return _.extend({other: other}, attrs);
  })

  testFn('pairsOrAttrs with q used first', [], function (getter) {
    var fn;
    before(function () {
      fn = getter();
    })

    it('should return an empty object when there are no args', function () {
      return expect(fn(1, 2)).eventually.deep.equal({});
    })

    it('should handle alternating keys and values', function () {
      return expect(fn(1, 2, 'foo', 'bar', 'baz', 'qux')).eventually.deep.equal({foo: 'bar', baz: 'qux'});
    })

    it('should handle an object', function () {
      return expect(fn(1, 2, {foo: 'bar', baz: 'qux'})).eventually.deep.equal({foo: 'bar', baz: 'qux'});
    })
  }, function (foo, bar, attrs) {
    return attrs;
  }.q())

  var wrapper = function (originalFn, x) {
    return originalFn(x) + 1;
  }

  testFn('wrap', [wrapper], function (getter) {
    var fn;
    before(function () {
      fn = getter();
    })

    it('should return the wrapped value', function () {
      return expect(fn(3)).to.equal(4);
    })
  })

  var afterX = 1;
  var afterFn = function () {
    afterX = afterX * 5;
  };

  testFn('after', [afterFn], function (getter) {
    var fn;
    before(function () {
      afterX = 1;
      fn = getter();
    })

    it('should run the after function after the input function', function () {
      fn();
      return expect(afterX).to.equal(10);
    })
  }, function () {
    afterX = 2;
  })

  var beforeX = 1;
  var beforeFn = function () {
    beforeX = beforeX * 5;
  };

  testFn('before', [beforeFn], function (getter) {
    var fn;
    before(function () {
      beforeX = 1;
      fn = getter();
    })

    it('should run the after function after the input function', function () {
      fn();
      return expect(beforeX).to.equal(2);
    })
  }, function () {
    beforeX = 2;
  })

  testFn('async', [], function (getter) {
    var fn;
    before(function () {
      fn = getter();
    })

    it('should return the sum of the values', function () {
      return expect(fn(Q.delay(1, 20), Q.delay(2, 20))).eventually.equal(3);
    })
  }, function * (a, b) {
    return (yield a) + (yield b);
  })

  var withResultFn = function (result, args) {
    return {
      result: result,
      args: args
    }
  }

  testFn('withResult', [withResultFn], function (getter) {
    var fn;
    before(function () {
      fn = getter();
    })

    it('should pass the correct arguments and return the result of the chained function', function () {
      return expect(fn('foo', 'bar', 'baz')).deep.equal({
        result: 'FooBarBaz',
        args: ['foo', 'bar', 'baz'],
      })
    })
  }, function (x, y, z) {
    return [x, y, z]._.invoke('capitalize').join('');
  })

  testFn('chainable', function (getter) {
    var testObj;
    before(function () {
      testObj = {
        didCall: 'no',
        go: getter(),
      }
    })

    var result;

    before(function () {
      result = testObj.go('yes');
    })

    it('should return the object', function () {
      return expect(result).equal(testObj);
    })

    it('should have the correct side effect', function () {
      return expect(testObj.didCall).equal('yes');
    })
  },
  function (arg) {
    var self = this;
    self.didCall = arg;
    return 'original return value'
  });

  ;(function () {
    var counter;
    testFn('memoize', [function (val) {return {val: val}}], function (getter) {
      var fn;
      var result;
      var oldCounter;
      before(function () {
        counter = 0;
        fn = getter();
      })

      before(function () {
        result = fn(5);
      })

      it('should return the correct result', function () {
        return expect(result).equal(6);
      })

      it('should have called the function once', function () {
        return expect(counter).equal(1);
      })

      describe('when you call it again with a different value', function () {
        before(function () {
          oldCounter = counter;
          result = fn(6);
        })

        it('should return the correct result', function () {
          return expect(result).equal(7);
        })

        it('should have called the function again', function () {
          return expect(counter).equal(oldCounter + 1);
        })
      })

      describe('when you call it again with the same value', function () {
        before(function () {
          oldCounter = counter;
          result = fn(5);
        })

        it('should return the correct result', function () {
          return expect(result).equal(6);
        })

        it('should not have called the function again', function () {
          return expect(counter).equal(oldCounter);
        })
      })

      describe('when you clear it and call it the first value', function () {
        before(function () {
          oldCounter = counter;
          fn.clear();
          result = fn(5);
        })

        it('should return the correct result', function () {
          return expect(result).equal(6);
        })

        it('should have called the function again', function () {
          return expect(counter).equal(oldCounter + 1);
        })

        describe('when you call it again with the same value', function () {
          before(function () {
            oldCounter = counter;
            result = fn(5);
          })

          it('should return the correct result', function () {
            return expect(result).equal(6);
          })

          it('should not have called the function again', function () {
            return expect(counter).equal(oldCounter);
          })
        })
      })

    }, function (val) {
      counter++;
      return val + 1;
    })
  })();

  describe('when you use a custom builder', function () {
    before(function () {
      FunctionBuilder.register('forceReturn', function (fn, forced) {
        return function () {
          var self = this;
          fn.apply(self, arguments);
          return forced;
        }
      })
    })

    var count = 0;
    testFn('forceReturn', [5], function (getter) {
      var fn, result;
      before(function () { fn = getter()})

      beforeEach(function () {
        count = 0;
        result = fn();
      })

      it('should call the function', function () {
        return expect(count).equal(1);
      })

      it('should return 5', function () {
        return expect(result).equal(5);
      })
    }, function () {
      count++;
    })
  })
})
