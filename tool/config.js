var fs = require('fs');
var path = require('path');
var config = require('../config');

var currentDir = __dirname;

(function(){
	var _command = 'chmod +x '+path.join(currentDir,'../shell/*.sh');
	require('../util').command(_command);
})();

(function(){
	var _path = path.join(currentDir,'../shell/confInotify.sh');
	var content = fs.readFileSync(_path);
	content = content.toString().replace(/(LOG_PATH=)[^;]+;/,'$1'+config.logPath+';');
	fs.writeFileSync(_path,content);
})();

(function(){
	var _path = path.join(currentDir,'../shell/stopWatcher.sh');
	var content = fs.readFileSync(_path);
	content = content.toString().replace(/(TEMP_PATH=)[^;]+;/,'$1'+config.copyToPath+';');
	fs.writeFileSync(_path,content);
})();

(function(){
	var _path = path.join(currentDir,'../shell/dealLog.sh');
	var content = fs.readFileSync(_path);
	content = content.toString().replace(/(?!LOG_PATH=`)node/,config.node.bin);
	fs.writeFileSync(_path,content);
})();