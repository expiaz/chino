Array.prototype.get = function(){
    return this[this.length-1];
}



var precompiler = function(){
    this._tpl;
    this._vars;
};

precompiler.prototype.precompile = function(tpl,vars){
    this._tpl = tpl;
    this._vars = vars;
    this.makeInjections();

    return this._tpl;
}

precompiler.prototype.makeInjections = function(){
    this._tpl = this._tpl.replace(/{{>(\w+)}}/g, replace_match.bind(this));
    function replace_match(fullmatch,match){
        var v = this._vars,
            t = match.split('.');
        for(var i =0; i<t.length; i++)
            v = v[t[i]];
        return v;
    }
};





var parser = function(){
    this._stack = [];
    this.cursor = {
        lastpos:0,
        currpos:0
    };
    this._tpl;
};

parser.prototype.parse = function(tpl,vars){
    this._stack = [];
    this.cursor = {
        lastpos:0,
        currpos:0
    };
    this._tpl = tpl;
    this._vars = vars;
    return this.getExpressionTree();
}

parser.prototype.IfNode = function(raw){
    this.type = 'OPENING';
    this.expression = 'if';
    this.childs = [];
    //this.content = '';
    this.rendered = '';
    this.context = {};

    this.variable = raw.variable;
    this.symbol = raw.symbol;
    this.tags = [raw.tag];
    this.indexs = [raw.index];
}

parser.prototype.ForNode = function(raw){
    this.type = 'OPENING';
    this.expression = 'for';
    this.childs = [];
    //this.content = '';
    this.rendered = '';
    this.context = {};
    this.symbol = raw.symbol;
    this.variable = raw.variable;
    this.subvariable = raw.subvariable;
    this.subsymbol = raw.subsymbol;
    this.keyword = raw.keyword;
    this.tags = [raw.tag];
    this.indexs = [raw.index];
}

parser.prototype.TextNode = function(raw){
    this.type = 'PLAIN';
    this.expression = 'text';
    this.content = raw.content;
    this.rendered = '';
    this.context = {};

    this.variables = [];
    this.indexs = raw.indexs;
}

parser.prototype.RootNode = function(){
    this.type = 'ROOT';
    this.expression = 'root';
    this.childs = [];
    this.context = {};
}

parser.prototype.ClosingTagNode = function(raw){
    this.type = 'CLOSING';
    this.expression = raw.expression.replace('end','');
    this.tag = raw.tag;
    this.indexs = [raw.index,raw.index+raw.tag.length];
}

parser.prototype.getNode = function(raw,type){
    switch(type || raw.expression){
        case 'if':
            return new this.IfNode(raw);
            break;
        case 'for':
            return new this.ForNode(raw);
            break;
        case 'text':
            return new this.TextNode(raw);
            break;
        case 'root':
            return new this.RootNode();
            break;
        case 'endif':
        case 'endfor':
            return new this.ClosingTagNode(raw);
            break;
    }
}

parser.prototype.pushTextNode = function(){
    var raw_text_node = {};
    raw_text_node.expression = 'text';
    raw_text_node.indexs = [this.cursor.lastpos, this.cursor.currpos];
    raw_text_node.content = this._tpl.substring(this.cursor.lastpos,this.cursor.currpos);
    this._stack[this._stack.length-1].childs.push(this.getNode(raw_text_node));
}

parser.prototype.pushExpressionNode = function(closingNode){
    var openingNode = this._stack.pop();
    if(openingNode.expression != closingNode.expression) return;
    openingNode.type = 'NODE';
    openingNode.tags.push(closingNode.tag);
    openingNode.indexs.push(closingNode.indexs[1]);
    this._stack[this._stack.length-1].childs.push(openingNode);
}

parser.prototype.reformate = function(match){
    return {
        tag: match[0],
        index: match.index,
        expression: match[1].toLowerCase(),
        symbol: match[2],
        variable: match[3],
        keyword: match[4],
        subsymbol:match[5],
        subvariable: match[6]
    };
};

parser.prototype.getExpressionTree = function(){
    this._stack.push(this.getNode(null,'root'));
    var match, current_node, opening_node,
        reg = /<%(\w+) *(?:{{(\W)?([^}]+)}})? *(?:(\w+) *{{(\W)?(\w+)}})?%>/g;

    while(match = reg.exec(this._tpl)){
        match = this.reformate(match);
        this.cursor.currpos = match.index;
        current_node = this.getNode(match);
        if(this.cursor.currpos > this.cursor.lastpos) this.pushTextNode();
        if(current_node.type == 'OPENING') this._stack.push(current_node);
        else this.pushExpressionNode(current_node);
        this.cursor.lastpos = this.cursor.currpos + (current_node.type == 'OPENING' ? current_node.tags[0].length : current_node.tag.length);
    }

    if(this.cursor.lastpos == this._tpl.length) return this._stack.pop();

    this.cursor.currpos = this._tpl.length;
    this.pushTextNode();
    return this._stack.pop();
}



var contextCalcultator = function(vars,nodeTree){
    this._stack = [];
    this._context;
    this._vars;
    this._nodeTree;
};

contextCalcultator.prototype.contextify = function(vars,nodeTree){
    this._stack = [vars];
    this._context = vars;
    this._vars = vars;
    this._nodeTree = nodeTree;
    return this.applyContext();
};

