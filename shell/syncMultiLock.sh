#!/bin/bash

TEMP_PATH=/tonny/tempDir/
TEMP_DATA_PATH=/tonny/.tempData.json
URL=http://localhost:3333
LOG_PATH=/tonny/log/

if [ ! -d $TEMP_PATH ]; then 
	mkdir -p $TEMP_PATH
fi

function informAdmin(){
	info=[$(date '+%Y-%m-%d %H:%M:%S')]" $1"
	echo "$info" | mail 450024933@qq.com -s 'syncMulti.sh error 61.4.185.191'
}

function run() {
    startTime=$(date +%s)
    showTime=$(date '+%Y-%m-%d %H:%M:%S')
    toDay=$(date +%Y-%m-%d)
	dealLog=${LOG_PATH}deal_${toDay}.log
	rsyncLog=${LOG_PATH}rsync_${toDay}
	shellLog=${LOG_PATH}sh_${toDay}.log
    curl -o $TEMP_DATA_PATH $URL 2>${LOG_PATH}curl_${toDay}.log
    node /tonny/nodejs/watcher/dealTreeMemory.js -f $TEMP_DATA_PATH >> ${dealLog}
    rm -rf $TEMP_DATA_PATH
    num=`ls ${TEMP_PATH}|wc -l`
    if [ $num -gt 0 ]; then
            #rsync multi server target
            #errorOne=`/usr/bin/rsync -WPaz --password-file=/tonny/passwd/61.4.185.156_rsync.pw ${TEMP_PATH} rsync@61.4.185.156::serverOne 2>&1 >> ${rsyncLog}_one.log`
            #errorTwo=`/usr/bin/rsync -WPaz --password-file=/tonny/passwd/61.4.185.156_rsync.pw ${TEMP_PATH} rsync@61.4.185.156::serverTwo 2>&1 >> ${rsyncLog}_two.log`
            #errorThree=`/usr/bin/rsync -WPaz --password-file=/tonny/passwd/61.4.185.156_rsync.pw ${TEMP_PATH} rsync@61.4.185.156::serverThree 2>&1 >> ${rsyncLog}_three.log`
            echo $(date '+%Y-%m-%d %H:%M:%S') >> ${rsyncLog}_one.log
            errorOne=`/usr/bin/rsync -WPaz '-e ssh -p 2222' ${TEMP_PATH} sam@61.4.185.111:/zkTest/serverOne/ 2>&1 >> ${rsyncLog}_one.log`
            echo $(date '+%Y-%m-%d %H:%M:%S') >> ${rsyncLog}_two.log
            errorTwo=`/usr/bin/rsync -WPaz '-e ssh -p 2222' ${TEMP_PATH} sam@61.4.185.111:/zkTest/serverTwo/ 2>&1 >> ${rsyncLog}_two.log`
            echo $(date '+%Y-%m-%d %H:%M:%S') >> ${rsyncLog}_three.log
            errorThree=`/usr/bin/rsync -WPaz '-e ssh -p 2222' ${TEMP_PATH} sam@61.4.185.111:/zkTest/serverThree/ 2>&1 >> ${rsyncLog}_three.log`
            
            if [ "$errorOne" ] || [ "$errorTwo" ] || [ "$errorThree" ];then
            	informAdmin "${errorOne}\n${errorTwo}\n${errorThree}\n"
            else
            	#clear warcher path
           		rm -rf ${TEMP_PATH}*
            fi
    fi
    usedTime=$(($(date +%s) - $startTime))
    echo $showTime' takes '$usedTime's' >> $shellLog
    return $usedTime
}
DELAY=10
totalSeconds=55
usedSeconds=0

echo '======== crontab start ========' >> ${LOG_PATH}sh_$(date +%Y-%m-%d).log;

while [ $usedSeconds -le $totalSeconds ]
do
    run
    usedSeconds=$(($?+$usedSeconds+$DELAY))
    if [ $usedSeconds -le $totalSeconds ];then
        sleep $DELAY
    fi
done