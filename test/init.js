var chai = require('chai');
var path = require('path');

chai.use(require('chai-as-promised'));

global.expect = chai.expect;

var rootdir = path.resolve(__dirname, '..');

// Returns a path relative to the project root, no matter what file it's called from.
var projpath = function (relativePath) {
  return path.join(rootdir, relativePath);
}

// First require in the babel hook
require('babel-register')({
  // Do not babel generated files or external files
  ignore: function (filename) {
    return (!/test\/dot-underscore/.test(filename))

    return false;
  },
  compact: false,
  plugins: [
    "transform-es2015-block-scoping",
    projpath("babel-plugins/dot-underscore"),
  ],
});
