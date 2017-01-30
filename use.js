var chino = require('./back/chino');

var engine = new chino();

engine.register('auth.chino');

//console.log(engine.cached['auth']);

var e = engine.render('auth',{mytest:'a'});

//console.log(engine.cached['auth']);

var e = engine.render('auth',{error:'bad'});

console.log(e);