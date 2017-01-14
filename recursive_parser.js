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

//hydrate variable & symbol & tags & indexs
parser.prototype.IfNode = function(raw){
    this.type = 'OPENING';
    this.expression = 'if';
    this.childs = [];
    //this.content = '';
    this.rendered = '';

    this.variable = raw.variable;
    this.symbol = raw.symbol;
    this.tags = [raw.tag];
    this.indexs = [raw.index];
}

//hydrate variable & subvar & tags & keyword & indexs
parser.prototype.ForNode = function(raw){
    this.type = 'OPENING';
    this.expression = 'for';
    this.childs = [];
    //this.content = '';
    this.rendered = '';

    this.variable = raw.variable;
    this.subvariable = raw.subvariable;
    this.keyword = raw.keyword;
    this.tags = [raw.tag];
    this.indexs = [raw.index];
}

//hydrate content & indexs
parser.prototype.TextNode = function(raw){
    this.type = 'PLAIN';
    this.expression = 'text';
    this.content = raw.content;
    this.rendered = '';

    this.variables = [];
    this.indexs = raw.indexs;
}

// no hydrate
parser.prototype.RootNode = function(){
    this.type = 'ROOT';
    this.expression = 'root';
    this.childs = [];
}

//hydrate
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
        subvariable: match[5]
    };
};


parser.prototype.getExpressionTree = function(){
    this._stack.push(this.getNode(null,'root'));
    var match, current_node, opening_node,
        reg = /<%(\w+) *(?:{{(\W)?(\w+)}})? *(?:(\w+) *{{(\w+)}})?%>/g;

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


parser.prototype.injectExpressionVariable = function(node,context){
    for(var i =0; i < node.childs.length; i++){
        switch(node.childs[i].type){
            case 'NODE':
                switch(node.childs[i].expression){
                    case 'if':
                        break;
                    case 'for':
                        break;
                }
                node.childs[i].variable = this.getVar(node.childs[i].variable);
                var context = node.childs[i].subvariable ? this.getVar(node.childs[i].subvariable) : undefined;
                return this.injectExpressionVariable(node.childs[i],context);
                break;
            case 'PLAIN':

                break;
        }
    }
}

parser.prototype.getVar = function(varName,vars){
    var v = vars || this._vars,
        t = varName.split('.');
    for(var i =0; i<t.length; i++)
        v = v[t[i]];
    return v;
}

parser.prototype.replace = function(reg,tpl){
    tpl = tpl || this._tpl;
    tpl = tpl.replace(reg, replace_match.bind(this));
    function replace_match(fullmatch,match){
        var v = this._vars,
            t = match.split('.');
        for(var i =0; i<t.length; i++)
            v = v[t[i]];
        return v;
    }

    return tpl;
}



var chunk = '<%for {{e}}%>'+
    '<div class="jeanlouis">'+
    '<%if {{greet}}%>'+
    '{{>greet}}'+
    '<%endif%>'+
    '</div>'+
    '<%endfor%>';

var subtpl = '<div class="greeting"><%for {{e}}%>Greet {{name}} !<%endfor%></div>';

var lorem = "Lorem {{>lorem1}} ipsum dolor {{>lorem2}} sit amet, consectetur adipiscing elit. Phasellus semper velit quis lorem pulvinar, sed consequat orci pellentesque. Etiam tincidunt " +
    "<%for {{nzdz}}%>" +
    "id elit in " +
    "<%if {{ffef}}%>" +
    "fringilla. {{>lorem3}} Donec" +
    "<%endif%>" +
    " vitae " +
    "<%for {{dand}}%>" +
    "accumsan nisi, in" +
    "<%endfor%>" +
    " tincidunt arcu." +
    "<%endfor%>" +
    " Pellentesque " +
    "<%for {{fefe}}%>" +
    "bibendum erat " +
    "<%for {{ffeef}}%>" +
    "at {{>lorem4}}" +
    "<%endfor%> " +
    "<%for {{fefefef}}%>" +
    "risus" +
    "<%endfor%> " +
    "<%endfor%>" +
    "maximus consectetur id eu lacus. Aenean tincidunt iaculis diam vitae malesuada. " +
    "<%for {{fefe2}}%>" +
    "bibendum {{>lorem5}} erat " +
    "<%for {{ffeef2}}%>" +
    "at" +
    "<%endfor%> " +
    "<%for {{fefefef2}}%>" +
    "risus" +
    "<%endfor%> " +
    "<%endfor%>" +
    "Suspendisse accumsan facilisis arcu quis sagittis. Integer in risus ligula. Vestibulum est mauris, pretium eu tortor eleifend, elementum mollis nulla. Vivamus neque nulla, commodo et massa a, hendrerit maximus mi. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Integer eros mi, " +
    "<%if {{name}}%>" +
    "maximus " +
    "<%for {{drake}}%>" +
    "id eleifend {{>lorem0}} vel" +
    "<%endfor%>" +
    ", rutrum nec elit." +
    "<%endif%>" +
    " ";


function displayNodeTree(tree,stair){
    stair = stair || 0;
    var indentation = "\t".repeat(stair);
    console.log(' ');
    console.log(indentation+"***** NODE "+stair+" ******")
    console.log(indentation+tree.expression+(tree.variable ? "{{"+tree.variable+"}}" : ''));
    console.log(indentation +  (tree.content ? tree.content : ''));
    if(tree.childs)
        for(var n = 0;n<tree.childs.length;n++)
            displayNodeTree(tree.childs[n],stair + 1);
}




var nuzzle = function(){
    this.templates = [];
    this.cache = [];
    this.precompiler = new precompiler();
    this.parser = new parser();
}

nuzzle.prototype.evaluate = function(tpl){
    var stack = [];
    var matches = [];
    var termReg = /<%(\w+) *(?:{{(.?\w+)}})?%>/gi;
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
    /*...*/
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
    console.log(indentation +  (tree.content ? tree.content : ''));
    if(tree.childs)
        for(var n = 0;n<tree.childs.length;n++)
            displayNodeTree(tree.childs[n],stair + 1);
};

module.exports = nuzzle;

/*
var mustach_bis = new nuzzle();
var debut = Date.now();
var chunk_rendered = mustach_bis.render(lorem,{lorem0:lorem,lorem1:lorem,lorem2:lorem,lorem3:lorem,lorem4:lorem,lorem5:lorem},'chunk');
console.log((Date.now() - debut) + " milliseconds for rendering nodeTree");

var fs = require('fs');
fs.writeFile(__dirname+"/nodeTree.txt",JSON.stringify(chunk_rendered.nodeTree),'utf8',function(err,res){
    if(err) throw err;
    console.log('writed')
});


displayNodeTree(chunk_rendered.nodeTree);
    */