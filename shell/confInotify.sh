#!/bin/bash

MAX_NUM=999999
if [ `cat /proc/sys/fs/inotify/max_user_watches` -lt $MAX_NUM ];then
	echo $MAX_NUM > /proc/sys/fs/inotify/max_user_watches

	IS_KILL_WATCHER=1
fi

if [ `cat /proc/sys/fs/inotify/max_queued_events` -lt $MAX_NUM ];then
	echo $MAX_NUM > /proc/sys/fs/inotify/max_queued_events
	IS_KILL_WATCHER=1
fi

if [ $IS_KILL_WATCHER ];then
	kill -9 `ps aux|grep watcher/memoryWatcher.js|grep /usr/bin/node|awk '{print $2}'`
	echo 'kill watcher,config inotify' >> /tonny/log/conf_inotify_$(date +%Y-%m-%d).log
fi