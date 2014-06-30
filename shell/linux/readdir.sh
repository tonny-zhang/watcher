#!/bin/bash
DIR_LOG=/tonny/log_read/dir.log
FILE_LOG=/tonny/log_read/file.log

INIT_PATH=${1}
BEGIN_SECOND=${2}
OVER_FILE_PATH=${3}
#echo $(date '+%Y-%m-%d %H:%M:%S')" start"
start_time=$(date '+%s')
function ergodic(){
        for file in ` ls $1 `
        do
                _tempFile=$1"/"$file
                if [ -d $_tempFile ];then
                        if [ -L $_tempFile ];then
                                echo $_tempFile"|"`ls -l $_tempFile|awk -F "->" '{print $2}'`
                        else
                		echo $_tempFile
                                ergodic $_tempFile
                        fi
                else
                        if [ $BEGIN_SECOND ];then
                                if [ `stat -c %Y $_tempFile` -gt $BEGIN_SECOND ];then
                                        echo $_tempFile"|"
                                fi
                        else
                                echo $_tempFile"|"
                        fi
                fi
        done
}
echo _BEGIN_
ergodic $INIT_PATH
echo _END_
end_time=$(date '+%s')
echo $((end_time-start_time))s>$OVER_FILE_PATH
#echo $(date '+%Y-%m-%d %H:%M:%S')" end"