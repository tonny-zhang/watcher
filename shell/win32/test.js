var command = require('util/misc').command;

command('set ws=wscript.createobject("wscript.shell");ws.run "e:/source/watcher/shell/win32/readdir.bat 1 2 3 4 /start",0',function(){
	console.log(arguments);
});