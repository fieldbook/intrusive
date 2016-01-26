var foo = function (x) {
  this.bar(function () {
    this.blah = true;
  });
}
