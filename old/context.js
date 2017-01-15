Array.prototype.get = function(){
    return this[this.length-1];
}

var expressionEvaluator = function(ctxC){
    this.contextCalcultator = ctxC;
};

expressionEvaluator.prototype.evaluate = function(exp){
    switch(exp){
        case 'if':
            return this.evaluateIf(exp);
            break;
        case 'for':
            return this.evaluateFor(exp);
            break;
    }
}

expressionEvaluator.prototype.evaluateIf = function(){}

expressionEvaluator.prototype.evaluateFor = function(){}

var contextCalcultator = function(vars,nodeTree){
    this._stack = [vars];
    this._context = vars;
    this._vars = vars;
    this._nodeTree = nodeTree;
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
        node.content = this.replace(node.content);
        return node;
    }
    else if(node.type == 'NODE'){
        if(!node.childs) return;
        var curr_node = this._nodeTree.childs[i];
        if(node.expression == 'if'){
            if(node.symbol){
                switch(node.symbol){
                    case '!':
                        node.variable = !this.getContext(curr_node.variable);
                        break;
                    case ':':
                        node.variable = this.getContext(curr_node.variable,1,true);
                        break;
                }
            }
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



    for(var i =0; i < node.childs.length; i++){
        var curr_node = this._nodeTree.childs[i];
        if(curr_node.expression == 'if'){
            if(curr_node.symbol){
                switch(curr_node.symbol){
                    case '!':
                        curr_node.variable = !this.getContext(curr_node.variable);
                        break;
                    case ':':
                        curr_node.variable = this.getContext(curr_node.variable,1,true);
                        break;
                }
            }
            if(curr_node.variable){
                if(typeof curr_node.variable == "object" && !Array.isArray(curr_node.variable)){
                    this._stack.push(curr_node.variable);
                    curr_node.context = curr_node.variable;
                }
                curr_node.rendered = true;
            }
            else{
                curr_node.rendered = false;
                curr_node.context = this._context;
            }
        }

    }
};

contextCalcultator.prototype.replace = function (tpl) {
    tpl = tpl.replace(/{{(\w)+}}/g,replace_match.bind(this));
    function replace_match(fullmatch,match){
        var ctx = this.getContext(match);
        return ctx !== undefined ? ctx : '';
    }
};

var o = {
    user:{
        infos:{
            user:{
                infos:'45'
            }
        }
    }
};
var ctx = new contextCalcultator(o,null);
ctx._stack.push({ infos: '45' });
var n = ctx.getContext('user.infos');
console.log(n);