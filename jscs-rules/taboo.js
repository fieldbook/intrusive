// JSCS plugin for disallowing certain identifier names.
//
// This checks only  bracket notation, so you can still do foo['bar'], even if
// bar is taboo.

var rule = function () {};

var proto = rule.prototype;

// Prefix for hash map to exclude any Object prototype value
var prefix = 'jscs-taboo :';

proto.getOptionName = function () {
  return 'taboo';
};

proto.configure = function (tabooIdentifiers) {
  var tabooSet = {};
  tabooIdentifiers.forEach(function (identifier) {
    tabooSet[prefix + identifier] = true;
  })
  this.tabooSet = tabooSet;
}

proto.check = function (file, errors) {
  var tabooSet = this.tabooSet;
  file.iterateNodesByType('Identifier', function (node) {
    if (tabooSet[prefix + node.name]) {
      errors.add('"' + node.name + '" is a taboo identifier', node.loc.start);
    }
  });
}

module.exports = rule;
