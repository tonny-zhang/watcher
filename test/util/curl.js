var util = require('../../util.js');
var config = require('../../config/');

util.curl(config.host,config.port,'/',function(err,data){
	console.log(err,data);
});