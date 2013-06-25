#!/bin/bash

updateFlag=`cd ..;pwd`/temp/updateFlag.data

if [ `cat $updateFlag 2>/dev/null` ];then
	`pwd`/stopWatcher.sh
	`pwd`/stopRun.sh
	#wait for crontab restart run.js and memoryWatcher.js

	#clear content of $updateFlag
	echo ''>$updateFlag
fi