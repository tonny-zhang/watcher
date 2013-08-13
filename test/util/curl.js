var util = require('../../util.js');
var config = require('../../config/');

var http = require('http');
var server = http.createServer(function (req, res) {
	setTimeout(function(){
		res.end('resConent');
	},2000)
	
}).on('listening',function(d){
	console.log('run in localhost:'+config.port);
}).listen(config.port);

util.curl(config.host,config.port,'/',function(err,data){
	console.log(err,data);
},100);