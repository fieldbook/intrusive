var Checker = require('jscs/lib/checker');

describe('Nested this jscs rule', function () {
  var checker;
  before(function () {
    checker = new Checker();
    checker.registerDefaultRules();
    checker.configure({
      additionalRules: ["jscs-rules/*.js"],
      restrictNestedThis: {
        allowedThisFunctions: ['allowedThisFunc'],
        allowedGrandparents: ['allowedGrandparent'],
        allowedConstructors: ['AllowedConstructor'],
      },
    })
  })

  describe('when a file has a "this" at the top level', function () {
    var check;
    before(function () {
      return checker.checkFile('jscs-fixtures/topLevelThis.js').then(function (c) { check = c });
    })

    it('should the one error', function () {
      return expect(check.getErrorCount()).equal(1);
    })

    it('should have error on the correct line', function () {
      return expect(check.getErrorList()[0].line).equal(2)
    })
  })

  describe('when a file has a "this" in a nested function', function () {
    var check;
    before(function () {
      return checker.checkFile('jscs-fixtures/nestedThis.js').then(function (c) { check = c });
    })

    it('should have one error', function () {
      return expect(check.getErrorCount()).equal(1);
    })

    it('should have error on the correct line', function () {
      return expect(check.getErrorList()[0].line).equal(3)
    })
  })

  describe('when a file uses "var self = this" in a nested function', function () {
    var check;
    before(function () {
      return checker.checkFile('jscs-fixtures/validNestedThis.js').then(function (c) { check = c });
    })

    it('should have no errors', function () {
      return expect(check.getErrorCount()).equal(0);
    })
  })

  describe('when a file uses "// jscs: nestedThisOk" in a nested function that uses this', function () {
    var check;
    before(function () {
      return checker.checkFile('jscs-fixtures/nestedThisOkComment.js').then(function (c) { check = c });
    })

    it('should have no errors', function () {
      return expect(check.getErrorCount()).equal(0);
    })
  })

  describe('when using a bound function', function () {
    var check;
    before(function () {
      return checker.checkFile('jscs-fixtures/boundFunction.js').then(function (c) { check = c });
    })

    it('should have no errors', function () {
      return expect(check.getErrorCount()).equal(0);
    })
  })

  describe('when using a bound function with an unbound subfunction', function () {
    var check;
    before(function () {
      return checker.checkFile('jscs-fixtures/boundFunctionWithSubfunction.js').then(function (c) { check = c });
    })

    it('should have one errors', function () {
      return expect(check.getErrorCount()).equal(1);
    })

    it('should have error on the correct line', function () {
      return expect(check.getErrorList()[0].line).equal(4);
    })
  })

  describe('when using a function in allowNestedThis', function () {
    var check;
    before(function () {
      return checker.checkFile('jscs-fixtures/allowedNestedThis.js').then(function (c) { check = c });
    })

    it('should have no errors', function () {
      return expect(check.getErrorCount()).equal(0);
    })
  })

  describe('when using "this" inside an allowed grandparent function', function () {
    var check;
    before(function () {
      return checker.checkFile('jscs-fixtures/allowedGrandparent.js').then(function (c) { check = c });
    })

    it('should have no errors', function () {
      return expect(check.getErrorCount()).equal(0);
    })
  })

  describe('when using "this" inside an allowed constructor', function () {
    var check;
    before(function () {
      return checker.checkFile('jscs-fixtures/validThisInConstructor.js').then(function (c) { check = c });
    })

    it('should have only correct number of errors', function () {
      return expect(check.getErrorCount()).equal(2);
    })
  })
})
