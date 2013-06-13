/*crontab每钟运行一次*/

var config = require('./config');
var util = require('./util');
var path = require('path');
var fs = require('fs');

var logPath = config.logPath;
var currentDir = __dirname;
(function(){
	util.mkdirSync(logPath);//创建日志文件夹目录
})();

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
	var totalRunTime = 55000;//程序运行总时间
	var usedTime = 0;
	var delay = 10000;
	var _log = util.prefixLogSync(logPath,config.runLogPrefix);
	var _rsyncErrLog = util.prefixLogSync(logPath,config.rsyncErrLogPrefix);
	var watcherInfo = config.watcher;
	var rsyncCommand = [config.rsync.bin,config.rsync.param].join(' ');
	var rsyncArr = [];
	var copyToPath = path.normalize(config.copyToPath);
	watcherInfo.forEach(function(v){
		var tempPath = path.join(copyToPath,v.tempName)+'/';
		var temp = [];
		v.rsync.forEach(function(_v){
			// /usr/bin/rsync -WPaz '-e ssh -p 2222' ${TEMP_PATH} sam@61.4.185.111:/zkTest/serverThree/ 2>&1 >> ${rsyncLog}_three.log
			var command = [rsyncCommand,"'-e ssh -p "+_v.port+"'",tempPath,_v.address,'2>&1','>>',path.join(logPath,_v.logPrefix+'_$(date +%Y-%m-%d).log')].join(' ');
			temp.push('if [ `ls '+tempPath+' 2>/dev/null|wc -l` -gt 0 ]; then '+command+';fi');
		});
		rsyncArr.push({'path':tempPath,'rsync': temp});
	});
	rsyncArr.push({'path':path.join(copyToPath,config.deletedFileName),'rsync': config.deleteRsync});

	function deal(callback){
		dealTreeMemory.getDataFromMemory(function(){
			var _runNum = rsyncArr.length;
			var _runedNum = 0;
			var _errInfo = '';
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
						_log('rm',rsyncInfo.path);
						callback();
					});
				}
			}
		}
		_rsyncInfo.forEach(function(_r){
			util.command(_r,function(err,d){
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
				_log('takes '+time+'ms');
				if(usedTime < totalRunTime){
					setTimeout(run,delay);
				}
			});
		}
	}
	setTimeout(run,delay);
})();