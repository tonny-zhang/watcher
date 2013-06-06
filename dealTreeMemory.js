/*处理内存中的目录结构信息*/

var http = require('http');
var config = require('./config/index');
var path = require('path');
var util = require('./util');
var fs = require('fs');

var copyToPath = path.normalize(config.copyToPath);
var copyToPathExp = new RegExp('^'+copyToPath.replace(/\\/g,'\\\\'));
var watchPath = path.normalize(config.watchPath.base);
function _dealData(data){
	if(!data){
		return;
	}
	util.log('dealTreeMemory');
	_dealTree(data.tree,copyToPath);
	_dealDeleteTree(data.deleteTree);
}
/*处理目录结构*/
function _dealTree(tree,basePath){
	if(!tree){
		return;
	}
	for(var i in tree){
		var toPath = path.normalize(path.join(basePath,i));
		if(tree[i]){
			util.mkdirSync(toPath);
			util.log('mkdir:',toPath);
			_dealTree(tree[i],toPath);
		}else{
			var fromPath = toPath.replace(copyToPathExp,watchPath);
			util.copyFileSync(fromPath,toPath);
			util.log('copyFile',toPath);
		}
	}
}
//处理要删除的信息
function _dealDeleteTree(deleteTree){
	if(!deleteTree || !deleteTree.length){
		return;
	}
	var deleteTreePath = copyToPath;
	util.mkdirSync(deleteTreePath);
	var deleteDetailFileName = path.join(deleteTreePath,config.deletedFileName);
	fs.appendFileSync(deleteDetailFileName,deleteTree.join(config.deletedSep)+config.deletedSep);
	util.log('deletedDetail:'+deleteDetailFileName);
}
// _dealData({"tree":{"a":{"b":{"2.txt":0},"1.txt":0}},"deleteTree":["aa/bb/c","aa/c/1.txt"]});

/*通过http得到内存中目录结构及要删除的信息
  ！！但这个方法不能保证同步
*/
function getDataFromMemory(){
	var req = http.get({
		hostname: 'localhost',
		port: config.port
	},function(res){
		res.setEncoding('utf8');
		var data = '';
		res.on('data',function(d){
			data += d.toString();
		}).on('end',function(){
			try{
				if(data){
					_dealData(JSON.parse(data));
				}
			}catch(e){
				util.log('error getDataFromMemory data wrong!'+e.message);
			}
		});
	});
	req.on('error', function(e) {
	  util.log('problem with request: ' + e.message);
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
			util.log('getDataFromJsonFile error',e.message);
		}
	}
}

;(function(){
	//node dealTreeMemory.js -f ./temp.json
	var helpInfo = '用法：\n'
				+'node '+__filename+' -f json_file\n'
				+'node '+__filename+'\n'
				+'Example:node '+__filename+' -f "/temp/data.json"\n'
				+'        node '+__filename;
	function help(){
		console.log(helpInfo);
	}
	var args = process.argv;
	if(args.length == 4){
		var option = args[2];
		if(option == '-f'){
			getDataFromJsonFile(args[3]);
		}else{
			help();
		}
	}else if(args.length == 2){
		getDataFromMemory();
	}else{
		help();
	}
})()