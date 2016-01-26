function foo(x) {
  return x.bar(function () {
    return function () {
      return this;
    };
  }.bind(this));
}
