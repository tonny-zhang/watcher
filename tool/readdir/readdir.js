var fs = require(fs);

exports.readdir = function(dir,callback){callback();return;
    fs.readdir(dir,function(err,files){
        if(err){
            return callback(err);
        }
        var _fileArr = [];
        var _len = files.length;
        files.forEach(function(fileName){
            var filePath = path.join(watchPath,fileName);
            fs.stat(filePath,function(errStat, stat){
                var info = {p:filePath};
                if(errStat){
                    info.err = errStat;
                }
                info.isDir = stat.isDirectory();
                _fileArr.push(info)
                if(_fileArr.length == _len){
                   callback(null,_fileArr);
                }
            });
        });
    });
}
var _thisIndex = 0;
process.on('message',function(msg){
    console.log(msg);
    setTimeout();
    // try{
    //     if(msg.index){
    //         _thisIndex = msg.index;
    //     }else if(msg.dir){
    //         exports.readdir(msg.dir,function(err,files){
    //             process.send({err: err,files: files,i:_thisIndex,cb:msg.cb});
    //         });
    //     }
    // }catch(e){console.log(e)}
});