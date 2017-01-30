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
    var self = this;
    this._tpl = this._tpl.replace(/{{>(\w+)}}/g, function (fullmatch,match){
        var v = self._vars,
            t = match.split('.');
        for(var i =0; i<t.length; i++)
            v = v[t[i]];
        return v == undefined ? fs.readFileSync('templates/'+match+'.chino') : v;
    });
};


module.exports = precompiler;