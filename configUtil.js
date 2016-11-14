var path = require('path');
var fs = require('fs');
var util = require('./util');

function index(config){
	var _watcherConfig = config.watcher;
	var defaultRsyncPort = config.rsync.defaultPort; 
	_watcherConfig.forEach(function(conf, i) {
		var _p = conf.path;
		if (util.isArray(conf.rsync)) {
			conf.rsync.forEach(function(_v, _i) {
				conf.rsync[_i]['port'] = _v['port'] || defaultRsyncPort; //配置端口号，默认为2222
				conf.rsync[_i]['logPrefix'] = _v['logPrefix'] || 'sync_'+_i;
				conf.rsync[_i]['param'] = _v['param'] || ''; //rsync的单配参数
			});
		}else{
			conf.rsync = [];
		}
		_watcherConfig[i] = conf;
	});
	if(util.isArray(config.deleteRsync)){
		config.deleteRsync.forEach(function(v,i){
			config.deleteRsync[i]['port'] = v['port'] || defaultRsyncPort; //配置端口号，默认为2222
			config.deleteRsync[i]['logPrefix'] = v['logPrefix'] || 'sync_dele_'+i;
		});
	}
	
	//合并重复的配置
	(function() {
		var tempArr = {};
		var isFileObj = {};
		_watcherConfig.forEach(function(v) {
			var isEndWithSep = /[\/\\]$/.test(v.path);
			var _p = path.normalize(path.join(v.path, '.')) + (isEndWithSep?path.sep:'');//这里方便配置检测时，对isFile进行检测
			tempArr[_p] || (tempArr[_p] = []);
			isFileObj[_p] = v.isFile;//以最后一次为准
			//处理相同的同步设置
			v.rsync.forEach(function(_rsync){
				//这里的重复配置的rsync在check里处理(人工处理更好)
				// if(!tempArr[_p].some(function(ele,i,arr){
				// 	return ele.address == _rsync.address;//暂时以同步地址为标准
				// })){
				// 	tempArr[_p].push(_rsync);
				// }
				tempArr[_p].push(_rsync);
			});
			// tempArr[_p] = tempArr[_p].concat(v.rsync);
		});
		var arr = [];
		for (var i in tempArr) {
			var tmp = tempArr[i];
			arr.push({
				'path': i,
				'isFile': isFileObj[i]|| false,
				'rsync': tmp
			});
		}
		_watcherConfig = arr;
	})();
	var cache = {};
	_watcherConfig.forEach(function(conf, i) {
		var _p = conf.path;
		conf.tempName = util.md5(_p); //临时文件夹名
		_watcherConfig[i] = conf;
		var _parentDir = path.dirname(_p);
		cache[_parentDir] || (cache[_parentDir] = []); //对上一级进行监控，防止指定监控的文件夹不存在
		cache[_parentDir].push(_p);
	});
	var newWatcheConfig = [];
	//把父级目录靠前
	_watcherConfig.sort(function(a,b){
		return a.path.split(path.sep).length > b.path.split(path.sep).length;
	});
	//当有父级目录时，把父级目录的同步处理加进来
	_watcherConfig.forEach(function(conf, i) {
		var _p = conf.path;
		for(var i = 0,j=newWatcheConfig.length;i<j;i++){
			var _parent = newWatcheConfig[i];
			var tempPath = _parent.path;
			var _index = _p.indexOf(tempPath);
			if(_index == 0){
				var rsync = _parent.rsync.slice();
				var relativePath = _p.replace(tempPath,'');
				rsync.forEach(function(v,i){
					var obj = util.extend({},v);
					obj.address = path.normalize(obj.address + relativePath).replace(/\\/g,'/');//保证linux下的rsync格式
					obj.param = "";	//把父级目录的限制参数去掉 '--exclude'
					obj._p = tempPath;	//添加父级目录标识，方便调试
					
					//处理自动生成的重复同步配置 
					if(!conf.rsync.some(function(ele,i,arr){
						return ele.address == obj.address;//暂时以同步地址为标准
					})){
						conf.rsync.push(obj);
					}
				});
			}
		}
		newWatcheConfig.push(conf);
	});
	config.watcher = newWatcheConfig;
	config.watcher.info = cache;
	return config;
}

