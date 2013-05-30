/*对外提供向内存中添加路径信息的接口,用法见htlp()*/

var http = require('http');
var util = require('./util');
var url = require('url');

;(function(){
	var config = require('./config/index');
	function curl(path,callback){
		//通过http得到内存中目录结构及要删除的信息
		var req = http.get({
			hostname: 'localhost',
			port: config.port,
			path: path||'/'
		},function(res){
			res.setEncoding('utf8');
			var data = '';
			res.on('data',function(d){
				data += d.toString();
			}).on('end',function(){
				callback && callback();
			});
		});
		req.on('error', function(e) {
		  util.log('problem with request:' ,e.message,__filename);
		});
	}
	var helpInfo = '用法：\n'
				+'node '+__filename+' -[f|p] file_or_dir_path\n'
				+'Example:node '+__filename+' -f "/1.txt" "/2.txt"\n'
				+'        node '+__filename+' -p "/a/b" "/a/1.txt|true"'
	function help(){
		console.log(helpInfo);
	}
	var args = process.argv;
	if(args.length >= 4){
		var option = args[2];
		var key = '';
		if(option == '-f'){
			key = 'f';
		}else if(option == '-p'){
			key = 'p';
		}
		if(key){
			var params = [].slice.call(args,3).join();
			curl('/?'+key+'='+encodeURIComponent(params.replace(/^\s+|\s+$/,'')));
		}else{
			help();
		}
	}else{
		help();
	}
})();
