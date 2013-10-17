var http = require('http');
var util = require('./util');
var url = require('url');
var fs = require('fs');
var config = require('./config');
var _log = util.prefixLogSync(config.logPath,'watcher');
var _logTest = util.prefixLogSync(config.logPath,'test');
/*创建用于其它程序访问的http服务*/
var _createServer = function(port,node,watcher){
	var dealContent = function(content){
		content.split(',').forEach(function(v){
			if(v){
				node.addPath.apply(node,v.split('|'));
			}
		});
	}
	var server = http.createServer(function (req, res) {
		_logTest(req.url);
		var params = url.parse(req.url,true).query;
		var resConent = '';
		var asyncFn ;//不需要及时得到结果的，可以异步执行，尽快响应请求
		if(params.f){//根据文件内容添加路径信息
			asyncFn = function(){
				params.f.split(',').forEach(function(v){
					if(v){
						if(fs.existsSync(v)){
							fs.readFile(v,function(err,data){
								if(!err){
									dealContent(data.toString());
								}else{
									_error(JSON.stringify(err));
								}
							});
						}
					}
				});
			}
		}else if(params.p){//直接添加路径信息
			asyncFn = function(){
				dealContent(params.p);
			}
		}else if(params.reload){
			asyncFn = function(){
				watcher.reset();
			}
		}else{//得到内存中的目录树信息
			var tree = node.getTree();
			var deleteTree = node.getDeleteTree();
			resConent = JSON.stringify({base:tree.basePath,tree:tree,deleteTree:deleteTree});
		}
		if(asyncFn){
			setTimeout(asyncFn,10);
		}
		_logTest(req.url,1);
		res.writeHead(200);
		res.end(resConent);
		_logTest(req.url,2);
	}).on('listening',function(d){
		_log('run in localhost:'+port);
	}).listen(port);
}

module.exports = _createServer;