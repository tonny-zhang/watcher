var readdir = require('../../tool/readdir').readdir;

readdir('d:/test',function(err,files){
	if(err){
		console.log(err);
	}else{
		files.forEach(function(v){
			console.log(v.p,v.isDir,v.err);
		});
	}
});