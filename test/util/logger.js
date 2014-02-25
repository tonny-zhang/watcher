var path = require('path');
var logger = require('util/logger');

var logPath = path.join(__dirname,'../../log/');
var log = logger.logSync(logPath);
log('hello');
log('hello1');

var err = logger.errorSync(logPath);
err('err1');
err('err2');

var prefix = logger.prefixLogSync(logPath,'prefix');
prefix('prefix1');
prefix('prefix2');