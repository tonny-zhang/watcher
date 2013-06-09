var util = require('../../util.js');
util.command('ls -ls',function(err,data){
	console.log(arguments);
	console.log('-------');
	console.log(data);
});