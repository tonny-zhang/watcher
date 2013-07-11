/*从原先的sh文件里分离出配置*/
var fs = require('fs');
var path = require('path');

require('../configUtil.js');
var config = {
	fromFile: [
	'e:/source/server_config/61.4.185.220/sync_conf/rsync_a.sh'
	// ,'e:/source/server_config/61.4.185.220/sync_conf/rsync_b.sh'
	,'e:/source/server_config/61.4.185.220/sync_conf/rsync_brief.sh'
	,'e:/source/server_config/61.4.185.220/sync_conf/rsync_brief_others.sh'
	,'e:/source/server_config/61.4.185.220/sync_conf/rsync_first.sh'
	,'e:/source/server_config/61.4.185.220/sync_conf/rsync_to154.sh'
	// ,'e:/source/server_config/61.4.185.220/sync_conf/rsync_to_70.sh'
	,'e:/source/server_config/61.4.185.220/sync_conf/rsync_tqyb.sh'
	,'e:/source/server_config/61.4.185.220/sync_conf/rsync_travel.sh'
	,'e:/source/server_config/61.4.185.220/sync_conf/rsync_xnw.sh'
	],
	toFile: 'e:/source/server_config/61.4.185.220/'+(new Date().format('yyyy-MM-dd_hh-mm-ss'))+'.js'
}

var totalConfig = {};
var getUsefullParam = ['--exclude'];
var userFullParamHaveValue = {
	'--exclude': true
};

var getConfig = function(content,flag){
	content = content.replace(/[\n\r]{2,}/g,'\n');
	var lines = content.split(/\n/);
	lines.forEach(function(line){
		line = line.replace(/(^\s+?)|(\s+?)$/,'');
		if(!line || /^#/.test(line)){
			return;
		}
		if(!/^rsync/.test(line)){//排除ssh的命令
			return;
		}
		line = line.replace(/(['"])-e ssh -p \d+\1/g,'');
		var params = line.split(/\s+/);
		var toPath = params.pop();
		var fromPath = params.pop();
		totalConfig[fromPath] || (totalConfig[fromPath] = {'path': fromPath,'isFile': !/\/$/.test(fromPath),'rsync':[]});
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
		totalConfig[fromPath]['rsync'].push(rsync);
		if(flag){
			totalConfig[fromPath]['flag'] || (totalConfig[fromPath]['flag'] = []);
			totalConfig[fromPath]['flag'].push(flag);
		}
	});
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
	getConfig(content.toString(),path.basename(fromFile));
});
pushConfigToFile();	