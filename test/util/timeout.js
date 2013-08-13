setTimeout(function(){
	console.log('hello');
	throw new Error('after timeout');
},10000);