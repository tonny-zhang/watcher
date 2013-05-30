var extend = require('../../util.js').extend;
var compare = require('./compare').compare;
var test = function(except,a,b){
	console.log(except == compare(a,b)?'√':'X');
}

test(true,{},extend({}));
test(true,{name:1},extend({},{name:1}));
test(true,{name:2},extend({},{name:1},{name:2}));
test(true,{name:2,age:10},extend({},{name:1},{name:2,age:10}));
test(true,{name:2,age:10,friends:{name:10,age:1}},extend({},{name:1,friends:{name:10,age:1}},{name:2,age:10}));