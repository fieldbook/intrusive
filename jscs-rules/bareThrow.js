var rule = function () {};

var proto = rule.prototype;

proto.getOptionName = function () {
  return 'restrictBareThrow'
};

proto.configure = function () {}

proto.check = function (file, errors) {
  file.iterateNodesByType('ThrowStatement', function (node) {
    if (node.argument.type === 'Literal') {
      errors.add('Bare throw (without new Error) not allowed', node.loc.start);
    }
  });
}

module.exports = rule;
