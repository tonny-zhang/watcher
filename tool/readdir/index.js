var os = require('os');
var cpusNum = Math.floor(os.cpus().length/2);

if(cpusNum > 1){
	var childProcess = require('child_process');
	var childs = new Array(cpusNum);
	for(var i = 0;i<cpusNum;i++){
		childs[i] = childProcess.fork('./readdir.js');
		childs[i].send({index:i});
		// childs[i].execing = 0;
	}
	process.on('message',function(msg){
		_callbackCach[msg.cb] && _callbackCach[msg.cb](msg.err,msg.files);
	});
	var _callbackCach = {};
	var currentIndex = 0;
	exports.readdir = function(dir,callback){
		var callbackName = 'read_'+(+new Date());
		_callbackCach[callbackName] = function(err,files){
			callback && callback(err,files);
			delete _callbackCach[callbackName];
		}
		childs[currentIndex].send({'dir':dir,cb:callbackName});
		if(currentIndex+1 <= cpusNum - 1){
			currentIndex++;
		}else{
			currentIndex = 0;
		}
	}
}else{
	exports.readdir = require('./readdir').readdir;
}