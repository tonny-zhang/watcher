var fs = require('fs');

// fs.open('/tonny/log_read/dir.log','r',function(err,fd){
// 	var offset = 0;
// 	var buffer = new Buffer(1024);
// 	fs.read(fd,buffer,offset,buffer.length,0,);
// });
var startTime = +new Date();
var readStream = fs.createReadStream('d:/test/log/dir.log');
readStream.setEncoding('utf8');
var dataInfo = [];
var inptext = '';
var totalNum = 0;
readStream.on('data', function (data) {
    inptext += data;
    var arr = inptext.split('\n');
    inptext = arr.pop();//最好一个出栈
    totalNum += arr.length;
    console.log(arr.length,totalNum);
    dataInfo = dataInfo.concat(arr);
});
readStream.on('end', function (close) {
    console.log(dataInfo.length,+new Date()-startTime+' ms');
});