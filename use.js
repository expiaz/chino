var nuzzle = require('./recursive_parser');
var fs = require('fs');

var tpl_engine = new nuzzle();

var nodes = fs.readFileSync('nodes.nuzzle','utf8');
var sample = fs.readFileSync('sample_tpl.nuzzle','utf8');
//var rendered = tpl_engine.render(nodes,{node1:nodes},'nodeify');
//console.log(rendered.nodeTree)
tpl_engine.display('nodes',nodes,{node1:nodes});

tpl_engine.display('jeanlou',sample,{});