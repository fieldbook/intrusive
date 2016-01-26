function foo(x) {
  return x.bar(function () {
    return this;
  }.bind(this));
}
