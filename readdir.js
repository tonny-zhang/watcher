var fs = require(fs);

process.on('message',function(msg){
	fs.readdir(watchPath,function(err,files){
        if(err){
            return process.send({err:err});
        }
        var _fileArr = [];
        var _len = files.length;
        files.forEach(function(fileName){
            var filePath = path.join(watchPath,fileName);
            fs.stat(filePath,function(errStat, stat){
            	var info = {p:filePath};
            	_fileArr.push({'isDir':})
                if(errStat){
                    info.err = errStat;
                }
                info.isDir = stat.isDirectory();
                if(_fileArr.length == _len){
                	process.send({i:_fileArr});
                }
            });
        });
    });
});