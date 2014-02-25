var fs = require('fs');
var path = require('path');

var root_path = process.argv[2];
var time = process.argv[3];
try{
  function getAllFiles(root){
    var res = [] , files = fs.readdirSync(root);
    files.forEach(function(file){
      try{
      var pathname = path.join(root,file)
      , stat = fs.lstatSync(pathname);

      if (!stat.isDirectory()){
          if(stat.mtime.getTime()/1000 > time){
            console.log(pathname+'|');
          }
         
      } else {
        console.log(pathname);
        getAllFiles(pathname);
      }
      }catch(e1){}
    });
    return res
  }
  getAllFiles(root_path)
  
}catch(e){}
