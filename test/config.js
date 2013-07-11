var config = require('../config');
var fs = require('fs');
var path = require('path');
// console.log(JSON.stringify(config));
// console.log(JSON.stringify(config.watcher.info));
fs.writeFileSync(path.join(__dirname,'1.js'),JSON.stringify(config.watcher));