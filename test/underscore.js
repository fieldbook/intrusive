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
      },
    };

    it('should return null for a nonexistant path', function () {
      expect(_.soak(obj, 'nested.nope.bar')).to.be.undefined;
    })

    it('should return the correct value for a nested path', function () {
      return expect(_.soak(obj, 'nested.deep')).equal(1);
    })

    it('should call a function with the passed arg', function () {
      return expect(_.soak(obj, 'nested.fn', 2)).equal(2)
    })

    it('should call a getter', function () {
      return expect(_.soak(obj, 'nested.@passed')).true;
    })

    it('should call an intermediate function', function () {
      return expect(_.soak(obj, 'nested.getHash().another.nested')).to.equal(3);
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
      },
    };

    it('should return null for a nonexistant path', function () {
      expect(_.soakApply(obj, 'nested.nope.bar')).to.be.undefined;
    })

    it('should return the correct value for a nested path with no arguments', function () {
      return expect(_.soakApply(obj, 'nested.noArgs')).equal(1);
    })

    it('should call a function with the passed arg', function () {
      return expect(_.soakApply(obj, 'nested.fn', [2])).equal(2)
    })

    it('should call a getter', function () {
      return expect(_.soakApply(obj, 'nested.@subObject.method')).equal('calledSubObjectMethod');
    })

    it('should call an intermediate function', function () {
      return expect(_.soakApply(obj, 'nested.getHash().another.nested')).to.equal(3);
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
      },
    };

    it('should return null for a nonexistant path', function () {
      expect(_.soakCall(obj, 'nested.nope.bar')).to.be.undefined;
    })

    it('should return the correct value for a nested path with no arguments', function () {
      return expect(_.soakCall(obj, 'nested.noArgs')).equal(1);
    })

    it('should call a function with the passed arg', function () {
      return expect(_.soakCall(obj, 'nested.fn', 2)).equal(2)
    })

    it('should call a function with two passed args', function () {
      return expect(_.soakCall(obj, 'nested.add', 2, 3)).equal(5)
    })

    it('should call a getter', function () {
      return expect(_.soakCall(obj, 'nested.@subObject.method')).equal('calledSubObjectMethod');
    })

    it('should call an intermediate function', function () {
      return expect(_.soakCall(obj, 'nested.getHash().another.nested')).to.equal(3);
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
      return expect(_.deepClone(obj)).deep.equal({foo: ['bar']});
    })

    it('should not reflect modifications after cloning', function () {
      var copy = _.deepClone(obj);
      obj.foo[0] = 'zip;'
      return expect(copy).deep.equal({foo: ['bar']});
    })
  })

  describe('concat', function () {
    it('should concat obj and arrays together', function () {
      return expect(_.concat([1, 2], 3, [4, 5])).deep.equal([1, 2, 3, 4, 5]);
    })
  })

  describe('mapBySoak', function () {
    var array = [
      {nested: {foo: 1}},
      {},
      {nested: {bar: 1}},
    ];
    it('should do soak on each element', function () {
      return expect(_.mapBySoak(array, 'nested.foo')).deep.equal([1, undefined, undefined])
    })
  })

  describe('filterBySoak', function () {
    var Ctor = BaseObject.extend({
      check: function (otherValue) {
        return otherValue === this.value; // eslint-disable-line fieldbook/no-nested-this
      },
    }).addProperties('value', 'name', 'smart');

    var arr = [
      {foo: new Ctor({value: 12, smart: true, name: 'Alice'})},
      {foo: new Ctor({value: 12, smart: false, name: 'Bob'})},
      {foo: new Ctor({value: 13, smart: true, name: 'Carlos'})},
      {foo: new Ctor({value: 12, smart: true, name: 'Debbie'})},
      {foo: new Ctor({value: 13, smart: false, name: 'Elvis'})},
    ]

    it('should handle missing member', function () {
      return expect(_.filterBySoak(arr, 'bar.check', 12)).deep.equal([]);
    })

    it('should handle missing method', function () {
      return expect(_.filterBySoak(arr, 'foo.validate', 12)).deep.equal([]);
    })

    it('should handle method call', function () {
      return expect(_.mapBySoak(_.filterBySoak(arr, 'foo.check', 12), 'foo.name')).deep.equal(['Alice', 'Bob', 'Debbie']);
    })

    it('should handle property access', function () {
      return expect(_.mapBySoak(_.filterBySoak(arr, 'foo.smart'), 'foo.name')).deep.equal(['Alice', 'Carlos', 'Debbie']);
    })
  })

  describe('bySoak methods', function () {
    var soakString = 'foo.bar.baz()'
    var makeArray = function (inputArray) {
      return inputArray.map(function (val, i) {
        return {foo: {bar: {baz: _.constant(val)}}, index: i};
      });
    }

    describe('rejectBySoak', function () {
      it('should return the correct elements', function () {
        var arr = makeArray([true, false, false, true])
        return expect(_.pluck(_.rejectBySoak(arr, soakString), 'index')).deep.equal([1, 2])
      })
    })

    describe('findBySoak', function () {
      it('should return the correct element', function () {
        var arr = makeArray([false, false, false, true])
        return expect(_.findBySoak(arr, soakString).index).equal(3);
      })
    })

    describe('findIndexBySoak', function () {
      it('should return the correct index', function () {
        var arr = makeArray([false, false, false, true])
        return expect(_.findIndexBySoak(arr, soakString)).equal(3);
      })
    })

    describe('everyBySoak', function () {
      it('should return false', function () {
        var arr = makeArray([false, false, false, true])
        return expect(_.everyBySoak(arr, soakString)).false
      })

      it('should return true', function () {
        var arr = makeArray([true, true, true, true])
        return expect(_.everyBySoak(arr, soakString)).true
      })
    })

    describe('someBySoak', function () {
      it('should return true', function () {
        var arr = makeArray([false, false, false, true])
        return expect(_.someBySoak(arr, soakString)).true
      })

      it('should return false', function () {
        var arr = makeArray([false, false, false, false])
        return expect(_.someBySoak(arr, soakString)).false
      })
    })
  })

  describe('mapMethod', function () {
    var obj = {
      bar: 2,
      meth: function (item) {
        var self = this;
        return self.bar + item; // eslint-disable-line fieldbook/no-nested-this
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
      result = _.applyMethod(obj, 'method', [1, 2, 3]);
    })

    it('should have the side effect', function () {
      return expect(obj.x).equal(1);
    })

    it('should have the correct result', function () {
      return expect(result).deep.equal([2, 3]);
    })
  })
})
