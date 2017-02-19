
/*
 * back
 */


var chino = require('./back/chino');

var engine = new chino();

engine.register('auth.chino');

var e = engine.render('auth',{error:'a'});

console.log(e);

var j = engine.render('auth',{mytest:'a'});

console.log(j);

