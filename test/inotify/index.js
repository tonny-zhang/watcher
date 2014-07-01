var platform = require('utils/platform');
var inotify = require('inotify/'+platform.platform+'/index').inotify;

var dir = 'd:\\test//html//test/';
new inotify(dir,function(){
	console.log(arguments);
});
new inotify('d:\\test//html//',function(){
	console.log('parent',arguments);
});
console.log(dir,'is watched!');