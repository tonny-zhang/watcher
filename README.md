基于Inotify的文件监控，并实现rsync同步大量静态文件的解决方案

# 环境依赖
	1. 操作系统 linux内核2.6.9(Inotify要求)
	2. nodejs (目前测试版本为0.10.7)
	3. rsync

# 配置
	## 监控
		1. watcheMemory.js(这个运行在生产机)
			这个是监控主程序，默认加载配置文件`./config/index.js`，
			也可以命令行指定配置文件，覆盖默认配置，如：`node watcherMemory.js './config/other.js'`
			主要配置watchPath 、copyToPath 、logPath
			程序会在日志目录下按天生成日志，默认日志名(可参考`util.js`)：
			`Watcher_2013-05-30.log` (监控程序输出日志)
		2. server.js(这个运行在目标机)
			主要监控并处理生产机上的删除操作，默认加载`./config/server.js`
			也可以命令行指定配置文件，覆盖默认配置，如：`node server.js './config/other.js'`

	## 同步
		1. shell/syncMultiLock.sh为同步主程序，脚本里有配置，根据需要可修改
			`sh_2013-05-30.log`为每次心跳测试日志，可做为脚本运行记录
			`rsync_2013-05-30_*.log`为syncMultiLock.sh向目标机同步的日志

# 运行
	1. 先运行生产机
		`nohup node memoryWatcher.js > /var/log/memoryWatcher.log 2>&1 &`
		或
		`nohup node memoryWatcher.js './config/other.js' > /var/log/memoryWatcher.log 2>&1 &`
	2. 运行目标机
		`nohup node server.js > /var/log/server.log 2>&1 &`
		或
		`nohup node server.js './config/other.js' > /var/log/server.log 2>&1 &`
	3. 生产机运行同步
		`nohup shell/syncMulti.sh > /var/log/syncMulti.log 2>&1 &`