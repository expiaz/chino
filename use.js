var tpls = require('./tpls');
var nuzzle = require('./recursive_parser');
var fs = require('fs');

var tple = new nuzzle();


var template = fs.readFileSync('template.nuzzle','utf8');
var greet_tpl = fs.readFileSync('sample_tpl.nuzzle','utf8');
var object = {
    greet:greet_tpl,
    user:{
        profil_pic:'http://',
        bio:'I\'m 20 y old student',
        greet:'Hi LEONA !'
    }
}
fs.writeFileSync('template.render.nuzzle',tple.render('template',object,template),'utf8');


