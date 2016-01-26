var inflection = require('inflection');

_.defaults(String.prototype, {
  inflect: function (verb) {
    // Put added inflections here

    // Convert dashes to underscores
    if (verb === 'undasherize') return this.replace(/-/g, '_');

    var args = _.tail(arguments);
    args.unshift(this);
    return inflection[verb].apply(inflection, args);
  },

  multiWordToCamelCase: function (lowerFirstLetter) {
    return this.inflect('dasherize').inflect('undasherize').inflect('camelize', lowerFirstLetter);
  },

  capitalize: function () {
    return this[0].toUpperCase() + this.slice(1);
  },

  toClass: function () {
    return '.' + this;
  },

  toId: function () {
    return '#' + this;
  },

  startsWith: function (otherString) {
    return this.slice(0, otherString.length) === String(otherString);
  },

  indefiniteArticle: function () {
    return /^[aeiou]/i.test(this) ? 'an' : 'a';
  },

  contains: function (substr) {
    return this.indexOf(substr) !== -1;
  },

  toBuffer: function () {
    return new Buffer(this.toString());
    // toString is necessary here because of autoboxing; if you pass `this`,
    // you will get a buffer with zeroes in it
  },
})
