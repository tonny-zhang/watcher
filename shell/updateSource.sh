#!/bin/bash

CURRENT_DIR=`dirname $0`
SOURCE_PATH=`cd $CURRENT_DIR;cd ..;pwd`

logPath=/tonny/update_source_log/
if [ ! -d $logPath ];then
	mkdir -p $logPath
fi
logName=$logPath$(date +%Y-%m-%d).log
chown sam.sam $logPath

echo 10 > $SOURCE_PATH/temp/updateFlag.data
#insure permision of sam
su - sam <<EOF
echo 'start 61.4.185.111'>>$logName
rsync --exclude 'config' -WPvaz '-e ssh -p 2222' $SOURCE_PATH/ sam@61.4.185.111:/zkTest/nodejs/watcher/ >> $logName 2>&1
echo 'end 61.4.185.111'>>$logName

echo 'start 61.4.184.32'>>$logName
rsync --exclude 'config' -WPvaz '-e ssh -p 2222' $SOURCE_PATH/ sam@61.4.184.32:/home/sam/nodejs/watcher/ >> $logName 2>&1
echo 'end 61.4.184.32'>>$logName

echo 'start 61.4.184.33'>>$logName
rsync --exclude 'config' -WPvaz '-e ssh -p 2222' $SOURCE_PATH/ sam@61.4.184.33:/home/sam/nodejs/watcher/ >> $logName 2>&1
echo 'end 61.4.184.33'>>$logName

echo 'start 61.4.185.220'>>$logName
rsync --exclude 'config' -WPvaz '-e ssh -p 2222' $SOURCE_PATH/ sam@61.4.185.220:/home/sam/nodejs/watcher/ >> $logName 2>&1
echo 'end 61.4.185.220'>>$logName
EOF