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
		var _logWatcher = watcherUtil.prefixLogSync(config.logPath,'watcher');
		if(args.length == 3 && args[2] == 'reload'){
			/*重新加载配置*/
			watcherUtil.curl(config.host,config.port,'/?reload=1',function(err){
				_logWatcher('reload',err||'Y');
			});
			return;
		}
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
			.on(Watcher.CREATE_DIR,function(d){
				tree.addPath(d.fullname);
			})
			.on(Watcher.MODIFY,function(d){
				tree.addPath(d.fullname,d.filetype == Watcher.TYPE_FILE);
			})
			.on(Watcher.DELETE,function(d){
				tree.deletePath(d.fullname);
			});

			if(config.port){
				createHttpServer(config.port,tree,watcher);
			}
			var watcherCache = config.watcher.info;
			for(var i in watcherCache){
				watcher.initAddParentWatch(i,watcherCache[i]);
			}
		})();
	}
})();