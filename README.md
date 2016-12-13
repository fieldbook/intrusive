# Intrusive

![Build Status](https://circleci.com/gh/fieldbook/intrusive.svg?style=shield)

## Overview

A collection of intrusive javascript changes.  Don't use in libraries, only use in apps.

    npm install intrusive

Then in the start of your app

    require('intrusive')

## Documentation

(More coming soon, hopefully)

### Soak babel plugin

The soak babel plugin introduces a new unary prefix operator, `+~`, which automatically adds existence guards to its argument. The null check applies recursively to an entire member chain. In CoffeeScript terms, this is equivalent to replacing every `.` with `?.`, every subscript `[...` with `?[...` and every function call `fn(...` with `fn?(...`.

In other words, `+~foo.bar().baz` will check that `foo` exists, that `foo.bar` exists, and that `foo.bar()` exists. If any of those evaluate to `null` or `undefined`, the expression will return `undefined` (it will not return `null` even if, for example `foo` is `null`). If all of them do exist, then the result will be the same as `foo.bar().baz` (including `null`).

If these property accesses and methods cause side effects, then it is guaranteed that _exactly_ the same side effects will occur when using `+~`. Of course, in the case that a null check fails, only the side effects up to that point will occur.

For example:

```js
var count = 0;
var x = {
    y: function () {
        count++,
        return {z: 'tada!'},
    },
};

console.log(+~x.y().z); // --> tada!
console.log(count);     // --> 1
```

This is also the case for computed properties/indexes. For example:

```js
var index = 0;
var arr = [{x: 'cat'}];

console.log(+~arr[index++].x) // --> cat
console.log(index)            // --> 1
```

#### Non-guarded constructions

Note, however, that neither function arguments, nor subscript property names are null checked. For example

```js
var x = {}, foo = null;
+~x[foo.bar]; // --> error
```

You can, of course, nest the `+~` operator, like so:

```js
+~x[+~foo.bar]; // --> undefined
```

Finally, note that while function calls are guarded, the `+~` operator does not guard against calling non-functions. This will still throw an error:

```js
var x = {y: 'z'};
+~x.y(); // --> error (x.y is not a function)
```

#### Runtime requirements

The generated code requires that the function `__soakNoop` be defined in scope. The file 'babel-plugins/soak-runtime.js' defines this globally, but you can also define it manually. It is assumed to be an empty function, and to return nothing.
