// This file is for testing negative cases (cases where the rule should *not*
// throw)
var call;
call.a.func();

throw new Error('foo');
