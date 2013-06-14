/*生产环境监控配置*/
var path = require('path');
var configUtil = require('../configUtil')
var config = {
	isDebug: true,
	watcher: [
		{
			'path': 'd:/test/html',
			'rsync': [{
					'address': 'sam@61.4.185.111:/zkTest/serverOne/',//同步的目标地址
					'port': 2222,	//[可选]同步的目标端口，默认设置为rsync.defaultPort
					'logPrefix': 'rsync_1' //[可选]同步信息的日志前缀，默认为'rsync_索引'
				}, {
					'address': 'sam@61.4.185.111:/zkTest/serverTwo/'
				}
			]
		},
		{
			'path': 'd:/test/html',
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
	host: '127.0.0.1', //文件夹树访问host
	copyToPath: 'd:/test/temp', //缓存文件队列
	logPath: 'd:/test/log',
	create_delay: 1000*60*5,//允许的创建文件的延时时间,初始化监控时用
	deletedFileName: '____delete____', //删除信息存放路径，在缓存文件队列路径下
	deletedSep: '__', //
	flock: { //监控文件锁定执行
		bin: '/usr/bin/flock',
		lockFile: '/var/run/watcher.lock'
	},
	node: { //配置node
		bin: 'node'
	},
	rsync: { //配置rsync
		bin: '/usr/bin/rsync',
		param: "-WPaz",
		defaultPort: 2222
	},
	dealLogPrefix: 'deal',//处理内存数据日志前缀
	runLogPrefix: 'run',//run.js运行日志前缀
	rsyncErrLogPrefix: 'rsyncErr'//同步时错误日志
}
//配置删除信息文件
config.deleteRsync = [{
		'address': 'sam@61.4.185.111:/zkTest/serverOne/',
	}, {
		'address': 'sam@61.4.185.111:/zkTest/serverTwo/'
	}
];
module.exports = configUtil.index(config);