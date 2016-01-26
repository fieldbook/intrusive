var rule = function () {};

var proto = rule.prototype;

proto.getOptionName = function () {
  return 'restrictOnly'
};

proto.configure = function () {}

proto.check = function (file, errors) {
  file.iterateNodesByType('MemberExpression', function (node) {
    if (node.property.name === 'only') {
      errors.add('leftover "only" call', node.loc.start);
    }
  });
}

module.exports = rule;
