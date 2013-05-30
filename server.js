/*监控并处理目标服务器上指定的删除信息*/

var fs = require('fs');
var path = require('path');
var util = require('./util');
var watcherConfig = require('./config/index');
var config = require('./config/server');
var _log = util.prefixLogSync(config.logPath,config.prefixLogname);
var _delete = function(content){
	if(!content){
		return;
	}
	content = content.toString();
	var lines = content.split(watcherConfig.deletedSep);
	lines.forEach(function(v){
		if(v){
			var rmdirName = path.join(config.serverPath,v);
			util.rmdirSync(rmdirName);
			_log('rmdir',rmdirName);
		}
	})
}

;(function(){
	var deletedFilePath = path.join(config.serverPath,watcherConfig.deletedFileName);
	var delay = config.watchDelay;
	var fn = function(){
		if(fs.existsSync(deletedFilePath)){
			var content = fs.readFileSync(deletedFilePath);
			fs.unlinkSync(deletedFilePath);
			_delete(content);
		}
		setTimeout(fn,delay);
	}
	setTimeout(fn,delay);
})();