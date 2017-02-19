var precompiler = require('./precompiler');
var parser = require('./parser');
var context = require('./context');
var render = require('./render');
var dictionnary = require('./dictionnary');
var fs = require('fs');

/**
 * @class chino
 */
var chino = function(){
    this._templates = new dictionnary();
    this._cached = new dictionnary();
    this.engine = {
        precompiler: new precompiler(),
        parser: new parser(),
        context: new context(),
        render: new render()
    };
}

/**
 * evaluate the validity of expressions in the template
 * @param tpl {string}
 * @returns {boolean}
 */
chino.prototype.evaluate = function(tpl){
    var stack = [],
        matches = [],
        termReg = /<%(\w+) *(?:{{(\W)?([^}]+)}})? *(?:(\w+) *{{(\W)?(\w+)}})?%>/gi;

    while (matches = termReg.exec(tpl))
        stack.length?(matches[1].match(/end/i)?(stack[stack.length-1]==matches[1].replace('end','')?stack.pop():null):stack.push(matches[1])):stack.push(matches[1]);

    return stack.length == 0;
}


/**
 * register a template on cache
 * @param tpl
 * @param vars
 * @param name
 * @returns {*}
 */
chino.prototype.register = function (tpl,name,vars) {

    if(!tpl.match(/^.*\.chino$/i))
        throw new Error('tempalte does not match *.chino files');

    if(!name || typeof name != "string")
        name = tpl.replace('.chino','');

    this._cached.add(name,fs.readFileSync('templates/'+tpl,'utf8'));

    if(!this.evaluate(this._cached.get(name)))
        throw new Error("Fail eval");

    if(vars && typeof vars == "object"){
        this._cached.set(name,this.engine.precompiler.precompile(this._cached.get(name),vars));
        if(!this.evaluate(this._cached.get(name)))
            throw new Error("Fail precompliation eval");
    }

    this._cached.set(name,this.engine.parser.parse(this._cached.get(name)));

    return this._cached.get(name);
}

/**
 * lauch rendering
 * @param tpl
 * @param vars
 * @param name
 * @returns {string|*}
 */
chino.prototype.render = function(tpl,vars,name){
    var template;

    if(!vars)
        vars = {};

    if(typeof vars != "object")
        throw new Error('vars aren\'t object type');

    if (tpl.match(/^.*\.chino$/i)){
        template = fs.readFileSync('templates/'+tpl,'utf8');
        if(!this.evaluate(template))
            throw new Error("Fail eval");
        template = this.engine.precompiler.precompile(template,vars);
        if(!this.evaluate(template))
            throw new Error("Fail precompliation eval");
        template = this.engine.parser.parse(template);
    }
    else{
        template = this._cached.duplicate(tpl);
    }

    if(name)
        this._cached.set(name,template);


    template = this.engine.context.contextify(template,vars);
    template = this.engine.render.render(template);

    return template;
}

/**
 * display the nodeTree with nesting levels on the console
 * @param tree
 * @param stair
 */
chino.prototype.displayNodeTree = function(tree,stair){
    stair = stair || 0;
    var indentation = "\t".repeat(stair);
    console.log(' ');
    console.log(indentation+"***** NODE "+stair+" ******")
    console.log(indentation+tree.expression+(tree.variable ? " {{"+tree.variable+"}}" : ''));
    //console.log(tree.context);
    console.log(indentation +  'content : ' + (tree.content ? tree.content : ''));
    console.log(indentation +  'rendered : ' + (tree.rendered !== undefined ? tree.rendered : ''));
    if(tree.childs)
        for(var n = 0;n<tree.childs.length;n++)
            this.displayNodeTree(tree.childs[n],stair + 1);
};

module.exports = chino;