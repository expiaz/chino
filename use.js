var tpls = require('./old/tpls');
var nuzzle = require('./parser');
var fs = require('fs');

var tple = new nuzzle();


var template = fs.readFileSync('templates/template.nuzzle','utf8');

var object = {
    users:[
        {name:'jdshusdj',classroom:false},
        {name:'jean',classroom:true}
    ]
}
var d = Date.now();
var r = tple.render('template',object,template);
console.log(Date.now() - d);
console.log('tpl')
console.log(r);
//fs.writeFileSync(__dirname+'/rendered/template.render.nuzzle',r,'utf8');


