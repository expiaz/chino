var precompiler = require('./precompiler');
var parser = require('./parser');
var context = require('./context');
var render = require('./render');
var fs = require('fs');

/**
 * @class chino
 */
var chino = function(){
    this.templates = [];
    this.cached = [];
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

    this.cached[name] = fs.readFileSync('templates/'+tpl,'utf8');

    if(!this.evaluate(this.cached[name]))
        throw new Error("Fail eval");

    if(vars && typeof vars == "object"){
        this.cached[name] = this.engine.precompiler.precompile(this.cached[name],vars);
        if(!this.evaluate(this.cached[name]))
            throw new Error("Fail precompliation eval");
    }

    this.cached[name] = this.engine.parser.parse(this.cached[name]);

    return this.cached[name];
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
        template = this.cached[tpl];
    }

    if(name)
        this.cached[name] = template;

    template = this.engine.context.contextify(template,vars);
    template = this.engine.render.render(template);

    return template;
}

/**
 * launch the rendering process of a template
 * @param name
 * @param vars
 * @param tpl
 * @param cached : to put in cache
 * @returns {string} template rendered
 */
chino.prototype.renderbis = function(name,vars,tpl,cached){
    if(!name) throw new Error("Can't render without a name");
    if(!this.cached[name]){
        //registering
        this.templates[name] = {tpl:tpl,vars:vars};
        if(!this.evaluate(this.templates[name].tpl)) throw new Error("Fail eval");
        //precompilation
        this.templates[name].tpl = this.precompiler.precompile(this.templates[name].tpl,this.templates[name].vars);
        if(!this.evaluate(this.templates[name].tpl)) throw new Error("Fail eval after precompilation");
        //Expressions
        this.templates[name].nodeTree = this.parser.parse(this.templates[name].tpl,this.templates[name].vars);
    }
    else{
        //recuperation du cache
        this.templates[name] = {tpl:this.cached[name].tpl,nodeTree:this.cached[name].nodeTree};
        this.templates[name].vars = vars;
    }
    //mise en cache
    if(cached) this.cached[name] = {tpl:this.templates[name].tpl,nodeTree:this.templates[name].nodeTree};

    //calculExpressions
    this.templates[name].contextNodeTree = this.contextEngine.contextify(this.templates[name].vars,this.templates[name].nodeTree);
    //replaceVariables
    /*...*/
    //rendering
    this.templates[name].rendered = this.renderEngine.render(this.templates[name].contextNodeTree);

    return this.templates[name].rendered;
};

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