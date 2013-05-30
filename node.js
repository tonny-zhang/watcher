/*用于存储目录结构的数据结构类*/

var http = require('http');
var util = require('./util');
var path = require('path');
var url = require('url');
var fs = require('fs');
var config = require('./config/watcher');
var _log = util.prefixLogSync(config.logPath,'watcher');
var _error = util.errorSync(config.logPath);
/*创建用于其它程序访问的http服务*/
var _createServer = function(port,node){
	var dealContent = function(content){
		content.split(',').forEach(function(v){
			if(v){
				node.addPath.apply(node,v.split('|'));
			}
		});
	}
	var server = http.createServer(function (req, res) {
		var params = url.parse(req.url,true).query;
		var resConent = '';
		if(params.f){//根据文件内容添加路径信息
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
		}else if(params.p){//直接添加路径信息
			dealContent(params.p);
		}else{//得到内存中的目录树信息
			var tree = node.getTree();
			var deleteTree = node.getDeleteTree();
			resConent = JSON.stringify({tree:tree,deleteTree:deleteTree});
		}
		res.end(resConent);
	}).on('listening',function(d){
		_log('run in localhost:'+port);
	}).listen(port);
}

var Node = function(basePath,port){
	if(!basePath){
		throw new Error('basePath is necessary!');
	}
	this.basePath = path.normalize(basePath+path.sep);
	this._basePathExp = new RegExp('^'+this.basePath.replace(/\\/g,'\\\\'));
	this.tree = {}
	this.deletedPaths = [];
	if(port){
		_createServer(port,this);
	}
}

Node.prototype._getRelativePath = function(p){
	return path.normalize(p).replace(this._basePathExp,'');
}
/*添加路径，可为相对basePath的相对路径*/
Node.prototype.addPath = function(p,isFile){
	p = this._getRelativePath(p);
	var pathArr = p.split(path.sep);
	var fileName = isFile && pathArr.pop();
	var temp = pathArr.shift();
	var currentNode = this.tree;

	while(temp){
		currentNode = currentNode[temp] || (currentNode[temp] = {});
		temp = pathArr.shift();
	}
	if(fileName){
		currentNode[fileName] = 0;
	}
	_log('addPath',p);
	return this;
}
/*删除路径*/
Node.prototype.deletePath = function(p){
	var _this = this;
	p = this._getRelativePath(p);
	var pathArr = p.split(path.sep);
	var temp = pathArr.shift();
	var currentNode = this.tree;
	var str = '';
	while(temp && currentNode){
		str += '["'+temp+'"]';
		currentNode = currentNode[temp];
		temp = pathArr.shift();
	}
	//这里保证了内存中的数据都是没有同步的
	if(!currentNode){
		this.deletedPaths.push(p);
	}
	(function(){
		var temp = this.tree;
		new Function('delete this.tree'+str).call(_this);
	})();
	_log('deletePath',p);
	return this;
}
Node.prototype.toString = function(){
	return JSON.stringify(this.tree);
}
/*得到修改的文件结构,得到后会把内存数据清空*/
Node.prototype.getTree = function(){
	var tree = this.tree;
	this.tree = {};
	return tree;
}
/*得到优化完的要删除的文件或目录,得到后会把内存数据清空*/
Node.prototype.getDeleteTree = function(){
	var deletedPaths = this.deletedPaths;
	this.deletedPaths = [];
	var toDeleteStack = {};
	deletedPaths.sort(function(a,b){
		return a.length > b.length?1:-1;
	});
	var finalDeleteStack = [];
	var temp;
	while((temp = deletedPaths.shift())){
		var parentPath = path.dirname(temp);
		if(!toDeleteStack[parentPath]){
			finalDeleteStack.push(temp);
		}
		toDeleteStack[temp] = 1;
	}
	return finalDeleteStack;
}
module.exports = Node;