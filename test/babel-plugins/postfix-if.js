describe('Postfix If', function () {
  describe('bare return (if)', function () {
    var sideEffects;
    var fn = function (cond) {
      sideEffects = 'start';
      return If(cond);
      sideEffects = 'after if';
    }

    it('should terminate when condition is true', function () {
      sideEffects = 'none';
      fn(true);
      return expect(sideEffects).equal('start');
    })

    it('should not terminate when condition is false', function () {
      sideEffects = 'none';
      fn(false);
      return expect(sideEffects).equal('after if');
    })
  })

  describe('bare return (unless)', function () {
    var sideEffects;
    var fn = function (cond) {
      sideEffects = 'start';
      return Unless(cond);
      sideEffects = 'after unless';
    }

    it('should terminate when condition is false', function () {
      sideEffects = 'none';
      fn(false);
      return expect(sideEffects).equal('start');
    })

    it('should not terminate when condition is true', function () {
      sideEffects = 'none';
      fn(true);
      return expect(sideEffects).equal('after unless');
    })
  })

  describe('return with argument', function () {
    var greaterThan2 = function (x) {
      return 'bigger', If(x > 2);
      return 'equal', If(x === 2);
      return 'smaller';
    }

    it('should detect a smaller number', function () {
      return expect(greaterThan2(1)).equal('smaller');
    })

    it('should detect an equal number', function () {
      return expect(greaterThan2(2)).equal('equal');
    })

    it('should detect a bigger number', function () {
      return expect(greaterThan2(3)).equal('bigger');
    })
  })

  describe('throw', function () {
    var numberCruncher = function (num) {
      throw new Error('Not a number'), Unless(typeof num === 'number');
      return 'crunch crunch crunch';
    }

    it('should accept a number', function () {
      return expect(numberCruncher(5)).equal('crunch crunch crunch');
    })

    it('should throw on a non-number', function () {
      return expect(function () {
        numberCruncher('turnip');
      }).to.throw('Not a number');
    })
  })

  describe('expression', function () {
    var seen;
    var updateSeen = function (val) {
      seen = 'yep', If(val != null);
    }

    it('should handle non-null', function () {
      seen = 'nope';
      updateSeen(5);
      return expect(seen).equal('yep');
    })

    it('should handle null', function () {
      seen = 'nope';
      updateSeen(null);
      return expect(seen).equal('nope');
    })
  })
});
