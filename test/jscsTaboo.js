var Checker = require('jscs/lib/checker');

describe('Taboo jscs rule', function () {
  var checker;
  before(function () {
    checker = new Checker();
    checker.registerDefaultRules();
    checker.configure({
      additionalRules: ["jscs-rules/*.js"],
      taboo: [
        'tabooName',
        'otherTabooName',
        'tabooParam',
      ],
    })
  })

  describe('when a file has taboo identifiers', function () {
    var check;
    before(function () {
      return checker.checkFile('jscs-fixtures/taboo.js').then(function (c) { check = c });
    })

    it('should have the right number of errors', function () {
      return expect(check.getErrorCount()).equal(3);
    })

    it('should have errors on the correct lines', function () {
      return expect(_.pluck(check.getErrorList(), 'line')).deep.equal([3, 7, 9]);
    })
  })
})
