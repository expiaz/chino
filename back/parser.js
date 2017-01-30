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


module.exports = parser;