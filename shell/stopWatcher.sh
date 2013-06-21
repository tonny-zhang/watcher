#!/bin/bash
node_path=`whereis node|awk '{print $2}'`
watcherPid=`ps aux|grep watcher/memoryWatcher.js|grep ${node_path}|awk '{print $2}'`
if [ $watcherPid ];then
	kill -9 $watcherPid
	rm -rf /var/run/watcher.lock
fi