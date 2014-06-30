var readdir = require('util/readdir');

readdir('d:/test/log/',0,'d:/test/tmp/',function(arr,isOver){
	console.log(arr,isOver);
});
console.log('after readdir?');