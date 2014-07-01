/*crontab每钟运行一次*/

var path = require('path');
var fs = require('fs');

var watcherUtil = require('utils'),
	logger = watcherUtil.logger,
	misc = watcherUtil.misc,
	fsUtil = watcherUtil.fs,
	platform = watcherUtil.platform;
var config = require('./config');

var isRetainTemp = config.isRetainTemp;//是否保留临时文件
var logPath = config.logPath;
var currentDir = __dirname;

var isWindows = platform.platform == platform.PLATFORM_WIN32;
var isLinux = platform.platform == platform.PLATFORM_LINUX;
//处理临时文件名
var dealTempName = function(){
	var currentTime = new Date().format('yyyyMMddhhmmss');//以秒为单位足矣
	logger.prefixLogSync(logPath,config.runLogPrefix)('start run '+currentTime);
	config.watcher.forEach(function(v){
		v.tempName = v.tempName.replace(/\d{14}$/,'') + currentTime;
	});
}
dealTempName();
var _runFn = function(){
	logger.sysError(logPath);
	if(isLinux){
		//运行监控
		(function(){
			var flock = config.flock;
			// /usr/bin/flock -xn /var/run/watcher.lock -c 'nohup /usr/local/bin/node /tonny/nodejs/memoryWatcher.js >> /tonny/log/watcher/memoryWatcher.log 2>&1 &'
			misc.command([flock.bin,'-xn',flock.lockFile,'-c',"'"+['nohup',config.node.bin,path.join(currentDir,'memoryWatcher.js'),'>>',path.join(logPath,'memoryWatcher.log'),'2>&1 &'].join(' ')+"'"].join(' '));

			// util.command([config.node.bin,path.join(currentDir,'memoryWatcher.js'),'>>',path.join(logPath,'memoryWatcher.log')].join(' '));
		})();
	}
	

	//运行处理
	(function(){
		var dealTreeMemory = watcherUtil.dealTree;
		dealTreeMemory.init(config);
		var totalRunTime = 55000;//程序运行总时间,给最后一次处理5秒的处理时间
		var usedTime = 0;
		var delay = config.delay.run;
		var _logRun = logger.prefixLogSync(logPath,config.runLogPrefix);
		var _logDeal = logger.prefixLogSync(logPath,config.dealLogPrefix);
		var _rsyncErrLog = logger.prefixLogSync(logPath,config.rsyncErrLogPrefix);
		var watcherInfo = config.watcher;
		var rsyncCommand = [config.rsync.bin,config.rsync.param].join(' ');
		var rsyncArr = [];
		var copyToPath = path.normalize(config.copyToPath);
		var dealCommand = function(rsyncPath,rsyncInfo,watcherPath,tempDir){
			if(rsyncPath && misc.isArray(rsyncInfo) && rsyncInfo.length > 0){
				var temp = [];
				rsyncInfo.forEach(function(v){
					//这里的错误交由rsync函数处理
					if(isLinux){
						var _logPath = path.join(logPath,v.logPrefix+'_$(date +%Y-%m-%d).log');
						var startCommand = "echo $(date '+%Y-%m-%d %H:%M:%S') "+(watcherPath+' '+rsyncPath)+"'=>"+v.address+"'"+' >> '+_logPath;
						var command = [rsyncCommand,(v.param||''),"'-e ssh -p "+v.port+"'",rsyncPath,v.address,'>>',_logPath].join(' ');
						var endCommand = "echo $(date '+%Y-%m-%d %H:%M:%S')  end >> "+_logPath;
						temp.push([startCommand,command,endCommand].join(';'));
					}else{
						var _logPath = path.join(logPath,v.logPrefix+'_'+(new Date().format('yyyy-MM-dd'))+'.log');
						var sourcePath = rsyncPath.replace(/\\/g,'/').replace(/^(\w):/,'/$1');
						var startCommand = "echo "+(new Date().format())+" "+(watcherPath+' '+rsyncPath)+"' to "+v.address+"'"+' >> '+_logPath;
						var param = v.param||'';
						var command = [rsyncCommand,param,'-P '+v.port,sourcePath,v.address,'>>',_logPath].join(' ');
						temp.push(command);
						// temp.push([startCommand,command].join(';'));
					}
				});
				rsyncArr.push({'path':rsyncPath,'rsync': temp,'tempDir': tempDir || rsyncPath});
			}
		}
		var dealWatcherCommand = function(){
			//处理同步命令处理
			watcherInfo.forEach(function(v){
				//v.isFile时，rsync命令格式如：rsync -WPaz '-e ssh -p 2222'  /tmp/footer.htm sam@*.*.*.*:/pub/footer.htm
				var tempDir = path.join(copyToPath,v.tempName);
				var tempRsyncPath = tempDir + '/' + (v.isFile?path.basename(v.path):'');
				dealCommand(tempRsyncPath,v.rsync,v.path,tempDir,v.isFile);
			});
			dealCommand(path.join(copyToPath,config.deletedFileName),config.deleteRsync);
		}
		dealWatcherCommand();

		var _execRsyncCommand = (function(){
			var timeout = config.delay.rsync;//同步命令的超时时间
			return isLinux && config.rsync.user ? function(command,callback){
				misc.command.su(config.rsync.user,command,callback,timeout);
			}: function(command,callback){
				misc.command(command,callback,timeout);
			}
		})();

		var _afterGetData = (function(){
			var isSyncExec = true;//是否同步执行每个监控目录的rsync
			return isSyncExec?function(callback){
				//每个监控目录的rsync要保证同步执行，保证一个机器的rsync的连接数最小
				var _tempRsyncArr = rsyncArr.slice(0);
				var _exec = function(){
					var info = _tempRsyncArr.shift();
					if(info){
						rsync(info,function(){
							_exec();
						});
					}else{
						callback();
					}
				}
				_exec();
			}:function(callback){
				var _runNum = rsyncArr.length;
				var _runedNum = 0;
				var _cb = function(){
					if(_runedNum == _runNum){
						callback();		
					}
				}
				rsyncArr.forEach(function(info){
					rsync(info,function(){
						_runedNum++;
						_cb();
					});
				});
			}
		})();
		function deal(callback){
			//dealTreeMemory.getDataFromMemory保证了超时处理
			dealTreeMemory.getDataFromMemory(function(){
				_afterGetData(callback);
			});
		}
		function rsync(rsyncInfo,callback){
			if(!fs.existsSync(rsyncInfo.path)){
				return callback();
			}
			var _rsyncInfo = rsyncInfo.rsync;
			var _runNum = _rsyncInfo.length;
			var _runedNum = 0;
			var _isHaveError = false;
			var _cb = function(){
				if(_runedNum == _runNum){
					// 不管是否出现错误都把临时文件删除
					if(_isHaveError){
						if(isRetainTemp){
							return callback();
						}
					}
					if(isLinux){
						misc.command('rm -rf '+rsyncInfo.tempDir,function(){
							_logDeal('rm',rsyncInfo.tempDir);
							callback();
						});
					}else{
						fsUtil.rmdirSync(rsyncInfo.tempDir);
						_logDeal('rm',rsyncInfo.tempDir);
						callback();
					}
				}
			}
			_rsyncInfo.forEach(function(_rsyncCommand){
				_execRsyncCommand(_rsyncCommand,function(err,d){
					if(err){
						console.log(err);
						if(!/^warning/i.test(err)){
							_isHaveError = true;
							_rsyncErrLog(['command:',_rsyncCommand,'err:',JSON.stringify(err)].join(' '));
						}
					}
					_runedNum++;
					_cb();
				});
			})
		}
		if(isLinux){
			function run(){
				var startTime = +new Date();
				if(usedTime < totalRunTime){
					deal(function(){
						var time = (+new Date() - startTime);
						usedTime += time+delay;
						_logRun('takes '+time+'ms');
						if(usedTime + delay < totalRunTime){
							setTimeout(run,delay);
						}
					});
				}
			}
		}else{
			function run () {
				var startTime = +new Date();
				deal(function(){
					var time = (+new Date() - startTime);
					usedTime += time + delay;
					_logRun('takes '+time+'ms');
					setTimeout(run,delay);
				});
				if(usedTime > 10){
					dealTempName();
					dealWatcherCommand()
					usedTime = 0;
				}
			}
		}
		
		setTimeout(run,delay);
	})();
}

;(function(){
	if(isLinux && config.rsync.user){
		misc.command('if [ ! -d '+logPath+' ];then mkdir '+logPath+';fi;chown '+(config.rsync.group||config.rsync.user)+'.'+config.rsync.user+' '+logPath,_runFn);
	}else{
		fsUtil.mkdirSync(logPath);//创建日志文件夹目录
		_runFn();
	}
})();