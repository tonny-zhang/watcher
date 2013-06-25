#!/bin/bash

#kill run.js
ps aux|grep watcher/run.js|grep -v grep|awk '{print $2}'|xargs kill -9 > /dev/null 2>&1
rm -rf /var/run/watcherRun.lock