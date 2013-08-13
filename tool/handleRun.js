/*crontab每钟运行一次*/

var config = require('../config');
var util = require('../util');
var path = require('path');
var fs = require('fs');

var logPath = config.logPath;
var currentDir = __dirname;

//处理临时文件名
// (function(){
// 	var currentTime = new Date().format('yyyyMMddhhmmss');//以秒为单位足矣
// 	util.prefixLogSync(logPath,config.runLogPrefix)('start run '+currentTime);
// 	config.watcher.forEach(function(v){
// 		v.tempName += currentTime;
// 	});
// })();
var _runFn = function(){
	// util.sysError(logPath);
	
	//运行处理
	(function(){
		var _logDeal = util.prefixLogSync(logPath,config.dealLogPrefix+'handle');
		var _rsyncErrLog = util.prefixLogSync(logPath,config.rsyncErrLogPrefix);
		var watcherInfo = config.watcher;
		var rsyncCommand = [config.rsync.bin,config.rsync.param].join(' ');
		var rsyncArr = [];
		var copyToPath = path.normalize(config.copyToPath);
	
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
					if(_isHaveError){
						callback();
					}else{
						util.command('rm -rf '+rsyncInfo.tempDir,function(){
							_logDeal('rm',rsyncInfo.tempDir);
							callback();
						});
					}
				}
			}
			_rsyncInfo.forEach(function(_rsyncCommand){
				_execRsyncCommand(_rsyncCommand,function(err,d){
					if(err){
						_isHaveError = true;
						_rsyncErrLog(['command:',_rsyncCommand,'err:',JSON.stringify(err)].join(' '));
					}
					_runedNum++;
					_cb();
				});
			})
		}
		var time = new Date();
		time.setMinutes(time.getMinutes() - 2 );//只处理两分钟之前
		time = time.format('yyyyMMddhhmmss');//以秒为单位足矣
		var tempPath = '/tmp/watcher/';
		// tempPath = 'D:\\test\\tmp\\';

		var dirs = fs.readdirSync(tempPath);
		dirs.forEach(function(dir){
			for(var i = 0,j = watcherInfo.length;i<j;i++){
				var v = watcherInfo[i];
				if(dir.indexOf(v.tempName) > -1){
					if(dir.replace(v.tempName,'') <= time){
						var temp = [];
						var watcherPath = v.path;
						var rsyncPath = tempPath+dir+'/';
						v.rsync.forEach(function(v){
							var _logPath = path.join(logPath,v.logPrefix+'_handle_$(date +%Y-%m-%d).log');
							var startCommand = "echo $(date '+%Y-%m-%d %H:%M:%S') "+(watcherPath+' '+rsyncPath)+"'=>"+v.address+"'"+' >> '+_logPath;
							var command = [rsyncCommand,(v.param||''),"'-e ssh -p "+v.port+"'",rsyncPath,v.address,'>>',_logPath].join(' ');
							var endCommand = "echo $(date '+%Y-%m-%d %H:%M:%S')  end >> "+_logPath;
							temp.push([startCommand,command,endCommand].join(';'));
						});
						rsyncArr.push({'path':rsyncPath,'rsync': temp});
						break;
					}
				}
			}
		});
		// fs.writeFileSync(path.join(__dirname,'run_handle_result.js'),JSON.stringify(rsyncArr));
		_afterGetData(function(){});
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
