describe('IfUnset', function () {
  var verify = function (fn) {
    it('should work with no argument', function () {
      return expect(fn()).equal('overridden');
    })

    it('should work with null argument', function () {
      return expect(fn(null)).equal('overridden');
    })

    it('should work with undefined argument', function () {
      return expect(fn(undefined)).equal('overridden');
    })

    var verifyNoChange = function (withValue) {
      it(`it should not override ${JSON.stringify(withValue)} argument`, function () {
        return expect(fn(withValue)).equal(withValue);
      })
    }

    verifyNoChange(0);
    verifyNoChange(false);
    verifyNoChange('');
    verifyNoChange({});
    verifyNoChange([]);
  }

  describe('single argument', function () {
    verify(function (a) {
      IfUnset, a = 'overridden';
      return a;
    });
  })

  describe('two arguments', function () {
    verify(function (a, b) {
      IfUnset, a = 'overridden', b = 'foo';
      return a;
    });
  })

  describe('member expression', function () {
    verify(function (a) {
      var x = {};
      if (arguments.length) x.a = a; // do this so that unset is still distinct from undefined in the test

      IfUnset, x.a = 'overridden';
      return x.a;
    });
  })

  describe('computed member expression', function () {
    verify(function (a) {
      var x = {};
      if (arguments.length) x.a = a; // do this so that unset is still distinct from undefined in the test

      IfUnset, x['apple'[0]] = 'overridden';
      return x.a;
    });
  })

  describe('function call', function () {
    var foo = () => 'overridden';
    verify(function (a) {
      IfUnset, a = foo();
      return a;
    });
  })

  describe('member with side effects', function () {
    // Check that the left hand side does not get called repeatedly
    var getObjCallCount = 0;
    var testCallCount = 0;
    verify(function (a) {
      var obj = {a: a};
      var getObj = function () {
        getObjCallCount++;
        return obj;
      };

      IfUnset, getObj().a = 'overridden';
      testCallCount++;
      return obj.a;
    })

    it('should not have called the lvalue any extra times', function () {
      return expect(getObjCallCount).equal(testCallCount);
    })
  })

  describe('computed member with side effects', function () {
    // Check that the left hand side does not get called repeatedly
    var getMemberNameCallCount = 0;
    var testCallCount = 0;
    verify(function (a) {
      var obj = {a: a};
      var getMemberName = function () {
        getMemberNameCallCount++;
        return 'a';
      };

      IfUnset, obj[getMemberName()] = 'overridden';
      testCallCount++;
      return obj.a;
    })

    it('should not have called the lvalue any extra times', function () {
      return expect(getMemberNameCallCount).equal(testCallCount);
    })
  })

  describe('array element', function () {
    var fn = function (arr) {
      IfUnset, arr[2] = 1;
      return arr;
    }

    it('should extend if given an empty array', function () {
      var expected = [];
      expected[2] = 1;
      return expect(fn([])).deep.equal(expected)
    })
  })

  describe('as an expression', function () {
    var x = 1;
    verify(function (a) {
      x = (IfUnset, a = 'overridden');
      return a;
    })

    it('should evaluate to undefined', function () {
      return expect(x).undefined;
    })
  })
})
