#!/bin/bash

CURRENT_DIR=`dirname $0`
LOG_PATH=`node $CURRENT_DIR/logPath.js`

TODAY=$(date +%Y-%m-%d);
deal_path=$1;
stat $deal_path
grep $deal_path $LOG_PATH/watcher_$TODAY.log|tail -n 1
grep $deal_path $LOG_PATH/deal_$TODAY.log|tail -n 1
