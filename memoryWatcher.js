/*生产环境上监控并把修改或删除的文件信息存入内存*/

var fs = require('fs');
var path = require('path');
var config = require('./config/index');
var watcherUtil = require('./util');
var Watcher = require('./watcher').Watcher;
var Node = require('./node');

(function(){
	watcherUtil.sysError(config.logPath);
})();
/*支持运行多个监控，只要指定不同的配置文件*/
(function(){
	var args = process.argv;
	if(args.length >= 2){
		(function(){
			var copyToPath = path.normalize(config.copyToPath);
			watcherUtil.mkdirSync(copyToPath);

			var tree = new Node('/',config.port);
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
			var watcherCache = config.watcher.info;
			for(var i in watcherCache){
				watcher.initAddWatch(i,watcherCache[i]);
			}
			var currentSecond = Math.round((+new Date() - config.create_delay)/1000);
			(currentSecond.toString().length == 10) || (currentSecond = '');
			var _log = watcherUtil.logSync(config.logPath);
			config.watcher.forEach(function(info){
				var _path = info.path;
				var tempFile = path.join(copyToPath,watcherUtil.md5(new Date()+_path));
				var command = ['nohup',path.join(__dirname,'./shell/readdir.sh'),_path,currentSecond,'>>',tempFile,'2>&1 &'].join(' ');
				_log('readdir',currentSecond,_path,tempFile);
				watcherUtil.command(command);
				setTimeout(function(){
					Watcher.initAddWatchFromFile(tempFile,function(lines){
						if(watcherUtil.isArray(lines)){
							lines.forEach(function(line){
								line = line.split('|');
								if(line.length == 2){
									watcher.initAddFile(line[0]);
								}else{
									watcher.initAddWatch(line[0]);
								}
							});
						}
					});
				},5);
			});
		})();
	}
})();