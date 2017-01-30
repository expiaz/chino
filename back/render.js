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

module.exports = renderEngine;