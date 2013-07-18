var util = require('../configUtil');

var config = require('../config/index');
util.server(config);
console.log(config.watcher);