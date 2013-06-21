#!/bin/bash
DIR_LOG=/tonny/log_read/dir.log
FILE_LOG=/tonny/log_read/file.log

echo $(date '+%Y-%m-%d %H:%M:%S')" start" >> $DIR_LOG
function ergodic(){
        for file in ` ls $1 `
        do
                if [ -d $1"/"$file ]
                then
        				echo $1"/"$file >> $DIR_LOG
                        ergodic $1"/"$file
                else
                        echo $1"/"$file >> $FILE_LOG
                fi
        done
}
INIT_PATH="/tonny/test"
ergodic $INIT_PATH
echo $(date '+%Y-%m-%d %H:%M:%S')" end" >> $DIR_LOG