#!/bin/bash

# node_path=`whereis node|awk '{print $2}'`
# watcherPid=`ps aux|grep watcher/memoryWatcher.js|grep -v grep|awk '{print $2}'`
# if [ $watcherPid ];then
# 	kill -9 $watcherPid
# 	rm -rf /var/run/watcher.lock

# 	`ps aux|grep nodejs|awk '$11 !~ /grep/ {print $2}'`
# fi

ps aux|grep watcher/memoryWatcher.js|grep -v grep|awk '{print $2}'|xargs kill -9
rm -rf /var/run/watcher.lock

ps aux|grep readdir.js|grep -v grep|awk '{print $2}'|xargs kill -9
# rm -rf /tonny/temp/*