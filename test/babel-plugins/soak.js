describe('Soak plugin', function () {
  let undef;
  let empty = {};
  let fooBarBaz = {
    actionCount: 0,
    foo: {
      bar: 'baz',
      blam: {boo: 'eek!'},
    },

    action: function () {
      const self = this;
      self.actionCount++;
      return self;
    },
  }

  it('should handle an undefined object property access', function () {
    return expect(+~undef.foo).undefined;
  })

  it('should handle an undefined object method call', function () {
    return expect(+~undef.foo()).undefined;
  })

  it('should handle undefineds deep in a chain', function () {
    return expect(+~fooBarBaz.foo.bar.qux.gralt.welp).undefined;
  })

  it('should return values that exist', function () {
    return expect(+~fooBarBaz.foo.bar).equal('baz');
  })

  it('should not duplicate side effects from function calls', function () {
    expect(+~fooBarBaz.action().actionCount).equal(1)
  })

  it('should not duplicate side effects from array subscripts', function () {
    let index = 0;
    let arr = [{x: 'y'}];
    expect(+~arr[index++].x).equal('y');
    expect(index).equal(1);
  })

  it('should work for computed keys', function () {
    let prefix = 'b';
    let callCount = 0;
    let addPrefix = function (key) {
      callCount++;
      return prefix + key;
    }

    expect(+~fooBarBaz.foo[addPrefix('lam')][addPrefix('oo')]).equal('eek!');
    expect(callCount).equal(2);
  })

  it('should not null check method arguments', function () {
    let missing = {};
    expect(function () {
      return +~fooBarBaz.action(missing.x.y);
    }).to.throw(/of undefined/);
  })

  it('should not null check property names', function () {
    let missing = {};
    expect(function () {
      return +~fooBarBaz.foo[missing.x.y];
    }).to.throw(/of undefined/);
  })

  it('should not work when nested', function () {
    let missing = {};
    expect(function () {
      return +~fooBarBaz.action(+~missing.x.y);
    }).not.to.throw();
  })

  it('should work with a function call at the beginning', function () {
    let fn = function () {
      return {x: 'y'};
    }

    expect(+~fn().x).equal('y');
    expect(+~fn().a.b).undef;
  })

  it('should work on a non-member expression', function () {
    // Pointless, but should work
    expect(+~fooBarBaz).equal(fooBarBaz);
  })

  it('should work on a bare function call', function () {
    let fn;
    expect(+~fn()).undef;
  })

  it('should not allow non-functions to be called', function () {
    expect(function () {
      +~fooBarBaz();
    }).to.throw(/not a function/)

    expect(function () {
      +~fooBarBaz.foo();
    }).to.throw(/not a function/)
  })

  it('should return null if null is the end of the chain', function () {
    let obj = {x: null}
    expect(+~obj.x).null;
  })

  it('should work when the result of the expression is unused', function () {
    fooBarBaz.actionCount = 0;
    +~fooBarBaz.action().foo;
    expect(fooBarBaz.actionCount).equal(1);
  })
})
