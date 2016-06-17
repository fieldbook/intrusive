var BaseObject = require('../lib/baseObject');

var ChildObject = BaseObject.extend({});

describe('Base object', function () {
  describe('if you try to call the base object constructor without "new"', function () {
    it('should throw an error', function () {
      return expect(function () {
        BaseObject();
      }).to.throw;
    })
  })

  describe('if you try to call the a sub object constructor without "new"', function () {
    it('should throw an error', function () {
      return expect(function () {
        ChildObject();
      }).to.throw;
    })
  })

  describe('when you create a singleton', function () {
    var S = BaseObject.extend({
      x: 1,
      y: 2,
    });
    S.makeSingleton('first');
    S.makeSingleton('second');

    it('should have created the first singleton', function () {
      return expect(S.first.x).equal(1)
    })

    it('should have created the second singleton', function () {
      return expect(S.second.x).equal(1)
    })

    describe('when you modify a property on one singleton', function () {
      before(function () {
        S.first.x = 2;
      })

      it('should modify the first singleton', function () {
        return expect(S.first.x).equal(2);
      })

      it('should not modify the second singleton', function () {
        return expect(S.second.x).equal(1);
      })
    })

    describe('when you have a subclass', function () {
      var T;
      before(function () {
        T = S.extend({
          y: 3,
          z: 4,
        })
      })

      describe('when you make a new singleton', function () {
        before(function () {
          T.makeSingleton('third');
        })

        it('should not create the singleton on the parent constructor', function () {
          return expect(S.third).undefined;
        })

        it('should create a singleton on the child constructor', function () {
          return expect(T.third).not.undefined;
        })

        it('should create a singleton that is an instance of the child constructor', function () {
          return expect(T.third.z).equal(4);
        })
      })

      describe('when you override a singleton', function () {
        before(function () {
          T.makeSingleton('first');
        })

        it('should not change parent constructor singleton', function () {
          return expect(S.first.y).equal(2);
        })

        it('should create a singleton on the child constructor', function () {
          return expect(T.first).not.undefined;
        })

        it('should create a singleton that is an instance of the child constructor', function () {
          return expect(T.first.z).equal(4);
        })
      })
    })
  })
})
