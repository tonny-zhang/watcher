var innerUtil = require('../../watcher')._innerUtil;
var watchPath = new innerUtil.watchFilter();
watchPath.addFilter(['/a/b','/a/c','/a/d/a1/b1','/a/d2/a2/b2/c2']);
watchPath.addFilter('/test');

var test = function(except,val){
	var isWatching = watchPath.isWatching(val);
	console.log(except == isWatching?'Y':'N',val,isWatching?'Y':'');
}

test(false,'/a');

test(false,'/a/1.txt');
test(true,'/a/b');
test(true,'/a/b/1.txt');
test(true,'/a/b');
test(true,'/a/b/a1');
test(true,'/a/b/a1/1.txt');

test(true,'/a/c');
test(false,'/a/c1');
test(false,'/a/c2');

test(false,'/a/d/a1');
test(true,'/a/d/a1/b1');
test(true,'/a/d/a1/b1/a');
test(true,'/a/d/a1/b1/a/1');

test(false,'/a/d2');
test(false,'/a/d2/a2');
test(false,'/a/d2/a2/b2');
test(true,'/a/d2/a2/b2/c2');
test(true,'/a/d2/a2/b2/c2/1');
test(true,'/a/d2/a2/b2/c2/1/2');

test(true,'/test');
test(false,'/');
