var AllowedConstructor, NotAllowedConstructor;

var foo = function () {
  var foo = new AllowedConstructor({
    method: function () {
      this.callSomething(); // should not error because of allowedConstructors
    },

    meth2: function () {
      function foo() {
        this.foo; // this should still error due to the extra level of function
      }
    },
  })

  var bar = new NotAllowedConstructor({
    method: function () {
      this.callSomething(); // this should error due to non-top-level function
    },
  })
}
