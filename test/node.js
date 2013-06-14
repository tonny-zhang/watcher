var Node = require('../node');
var tree = new Node('d:/',3333);

tree.addPath('d:/test/html');
tree.addPath('d:/test/html/1',true);
tree.addPath('d:/test/html/a/b');
setTimeout(function(){

	console.log(JSON.stringify(tree.getTree()));
	tree.deletePath('d:/test/html/a/b');
	console.log(JSON.stringify(tree.getDeleteTree()));
},1000);