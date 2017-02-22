var fs = require('fs');

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
    var reg = /{{>(\w+)}}/,
        match = [];

    while(match = reg.exec(this._tpl)){
        var v = this._vars,
            t = match[1].split('.');
        for(var i =0; i<t.length; i++)
            v = v[t[i]];
        this._tpl.replace(match[0],v == undefined ? fs.readFileSync('templates/'+match+'.chino') : v);
    }
};

module.exports = precompiler;