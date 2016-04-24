require('./init');
var makeLazyProperty = require('../lib/makeLazyProperty');

describe('Lazy property', function () {
  var Ctor = function () {};
  var callCount = 0;

  describe('when you add a lazy property to a prototype', function () {
    makeLazyProperty(Ctor.prototype, 'val', function () {
      callCount++;
      return 'value';
    })

    it('should not call the getter', function () {
      return expect(callCount).equal(0);
    })

    describe('when you create instances', function () {
      var foo, bar;
      before(function () {
        foo = new Ctor();
        bar = new Ctor();
      })

      it('should not call the getter', function () {
        return expect(callCount).equal(0);
      })

      describe('when you access the property on one instance', function () {
        var val;
        before(function () {
          val = foo.val;
        })

        it('should be the correct value', function () {
          return expect(val).equal('value');
        })

        it('should call the getter once', function () {
          return expect(callCount).equal(1);
        })

        describe('when you access the property on the other instance', function () {
          before(function () {
            val = bar.val;
          })

          it('should have the correct value', function () {
            return expect(val).equal('value')
          })

          it('should not call the getter again', function () {
            return expect(callCount).equal(1);
          })
        })
      })
    })
  })

  describe('when you add a lazy property but set it before it is ever accessed', function () {
    var obj;
    var callCount = 0;
    before(function () {
      obj = {};
      makeLazyProperty(obj, 'val', function () {
        callCount++;
        return 'lazy';
      })
      obj.val = 'direct';
    })

    it('should set the property', function () {
      return expect(obj.val).equal('direct');
    })

    it('should not call the getter', function () {
      return expect(callCount).equal(0);
    })

  })
})
