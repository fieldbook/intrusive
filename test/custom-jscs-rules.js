var Checker = require('jscs/lib/checker');

var checkTests = function (options) {

  describe(options.describe, function () {
    var checker;
    before(function () {
      checker = new Checker();
      checker.registerDefaultRules;

      var checkerOptions = {
        additionalRules: ['jscs-rules/*.js'],
      };

      _.extend(checkerOptions, options.jscsOptions);

      checker.configure(checkerOptions);
    })

    var check;
    before(function () {
      return checker.checkFile(options.file).then(function (c) {
        check = c;
      })
    })

    it('should have correct number of errors', function () {
      return expect(check.getErrorCount()).equal(options.errorCount);
    })
  })
}

describe('Custom JSCS rules', function () {
  checkTests({
    jscsOptions: {
      restrictOnly: true,
    },
    describe: 'when a file has .only in it',
    errorCount: 1,
    file: 'jscs-fixtures/only.js'
  })

  checkTests({
    jscsOptions: {
      restrictBareThrow: true,
    },
    describe: 'when a file has a bare string throw',
    errorCount: 2,
    file: 'jscs-fixtures/throw.js'
  })

  checkTests({
    jscsOptions: {
      restrictBareThrow: true,
      restrictOnly: true,
    },
    describe: 'when a file has no style errors',
    errorCount: 0,
    file: 'jscs-fixtures/noErrors.js'
  })
})
