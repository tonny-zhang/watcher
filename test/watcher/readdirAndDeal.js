var path = require('path');
var innerUtil = require('../../watcher')._innerUtil;
var config = require('../../config');

//把父级目录尽量靠前
config.watcher.sort(function(a,b){
	return a.path.split(path.sep).length > b.path.split(path.sep).length;
});
//dir,copyToPath,fromSecond,dealCallback
var copyToPath = config.copyToPath;
var fromSecond = +new Date() - config.create_delay;
config.watcher.forEach(function(_watcher){
	innerUtil.readdirAndDeal(_watcher.path,copyToPath,fromSecond,function(line,isFile){
		// console.log(line,isFile);
	});
});
