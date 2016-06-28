describe('Dot underscore', function () {
  var fn = function (arr) {
    return arr._.pluck('length');
  }

  it('should work on a normal array', function () {
    return expect(fn(['foo'])).deep.equal([3]);
  })

  it('should work on undefined', function () {
    return expect(fn()).deep.equal([])
  })

  it('should work on null', function () {
    return expect(fn(null)).deep.equal([])
  })

  it('should work on a custom property', function () {
    return expect(fn({
      _: {
        pluck: _.constant('custom'),
      },
    })).equal('custom');
  })

  it('should allow assignment to _', function () {
    let x = {};
    x._ = {pluck: _.constant('assignment')};
    return expect(fn(x)).equal('assignment');
  })

  it('should allow multi-dot assignment to _', function () {
    let x = {y: {}};
    x.y._ = {pluck: _.constant('assignment')};
    return expect(fn(x.y)).equal('assignment');
  })

  it('should work on a complicated iife', function () {
    return expect(fn((function () {
      let getQuxes = () => 'quxes';
      let x = 'foo';
      let y = 'bars';
      let z = null;
      if (y === 'bars' && x != null) {
        z = getQuxes()
      }
      return [x, y, z];
    })())).deep.equal([3, 4, 5])
  })
});
