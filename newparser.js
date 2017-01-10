var parser = function(){};

/**
 * @function parse
 * return content of next expression to parse
 * @param tpl
 */
parser.prototype.getNode = function(tpl){

}


var chunk = '<%for {{e}}%>'+
    '<div class="jeanlouis">'+
    '<%if {{name}}%>'+
    '<p>hi {{name}}</p>'+
    '<%endif%>'+
    '</div>'+
    '<%endfor%>';

var maphrase = 	"Bonjour jeune chevalier {{name}} "+
    "Bienvenue dans la quete du {{boss}} \n" +
    "Pour triompher tu devras faire \n" +
    "<ul>"+
    "<%for {{epreuves}}%>" +
    "<%if {{difficulte}}%>"+
    "<li>- {{name}}</li>"+
    "<%endif%>"+
    "<%endfor%>";

var balez = "<html><%if {{head}}%><head><style></style></head><%endif%><body><%if {{header}}%><header><nav><ul><%for {{itemmenu}}%><li>{{title}} <%if {{meta}}%>meta=\"{{meta}}\"<%endif%></li><%for {{ol}}%><ol><%if {{jl}}%>{{content}}<%endif%></ol><%endfor%><%endfor%></ul></nav></header><%endif%></body></html>";
/*

var stack = [];

function parse(tpl){
    var match = chunk.match(/<%(\w+) ?(?:{{(\w+)}})?%>/g);
    console.log(match);
    console.log(match[1].search('end'))
    if(match[1].search('end') == -1){
        stack.push({exp:match[1],index:match.index});
        console.log(stack);
    }
    else{
        var e = stack.pop();
        if(e.exp == match[1].replace('end','')){
            console.log(tpl);
            console.log(tpl.substring(e.index,match.index));
        }
    }

}


function evaluate(tpl){
    var stack = [];
    var matches = [];
    var termReg = /<%(\w+) *(?:{{(.?\w+)}})?%>/gi;
    while (matches = termReg.exec(tpl)) {
        stack.length?(matches[1].match(/end/i)?(stack[stack.length-1]==matches[1].replace('end','')?stack.pop():null):stack.push(matches[1])):stack.push(matches[1]);
    }
    return stack.length == 0;
}

function getExpNode(tpl){
    if(!evaluate(tpl)) return false;
    var match;
    var reg = /<%(\w+) *(?:{{(\W)?(\w+)}})?%>/g;
    var stack = [];
    var nodes = [];
    while(match = reg.exec(tpl)){
        var current = getNodeObject(match);
        if(current.exp.search('end') == -1){
            stack.push(current);
        }
        else{
            var e = stack.pop();
            if(e.exp == current.exp.replace('end','')){
                nodes.push(tpl.substring(e.index,match.index).replace(e.delimiter,'').replace(current.delimiter,''));
            }
        }
    }

    return nodes.length ? getExpNode(nodes.pop()) : tpl;

}


function getNodeObject(raw){
    return {
        type:raw[1].toLowerCase(),
        delimiter:raw[0],
        index:raw.index,
        childs: []
    };
}

console.log(getExpNode(maphrase));

*/

function evaluate(tpl){
    var stack = [];
    var matches = [];
    var termReg = /<%(\w+) *(?:{{(.?\w+)}})?%>/gi;
    while (matches = termReg.exec(tpl)) {
        stack.length?(matches[1].match(/end/i)?(stack[stack.length-1]==matches[1].replace('end','')?stack.pop():null):stack.push(matches[1])):stack.push(matches[1]);
    }
    return stack.length == 0;
}

function getNodeObject(raw){
    return {
        expression : '',
        type:raw[1].toLowerCase(),
        variable:raw[3],
        symbol:raw[2],
        delimiter:raw[0],
        index:raw.index,
        childs: [],
        content: ''
    };
}

function stacking(tpl){
    //c = current node, e = stacked element
    if(!evaluate(tpl)) return false;
    var match, c, e, stack = [], nodes = [];
    var reg = /<%(\w+) *(?:{{(\W)?(\w+)}})?%>/g;
    while(match = reg.exec(tpl)){
        c = getNodeObject(match);
        if(c.type.search('end') == -1) stack.push(c);
        else{
            e = stack.pop();
            if(e.type == c.type.replace('end','')){
                e.expression = tpl.substring(e.index,c.index+c.delimiter.length);
                e.content = e.expression.replace(e.delimiter,'').replace(c.delimiter,'');

                for(var i=0;i<e.childs.length;i++){
                    console.log(e.content+' = replace('+e.childs[i].expression+',{{'+i+'}});');
                    e.content = e.content.replace(e.childs[i].expression,'{{'+i+'}}');
                }

                if(stack.length) stack[stack.length-1].childs.push(e);
                else nodes.push(e);
            }
        }
    }

    return nodes;
}

var v = stacking(balez);
console.log(v);

for(var i = 0; i < v.length; i++){
    displayNodeTree(v[i],0)
}

function displayNodeTree(tree,stair){
    var indentation = "\t".repeat(stair);
    console.log(' ');
    console.log(indentation+"***** NODE "+stair+" ******")
    console.log(indentation+tree.type+" {{"+tree.variable+"}}")
    console.log(indentation+tree.content)
    if(tree.childs)
        for(var n = 0;n<tree.childs.length;n++)
            displayNodeTree(tree.childs[n],stair + 1);
}

