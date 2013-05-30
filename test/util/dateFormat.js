require('../../util.js');

function test(time,format,except){
	console.log(time.format(format) == except);
}

var testTime = new Date('1910-10-20 12:24:32');
test(testTime,'','1910-10-20 12:24:32');
test(testTime,'yyyy-MM-dd hh:mm:ss','1910-10-20 12:24:32');
test(testTime,'yyyy-MM-dd','1910-10-20');
test(testTime,'yyyy','1910');
test(testTime,'MM','10');
test(testTime,'dd','20');
test(testTime,'hh:mm:ss','12:24:32');