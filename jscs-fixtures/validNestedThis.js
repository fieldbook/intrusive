function foo(x) {
  if (x) {
    return function () {
      var self = this;
      self.x = x;
    }
  }
}
