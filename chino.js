var Dictionnary = function () {
    this._keys = [];
    this._values = [];
}

Dictionnary.prototype.add = function (key,value) {
    if(typeof key == "object"){
        for(var k in key){
            if(typeof k == "object") {
                this.add(k);
            }
            else if(this.existsKey(k)){
                this.set(k,key[k]);
            }
            else{
                this._keys.push(k);
                this._values.push(key[k]);
            }
        }
    }
    else if(typeof key == "string" && !!value){
        if(this.existsKey(key)){
            this.set(key,value);
        }
        else{
            this._keys.push(key);
            this._values.push(value);
        }
    }
}

Dictionnary.prototype.set = function (key,value) {
    if(typeof key == "object"){
        for(var k in key){
            if(typeof k == "object") {
                this.set(k);
            }
            else if(!this.existsKey(k)){
                this.add(k,key[k]);
            }
            else{
                this._values[this._keys.indexOf(k)] = key[k];
            }
        }
    }
    else if(typeof key == "string" && !!value){
        if(!this.existsKey(key)){
            this.add(key,value);
        }
        else{
            this._values[this._keys.indexOf(key)] = value;
        }
    }
}

Dictionnary.prototype.get = function (key) {
    return this._values[this._keys.indexOf(key)] || -1;
}

Dictionnary.prototype.duplicate = function (key) {
    var ret = this._values.slice(this._keys.indexOf(key) || 0,1)[0];
    if(typeof ret == "object"){
        if(Array.isArray(ret)){
            return this.utils.map_(ret);
        }
        else{
            return this.utils.assign_(ret);
        }
    }
    return ret;
}



Dictionnary.prototype.utils = {
    assign_: function (obj) {
        var dup = {};
        for(var k in obj){
            dup[k] = typeof obj[k] == "object" ? Array.isArray(obj[k]) ? this.map_(obj[k]) : this.assign_(obj[k]) : obj[k];
        }
        return dup;
    },
    map_: function (arr) {
        return arr.map(function (e) {
            return typeof e == "object" ? Array.isArray(e) ? this.map_(e) : this.assign_(e) : e
        }, this);
    }
}

Dictionnary.prototype.remove = function (key) {
    if(this._keys.indexOf(key) == -1) return false;
    var index = this._keys.indexOf(key);
    this._keys.splice(index,1);
    return this._values.splice(index,1);
}

Dictionnary.prototype.replace = function (key,value) {
    this._values[this._keys.indexOf(key)] = value;
}

Dictionnary.prototype.existsKey = function (key) {
    return this._keys.indexOf(key) != -1;
}

Dictionnary.prototype.existsValue = function (value) {
    return this._values.indexOf(value) != -1;
}

Dictionnary.prototype.getKey = function (value) {
    return this._keys[this._values.indexOf(value)];
}

