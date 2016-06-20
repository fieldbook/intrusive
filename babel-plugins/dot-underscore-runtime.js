// Runtime function for dot-underscore babel plugin.

// Defines the global _getUnderscore which, when passed an argument, will
// check if that argument has an '_' property (to maximize compatibility), and
// return it if so. If the property does not exist, returns an underscore
// wrapper for the object.
global._getUnderscore = function (obj) {
  // The `in` operator can only be used with objects
  return (typeof obj === 'object' && obj !== null && '_' in obj) ? obj['_'] : _(obj);
}
