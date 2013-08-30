var fs = require('fs');
var path = require('path');
var config = require('./config');
var watcherUtil = require('./util');
var Watcher = require('./watcher').Watcher;
config = watcherUtil.extend(config,require('./config/callback'));//重写watcher

var cache = {};
var fn = function(d){
	var fullname = d.fullname;
	clearTimeout(cache[fullname]);
	var tt = setTimeout(function(){
		delete cache[tt];
		config.watcher.forEach(function(v){
			if(~fullname.indexOf(v.path)){
				if(v.command){
					watcherUtil.command([v.command,fullname].join(' '));
				}
			}
		});
	},10);
	cache[fullname] = tt;
}
var watcher = new Watcher({ignorePath:/^\..+/})
.on(Watcher.CREATE_FILE,fn)
.on(Watcher.MODIFY,fn);

config.watcher.forEach(function(v){
	watcher.initAddWatch(v.path);
});