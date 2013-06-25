var path = require('path');
var Watcher = require('../../watcher').Watcher;
var innerUtil = require('../../watcher')._innerUtil;
var readFromFile = innerUtil.readFromFile;
var watcherUtil = require('../../util');

var _log = watcherUtil.prefixLogSync('/tonny/log','ergodic');
var _logResult = watcherUtil.prefixLogSync('/tonny/log','ergodic_result');
var currentSecond = Math.round((+new Date() - 1000*60*60)/1000);
(currentSecond.toString().length == 10) || (currentSecond = '');

var _path = '/tonny/test';
var tempFile = path.join('/tonny/temp',watcherUtil.md5(new Date()+_path));
var command = ['nohup',path.join(__dirname,'../../shell/readdir.sh'),_path,currentSecond,'>>',tempFile,'2>&1 &'].join(' ');
_log('readdir',currentSecond,_path,tempFile);
watcherUtil.command(command);
setTimeout(function(){
	Watcher.initAddWatchFromFile(tempFile,function(lines){
		if(watcherUtil.isArray(lines)){
			lines.forEach(function(line){
				_logResult(line);
			});
		}
	});
},5);