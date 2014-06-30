var platform = require('util/platform');
var inotify = require('inotify/'+platform.platform+'/index').inotify;

var dir = 'd:\\test//html//';
new inotify(dir,function(){
	console.log(arguments);
});
console.log(dir,'is watched!');