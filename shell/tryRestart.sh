#!/bin/bash

CURRENT_DIR=`dirname $0`
updateFlag=`cd $CURRENT_DIR;cd ..;pwd`/temp/updateFlag.data

if [ `cat $updateFlag 2>/dev/null` ];then
	$CURRENT_DIR/stopWatcher.sh
	$CURRENT_DIR/stopRun.sh
	#wait for crontab restart run.js and memoryWatcher.js

	#clear content of $updateFlag
	echo ''>$updateFlag
fi