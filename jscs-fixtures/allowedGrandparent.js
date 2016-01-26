var Foo;

Foo.Bar.allowedGrandparent(function (zip) {
  return {
    method: function () {
      this.method();
    }
  }
})