contextCalcultator.prototype.getContext = function(varName,stackStair,locked){
    stackStair = stackStair || 1;
    var v = this._stack[this._stack.length - stackStair] || {},
        t = varName.split('.');
    for(var i =0; i<t.length; i++){
        if(v == undefined){
            if(locked) return v;
            return this.getContext(varName,++stackStair);
        }
        v = v[t[i]];
    }
    return v;
};

contextCalcultator.prototype.applyContext = function (node) {
    node = node || this._nodeTree;
    this._context = this._stack[this._stack.length -1] || {};
    var contextChanged = false;
    if(node.type == 'PLAIN'){
        node.context = this._context;
        node.content = this.replace(node.content);
        return node;
    }
    else if(node.type == 'NODE'){
        if(!node.childs) return;
        if(node.expression == 'if'){
            if(node.symbol){
                switch(node.symbol){
                    case '!':
                        node.variable = !this.getContext(node.variable);
                        break;
                    case ':':
                        node.variable = this.getContext(node.variable,1,true);
                        break;
                }
            }
            else node.variable = this.getContext(node.variable);
            if(node.variable){
                if(typeof node.variable == "object" && !Array.isArray(node.variable)){
                    this._stack.push(node.variable);
                    node.context = node.variable;
                    contextChanged = true;
                }
                node.rendered = true;
            }
            else{
                node.rendered = false;
                node.context = this._context;
                return node;
            }
        }
        else if(node.expression == 'for'){

        }
        for(var i =0; i < node.childs.length; i++){
            node.childs[i] = this.applyContext(node.childs[i]);
        }
        if(contextChanged) this._stack.pop();
        return node;
    }
    else if(node.type == 'ROOT'){
        node.context = this._context;
        if(!node.childs) return;
        for(var i =0; i < node.childs.length; i++){
            node.childs[i] = this.applyContext(node.childs[i]);
        }
        return node;
    }
};

contextCalcultator.prototype.replace = function (tpl) {
    tpl = tpl.replace(/{{(?:(\W)?([^{]+))}}/g,replace_match.bind(this));
    function replace_match(fullmatch,symbol,match){
        if(symbol){
            switch(symbol){
                case '!':
                    var ctx = !this.getContext(match);
                    break;
                case ':':
                    var ctx = this.getContext(match,1,true);
                    break;
                default:
                    var ctx = this.getContext(match);
                    break;
            }
        }
        else var ctx = this.getContext(match);
        return ctx !== undefined ? ctx : '';
    }
    return tpl;
};





var nuzzle = function(){
    this.templates = [];
    this.cache = [];
    this.precompiler = new precompiler();
    this.parser = new parser();
    this.contextEngine = new contextCalcultator()
}

nuzzle.prototype.evaluate = function(tpl){
    var stack = [];
    var matches = [];
    var termReg = /<%(\w+) *(?:{{(\W)?([^}]+)}})? *(?:(\w+) *{{(\W)?(\w+)}})?%>/gi;
    while (matches = termReg.exec(tpl)){
        stack.length?(matches[1].match(/end/i)?(stack[stack.length-1]==matches[1].replace('end','')?stack.pop():null):stack.push(matches[1])):stack.push(matches[1]);
    }
    return stack.length == 0;
}

nuzzle.prototype.render = function(tpl,vars,name,cached){
    if(!name) throw new Error("Can't parse without a name");
    if(this.templates[name] || this.cache[name]) throw new Error("Already parsed");
    this.templates[name] = {tpl:tpl,vars:vars};
    if(cached) this.cache[name] = tpl;
    if(!this.evaluate(this.templates[name].tpl)) throw new Error("Fail eval");
    //precompilation
    this.templates[name].tpl = this.precompiler.precompile(this.templates[name].tpl,this.templates[name].vars);
    if(!this.evaluate(this.templates[name].tpl)) throw new Error("Fail eval after precompilation");
    //Expressions
    this.templates[name].nodeTree = this.parser.parse(this.templates[name].tpl,this.templates[name].vars);
    //calculExpressions
    this.templates[name].contextNodeTree = this.contextEngine.contextify(this.templates[name].vars,this.templates[name].nodeTree);
    //replaceVariables
    /*...*/
    //rendering
    /*..*/

    return this.templates[name];
};

nuzzle.prototype.display = function(tplName,tpl,vars){
    if(!this.templates[tplName]) this.render(tpl,vars,tplName);
    if(!this.templates[tplName].nodeTree) this.render(this.templates[tplName].tpl,this.templates[tplName].vars,tplName);
    this.displayNodeTree(this.templates[tplName].nodeTree);
}

nuzzle.prototype.displayNodeTree = function(tree,stair){
    stair = stair || 0;
    var indentation = "\t".repeat(stair);
    console.log(' ');
    console.log(indentation+"***** NODE "+stair+" ******")
    console.log(indentation+tree.expression+(tree.variable ? "{{"+tree.variable+"}}" : ''));
    console.log(tree.context);
    console.log(indentation +  (tree.content ? tree.content : ''));
    if(tree.childs)
        for(var n = 0;n<tree.childs.length;n++)
            this.displayNodeTree(tree.childs[n],stair + 1);
};

module.exports = nuzzle;




var tpls = require('./tpls');

var tple = new nuzzle();

var g = tple.render(tpls.iftpl,tpls.oiftpl,'john');

tple.displayNodeTree(g.contextNodeTree);