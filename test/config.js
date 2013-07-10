var config = require('../config');
var fs = require('fs');
// console.log(JSON.stringify(config));
// console.log(JSON.stringify(config.watcher.info));
fs.writeFileSync('e:/source/watcher/test/1.js',JSON.stringify(config.watcher));