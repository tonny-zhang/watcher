var config = require('../config');
var pathArr = {};
config.watcher.forEach(function(w){
	w.rsync.forEach(function(rsync){
		var remoteDir = rsync.address.replace(/^sam@\d+(\.\d+){3}:/,'');
		if(/(\/|\\)$/.test(remoteDir) && !pathArr[remoteDir]){
			pathArr[remoteDir] = true;
		}
	});
});

console.log(Object.keys(pathArr).map(function(v,i){
	return 'mkdir -p '+v;
}).join('\n'));