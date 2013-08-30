var fs = require('fs');
var path = require('path');
var config = require('./config');
var watcherUtil = require('./util');
var Watcher = require('./watcher').Watcher;
config = watcherUtil.extend(config,require('./config/callback'));//重写watcher

var fn = function(d){
	var filter = config.watcher.forEach(function(v){
		if(~d.fullname.indexOf(v.path)){
			if(v.command){
				watcherUtil.command([v.command,d.fullname].join(' '));
			}
		}
	});
}
var watcher = new Watcher({ignorePath:/^\..+/})
.on(Watcher.CREATE_FILE,fn)
.on(Watcher.MODIFY,fn);

config.watcher.forEach(function(v){
	watcher.initAddWatch(v.path);
});