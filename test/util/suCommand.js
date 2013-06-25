var util = require('../../util.js');
util.command.su('sam','echo test;echo hello',function(err,data){
	console.log(err,data);
	console.log(data);
});