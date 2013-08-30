var config = {};
config.watcher = [{
	'path': 'd:/test/html/b1/',
	'command': [
		'node E:/source/watcher/test/config.js'
	]
}];
module.exports = require('../configUtil').callback(config);