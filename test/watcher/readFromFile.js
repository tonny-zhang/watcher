var innerUtil = require('../../watcher')._innerUtil;
var readFromFile = innerUtil.readFromFile;

var num = 0;
var dir = 'd:/test/log/init_2013-06-21.log';
dir = 'd:/test/log/dir.log';
readFromFile(dir,function(lineArr){
	lineArr.forEach(function(line){
		//console.log(++num,line);
	});
});