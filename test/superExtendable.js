// Test prototypes
var BaseObject = require('../lib/baseObject');

var OneWord = BaseObject.extend({
  firstWord: 'foo',

  val: function () {
    return this.firstWord;
  },
})

var TwoWords = OneWord.superExtend(function (sup) {
  return {
    secondWord: 'bar',
    val: function () {
      return sup.val.call(this) + ' ' + this.secondWord;
    },
  }
})

var TwoWordsPlural = TwoWords.superExtend(function (sup) {
  return {
    firstWord: 'foos',
    secondWord: 'bars'
  }
})

var ThreeWords = TwoWordsPlural.superExtend(function (sup) {
  return {
    val: function (thirdWord) {
      return sup.val.call(this) + ' ' + thirdWord;
    },
  }
})

var FourWords = ThreeWords.superExtend(function (sup) {
  return {
    val: function (thirdWord, fourthWord) {
      return sup.val.call(this, thirdWord) + ' ' + fourthWord;
    },
  }
})

describe('superExtendable', function () {
  describe('first inheritance step (with override)', function () {
    var inst;
    before(function () {
      inst = new TwoWords();
    })

    it('should return the correct value', function () {
      return expect(inst.val()).to.equal('foo bar');
    })
  })

  describe('second inheritance step (no override)', function () {
    var inst;
    before(function () {
      inst = new TwoWordsPlural();
    })

    it('should return the correct value', function () {
      return expect(inst.val()).to.equal('foos bars');
    })
  })

  describe('third inheritance step (with override)', function () {
    var inst;
    before(function () {
      inst = new ThreeWords();
    })

    it('should return the correct value', function () {
      return expect(inst.val('baz')).to.equal('foos bars baz');
    })
  })

  describe('fourth inheritance step (with override)', function () {
    var inst;
    before(function () {
      inst = new FourWords();
    })

    it('should return the correct value', function () {
      return expect(inst.val('baz', 'qux')).to.equal('foos bars baz qux');
    })
  })
})
