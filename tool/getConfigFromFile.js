/*从原先的sh文件里分离出配置*/
var fs = require('fs');
var path = require('path');

require('../configUtil.js');
var config = require('../config/getConfigFromFile.js');

var totalConfig = {};
var getUsefullParam = ['--exclude'];
var userFullParamHaveValue = {
	'--exclude': true
};

var getConfig = function(content,flag){
	content = content.replace(/[\n\r]{2,}/g,'\n');
	var lines = content.split(/\n/);
	var errorInfo = [];
	var isPutoutLine = /\.1$/.test(flag);
	lines.forEach(function(line){
		line = line.replace(/(^\s+?)|(\s+?)$/,'');
		if(!line || /^#/.test(line)){
			return;
		}
		if(!/^rsync/.test(line)){//排除ssh的命令
			return;
		}
		var match = /(['"])-e ssh -p (\d+)\1/.exec(line);
		if(match){
			line = line.replace(match[0],'');
			var port = match[2];
		}
		
		var params = line.split(/\s+/);
		var toPath = params.pop();
		var fromPath = params.pop();
		var usefullParam = [];

		var temp;
		while((temp = params.shift())){
			var p = getUsefullParam.indexOf(temp);
			if(p > -1){
				var name = getUsefullParam[p];

				var param = [name];
				if(userFullParamHaveValue[name] && params.length > 0){
					param.push(params.shift());
				}
				usefullParam.push(param.join(' '));
			}
		}
		var rsync = {
			'address': toPath
		}
		if(usefullParam.length > 0){
			rsync['param'] =  usefullParam.join(' ');
		}
		var match = /@(\d+(\.\d+){3})[^0-9]/.exec(toPath);
		if(match){
			rsync['logPrefix'] = match[1];
		}
		if(port){
			rsync['port'] = port;
		}
		
		if(/\*/.test(fromPath)){
			errorInfo.push(line);
		}else{
			totalConfig[fromPath] || (totalConfig[fromPath] = {'path': fromPath,'isFile': !/\/$/.test(fromPath),'rsync':[]});
			totalConfig[fromPath]['rsync'].push(rsync);
			if(flag){
				totalConfig[fromPath]['flag'] || (totalConfig[fromPath]['flag'] = []);
				totalConfig[fromPath]['flag'].push(flag);
			}
			if(isPutoutLine){
				console.log(fromPath,'----',line);
			}
		}
	});
	return errorInfo;
}
function pushConfigToFile(){
	var watcherConfig = [];
	for(var i in totalConfig){
		totalConfig[i].flag = totalConfig[i].flag.join();
		watcherConfig.push(totalConfig[i]);
	}
	watcherConfig.sort(function(a,b){
		return a.path.localeCompare(b.path);
	});
	fs.writeFileSync(config.toFile,JSON.stringify(watcherConfig));
	console.log('config [ ',watcherConfig.length,' ] watcher');
}
config.fromFile.forEach(function(fromFile){
	var content = fs.readFileSync(fromFile);
	var errorInfo = getConfig(content.toString(),path.basename(fromFile));
	if(errorInfo.length > 0){
		console.log(fromFile,errorInfo);
		var specialFromFile = fromFile+'.1'
		if(fs.existsSync(specialFromFile)){
			var content = fs.readFileSync(specialFromFile);
			getConfig(content.toString(),path.basename(specialFromFile));
		}
	}
});
pushConfigToFile();	