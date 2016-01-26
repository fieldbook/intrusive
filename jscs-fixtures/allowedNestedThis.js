function allowedThisFunc() {}

function foo(x) {
  allowedThisFunc(function (bar) {
    return this;
  })

  x.allowedThisFunc(function (bar) {
    return this;
  })

  allowedThisFunc(x, function (bar) {
    return this;
  })

  x.allowedThisFunc(x, function (bar) {
    return this;
  })

  x.foo.bar[5 + 3 + x()].allowedThisFunc(x, function (bar) {
    return this;
  })

  x.each(() => {
    return this;
  })

  x.each(() => this);
}
