Array.prototype.get = function() {
    return this[this.length - 1];
}


/**
 * @class precompiler
 */
var precompiler = function(){
    this._tpl;
    this._vars;
};

/**
 * launch precompilation
 * @param tpl
 * @param vars
 * @returns new template
 */
precompiler.prototype.precompile = function(tpl,vars){
    this._tpl = tpl;
    this._vars = vars;
    this.makeInjections();

    return this._tpl;
}

/**
 * replace {{>*}} tags by their content
 */
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


/**
 * @class parser
 */
var parser = function(){
    this._stack = [];
    this.cursor = {
        lastpos:0,
        currpos:0
    };
    this._tpl;
};


/**
 * launch parsing
 * @param tpl
 * @param vars
 */
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

/**
 * @class IfNode
 * @param raw
 * @constructor
 */
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

/**
 * @class ForNode
 * @param raw
 * @constructor
 */
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


/**
 * @class TextNode
 * @param raw
 * @constructor
 */
parser.prototype.TextNode = function(raw){
    this.type = 'PLAIN';
    this.expression = 'text';
    this.content = raw.content;
    this.rendered = '';
    this.context = {};

    this.variables = [];
    this.indexs = raw.indexs;
}

/**
 * @class RootNode
 * @constructor
 */
parser.prototype.RootNode = function(){
    this.type = 'ROOT';
    this.expression = 'root';
    this.childs = [];
    this.context = {};
}

/**
 * @class represents any of </> tag
 * @param raw
 * @constructor
 */
parser.prototype.ClosingTagNode = function(raw){
    this.type = 'CLOSING';
    this.expression = raw.expression.replace('end','');
    this.tag = raw.tag;
    this.indexs = [raw.index,raw.index+raw.tag.length];
}

/**
 * return a nodeObject depending on raw infos
 * @param raw
 * @param type
 * @returns node
 */
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

/**
 * push a text node to the nodeTree depending on the positions of the cursor
 */
parser.prototype.pushTextNode = function(){
    var raw_text_node = {};
    raw_text_node.expression = 'text';
    raw_text_node.indexs = [this.cursor.lastpos, this.cursor.currpos];
    raw_text_node.content = this._tpl.substring(this.cursor.lastpos,this.cursor.currpos);
    this._stack[this._stack.length-1].childs.push(this.getNode(raw_text_node));
}

/**
 * push an entiere node to the nodeTree by assembling opening and closing nodes
 * @param closingNode
 */
parser.prototype.pushExpressionNode = function(closingNode){
    var openingNode = this._stack.pop();
    if(openingNode.expression != closingNode.expression) return;
    openingNode.type = 'NODE';
    openingNode.tags.push(closingNode.tag);
    openingNode.indexs.push(closingNode.indexs[1]);
    this._stack[this._stack.length-1].childs.push(openingNode);
}

/**
 * reformate the match result into an object
 * @param match
 * @returns {{tag: *, index: (*|Number), expression: string, symbol: *, variable: *, keyword: *, subsymbol: *, subvariable: *}}
 */
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

/**
 * return a tree of expressions and text nodes from a template
 * @returns nodeTree
 */
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


/**
 * @class contextCalculator
 */
var contextCalcultator = function(){
    this._stack = [];
    this._context;
    this._vars;
    this._nodeTree;
};

/**
 * launch context
 * @param vars
 * @param nodeTree
 */
contextCalcultator.prototype.contextify = function(vars,nodeTree){
    this._stack = [vars];
    this._context = vars;
    this._vars = vars;
    this._nodeTree = nodeTree;
    return this.applyContext();
};

/**
 * browse contexts to find the value of varName
 * @param varName
 * @param stackStair : context level
 * @param locked : stop at first context
 * @returns varName value depending on context
 */
contextCalcultator.prototype.getContext = function(varName,stackStair,locked){
    stackStair = stackStair || 1;
    var v = this._stack[this._stack.length - stackStair] || -1,
        t = varName.split('.');
    if(v == -1) return undefined;
    for(var i =0; i<t.length; i++){
        if(v == undefined){
            if(locked) return v;
            return this.getContext(varName,++stackStair);
        }
        v = v[t[i]];
    }
    return v;
};

/**
 * browse a nodeTree recursively and apply context of variables inside depending on the level of nesting
 * @param node
 * @returns nodeTree
 */
