/* eslint-disable */
function foo(x) {
  if (x) {
    return function () {
      foo(this); // jscs: nestedThisOk
    }
  }
}
