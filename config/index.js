/*生产环境监控配置*/
var path = require('path');
var util = require('../util')
var config = {
	isDebug: true,
	//watchPath: '/tonny/test',	//当前要监测的文件夹
	/*这里还得有base,防止监控的子目录是后期生成的*/
	// watchPath: [{'base': '/tonny/test1','sub': ['a','b/c']},{'base': '/tonny/test1','sub': ['a','b/c']},{'base': '/tonny/test2'}],
	watcher: [{
			'path': '/tonny/test/a',
			'rsync': [{
					'address': 'sam@61.4.185.111:/zkTest/serverOne/',
					'logPrefix': 'sync_1',
					'port': 2222
				}, {
					'address': 'sam@61.4.185.112:/zkTest/serverTwo/',
					'logPrefix': 'sync_2'
				}
			]
		}, {
			'path': '/tonny/test/a',
			'rsync': [{
					'address': 'sam@61.4.185.111:/zkTest/serverOne/',
					'logPrefix': 'sync_1',
					'port': 2222
				}, {
					'address': 'sam@61.4.185.112:/zkTest/serverTwo/',
					'logPrefix': 'sync_2'
				}
			]
		}, {
			'path': '/tonny/test/b',
			'rsync': [{
					'address': 'sam@61.4.185.111:/zkTest/serverOne/',
					'port': 2222
				}, {
					'address': 'sam@61.4.185.111:/zkTest/serverTwo/'
				}
			]
		}
	],
	port: 3333, //文件夹树访问端口
	copyToPath: '/tonny/temp', //缓存文件队列
	logPath: '/tonny/log',
	deletedFileName: '____delete____', //删除信息存放路径，在缓存文件队列路径下
	deletedSep: '||', //
	flock: { //监控文件锁定执行
		bin: '/usr/bin/flock',
		lockFile: '/var/run/watcher.lock'
	},
	node: { //配置node
		bin: '/usr/local/bin/node'
	},
	rsync: {
		bin: '/usr/bin/rsync',
		param: "-WPaz"
	},
	runLogPrefix: 'run',//run.js运行日志前缀
	rsyncErrLogPrefix: 'rsyncErr'//同步时错误日志
}
var cache = {};
var _watcherConfig = config.watcher;
//合并重复的配置
(function() {
	var tempArr = {};
	_watcherConfig.forEach(function(v) {
		var _p = path.normalize(path.join(v.path, '.'));
		tempArr[_p] || (tempArr[_p] = []);
		tempArr[_p] = tempArr[_p].concat(v.rsync);
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
_watcherConfig.forEach(function(conf, i) {
	var _p = conf.path;
	conf.tempName = util.md5(_p); //临时文件夹名
	if (util.isArray(conf.rsync)) {
		conf.rsync.forEach(function(_v, _i) {
			conf.rsync[_i]['port'] = _v['port'] || 2222; //配置端口号，默认为2222
		});
	}else{
		conf.rsync = [];
	}
	_watcherConfig[i] = conf;
	var _parentDir = path.dirname(_p);
	cache[_parentDir] || (cache[_parentDir] = []); //对上一级进行监控，防止指定监控的文件夹不存在
	cache[_parentDir].push(_p);
});
config.watcher = _watcherConfig;
config.watcher.info = cache;
/*
	watcher: [{'base': '/tonny/test','sub': [{'path': 'a','rsync': ["/usr/bin/rsync -WPaz '-e ssh -p 2222' ${TEMP_PATH} sam@61.4.185.111:/zkTest/serverOne/ 2>&1 >> ${rsyncLog}_one.log"]}]}]
*/
module.exports = config;