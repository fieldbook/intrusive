// Setup globals
global.Q = require('q');
global.BaseObject = require('./lib/baseObject');
global.extendable = require('./lib/extendable');
global.superExtendable = require('./lib/superExtendable');
global.gettable = require('./lib/gettable');

// Require some prototype modifiers
require('./lib/q.fieldbook');
require('./lib/underscore.fieldbook');
require('./lib/objectUnderscore');
require('./lib/proto/index');
require('./lib/functionBuilder');
