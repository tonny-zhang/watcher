#!/bin/bash

DELAY=120
CURRENT_DIR=`dirname $0`
LOG_PATH=`node $CURRENT_DIR/tongji/logPath.js`
TODAY=$(date +%Y-%m-%d);

#maybe run.js is hanged
function stopRun(){
	echo $(date '+%Y-%m-%d %H:%M:%S') [$1] >> $LOG_PATH/checkRun_$TODAY.log
	$CURRENT_DIR/stopRun.sh
}

runLogFile=$LOG_PATH/run_$TODAY.log
#no run log
if [ ! -e $runLogFile ];then
	stopRun 'noFile'
else
	lastRunTimeStr=`tail -n 1 $LOG_PATH/run_$TODAY.log 2>/dev/null|awk '{print $1" "$2}'`
	lastRunTime=$(date +%s -d "$lastRunTimeStr");
	currentTime=$(date +%s);

	if [ $(($currentTime-$lastRunTime)) -gt $DELAY ];then
		stopRun "$lastRunTimeStr"
	fi;
fi;
	