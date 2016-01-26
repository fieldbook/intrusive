require('./init');

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
})