contextCalcultator.prototype.applyContext = function (node) {
    node = node || this._nodeTree;
    this._context = this._stack[this._stack.length -1] || {};
    var contextChanged = false;
    if(node.type == 'PLAIN'){
        node.context = this._context;
        node.rendered = this.replace(node.content);
        return node;
    }
    else if(node.type == 'NODE'){
        if(node.childs.length){
            if(node.expression == 'if'){
                var pushContext = true;
                if(node.symbol){
                    switch(node.symbol){
                        case '!':
                            node.variable = !this.getContext(node.variable);
                            break;
                        case '&':
                            node.variable = this.getContext(node.variable,1,true);
                            break;
                        case ':':
                            pushContext = false;
                            break;
                        default:
                            node.variable = this.getContext(node.variable);
                    }
                }
                else node.variable = this.getContext(node.variable,1);
                if(node.variable){
                    if(typeof node.variable == "object" && !Array.isArray(node.variable) && pushContext){
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
        }
        return node;
    }
    else if(node.type == 'ROOT'){
        node.context = this._context;
        if(node.childs.length){
            for(var i =0; i < node.childs.length; i++){
                node.childs[i] = this.applyContext(node.childs[i]);
            }
        }
        return node;
    }
};

/**
 * replace variables on a string (tpl) depending on symbols and contexts
 * @param tpl
 * @returns tpl
 */
contextCalcultator.prototype.replace = function (tpl) {
    tpl = tpl.replace(/{{(?:(\W)?([^{]+))}}/g,replace_match.bind(this));
    function replace_match(fullmatch,symbol,match){
        var ctx;
        if(symbol){
            switch(symbol){
                case '!':
                    ctx = !this.getContext(match);
                    break;
                case '&':
                    ctx = this.getContext(match,1,true);
                    break;
                default:
                    ctx = this.getContext(match);
                    break;
            }
        }
        else ctx = this.getContext(match);
        return ctx !== undefined && typeof ctx !== "object" ? ctx : '';
    }
    return tpl;
};


/**
 * @class renderEngine
 */
var renderEngine = function(){
    this._nodeTree;
};

/**
 * launch rendering
 * @param nodeTree
 * @return {string} template rendered
 */
renderEngine.prototype.render = function(nodeTree){
    this._nodeTree = nodeTree;
    return this.renderNode(nodeTree);
}

/**
 * browse a nodeTree recurively and assemble text nodes together to make the template
 * @param node
 * @returns {string} template rendered
 */
renderEngine.prototype.renderNode = function(node){
    var ret = '';
    for(var i = 0; i < node.childs.length; i++){
        if(node.childs[i].type == 'NODE'){
            if(node.childs[i].expression == 'if')
                if(node.childs[i].rendered)
                    ret += this.renderNode(node.childs[i]);
            else ret += this.renderNode(node.childs[i]);
        }
        else if(node.childs[i].type == 'PLAIN') ret += this.trimText(node.childs[i].rendered);
    }
    return ret;
}


renderEngine.prototype.trimText = function(text){
    return text.replace(/^[\r\n]+|[\r\n]+$/g,'');
}


/**
 * @class nuzzle
 */
var nuzzle = function(){
    this.templates = [];
    this.cached = [];
    this.precompiler = new precompiler();
    this.parser = new parser();
    this.contextEngine = new contextCalcultator();
    this.renderEngine = new renderEngine();
}

/**
 * evaluate the validity of expressions in the template
 * @param tpl
 * @returns {boolean}
 */
nuzzle.prototype.evaluate = function(tpl){
    var stack = [];
    var matches = [];
    var termReg = /<%(\w+) *(?:{{(\W)?([^}]+)}})? *(?:(\w+) *{{(\W)?(\w+)}})?%>/gi;
    while (matches = termReg.exec(tpl)){
        stack.length?(matches[1].match(/end/i)?(stack[stack.length-1]==matches[1].replace('end','')?stack.pop():null):stack.push(matches[1])):stack.push(matches[1]);
    }
    return stack.length == 0;
}

/**
 * launch the rendering process of a template
 * @param name
 * @param vars
 * @param tpl
 * @param cached : to put in cache
 * @returns {string} template rendered
 */
nuzzle.prototype.render = function(name,vars,tpl,cached){
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

nuzzle.prototype.display = function(tplName,tpl,vars){
    if(!this.templates[tplName]) this.render(tpl,vars,tplName);
    if(!this.templates[tplName].nodeTree) this.render(this.templates[tplName].tpl,this.templates[tplName].vars,tplName);
    this.displayNodeTree(this.templates[tplName].nodeTree);
}

/**
 * display the nodeTree with nesting levels on the console
 * @param tree
 * @param stair
 */
nuzzle.prototype.displayNodeTree = function(tree,stair){
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

module.exports = nuzzle;