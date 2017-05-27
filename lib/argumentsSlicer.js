// Efficient conversion of arguments to arrays, with slicing.
//
// Usage:
//   let slicer = ArgumentsSlicer.make(1, -1);
//
//   let foo = function () {
//     return slicer.apply(null, arguments);
//   }
//
//  foo('a', 'b', 'c', 'd');
//    --> ['b', 'c']
//
// Notes:
//
// - We sacrifice some syntax weirdness here to prevent deoptimization from
//   passing around arguments, which is why you must call apply.
// - This works best in the case where you have a _static_ slice operation
//   (slice parameters known in advance), so that you can cache the slice
//   function. A few common instances are also provided, which you should use
//   whenever possible to help the optimizer with reuse.
// - Calling ArgumentsSlicer.make dynamically in a function may still be better
//   than using [].slice.call, but you're probably better off with a custom
//   for loop.

let ArgumentsSlicer = module.exports = {
  // Create a function which will output an array from an arguments object,
  // using the semantics as Array.prototype.slice
  make: function (sliceStart, sliceEnd) {
    // Note that we carefully restrict arguments operations throughout this method.

    // This is the main workhorse which contains the loop over arguments. We
    // give it our start and end, which may be computed from the arguments
    // object itself, and we get back a function we can apply to execute the
    // loop and copy into an array.
    let makeLooper = function (start, end) {
      if (start < 0) start = 0;

      // We return a function rather than taking the arguments hash at this
      // level, allowing us to preserve our restricted set of arguments operations
      return function () {
        let adjustedEnd = end;
        if (end > arguments.length) adjustedEnd = arguments.length;

        if (adjustedEnd <= start) return [];

        // Allocate the array to the size we know we need
        let array = new Array(adjustedEnd - start);
        let insertIndex = 0;
        for (let i = start; i < adjustedEnd; i++, insertIndex++) {
          array[insertIndex] = arguments[i];
        }

        return array;
      }
    }

    if (sliceStart == null) sliceStart = 0; // not really a special case
    if (sliceStart < 0) { // start relative to length

      // no explicit end
      if (sliceEnd == null) {
        return function () {
          return makeLooper(arguments.length + sliceStart, arguments.length)
            .apply(null, arguments);
        }
      }

      // end relative to length
      if (sliceEnd < 0) {
        return function () {
          return makeLooper(arguments.length + sliceStart, arguments.length + sliceEnd)
            .apply(null, arguments);
        }
      }

      // end indexed from beginning
      return function () {
        return makeLooper(arguments.length + sliceStart, sliceEnd)
          .apply(null, arguments);
      }
    } else { // start indexed from beginning

      // no explicit end
      if (sliceEnd == null) {
        return function () {
          return makeLooper(sliceStart, arguments.length)
            .apply(null, arguments);
        }
      }

      // end relative to length
      if (sliceEnd < 0) {
        return function () {
          return makeLooper(sliceStart, arguments.length + sliceEnd)
            .apply(null, arguments);
        }
      }

      // end indexed from beginning
      return function () {
        return makeLooper(sliceStart, sliceEnd).apply(null, arguments);
      }
    }
  },
}

_.extend(ArgumentsSlicer, {
  // simple tail; just omit first element
  tail: ArgumentsSlicer.make(1),

  // all but the last element
  initial: ArgumentsSlicer.make(0, -1),

  toArray: ArgumentsSlicer.make(),

  last: function () {
    return arguments[arguments.length - 1];
  },

  // Like array.map; fn gets item, index (but not arguments, because that would deopt)
  // Usage: ArraySlicer.map(fn).apply(null, arguments);
  map: function (fn) {
    return function () {
      let output = new Array(arguments.length);
      for (let i = 0; i < arguments.length; i++) {
        output[i] = fn(arguments[i], i)
      }
      return output;
    }
  },

  // Usage: ArgumentsSlicer.each(fn).apply(null, arguments)
  each: function (fn) {
    return function () {
      for (let i = 0; i < arguments.length; i++) {
        fn(arguments[i], i)
      }
    }
  },

  // Usage: args = ArgumentsSlicer.concat([a, b], [c, d]).apply(null, argumetns) --> [a, b, ...arguments..., c, d]
  concat: function (leadingItems, trailingItems) {
    let leadingCount = leadingItems ? leadingItems.length : 0;
    let trailingCount = trailingItems ? trailingItems.length : 0;

    return function () {
      let array = new Array(leadingCount + arguments.length + trailingCount);
      let outputIndex = 0;

      for (let i = 0; i < leadingCount; i++, outputIndex++) {
        array[outputIndex] = leadingItems[i];
      }

      for (let i = 0; i < arguments.length; i++, outputIndex++) {
        array[outputIndex] = arguments[i];
      }

      for (let i = 0; i < trailingCount; i++, outputIndex++) {
        array[outputIndex] = trailingItems[i];
      }

      return array;
    }
  },

  push: function (items) {
    return ArgumentsSlicer.concat(null, items);
  },

  unshift: function (items) {
    return ArgumentsSlicer.concat(items);
  },
})
