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

module.exports = contextCalcultator;