/*监控并处理目标服务器上指定的删除信息*/

var fs = require('fs');
var path = require('path');
var util = require('./util');
var configUtil = require('./configUtil');

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
	var mapObj = {};
	configUtil.server(config);
	config.watcher.forEach(function(item){
		if(util.isArray(item.map)){
			item.ip = item.ip||'';
			mapObj[item.ip] = mapObj[item.ip] || [];
			mapObj[item.ip].push({client:item.path,server:item.map});
		}
	});
	var _log = util.prefixLogSync(config.logPath,config.prefixLogname);
	var _error = util.prefixLogSync(config.logPath,config.prefixErrorLogname);
	var _rm = require('os').platform() == 'linux': function(_path){
		util.command('rm -rf '+_path,function(){
			_log('rmdir',_path);
		});
	}:function(_path){
		util.rmdirSync(_path);
		_log('rmdir',_path);
	}
	var _delete = function(content){
		if(!content){
			return;
		}
		try{
			content = JSON.parse(content);
			var ip = content.ip;
			var mapInfo = mapObj[ip];
			if(mapInfo){
				mapInfo.forEach(function(item){
					var watcherPath = item.client;
					var serverPath = item.server;
					content.p.forEach(function(_path){
						_path = path.normalize(_path);
						//为了安全，防止操作监控以外的目录
						if(_path.length >= watcherPath.length && _path.indexOf(watcherPath) == 0){
							serverPath.forEach(function(v){
								var rmdirName = _path.replace(watcherPath,v);
								if(rmdirName != _path){
									_rm(rmdirName);
								}
							});
						}
					});
				});
			}else{
				_error('no ip',content);
			}
		}catch(e){
			_error('JSON.parse',content);
			return;
		}
	}

	setTimeout(fn,delay);
}
(function(){
	var args = process.argv;
	if(args.length >= 2){
		var configPath = args[2] && (args[2].replace(/^\s+|\s+$/,''));
		deal(configPath);
	}
})();