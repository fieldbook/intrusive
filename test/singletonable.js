var singletonable = require('../lib/singletonable');

describe('Singletonable', function () {
  var constructorCalls = 0;
  var Klass = function (a, b, c) {
    var self = this;
    constructorCalls++;
    self.a = a;
    self.b = b;
    self.c = c;
  }

  singletonable(Klass);

  describe('when you create a singleton', function () {
    before(function () {
      Klass.makeSingleton('singleton', 1, 2, 3);
    })

    it('should not call the constructor', function () {
      return expect(constructorCalls).equal(0);
    })

    it('should have a property for the singleton', function () {
      return expect(Klass.hasOwnProperty('singleton')).true;
    })

    describe('when you access the constructor', function () {
      before(function () {
        Klass.singleton;
        Klass.singleton;
      })

      it('should have called the constructor once', function () {
        return expect(constructorCalls).equal(1);
      })

      it('should have the correct properties', function () {
        return expect(Klass.singleton._.pick('a', 'b', 'c')).deep.equal({a: 1, b: 2, c: 3});
      })
    })
  })
})
