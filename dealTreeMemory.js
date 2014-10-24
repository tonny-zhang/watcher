/*处理内存中的目录结构信息*/
var config = require('./config/index');
var path = require('path');
var util = require('./util');
var fs = require('fs');

var max_deal_num = config.max_deal_num || 2000;
var copyToPath = path.normalize(config.copyToPath);

var _log = util.prefixLogSync(config.logPath,config.dealLogPrefix);
var _logError = util.errorSync(config.logPath);
var tree_queue = [];//要处理的文件都会放到队列里
function _dealData(data,nextCallback){
	if(data){
		_dealDeleteTree(data.deleteTree);
		_dealTree(data.tree);
	}
	deal_tree_queue(nextCallback);
}
/*处理队列*/
function deal_tree_queue(nextCallback){
	var total_len = tree_queue.length;
	var deal_queue = tree_queue.splice(0,max_deal_num);
	var queue_len = deal_queue.length;
	if(queue_len > 0 || total_len > 0){
		_log('queue','deal_queue len = '+queue_len+', tree_queue len = '+total_len);
	}
	var item;
	while(item = deal_queue.shift()){
		_copy.apply(null,item);
	}
	nextCallback && nextCallback(tree_queue.length > 0?deal_tree_queue:null);
}
/*复制文件，保证文件内容不为空*/
var _copy = function(sourcePath,targetPath){
	if(!fs.existsSync(sourcePath)){
		_logError('copy',sourcePath,'no exists');
		return;
	}
	if(fs.statSync(sourcePath).size > 0){
		util.copyFileSync(sourcePath,targetPath);
		_log('copyFile',sourcePath,targetPath);
	}else{
		_logError('copy',sourcePath,'size 0');
	}
}
/*处理目录结构*/
function _dealTree(tree){
	if(!tree){
		return;
	}
	function _deal(fromDir,toDir,treeNode){
		for(var i in treeNode){
			var toPath = path.normalize(path.join(toDir,i));
			var fromPath = path.normalize(path.join(fromDir,i));
			var subTreeNode = treeNode[i];
			if(subTreeNode == 0){
				// _copy(fromPath,toPath);
				tree_queue.push([fromPath,toPath]);
			}else{
				// util.mkdirSync(toPath);
				// _log('mkdir',toPath);
				_deal(fromPath,toPath,subTreeNode);
			}
		}
	}
	//优先处理子目录
	config.watcher.sort(function(a,b){
		var aLen = a.path.split(path.sep).length;
		var bLen = b.path.split(path.sep).length
		return  (a.isFile?aLen+1:aLen) < (b.isFile?bLen+1:bLen);
	});
	config.watcher.forEach(function(v){
		var driInfo = tree;
		var str = '';
		var _pathArr = v.path.split(path.sep);
		for(var i = 0,j=_pathArr.length;i<j;i++){
			if(!_pathArr[i]){
				continue;
			}
			var temp = driInfo[_pathArr[i]];
			str += '["'+_pathArr[i]+'"]';
			if(temp){
				driInfo = temp;
			}else{
				if(temp == 0){
					var isWatchingFile = true;//当监控为文件时直接进行处理
				}
				break;
			}
		}
		if(i == j || isWatchingFile){
			var toPath = path.join(copyToPath,v.tempName);
			if(isWatchingFile && v.isFile){
				var filePath = v.path;
				var newPath = path.join(toPath,path.basename(filePath));
				// _copy(filePath,newPath);
				tree_queue.push([filePath,newPath]);
			}else{
				_deal(v.path,toPath,driInfo);
			}
			new Function('delete this'+str).call(tree);//子目录处理完后清除数据，减小父级目录的处理，达到减小IO资源浪费
		}
	});
}

//处理要删除的信息
function _dealDeleteTree(deleteTree,base){
	if(!deleteTree || !deleteTree.length){
		return;
	}
	base = base || '/';
	var deleteTreePath = copyToPath;
	util.mkdirSync(deleteTreePath);
	deleteTree.forEach(function(v,i){
		deleteTree[i] = base+v;
	});
	var deleteDetailFileName = path.join(deleteTreePath,config.deletedFileName);
	fs.appendFileSync(deleteDetailFileName,JSON.stringify({ip:config.ip||'',p:deleteTree}));
	_log('deletedDetail',deleteDetailFileName);
}

/*通过http得到内存中目录结构及要删除的信息
  ！！但这个方法不能保证同步
*/
function getDataFromMemory(nextCallback){
	nextCallback || (nextCallback = function(){});
	util.curl(config.host,config.port,'/',function(err,data){
		if(err){
			_logError('problem with request: ' + JSON.stringify(err));
		}else{
			try{
				data = JSON.parse(data);
			}catch(e){
				_logError('error getDataFromMemory data wrong!'+JSON.stringify(err));
				nextCallback();
			}
			_dealData(data,nextCallback);
		}
	},config.delay.curl);//设置超时时间
}
/*从json文件中得到目录结构及要删除的信息
  !!可以在shell中用
*/
function getDataFromJsonFile(filePath){
	if(fs.existsSync(filePath)){
		try{
			var tree = require(filePath);
			_dealData(tree);
			deal_tree_queue(function(haveNextFn){
				if(haveNextFn){
					haveNextFn();
				}else{
					_log('deal data from json file down!');
				}
			});
		}catch(e){
			_logError('getDataFromJsonFile error',JSON.stringify(err));
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
exports._dealData = _dealData;
exports._copy = _copy;