/*直接运行外部命令*/
var path = require('path');
var util = require('../../util');
// var util = {};
// ;(function(){
// 	var exec = require('child_process').exec;
// 	util.command = function(command,callback){
// 		callback || (callback = function(){});
// 		var runCommand = exec(command,function(error, stdout, stderr){
// 			console.log('error-----');
// 			console.log(error);
// 			console.log('stdout-----');
// 			console.log(stdout);
// 			console.log('stderr-----');
// 			console.log(stderr);
// 			console.log('-----');
// 			if(error || stderr){
// 				callback(error||stderr);
// 			}else{
// 				callback(null,stdout&&stdout.replace(/^\s*|\s*$/g,''));
// 			}
// 		}); 
// 		// var runCommand = exec(command);
// 		// var result = '';
// 		// var errMsg = '';
// 		// runCommand.stdout.on('data', function (data) {
// 		// 	result += data.toString();
// 		// 	// console.log('输出：'+data);
// 		// });
// 		// // 捕获标准错误输出并将其打印到控制台
// 		// runCommand.stderr.on('data', function (data) {
// 		// 	errMsg += data;
// 		// 	// console.log('错误输出：'+data);
// 		// });
// 		// runCommand.on('exit', function (code) {
// 		// 	callback(errMsg,result);
// 		// });
// 	}
// 	util.command.su = function(user,command,callback){
// 		command = ['su - '+user+' << EOF',command,'EOF'].join('\n');
// 		util.command(command,callback);
// 	}
// })();
// util.command('ls -ls',function(err,data){
// 	console.log(err,data);
// 	console.log('==========');
// });
// util.command('/user/bin/test',function(err,data){
// 	console.log(err,data);
// 	console.log('==========');
// });

// util.command('test',function(err,data){
// 	console.log(err,data);
// 	console.log('==========');
// });

// (function(){
// 	var command = "/usr/bin/rsync -WPaz  '-e ssh -p 2222' /tmp/watcher/6714df1483f29f51fc24dfc7b73812a231fda4db20130812121802/ sam@61.4.185.44:/home/sam/www/htdocs/lab/webapps/  >> /tonny/log/_$(date +%Y-%m-%d).log;";
// 	util.command(command,function(err,data){
// 		console.log(err,data);
// 		console.log('==========');
// 	});
// })();

// (function(){
// 	var command = "/usr/local/bin/rsync -WPaz /tmp/a/ /tmp/b/1 >> /tmp/result.log";
// 	util.command(command,function(err,data){
// 		console.log(err,data,command);
// 		console.log('==========');
// 	});
// })();

// (function(){
// 	var command = "echo $(date '+%Y-%m-%d %H:%M:%S');/usr/local/bin/rsync -WPaz /tmp/a/ /tmp/b/1 >> /tmp/result.log;echo $(date '+%Y-%m-%d %H:%M:%S')end;";
// 	util.command.su('sam',command,function(err,data){
// 		console.log(err,data,command);
// 		console.log('==========');
// 	});
// })();

console.log('===== setTimeout =====');
(function(){
	var command = "/usr/local/bin/node "+path.join(__dirname,'timeout.js');
	util.command(command,function(err,data){
		console.log(err,data,command);
		console.log('==========');
	},5000);
})();