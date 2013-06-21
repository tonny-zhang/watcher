/**自动创建多个文件*/
var util = require('../util');
var fs = require('fs');
var path = require('path');

var create = (function(){
	var depthInfoArr;
	var _numPerDepth = 1;
	var _numRemain;
	var _totalNum;
	var _basePath;
	var _depth;
	/*在内存中计算每个深度要放置的文件数*/
	var _tryCreate = function(){
		for(var i = 0,j=depthInfoArr.length;i<j;i++){
			if(_numRemain > 0){
				if(i > 0){
					var parent = depthInfoArr[i-1];
					for(var _iP = 0,_jP=parent.length;_iP<_jP;_iP++){
						var _currentParent = parent[_iP];
						for(var _iCurrentDepth = _currentParent['cNum'];_iCurrentDepth<_numPerDepth && _numRemain > 0;_iCurrentDepth++){
							depthInfoArr[i].push({'p':_iP,'cNum':0});
							_currentParent['cNum']++;
							_numRemain--;
						}
					}
				}else{
					for(var _iFirstDepth = depthInfoArr[0].length;_iFirstDepth<_numPerDepth && _numRemain > 0;_iFirstDepth++){
						depthInfoArr[0].push({'p':-1,'cNum':0});
							_numRemain--;
					}
				}
			}
		}
		if(_numRemain > 0){
			_numPerDepth++;
			_tryCreate();
		}
	}
	/*根据计算出来的文件分布，创建文件及文件夹*/
	var _createFile = function(){
		var nameLen = 15;
		var _n = _totalNum.toString().length;
		function _getFloderName(index){
			var iLen = index.toString().length;
			var arr = [];
			for (var i = _n-iLen; i > 0; i--) {
				arr.push('0');
			}
			arr.push(index);
			return arr.join('')+'_'+util.md5(Math.random().toString()).slice(0,nameLen-arr.length-1);
		}
		var _tempIndex = 1;
		depthInfoArr.forEach(function(v,depth){
			var parent = depth > 0?depthInfoArr[depth - 1]:null;
			v.forEach(function(info,i){
				var _parentPath = depth == 0?_basePath: parent[info['p']]['path'];
				var pathName = path.join(_parentPath,_getFloderName(_tempIndex));//_c(_parentPath,v.cNum,depth);
				util.log(_tempIndex,pathName);
				util.mkdirSync(pathName);
				fs.writeFileSync(pathName+'.txt',pathName);
				info['path'] = pathName;
				_tempIndex++;
			});			
		});
	}
	return function(config){
		var startTime = +new Date();
		_numRemain = config.num;
		_totalNum = _numRemain;
		_basePath = config.dir;
		_depth = config.depth;
		depthInfoArr = [];
		for(var i = 0;i<_depth;i++){
			depthInfoArr[i] = [];
		}
		_tryCreate();
		// var totalNum = 0;
		// depthInfoArr.forEach(function(v){
		// 	totalNum += v.length;
		// 	console.log(v.length) ;
		// });
		// console.log('totalNum',totalNum);
		_createFile();
		console.log('use '+(+new Date()-startTime)+' ms');
	}
})();

/*尽量保证深度的前提*/
var args = process.argv;
if(args.length >= 2){
	var _help = function(){
		console.log('args error');
		console.log('-dir /test -num 100 -depth 4');
	}
	var defaultConfig = {
		dir: '/',
		num: 100,
		depth: 4
	}
	var configArgs = [].slice.call(args,2);
	if(configArgs.length % 2 == 0){
		var config = util.extend({},defaultConfig);
		var temp;
		while((temp = configArgs.shift())){
			switch(temp){
				case '-dir':
					config['dir'] = configArgs.shift();
					break;
				case '-num':
					config['num'] = configArgs.shift();
					break;
				case '-depth':
					config['depth'] = configArgs.shift();
					break;
				default:
					return _help();
			}
		}
		create(config);
	}else{
		_help();
	}
}