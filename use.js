var chino = require('./back/chino');

var engine = new chino();

//engine.register('auth.chino');

var e = engine.render('auth.chino',{user:{username:'John Doe'}});

console.log(e);