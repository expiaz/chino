
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
    
module.exports = Dictionnary;