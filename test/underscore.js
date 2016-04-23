require('./init');

describe('Underscore mixins', function () {
  describe('ensurePath', function () {
    var noop, addFull, addPart, addArray;
    var path = ["foo", "bar", "baz"];
    noop = {foo: {bar: {baz: {}}}, qux: 1}
    addFull = {qux: 1};
    addPart = {foo: {}, qux: 1};
    addArray = {foo: {}, qux: 1};

    it('should ensure a path that already exists', function () {
      _.ensurePath(noop, path);
      return expect(noop).deep.equal({foo: {bar: {baz: {}}}, qux: 1});
    })

    it('should ensure a path that does not exist', function () {
      _.ensurePath(addFull, path);
      return expect(addFull).deep.equal({foo: {bar: {baz: {}}}, qux: 1});
    })

    it('should ensure a path that partly exists', function () {
      _.ensurePath(addPart, path);
      return expect(addPart).deep.equal({foo: {bar: {baz: {}}}, qux: 1});
    })

    it('should ensure a path that terminates in an array', function () {
      _.ensurePath(addArray, path, []);
      return expect(addArray).deep.equal({foo: {bar: {baz: []}}, qux: 1});
    })
  })

  describe('soak', function () {
    var obj = {
      nested: {
        deep: 1,
        fn: function (arg) { return arg },
        get: function (key) {
          if (key === 'passed') return true;
          return false;
        },
        getHash: function () {
          return {another: {nested: 3}};
        },
      }
    };

    it('should return null for a nonexistant path', function () {
      expect(obj._.soak('nested.nope.bar')).to.be.undefined;
    })

    it('should return the correct value for a nested path', function () {
      return expect(obj._.soak('nested.deep')).equal(1);
    })

    it('should call a function with the passed arg', function () {
      return expect(obj._.soak('nested.fn', 2)).equal(2)
    })

    it('should call a getter', function () {
      return expect(obj._.soak('nested.@passed')).true;
    })

    it('should call an intermediate function', function () {
      return expect(obj._.soak('nested.getHash().another.nested')).to.equal(3);
    })
  })

  describe('soakApply', function () {
    var obj = {
      nested: {
        noArgs: function () {
          return 1
        },
        fn: function (arg) { return arg },
        get: function (key) {
          if (key === 'passed') return true;
          if (key === 'subObject') return {
            method: function () {
              return 'calledSubObjectMethod'
            },
          }
          return false;
        },
        getHash: function () {
          return {another: {nested: function () {
            return 3
          }}};
        },
      }
    };

    it('should return null for a nonexistant path', function () {
      expect(obj._.soakApply('nested.nope.bar')).to.be.undefined;
    })

    it('should return the correct value for a nested path with no arguments', function () {
      return expect(obj._.soakApply('nested.noArgs')).equal(1);
    })

    it('should call a function with the passed arg', function () {
      return expect(obj._.soakApply('nested.fn', [2])).equal(2)
    })

    it('should call a getter', function () {
      return expect(obj._.soakApply('nested.@subObject.method')).equal('calledSubObjectMethod');
    })

    it('should call an intermediate function', function () {
      return expect(obj._.soakApply('nested.getHash().another.nested')).to.equal(3);
    })
  })

  describe('soakCall', function () {
    var obj = {
      nested: {
        noArgs: function () {
          return 1
        },
        add: function (a, b) {
          return a + b;
        },
        fn: function (arg) { return arg },
        get: function (key) {
          if (key === 'passed') return true;
          if (key === 'subObject') return {
            method: function () {
              return 'calledSubObjectMethod'
            },
          }
          return false;
        },
        getHash: function () {
          return {another: {nested: function () {
            return 3
          }}};
        },
      }
    };

    it('should return null for a nonexistant path', function () {
      expect(obj._.soakCall('nested.nope.bar')).to.be.undefined;
    })

    it('should return the correct value for a nested path with no arguments', function () {
      return expect(obj._.soakCall('nested.noArgs')).equal(1);
    })

    it('should call a function with the passed arg', function () {
      return expect(obj._.soakCall('nested.fn', 2)).equal(2)
    })

    it('should call a function with two passed args', function () {
      return expect(obj._.soakCall('nested.add', 2, 3)).equal(5)
    })

    it('should call a getter', function () {
      return expect(obj._.soakCall('nested.@subObject.method')).equal('calledSubObjectMethod');
    })

    it('should call an intermediate function', function () {
      return expect(obj._.soakCall('nested.getHash().another.nested')).to.equal(3);
    })
  })

  describe('compactNullish', function () {
    it('should remove null and undefined', function () {
      return expect(_.compactNullish(['', true, undefined, false, null, 0, 1, 'foo'])).to.deep.equal(['', true, false, 0, 1, 'foo'])
    })
  })

  describe('deepClone', function () {
    var obj = {foo: ['bar']};
    it('should return a the correct data', function () {
      return expect(obj._.deepClone()).deep.equal({foo: ['bar']});
    })

    it('should not reflect modifications after cloning', function () {
      var copy = obj._.deepClone();
      obj.foo[0] = 'zip;'
      return expect(copy).deep.equal({foo: ['bar']});
    })
  })

  describe('concat', function () {
    it('should concat obj and arrays together', function () {
      return expect(_.concat([1, 2], 3, [4, 5])).deep.equal([1, 2, 3, 4, 5]);
    })
  })

  describe('pluckSoak', function () {
    var array = [
      {nested: {foo: 1}},
      {},
      {nested: {bar: 1}}
    ];
    it('should do soak on each element', function () {
      return expect(array._.pluckSoak('nested.foo')).deep.equal([1, undefined, undefined])
    })
  })

  describe('mapMethod', function () {
    var obj = {
      bar: 2,
      meth: function (item) {
        return this.bar + item; // jscs: nestedThisOk
      },
    }

    it('shoudl call the method with correct this', function () {
      return expect(_.mapMethod([1, 2], obj, 'meth')).deep.equal([3, 4])
    })
  })

  describe('stencil', function () {
    it('should replace data correctly', function () {
      return expect('foo {{name}}'.stencil({name: 'bar'})).equal('foo bar');
    })
  })

  describe('applyMethod', function () {
    var result, obj = {
      method: function (x, y, z) {
        var self = this;
        self.x = x;
        return [y, z];
      },
    };

    before(function () {
      result = obj._.applyMethod('method', [1, 2, 3]);
    })

    it('should have the side effect', function () {
      return expect(obj.x).equal(1);
    })

    it('should have the correct result', function () {
      return expect(result).deep.equal([2, 3]);
    })
  })
})
