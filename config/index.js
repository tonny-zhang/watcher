/*生产环境监控配置*/
module.exports = {
	isDebug: true,
	//watchPath: '/tonny/test',	//当前要监测的文件夹
	watchPath: {'base': '/tonny/test1','sub': ['a','b/c']},
	port: 3333,							//文件夹树访问端口
	copyToPath: '/tonny/temp',		//缓存文件队列
	logPath: '/tonny/log',
	deletedFileName: '____delete____',	//删除信息存放路径，在缓存文件队列路径下
	deletedSep: '||'
}