#!/bin/bash
watcherPid=`ps aux|grep watcher/memoryWatcher.js|grep $(which node)|awk '{print $2}'`
if [ $watcherPid ];then
	kill -9 $watcherPid
	rm -rf /var/run/watcher.lock
fi