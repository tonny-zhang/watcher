/*crontab每钟运行一次*/

var config = require('./config');
var util = require('./util');
var path = require('path');
var fs = require('fs');

var logPath = config.logPath;
var currentDir = __dirname;

//处理临时文件名
(function(){
	var currentTime = new Date().format('yyyyMMddhhmmss');//以秒为单位足矣
	util.prefixLogSync(logPath,config.runLogPrefix)('start run '+currentTime);
	config.watcher.forEach(function(v){
		v.tempName += currentTime;
	});
})();
var _runFn = function(){
	util.sysError(logPath);
	//运行监控
	(function(){
		var flock = config.flock;
		// /usr/bin/flock -xn /var/run/watcher.lock -c 'nohup /usr/local/bin/node /tonny/nodejs/memoryWatcher.js >> /tonny/log/watcher/memoryWatcher.log 2>&1 &'
		util.command([flock.bin,'-xn',flock.lockFile,'-c',"'"+['nohup',config.node.bin,path.join(currentDir,'memoryWatcher.js'),'>>',path.join(logPath,'memoryWatcher.log'),'2>&1 &'].join(' ')+"'"].join(' '));

		// util.command([config.node.bin,path.join(currentDir,'memoryWatcher.js'),'>>',path.join(logPath,'memoryWatcher.log')].join(' '));
	})();

	//运行处理
	(function(){
		var dealTreeMemory = require('./dealTreeMemory');
		var totalRunTime = 55000;//程序运行总时间,给最后一次处理5秒的处理时间
		var usedTime = 0;
		var delay = 3000;
		var _logRun = util.prefixLogSync(logPath,config.runLogPrefix);
		var _logDeal = util.prefixLogSync(logPath,config.dealLogPrefix);
		var _rsyncErrLog = util.prefixLogSync(logPath,config.rsyncErrLogPrefix);
		var watcherInfo = config.watcher;
		var rsyncCommand = [config.rsync.bin,config.rsync.param].join(' ');
		var rsyncArr = [];
		var copyToPath = path.normalize(config.copyToPath);
		var dealCommand = function(rsyncPath,rsyncInfo,watcherPath){
			if(rsyncPath && util.isArray(rsyncInfo) && rsyncInfo.length > 0){
				var temp = [];
				rsyncInfo.forEach(function(v){
					var _logPath = path.join(logPath,v.logPrefix+'_$(date +%Y-%m-%d).log');
					var startCommand = "echo $(date '+%Y-%m-%d %H:%M:%S') "+(watcherPath+' '+rsyncPath)+"'=>"+v.address+"'"+' >> '+_logPath;
					var command = [rsyncCommand,(v.param||''),"'-e ssh -p "+v.port+"'",rsyncPath,v.address,'2>&1','>>',_logPath].join(' ');
					var endCommand = "echo $(date '+%Y-%m-%d %H:%M:%S')  end >> "+_logPath;
					temp.push([startCommand,command,endCommand].join(';'));
				});
				rsyncArr.push({'path':rsyncPath,'rsync': temp});
			}
		}
		//处理同步命令处理
		watcherInfo.forEach(function(v){
			//v.isFile时，rsync命令格式如：rsync -WPaz '-e ssh -p 2222'  /tmp/footer.htm sam@*.*.*.*:/pub/footer.htm
			var tempPath = path.join(copyToPath,v.tempName) + '/' + (v.isFile?path.basename(v.path):'');
			dealCommand(tempPath,v.rsync,v.path);
		});
		dealCommand(path.join(copyToPath,config.deletedFileName),config.deleteRsync);

		var _execRsyncCommand = config.rsync.user?function(command,callback){
			util.command.su(config.rsync.user,command,callback);
		} : util.command
		
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
			var _errInfo = '';
			var _cb = function(){
				if(_runedNum == _runNum){
					if(_errInfo){
						_rsyncErrLog(_errInfo);
						callback();
					}else{
						util.command('rm -rf '+rsyncInfo.path,function(){
							_logDeal('rm',rsyncInfo.path);
							callback();
						});
					}
				}
			}
			_rsyncInfo.forEach(function(_r){
				_execRsyncCommand(_r,function(err,d){
					if(err){
						_errInfo += JSON.stringify(err);
					}else{
						_runedNum++;
					}
					_cb();
				});
			})
		}
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
		setTimeout(run,delay);
	})();
}

;(function(){
	if(config.rsync.user){
		util.command('if [ ! -d '+logPath+' ];then mkdir '+logPath+';fi;chown '+(config.rsync.group||config.rsync.user)+'.'+config.rsync.user+' '+logPath,_runFn);
	}else{
		util.mkdirSync(logPath);//创建日志文件夹目录
		_runFn();
	}
})();
