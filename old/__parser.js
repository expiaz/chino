
var greet = '<div>Hi {{name}} and {{greet}}</div>';
var terms = "Hi greet <%if " +
	"{{name}}%>plop les <%for {{jean}}%>zamis<%endfor%><%endif%>";

var maphrase = 	"Bonjour jeune chevalier {{name}} "+
							"Bienvenue dans la quete du {{boss}} \n" + 
							"Pour triompher tu devras faire \n" + 
							"<ul>"+
							"<%for {{epreuves}}%>" +
								"<%if {{difficulte}}%>"+
									"<%for {{4}}%>"+
										"<li>- {{name}}</li>"+
									"<%endfor%>"+
								"<%endif%>"+
							"<%endfor%>"+
							"</ul>"+
							"<%if {{islevelfinished}}%>"+
							"Bien ouej gros"+
							"<%endif%>" + 
							"<%if {{!islevelfinished}}%>"+
							"t nul"+
							"<%endif%>";
							
var monobj = {
	name:'Remi',
	boss:'underworld',
	epreuves:
	[
		{
			name:'le feu magnifique',
			difficulte:true
		},
		{
			name:'le feu dur',
			difficulte:false
		}
	],
	islevelfinished:false
}




var parser = function(){
	this.stack;
	this.regex = {
		term:/<%\b(for|if|else|endfor|endif)\b[^%>]*%>/gi,
		parse:/<%\b(if|for)\b[^%>]*%>/gi,
		variable:/{{([^}}]*)}}/gi
	};
	this.template;
	this.vars;
}

parser.prototype.evaluate = function(tpl){
	this.stack = [];
	var matches = [];
	var termReg = /<%(\w+) *(?:{{(?:\W)?(?:\w+)}})?%>/g;
	while (matches = termReg.exec(tpl)) {
		console.log(matches);
		this.stack.length?(matches[1].match(/end/i)?(this.stack[this.stack.length-1]==matches[1].replace('end','')?this.stack.pop():null):this.stack.push(matches[1])):this.stack.push(matches[1]);
	}
	console.log(this.stack);
	return this.stack.length == 0;
}

parser.prototype.parseExp = function(exp,content){
	var variableReg = /{{([^}}]*)}}/gi;
	var variable_name = variableReg.exec(content[1]);
	var variable = this.vars[variable_name[1]] != undefined ? this.vars[variable_name[1]] : variable_name[1];
	switch(exp){
		case 'if':
			if(typeof variable == "string" && variable.indexOf("!") != -1 && !this.vars[(variable.replace('!',''))]){
				return this.template.replace(content[0],content[2]);
			}
			if(variable) return this.template.replace(content[0],content[2]);
			return this.template.replace(content[0],'');
			break;
		case 'for':
			var ret = '';
			if(typeof variable == "object"){
				variable.forEach(tmp.bind(this));
				function tmp(array_variable){
					if(typeof array_variable == "object")ret += this.replace(content[2],array_variable);
					else ret += content[2].replace( /{{([^}}]*)}}/gi,array_variable);
				}
			}
			else if(typeof parseInt(variable) != NaN){
				for(var i =0;i < parseInt(variable);i++)
					ret += content[2];
			}
			else ret = content[0];
			return this.template.replace(content[0],ret);
			break;
	}
}

parser.prototype.parse = function(){
	
	var parseReg = /<%(\w+) *(?:{{(\W)?(\w+)}})?%>/g;
	var matches = parseReg.exec(this.template);
	console.log("match ********")
	console.log("********************")
	console.log(matches)
	if(!matches) return this.template;
	var res = new RegExp('<%'+matches[1]+' *(?:{{(\W)?(\w+)}})?%>([^%]*)<%end'+matches[1]+'%>',"i").exec(this.template);
	console.log("res ********")
	console.log("********************")
	console.log(matches)
	this.template = this.parseExp(matches[1],res);
	return this.parse();
}




parser.prototype.replace = function(tpl,vars){
	tpl = tpl || this.template;
	vars = vars || this.vars;
	
	tpl = tpl.replace(/{{([^}}]*)}}/gi,tmp.bind(this));
		
	function tmp(match,m){
		var v = vars,
			t = m.split('.');

		for(var i =0; i<t.length; i++)
			v = v[t[i]];

		return v;
	}
	
	return tpl;
}

parser.prototype.render = function(tpl,variables){
	console.log(tpl);
	if(!this.evaluate(tpl)) return false;
	this.template = tpl;
	this.vars = variables;
	this.parse();
	this.replace();
	return this.template;
}

var tm = new parser();
console.log(tm.render(maphrase,monobj));