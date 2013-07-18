var obj = {ip:'',p:['d:/test/html/b1/1.html','d:/test/html/b1/test/b']}

var fs = require('fs');
var path = require('path');
var config = require('../config');
var serverConfig = require('../config/server');
var util = require('../util');
config = util.extend({},config,serverConfig);
var deletedFilePath = path.join(config.serverPath,config.deletedFileName);
fs.writeFileSync(deletedFilePath,JSON.stringify(obj));