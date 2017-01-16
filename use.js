var tpls = require('./old/tpls');
var nuzzle = require('./parser');
var fs = require('fs');

var tple = new nuzzle();


var template = fs.readFileSync('templates/template.nuzzle','utf8');
var greet_tpl = fs.readFileSync('templates/sample_tpl.nuzzle','utf8');
var object = {
    user:{
        friend:'tomy'
    }
}
var r = tple.render('template',object,template);
console.log(r);
//fs.writeFileSync(__dirname+'/rendered/template.render.nuzzle',r,'utf8');