Dictionnary.prototype[Symbol.iterator] = function () {
    var index = 0,
        data  = this._values;

    return {
        next: function() {
            return { value: data[++index], done: !(index in data) }
        }
    };
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
    var reg = /{{>(\w+)}}/g,
        match = [];

    while(match = reg.exec(this._tpl)){
        var v = this._vars,
            t = match[1].split('.');
        for(var i =0; i<t.length; i++)
            v = v[t[i]];
        this._tpl.replace(match[0],v == undefined ? fs.readFileSync('templates/'+match+'.chino') : v);
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
parser.prototype.parse = function(tpl){
    this._stack = [];
    this.cursor = {
        lastpos:0,
        currpos:0
    };
    this._tpl = tpl;
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
    this.iterateChilds = [];
    //this.content = '';
    this.rendered = '';
    this.context = {};
    this.symbol = raw.symbol;
    this.variable = raw.variable;
    this.subvariable = raw.subvariable || 'i';
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
contextCalcultator.prototype.contextify = function(nodeTree,vars){
    this._stack = [vars];
    this._context = vars;
    this._vars = vars;
    this._nodeTree = nodeTree;
    return this.applyContext(this._nodeTree);
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
    this._context = this._stack[this._stack.length -1] || {};
    if(node.type == 'PLAIN'){
        node.context = this._context;
        node.rendered = this.replace(node.content);
        return node;
    }
    else if(node.type == 'NODE'){
        if(node.childs.length){
            if(node.expression == 'if'){
                var pushContext = true, contextPushed = false;
                if(node.symbol){
                    switch(node.symbol){
                        case '!':
                            node.variable = !this.getContext(node.variable);
                            break;
                        case '&':
                            node.variable = this.getContext(node.variable,1,true);
                            break;
                        case ':':
                            node.variable = this.getContext(node.variable);
                            pushContext = false;
                            break;
                        default:
                            node.variable = this.getContext(node.variable);
                    }
                }
                else node.variable = this.getContext(node.variable,1);
                if(node.variable){
                    node.rendered = true;
                    if(typeof node.variable == "object" && !Array.isArray(node.variable) && pushContext){
                        this._stack.push(node.variable);
                        node.context = node.variable;
                        contextPushed = true;
                    }
                    for(var i =0; i < node.childs.length; i++){
                        node.childs[i] = this.applyContext(node.childs[i]);
                    }
                    if(contextPushed) this._stack.pop();
                }
                else{
                    node.rendered = false;
                    node.context = this._context;
                }
                return node;
            }
            else if(node.expression == 'for'){
                var currContext, dupChild;
                node.iterateChilds = node.childs;
                node.childs = [];
                if(!isNaN(parseInt(node.variable))){
                    node.variable = parseInt(node.variable);
                }
                else if(node.symbol){
                    switch(node.symbol){
                        case '&':
                            node.variable = this.getContext(node.variable,1,true);
                            break;
                        default:
                            node.variable = this.getContext(node.variable);
                            break;
                    }
                }
                else node.variable = this.getContext(node.variable);
                if(typeof node.variable == "object" && Array.isArray(node.variable)){
                    for(var i = 0; i < node.variable.length; i++){
                        currContext = {};
                        currContext[node.subvariable] = node.variable[i];
                        this._stack.push(currContext);
                        for(var j =0; j < node.iterateChilds.length; j++){
                            dupChild = {};
                            for(var k in node.iterateChilds[j])
                                dupChild[k] = node.iterateChilds[j][k];
                            node.childs.push(this.applyContext(dupChild));
                        }
                        this._stack.pop();
                    }
                    node.context = node.variable;
                    node.rendered = true;
                }
                else if(!isNaN(parseInt(node.variable))){
                    node.variable = parseInt(node.variable);
                    for(var i = 0; i < node.variable; i++){
                        currContext = {};
                        currContext[node.subvariable] = i;
                        this._stack.push(currContext);
                        for(var j =0; j < node.iterateChilds.length; j++){
                            dupChild = {};
                            for(var k in node.iterateChilds[j])
                                dupChild[k] = node.iterateChilds[j][k];
                            node.childs.push(this.applyContext(dupChild));
                        }
                        this._stack.pop();
                    }
                    node.context = node.variable;
                    node.rendered = true;
                }
                else {
                    node.rendered = false;
                    node.context = this._context;
                }
            }
        }
        else{
            node.rendered = false;
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
    if(tpl == '\r\n' || tpl == '\n\r') return '';

    var match = [],
        reg = /{{(?:(\W)?([^{]+))}}/g;

    while(match = reg.exec(tpl)){
        var symbol = match[1],
            m = match[2],
            ctx;

        if(symbol){
            switch(symbol){
                case '!':
                    ctx = !this.getContext(m);
                    break;
                case '&':
                    ctx = this.getContext(m,1,true);
                    break;
                default:
                    ctx = this.getContext(m);
                    break;
            }
        }
        else ctx = this.getContext(m);

        tpl = tpl.replace(match[0],ctx !== undefined && typeof ctx !== "object" ? ctx : '');
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
            if(node.childs[i].expression == 'if' || node.childs[i].expression == 'for')
                if(node.childs[i].rendered)
                    ret += this.renderNode(node.childs[i]);
        }
        else if(node.childs[i].type == 'PLAIN'){
            ret += this.trimText(node.childs[i].rendered);
        }
    }
    return ret;
}


renderEngine.prototype.trimText = function(text){
    return text.replace(/^[\r\n]+|[\r\n]+$/g,'');
}





/**
 * @class chino
 */
var chino = function(){
    this._cached = new Dictionnary();
    this.engine = {
        precompiler: new precompiler(),
        parser: new parser(),
        context: new contextCalcultator(),
        render: new renderEngine()
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
    if(!tpl || !name)
        throw new Error("Can't register a template without name or content");

    this._cached.add(name,tpl);

    if(!this.evaluate(this._cached.get(name)))


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

    if(typeof vars != "object" || Array.isArray(vars))
        throw new Error('vars aren\'t object type');

    if (this._cached.existsKey(tpl)){
        template = this._cached.duplicate(tpl);
    }
    else{
        template = tpl;
        if(!this.evaluate(template))
            throw new Error("Fail eval");
        template = this.engine.precompiler.precompile(template,vars);
        if(!this.evaluate(template))
            throw new Error("Fail precompliation eval");
        template = this.engine.parser.parse(template);
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