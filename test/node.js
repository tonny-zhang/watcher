var Node = require('../node');
var tree = new Node('d:/',3333);

tree.addPath('d:/test/html');
tree.addPath('d:/test/html/1',true);
tree.addPath('d:/test/html/a/b');
setTimeout(function(){
	console.log(JSON.stringify(tree.getTree()));
},1000);