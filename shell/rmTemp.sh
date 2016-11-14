#!/bin/bash

CURRENT_DIR=`dirname $0`
TEMP_PATH=`node $CURRENT_DIR/tongji/tempPath.js`

find $TEMP_PATH -maxdepth 1 -mtime +1 -exec rm -rf {} \;