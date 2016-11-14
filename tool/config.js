var fs = require('fs');
var path = require('path');
var config = require('../config');
var confUtil = require('../configUtil');

confUtil.check(config, function(flag) {console.log(flag);
	if (flag) {

		var currentDir = __dirname;

		(function(){
			var _command = 'chmod +x '+path.join(currentDir,'../shell/*.sh');
			require('../util').command(_command);

			console.log('Y', _command);
		})();

		(function(){
			var _path = path.join(currentDir,'../shell/confInotify.sh');
			var content = fs.readFileSync(_path);
			content = content.toString().replace(/(LOG_PATH=)[^;]+;/,'$1'+config.logPath+';');
			fs.writeFileSync(_path,content);
			console.log('Y', 'change '+_path+' LOG_PATH');
		})();

		(function(){
			var _path = path.join(currentDir,'../shell/stopWatcher.sh');
			var content = fs.readFileSync(_path);
			content = content.toString().replace(/(TEMP_PATH=)[^;]+;/,'$1'+config.copyToPath+';');
			fs.writeFileSync(_path,content);

			console.log('Y', 'change '+_path+' TEMP_PATH');
		})();

		(function(){
			var _path = path.join(currentDir,'../shell/dealLog.sh');
			var content = fs.readFileSync(_path);
			content = content.toString().replace(/(?!LOG_PATH=`)node/,config.node.bin);
			fs.writeFileSync(_path,content);

			console.log('Y', 'change '+_path+' LOG_PATH');
		})();
	}
});