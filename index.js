/*生产环境上监控并把修改或删除的文件信息存入内存*/

var fs = require('fs'),
	path = require('path');

var Watcher = require('Watcher'),
	watcherUtil = require('utils'),
	FSNode = require('FSNode'),
	createHttpServer = watcherUtil.createServer;
	logger = watcherUtil.logger,
	misc = watcherUtil.misc,
	fsUtil = watcherUtil.fs,
	EVENT_CONST = require('inotify/CONST'),
	platform = watcherUtil.platform;

var config = require('./config');
var logPath = config.logPath;

(function(){
	logger.sysError(logPath);
})();
/*支持运行多个监控，只要指定不同的配置文件*/
(function(){
	var args = process.argv;
	if(args.length >= 2){
		// //初始化时创建远程文件
		// var createRemoteDirs = function(){
		// 	var command = (platform.platform = platform.PLATFORM_LINUX && config.rsync.user && config.rsync.user != 'root') ? watcherUtil.command.su : watcherUtil.command;
		// 	var _logInit = logger.prefixLogSync(logPath,'init');
		// 	var _logError = logger.errorSync(logPath);
		// 	config.watcher.forEach(function(v){
		// 		var rsync = v.rsync;
		// 		if(rsync && !v.isFile){
		// 			rsync.forEach(function(rv){
		// 				var port = rv.port;
		// 				var m = rv.address.match(/(.+?):(.+)/);
		// 				if(m){
		// 					var remoteAddress = m[1];
		// 					var remoteDir = m[2];
		// 					if(remoteAddress && remoteDir){
		// 						var _command = ['ssh -p',port,remoteAddress,'"mkdir -p '+remoteDir+'"'].join(' ');
		// 						command(_command,function(err,data){
		// 							if(err){
		// 								_logError(_command,err);
		// 							}else{
		// 								_logInit(_command,data);
		// 							}
		// 						});
		// 					}
		// 				}
		// 			});
		// 		}
		// 	});
		// }
		var _logWatcher = logger.prefixLogSync(logPath,'watcher');
		if(args.length == 3 && args[2] == 'reload'){
			/*重新加载配置*/
			misc.curl(config.host,config.port,'/?reload=1',function(err){
				_logWatcher('reload',err||'Y');
			});
			return;
		}
		_logWatcher('start');
		(function(){
			var copyToPath = path.normalize(config.copyToPath);
			fsUtil.mkdirSync(copyToPath);
			var tree = new FSNode('/');
			tree.on('addPath',function(_path){
				_logWatcher('addPath',_path);
			}).on('deletePath',function(_path){
				_logWatcher('deletePath',_path);
			});

			var watcher = new Watcher()
			/*创建文件夹可以不处理，交由创建文件事件处理父级文件夹*/
			// .on(EVENT_CONST.EVENT_CREATE,function(d){
			// 	tree.addPath(d.fullname,d.isDir);
			// })
			.on(EVENT_CONST.EVENT_CHANGE,function(d){
				tree.addPath(d.fullname,!d.isDir);
			})
			/*创建文件夹可以不处理，交由创建文件事件处理父级文件夹*/
			// .on(Watcher.CREATE_DIR,function(d){
			// 	tree.addPath(d.fullname);
			// })
			.on(EVENT_CONST.EVENT_REMOVE,function(d){
				tree.deletePath(d.fullname);
			});

			if(config.port){
				createHttpServer(config.port,tree,watcher,logPath);
			}
			//split(path.sep)时使用
			var _addSepToFilePath = function(_path){
				_path = path.normalize(_path);
				if(_path.lastIndexOf(_path.length-1) != path.sep){
					_path += path.sep;
				}
				return _path;
			}

			// createRemoteDirs();
			var watcherCache = config.watcher.info;
			var getPathDepth = misc.getPathDepth;
			//进行排序，让父级尽量靠前
	        Object.keys(watcherCache).sort(function(a,b){
	            return getPathDepth(a) > getPathDepth(b);
	        }).forEach(function(i){
				var sub = watcherCache[i];
				sub.sort(function(a,b){
					return getPathDepth(a) > getPathDepth(b);
				});
				watcher.initAddParentWatch(i,sub);
	        });			
		})();
	}
})();