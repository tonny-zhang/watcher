var path = require('path');
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
		_watcherConfig.forEach(function(v) {
			var _p = path.normalize(path.join(v.path, '.'));
			tempArr[_p] || (tempArr[_p] = []);
			//处理相同的同步设置
			v.rsync.forEach(function(_rsync){
				if(!tempArr[_p].some(function(ele,i,arr){
					return ele.address == _rsync.address;//暂时以同步地址为标准
				})){
					tempArr[_p].push(_rsync);
				}
			});
			// tempArr[_p] = tempArr[_p].concat(v.rsync);
		});
		var arr = [];
		for (var i in tempArr) {
			var tmp = tempArr[i];
			arr.push({
				'path': i,
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
	config.watcher = _watcherConfig;
	config.watcher.info = cache;
	return config;
}
exports.index = index;