var util_file = (function() {
	var is_posix = false;
	if (process.getuid) {
		var uid = process.uid || process.getuid();
		var gid = process.gid || process.getgid();
		is_posix = true;
	}

	var MASK_WRITE = 00200;
	var MASK = {
		WRITE: {
			OWNER: 0200,
			GROUND: 0020,
			OTHER: 0002
		},
		EXECUT: {
			OWNER: 0100,
			GROUND: 010,
			OTHER: 0001
		}
	}
	function _check(p, mask) {
		var stat;
		try {
			stat = fs.statSync(p);
		} catch(e) {
			return false;
		}

		var mode = stat.mode;
		if (is_posix) {
			var _mask = MASK[mask];
			var isowner = uid == stat.uid;
			if (isowner) {
				return !!(mode & _mask['OWNER']);
			} else if (gid == stat.gid) {
				return !!(mode & _mask['GROUND']);
			} else {
				return !!(mode & _mask['OTHER']);
			}
		} else {
			return !!(mode & _mask['OWNER']) || !!(mode & _mask['GROUND']) || !!(mode & _mask['OTHER']);
		}
	}
	return {
		isCanWrite: function(p) {
			return _check(p, 'WRITE');
		},
		isCanExec: function(p) {
			return _check(p, 'EXECUT');
		}
	}
})();
//当配置较多时，自动检测，最后有一个简单的统计
/*
1. 必要参数必须配置
2. watcher里要是监测文件时，是否配置‘isFile’参数
3. watcher里的‘logPrefix’要是配置提示和IP的配置
4. 
*/
var check = (function(){
	var defaultConfig = {
		watcher: [],
		port: 0, //文件夹树访问端口
		host: '', //文件夹树访问host
		copyToPath: '', //缓存文件队列
		logPath: '',
		create_delay: 0,//允许的创建文件的延时时间,初始化监控时用
		deletedFileName: '', //删除信息存放路径，在缓存文件队列路径下
		flock: { //监控文件锁定执行
			bin: '',
			lockFile: ''
		},
		node: { //配置node
			bin: ''
		},
		rsync: { //配置rsync
			bin: '',
			// param: "",
			user: '',
			defaultPort: 0
		},
		dealLogPrefix: '',//处理内存数据日志前缀
		runLogPrefix: '',//run.js运行日志前缀
		rsyncErrLogPrefix: ''//同步时错误日志
		,ip: ''
	};
	var defaultSync = {
		'address': '',
		'port': 0,
		// 'param': ""
	}
	var desc = {}	//错误描述
	var ERROR_NULL = 1;//配置参数值为空
	desc[ERROR_NULL] = ['配置参数值为空',true];
	var ERROR_NO_WATCHER = 2;//没有配置watcher
	desc[ERROR_NO_WATCHER] = ['没有配置watcher',true];
	var ERROR_IS_FILE = 3;//"isFile"没有配置或配置不正确
	desc[ERROR_IS_FILE] = ['"isFile"没有配置或配置不正确',true];
	var ERROR_REPEAT_RSYNC = 4;//重复的rsync配置,可能由于父级目录配置造成
	desc[ERROR_REPEAT_RSYNC] = ['重复的rsync配置,可能由于父级目录配置造成',true];
	var ERROR_RSYNC_PREFIX = 5;//IP地址形式的prefix不正确
	desc[ERROR_RSYNC_PREFIX] = ['IP地址形式的prefix不正确',false];
	var ERROR_ILLEGAL_RSYNC_ADDRESS = 6;//不合法的同步地址
	desc[ERROR_ILLEGAL_RSYNC_ADDRESS] = ['不合法的同步地址',true];
	var ERROR_IP = 7;//IP不是本机IP
	desc[ERROR_IP] = ['IP不是本机IP',false];
	var ERROR_DEBUG = 8;
	desc[ERROR_DEBUG] = ['isDebug 为true可能会造成日志激增',true];
	var ERROR_NO_WRITE = 9;
	desc[ERROR_NO_WRITE] = ['路径不可写', true];
	var ERROR_NO_EXECUT = 10;
	desc[ERROR_NO_EXECUT] = ['不可执行', true];

	var sayDesc = function(){
		console.log('\n=== (* 表示比较重要) ===');
		Object.keys(desc).sort(function(a,b){
			return a.b
		}).forEach(function(v){
			var item = desc[v];
			console.log(item[1]?'*':' ',v,':',item[0]);
		});
		console.log('=======================');
	}
	return function _check(config, cb){
		var errorInfo = [];
		function fn (target,default_c,prefix){
			prefix || (prefix = '');
			for(var i in default_c){
				if(!target[i] && target[i] !== false && target[i] !== 0){
					errorInfo.push(ERROR_NULL+'\t'+prefix+i);
				}else{
					for(var _i in default_c[i]){
						if(!target[i][_i] && target[i][_i] !== false && target[i][_i] !== 0){
							errorInfo.push(ERROR_NULL+'\t'+prefix+i+':'+_i);
						}
					}
				}
			}
		}
		fn(config,defaultConfig);	
		if(config.watcher && config.watcher.length == 0){
			errorInfo.push(ERROR_NO_WATCHER+'\t'+'watcherLength is 0');
		}else{
			var watcher = config.watcher;
			
			watcher.forEach(function(v,i){
				if(!v.path){
					errorInfo.push(ERROR_NULL+'\t'+'watcher['+i+']');
				}else{
					//可能会有目录形如‘www.weather.com.cn’的，最后人工排除下
					if(/\.\w+$/.test(v.path) && !v.isFile){
						errorInfo.push(ERROR_IS_FILE+'\t'+v.path);
					}
				}
				if(!v.rsync || v.rsync.length == 0){
					errorInfo.push(ERROR_NULL+'\t'+'rsync:'+v.path);
				}else{
					var temp = {};
					v.rsync.forEach(function(_vRsync){
						fn(_vRsync,defaultSync,'watcher['+v.path+']:rsync:');
				
						if(_vRsync['address']){
							temp[_vRsync['address']] || (temp[_vRsync['address']] = []);
							temp[_vRsync['address']].push(_vRsync['address']);
							if(!/\w+@\d+(\.\d+){3}/.test(_vRsync['address'])){//现在只支持IP形式，如：sam@61.4.185.50
								errorInfo.push(ERROR_ILLEGAL_RSYNC_ADDRESS+'\t'+_vRsync['address']);
							}
						}
						if(/\d+(\.\d+){3}/.test(_vRsync.logPrefix) && !new RegExp('@'+_vRsync.logPrefix+'[^0-9]').test(_vRsync.address)){
							errorInfo.push(ERROR_RSYNC_PREFIX+'\t'+v.path+' '+_vRsync.address);
						}
					});
					for(var i in temp){
						if(temp[i].length > 1){
							errorInfo.push(ERROR_REPEAT_RSYNC+'\t'+v.path);
						}
					}
				}
			});
		}
		var ips = util.getIp();
		if(ips.indexOf(config.ip) == -1){
			errorInfo.push(ERROR_IP+'\t'+config.ip+'\t should be one of '+ips);
		}
		if(config.isDebug){
			errorInfo.push(ERROR_DEBUG+'\tisDebug is true');
		}

		if (!util_file.isCanWrite(config.copyToPath)) {
			errorInfo.push(ERROR_NO_WRITE+'\t' + config.copyToPath + ' is no writable!');
		}
		if (!util_file.isCanWrite(config.logPath)) {
			errorInfo.push(ERROR_NO_WRITE+'\t' + config.logPath + ' is no writable!');
		}
		var lockFile = path.dirname(config.flock.lockFile);
		if (!util_file.isCanWrite(lockFile)) {
			errorInfo.push(ERROR_NO_WRITE+'\t' + config.flock.lockFile + ' dir is no writable!');
		}
		if (!util_file.isCanExec(config.flock.bin)) {
			errorInfo.push(ERROR_NO_EXECUT+'\t' + config.flock.bin + ' is no excutable!');
		}
		if (!util_file.isCanExec(config.node.bin)) {
			errorInfo.push(ERROR_NO_EXECUT+'\t' + config.node.bin + ' is no excutable!');
		}
		if (!util_file.isCanExec(config.rsync.bin)) {
			errorInfo.push(ERROR_NO_EXECUT+'\t' + config.rsync.bin + ' is no excutable!');
		}
		if(!errorInfo.length){
			console.log('+++++++++++++++++');

			cb && cb(true);
		}else{
			errorInfo.forEach(function(v){
				var errIndex = Number(v.split('\t')[0]);
				var isImportant = desc[errIndex] && desc[errIndex][1];
				var msg = (isImportant?'*':' ') + v;
				if (isImportant) {
					msg = '\033[0;31m' + msg + '\033[0m';
				}
				console.log(msg);
			});
			sayDesc();

			cb && cb(false);
		}
	}
})();

var server = function(config){
	var ips = util.getIp();
	var watcher = config.watcher;
	watcher.forEach(function(item){
		var _map = [];
		var _path = item.path;
		item.rsync.forEach(function(rsync){
			ips.forEach(function(ip){
				if(rsync.address.indexOf(ip)){
					var _target = rsync.address.replace(/^.+@\d+(\.\d+){3}:/,'');
					if(_map.indexOf(_target) == -1){
						_map.push(_target);
					}
				}
			});
		});
		item.map = _map;
	});
}
var callback = function(config){
	var watcher = config.watcher;
	watcher.forEach(function(v){
		v.path = path.normalize(v.path);
	});
	return config;
}
exports.index = index;
exports.check = check;
exports.server = server;
exports.callback = callback;