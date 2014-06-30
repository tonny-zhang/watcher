var Watcher = require('Watcher');

var watcher = new Watcher({
	filter: function(_path){
		// console.log('filter _path:'+_path);
		return true
	}
});
watcher.initAddParentWatch('d:/test/html/',['d:/test/html/test/']);