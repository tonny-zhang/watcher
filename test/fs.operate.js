(function(){
	var path = require('path');
		var fs = require('fs');
	var currentDir = __dirname;
	setTimeout(function(){
		fs.appendFileSync(path.join(currentDir,'chown.js'),''); 
	},2000);

	setTimeout(function(){
		fs.writeFileSync(path.join(currentDir,'1.js'),'test'); 
	},3000);

	setTimeout(function(){
		fs.writeFileSync(path.join(currentDir,'1.js'),'hello'); 
	},4000);
})();