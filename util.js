/*watcher下用到的工具类*/

var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
/*时间格式化*/
Date.prototype.format = function(format){
	format || (format = 'yyyy-MM-dd hh:mm:ss');
	var o = {
		"M+" : this.getMonth()+1, //month
		"d+" : this.getDate(),    //day
		"h+" : this.getHours(),   //hour
		"m+" : this.getMinutes(), //minute
		"s+" : this.getSeconds(), //second
		"q+" : Math.floor((this.getMonth()+3)/3),  //quarter
		"S" : this.getMilliseconds() //millisecond
	}
	if(/(y+)/.test(format)){
		format = format.replace(RegExp.$1,(this.getFullYear()+"").substr(4 - RegExp.$1.length));
	} 
	for(var k in o){
		if(new RegExp("("+ k +")").test(format)){
			format = format.replace(RegExp.$1,RegExp.$1.length==1 ? o[k] :("00"+ o[k]).substr((""+ o[k]).length));
		}
	}
	
	return format;
}
/*字符中加密*/
function md5(str){
    if(str && str.toString){
        return crypto.createHash('sha1').update(str.toString()).digest('hex');
    }
    return '';
}
exports.md5 = md5;

/*同步拷贝文件*/
exports.copyFileSync = function(fromPath,toPath){
	if(fs.existsSync(toPath)){
		fs.unlinkSync(toPath);
	}else{
		exports.mkdirSync(path.dirname(toPath));
	}
	var BUF_LENGTH = 64*1024
	var buff = new Buffer(BUF_LENGTH)
	var fdr = fs.openSync(fromPath, 'r');
	var fdw = fs.openSync(toPath, 'w');
	var bytesRead = 1;
	var pos = 0;
	while (bytesRead > 0){
		bytesRead = fs.readSync(fdr, buff, 0, BUF_LENGTH, pos);
		fs.writeSync(fdw,buff,0,bytesRead);
		pos += bytesRead;
	}
	
	fs.closeSync(fdr);
	fs.closeSync(fdw);
}
/*同步递归创建目录*/
exports.mkdirSync = function(mkPath){
	var parentPath = path.dirname(mkPath);
	if(!fs.existsSync(parentPath)){
		exports.mkdirSync(parentPath);
	}
	if(!fs.existsSync(mkPath)){
		fs.mkdirSync(mkPath);
	}
}
/*同步递归删除目录*/
exports.rmdirSync = function(p) {
    //如果文件路径不存在或文件路径不是文件夹则直接返回
    if(fs.existsSync(p)){
    	var stat = fs.statSync(p);
    	if(stat.isDirectory()){
    		var files = fs.readdirSync(p);
    		files.forEach(function(file) {
	            var fullName = path.join(p, file);
	            if (fs.statSync(fullName).isDirectory()) {
	                exports.rmdirSync(fullName);
	            } else {
	                fs.unlinkSync(fullName);
	            }
	        });
		    fs.rmdirSync(p);
    	}else{
    		fs.unlinkSync(p);
    	}
    }
}
/*继承*/
exports.extend = function(a,b,c,d){
	var args = [].slice.call(arguments,1);
	args.forEach(function(obj){
		for(var i in obj){
			a[i] = obj[i];
		}
	});
	
	return a;
}
/*isArray*/
;(function(){
	['Array'].forEach(function(item){
		exports['is'+item] = function(obj){
			return Object.prototype.toString.call(obj) == '[object '+item+']';
		}
	});
})();

/*日志处理*/
;(function(){
	//日志格式：
	//"2013-05-21 09:30:21"	"add to memory" "/path/a/b.txt" 
	var addTime = function(args){
		args = [].slice.call(args);
		args.unshift(new Date().format());
		return args;
	}
	var print = function(sep){
		if(sep){
			return function(){
				return console.log.call(console,addTime(arguments).join(sep));
			}
		}else{
			return function(){
				console.log.apply(console,addTime(arguments));
			}
		}
	}
	exports.print = print();
	exports.log = print('\t');
	;(function(){
		var delay = 10;
		var logData = {};
		var fnCache = {};
		var _cacheTime = new Date();
		/*同步输出*/
		exports.logSync = function(logPath,getLogFileName){
			getLogFileName || (getLogFileName = function(msgDate){
				return path.join(logPath,msgDate.format('yyyy-MM-dd')+'.log');
			});
			logPath = path.normalize(path.join(logPath,'.'));
			var cacheName = getLogFileName(_cacheTime);//根据logPath和getLogFileName来确定缓存名称
			if(fnCache[cacheName]){
				return fnCache[cacheName];
			}
			exports.mkdirSync(logPath);
			logData[cacheName] || (logData[cacheName] = []);
			var deal = function(){
				var tempData = logData[cacheName];
				logData[cacheName] = [];
				var tempObj = {};
				tempData.forEach(function(info){
					var t = getLogFileName(info[0]);
					tempObj[t] || (tempObj[t] = []);
					tempObj[t].push(info[1]);
				});
				for(var _path in tempObj){
					tempObj[_path].push('');
					fs.appendFileSync(_path,tempObj[_path].join('\n'));
				}
				if(tempData.length){
					dealTime = setTimeout(deal,delay);
				}else{
					clearTimeout(dealTime);
					dealTime = false;
				}
			}
			function startDeal(){
				dealTime = setTimeout(deal,delay);
			}
			var dealTime;
			return (fnCache[cacheName] = function(){
				var args = addTime(arguments);
				var obj = [new Date(),args.join('\t')];
				logData[cacheName].push(obj);
				// config.isDebug && exports.print.apply(null,arguments);
				if(!dealTime){//当没有处理队列时，启动处理
					startDeal();
				}
			})
		}
		//同步输出到错误日志文件
		exports.errorSync = function(logPath,prefix){
			//这里可以保证不和logSync的缓存键值相同
			return exports.logSync(logPath,function(msgDate){
				return path.join(logPath,(prefix||'err_')+msgDate.format('yyyy-MM-dd')+'.log');
			});
		}
		exports.prefixLogSync = function(logPath,prefix){
			//这里可以保证不和logSync的缓存键值相同
			return exports.logSync(logPath,function(msgDate){
				return path.join(logPath,prefix+'_'+msgDate.format('yyyy-MM-dd')+'.log');
			});
		}
	})()
})();
/*直接运行外部命令*/
;(function(){
	var exec = require('child_process').exec;
	exports.command = function(command,callback){
		callback || (callback = function(){});
		var runCommand = exec(command,function(error, stdout, stderr){
			if(error || stderr){
				callback(error||stderr);
			}else{
				callback(null,stdout);
			}
		});
	}
	exports.command.su = function(user,command,callback){
		command = ['su - '+user+' << EOF',command,'EOF'].join('\n');
		exports.command(command,callback);
	}
})();
	
exports.sysError = function(logPath){
	var errorLog = exports.prefixLogSync(logPath,'err');
	process.on('uncaughtException',function(e){
		errorLog('sysErr',e);
	});
}