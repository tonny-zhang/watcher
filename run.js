/*crontab每钟运行一次*/

var config = require('./config');
var util = require('./util');
var path = require('path');
var fs = require('fs');

var logPath = config.logPath;
var currentDir = __dirname;
//运行监控
(function(){
	var flock = config.flock;
	util.command([flock.bin,'-xn',flock.lockFile,'-c',"'"+['nohup',path.join(config.node.bin,'memoryWatcher.js'),'>>',path.join(logPath,'memoryWatcher.log'),'2>&1 &'].join(' ')+"'"].join(' '));
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
	var rsyncArr = {};
	var copyToPath = path.normalize(config.copyToPath);
	watcherInfo.forEach(function(v){
		var tempPath = path.join(copyToPath,v.tempName)+'/';
		var temp = [];
		v.rsync.forEach(function(_v){
			temp.push([rsyncCommand,"'-e ssh -p "+_v.port+"'",tempPath,_v.address,'2>&1','>>',path.join(logPath,_v.logPrefix+'_$(date +%Y-%m-%d).log')]);
		});
		rsyncArr[v.path] = temp;
	});
	function deal(callback){
		dealTreeMemory.getDataFromMemory(function(){
			var _runNum = 0;
			var _runedNum = 0;
			var _errInfo = '';
			var _cb = function(){
				if(_runedNum == _runNum){
					callback();		
				}
			}
			for(var i in rsyncArr){
				_runNum++;
			}
			for(var i in rsyncArr){
				rsync(rsyncArr[i],function(){
					_runedNum++;
					_cb();
				});
			}
		});
	}
	function rsync(watcherPath,callback){
		if(!fs.existsSync(watcherPath)){
			return callback();
		}
		var _rsyncInfo = rsyncArr[watcherPath];
		var _runNum = _rsyncInfo.length;
		var _runedNum = 0;
		var _errInfo = '';
		var _cb = function(){
			if(_runedNum == _runNum){
				if(_errInfo){
					_rsyncErrLog(_errInfo);
					callback();
				}else{
					util.command('rm -rf '+watcherPath,callback);
				}
			}
		}
		_rsyncInfo.forEach(function(_r){
			util.command(_r,function(d){
				if(d){
					_errInfo += d;
				}
				_runedNum++;
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