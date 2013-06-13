/*监控并处理目标服务器上指定的删除信息*/

var fs = require('fs');
var path = require('path');
var util = require('./util');

function deal(configPath){
	var config = util.extend({},require('./config/index'),require('./config/server'));
	if(configPath){
		config = util.extend(config,require(configPath));
	}
	var deletedFilePath = path.join(config.serverPath,config.deletedFileName);
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

	var _log = util.prefixLogSync(config.logPath,config.prefixLogname);
	var fillReg = new RegExp('^([^'+config.deletedSep+'])');
	var _delete = function(content){
		if(!content){
			return;
		}
		content = path.normalize(content.toString());
		content = content.replace(fillReg,config.deletedSep+'$1');
		var deleteMap = config.deleteMap;
		for(var i in deleteMap){
			var reg = new RegExp('('+config.deletedSep+')'+path.normalize(i).replace(/\\/g,'\\\\'),'g');
			content = content.replace(reg,'$1'+deleteMap[i]);
		}
		var lines = content.split(config.deletedSep);
		lines.forEach(function(v){
			if(v){
				var rmdirName = v;
				util.rmdirSync(rmdirName);
				_log('rmdir',rmdirName);
			}
		})
	}
}
(function(){
	var args = process.argv;
	if(args.length >= 2){
		var configPath = args[2] && (args[2].replace(/^\s+|\s+$/,''));
		deal(configPath);
	}
})();