#!/bin/bash

#kill memoryWatcher.js
ps aux|grep watcher/memoryWatcher.js|grep -v grep|awk '{print $2}'|xargs kill -9 > /dev/null 2>&1
rm -rf /var/run/watcher.lock

#kill readdir.sh
ps aux|grep readdir.sh|grep -v grep|awk '{print $2}'|xargs kill -9 > /dev/null 2>&1

#remove files created by readdir.sh
find /tmp/watcher/ -type f -exec rm -rf {} \;