/*生产环境上监控并把修改或删除的文件信息存入内存*/

var fs = require('fs');
var path = require('path');
var config = require('./config');
var watcherUtil = require('./util');
var Watcher = require('./watcher').Watcher;
var Node = require('./node');
var createHttpServer = require('./createHttpServer');

(function(){
	watcherUtil.sysError(config.logPath);
})();
/*支持运行多个监控，只要指定不同的配置文件*/
(function(){
	var args = process.argv;
	if(args.length >= 2){
		//初始化时创建远程文件
		var createRemoteDirs = function(){
			var command = config.rsync.user && config.rsync.user != 'root' ? watcherUtil.command.su : watcherUtil.command;
			var _logInit = watcherUtil.prefixLogSync(config.logPath,'init');
			var _logError = watcherUtil.errorSync(config.logPath);
			config.watcher.forEach(function(v){
				var rsync = v.rsync;
				if(rsync && !v.isFile){
					rsync.forEach(function(rv){
						var port = rv.port;
						var m = rv.address.match(/(.+?):(.+)/);
						if(m){
							var remoteAddress = m[1];
							var remoteDir = m[2];
							if(remoteAddress && remoteDir){
								var _command = ['ssh -p',port,remoteAddress,'"mkdir -p '+remoteDir+'"'].join(' ');
								command(_command,function(err,data){
									if(err){
										_logError(_command,err);
									}else{
										_logInit(_command,data);
									}
								});
							}
						}
					});
				}
			});
		}
		var _logWatcher = watcherUtil.prefixLogSync(config.logPath,'watcher');
		if(args.length == 3 && args[2] == 'reload'){
			/*重新加载配置*/
			watcherUtil.curl(config.host,config.port,'/?reload=1',function(err){
				_logWatcher('reload',err||'Y');
			});
			createRemoteDirs();
			return;
		}
		_logWatcher('start');
		(function(){
			var copyToPath = path.normalize(config.copyToPath);
			watcherUtil.mkdirSync(copyToPath);
			var tree = new Node('/');
			tree.on('addPath',function(_path){
				_logWatcher('addPath',_path);
			}).on('deletePath',function(_path){
				_logWatcher('deletePath',_path);
			});

			var watcher = new Watcher({ignorePath:/^\..+/})
			.on(Watcher.CREATE_FILE,function(d){
				tree.addPath(d.fullname,true);
			})
			/*创建文件夹可以不处理，交由创建文件事件处理父级文件夹*/
			// .on(Watcher.CREATE_DIR,function(d){
			// 	tree.addPath(d.fullname);
			// })
			.on(Watcher.MODIFY,function(d){
				tree.addPath(d.fullname,d.filetype == Watcher.TYPE_FILE);
			})
			.on(Watcher.DELETE,function(d){
				tree.deletePath(d.fullname);
			});

			if(config.port){
				createHttpServer(config.port,tree,watcher);
			}
			//split(path.sep)时使用
			var _addSepToFilePath = function(_path){
				_path = path.normalize(_path);
				if(_path.lastIndexOf(_path.length-1) != path.sep){
					_path += path.sep;
				}
				return _path;
			}

			createRemoteDirs();
			var watcherCache = config.watcher.info;
			//进行排序，让父级尽量靠前
	        Object.keys(watcherCache).sort(function(a,b){
	            return watcherUtil.getPathDepth(a) > watcherUtil.getPathDepth(b);
	        }).forEach(function(i){
				var sub = watcherCache[i];
				sub.sort(function(a,b){
					return watcherUtil.getPathDepth(a) > watcherUtil.getPathDepth(b);
				});
				watcher.initAddParentWatch(i,sub);
	        });			
		})();
	}
})();