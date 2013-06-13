var util = require('../../util.js');
util.command('ls -ls',function(err,data){
	console.log(data);
});
util.command('/user/bin/test',function(err,data){
	console.log(arguments);
});