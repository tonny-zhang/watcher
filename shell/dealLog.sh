#!/bin/bash

LOG_PATH=/var/www/logs/watcher/
LOG_BAK_PATH=/log_bak/
find $LOG_PATH -ctime +0 -exec mv {} $LOG_BAK_PATH \;