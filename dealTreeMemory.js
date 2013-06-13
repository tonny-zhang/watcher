/*处理内存中的目录结构信息*/

var http = require('http');
var config = require('./config/index');
var path = require('path');
var util = require('./util');
var fs = require('fs');

var copyToPath = path.normalize(config.copyToPath);
// var copyToPathExp = new RegExp('^'+copyToPath.replace(/\\/g,'\\\\'));
// var watchPath = path.normalize(config.watchPath.base);
var _log = util.prefixLogSync(config.logPath,config.dealLogPrefix);
function _dealData(data,callback){
	_log('deal start');
	callback || (callback = function(){});
	if(data){
		_dealTree(data.tree);
		_dealDeleteTree(data.deleteTree);
	}
	_log('deal end');
	callback();
}
/*处理目录结构*/
function _dealTree(tree){
	if(!tree){
		return;
	}
	function _deal(fromDir,toDir,treeNode){
		for(var i in treeNode){
			var toPath = path.normalize(path.join(toDir,i));
			var subTreeNode = treeNode[i];
			if(subTreeNode){
				util.mkdirSync(toPath);
				_log('mkdir',toPath);
				for(var j in subTreeNode){
					_deal(path.join(fromDir,i),path.join(toDir,i),subTreeNode);
				}
			}else{
				var fromPath = path.normalize(path.join(fromDir,i));
				util.copyFileSync(fromPath,toPath);
				_log('copyFile',toPath);
			}
		}
	}
	config.watcher.forEach(function(v){
		var driInfo = tree;
		var _pathArr = v.path.split(path.sep);
		for(var i = 1,j=_pathArr.length;i<j;i++){
			var temp = driInfo[_pathArr[i]];
			if(temp){
				driInfo = temp;
			}else{
				break;
			}
		}
		if(i == j){
			_deal(v.path,path.join(copyToPath,v.tempName),driInfo);
		}
	});
	
}

//处理要删除的信息
function _dealDeleteTree(deleteTree){
	if(!deleteTree || !deleteTree.length){
		return;
	}
	var deleteTreePath = copyToPath;
	util.mkdirSync(deleteTreePath);
	var deleteDetailFileName = path.join(deleteTreePath,config.deletedFileName);
	fs.appendFileSync(deleteDetailFileName,config.deletedSep+deleteTree.join(config.deletedSep));
	_log('deletedDetail',deleteDetailFileName);
}
// _dealData({"base":"d:/","tree":{"test":{"html":{"1":0,"a":{"b":{}}}}},"deleteTree":["aa/bb/c","aa/c/1.txt"]});

/*通过http得到内存中目录结构及要删除的信息
  ！！但这个方法不能保证同步
*/
function getDataFromMemory(callback){
	callback || (callback = function(){});
	var req = http.get({
		hostname: 'localhost',
		port: config.port
	},function(res){
		res.setEncoding('utf8');
		var data = '';
		res.on('data',function(d){
			data += d.toString();
		}).on('end',function(){
			if(data){
				try{
					_dealData(JSON.parse(data),callback);
				}catch(e){
					_log('error getDataFromMemory data wrong!'+e.message);
					callback();
				}
			}else{
				callback();
			}
		});
	});
	req.on('error', function(e) {
		_log('problem with request: ' + e.message);
		callback();
	});
}
/*从json文件中得到目录结构及要删除的信息
  !!可以在shell中用
*/
function getDataFromJsonFile(filePath){
	if(fs.existsSync(filePath)){
		try{
			var tree = require(filePath);
			_dealData(tree);
		}catch(e){
			_log('getDataFromJsonFile error',e.message);
		}
	}
}

// ;(function(){
// 	//node dealTreeMemory.js -f ./temp.json
// 	var helpInfo = '用法：\n'
// 				+'node '+__filename+' -f json_file\n'
// 				+'node '+__filename+'\n'
// 				+'Example:node '+__filename+' -f "/temp/data.json"\n'
// 				+'        node '+__filename;
// 	function help(){
// 		console.log(helpInfo);
// 	}
// 	var args = process.argv;
// 	if(args.length == 4){
// 		var option = args[2];
// 		if(option == '-f'){
// 			getDataFromJsonFile(args[3]);
// 		}else{
// 			help();
// 		}
// 	}else if(args.length == 2){
// 		getDataFromMemory();
// 	}else{
// 		help();
// 	}
// })()

exports.getDataFromMemory = getDataFromMemory;