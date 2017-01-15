

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
    "<%endfor%>"+
    "</ul>";

var balezbis =
    "<html>" +
    "<%if {{head}}%>" +
    "<head><style></style></head>" +
    "<%endif%>" +
    "<body>" +
    "<%if {{header}}%>" +
    "<header><nav><ul>" +
    "<%for {{itemmenu}}%>" +
    "<li>{{title}} " +
    "<%if {{meta}}%>" +
    "meta=\"{{meta}}\"" +
    "<%endif%>" +
    "</li>" +
    "<%for {{ol}}%>" +
    "<ol>" +
    "<%if {{jl}}%>" +
    "{{content}}" +
    "<%endif%>" +
    "</ol>" +
    "<%endfor%>" +
    "<%endfor%>" +
    "</ul></nav></header>" +
    "<%endif%>" +
    "</body></html>";

var balez =
    "<html>" +
    "<%if {{head}}%>" +
        "<head><style></style></head>" +
    "<%endif%>" +
    "<body>" +
    "<%if {{header}}%>" +
        "<header><nav><ul>" +
        "<%for {{itemmenu}}%>" +
            "<li>{{title}} " +
                "<%if {{meta}}%>" +
                    "meta=\"{{meta}}\"" +
                "<%endif%>" +
            "</li>" +
            "<%for {{ol}}%>" +
                "<ol>" +
                "<%if {{jl}}%>" +
                    "{{content}}" +
                "<%endif%>" +
                "</ol>" +
            "<%endfor%>" +
            " Mon beau palace "+
            "<%for {{jeankaka}}%>"+
                "<span>fjejfi</span>"+
            "<%endfor%>"+
        "<%endfor%>" +
        "</ul></nav></header>" +
        "<%endif%>" +
    "</body></html>";

var lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus semper velit quis lorem pulvinar, sed consequat orci pellentesque. Etiam tincidunt " +
    "<%for {{nzdz}}%>" +
        "id elit in " +
        "<%if {{ffef}}%>" +
            "fringilla. Donec" +
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
                "at" +
            "<%endfor%> " +
            "<%for {{fefefef}}%>" +
                "risus" +
            "<%endfor%> " +
    "<%endfor%>" +
    "maximus consectetur id eu lacus. Aenean tincidunt iaculis diam vitae malesuada. " +
    "<%for {{fefe2}}%>" +
        "bibendum erat " +
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
            "id eleifend vel" +
        "<%endfor%>" +
        ", rutrum nec elit." +
    "<%endif%>" +
    " Quisque ut magna sapien"


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
        type:raw[1].toLowerCase(),
        variable:raw[3],
        symbol:raw[2],
        delimiters:[raw[0]],
        indexs:[raw.index],
        childs: [],
        content: '',
        expression : '',
        result: this.content
    };
}

function getNodeTree(tpl){
    //c = current node, e = stacked element
    if(!evaluate(tpl)) return false;
    var match, c, e, stack = [], nodes = [];
    var reg = /<%(\w+) *(?:{{(\W)?(\w+)}})? *(?:(\w+) *{{(\w+)}})?%>/g;
    while(match = reg.exec(tpl)){
        c = getNodeObject(match);
        if(c.type.search('end') == -1) stack.push(c);
        else{
            e = stack.pop();
            if(e.type == c.type.replace('end','')){
                //finissage du balisage
                e.delimiters.push(c.delimiters[0]);
                e.indexs.push(c.indexs[0]+e.delimiters[1].length);
                //creation du contenu
                e.expression = tpl.substring(e.indexs[0],e.indexs[1]);
                e.content = e.expression.substring(e.delimiters[0].length,e.expression.length-e.delimiters[1].length);
                //node complete a partir d'ici
                if(stack.length) stack[stack.length-1].childs.push(e);
                else nodes.push(e);
            }
        }
    }

    var nodeTree = {
        type:'root',
        expression:tpl,
        content: tpl,
        childs: nodes,
        indexs:[0,tpl.length]
    };

    return nodeTree;
}

function getWholeNodeTree(tpl){
    var match, c, e, stack = [], nodes = [], lastpos = 0;
    nodes.push(this.getNodeObject(tpl,'root'));
    var reg = /<%(\w+) *(?:{{(\W)?(\w+)}})?%>/g;
    while(match = reg.exec(tpl)){

        c = getNodeObject(match);
        //est-ce qu'on a avancé ?
        if(c.indexs[0] > lastpos){
            //oui
            //on prend le contenu loupé
            var TextNode = {
                type:'text',
                context:{
                    variables:[]
                },
                content:tpl.substring(lastpos,c.indexs[0])
            };
            //on push dans la stack de nodes
            if(stack.length) stack[stack.length-1].childs.push(TextNode);
            else nodes.push(TextNode);

            //on fait avancer lastpos
            lastpos = c.indexs[0] + c.delimiters[0].length;
        }


        if(c.type.search('end') == -1) stack.push(c);
        else{
            e = stack.pop();
            if(e.type == c.type.replace('end','')){
                //finissage du balisage
                e.delimiters.push(c.delimiters[0]);
                e.indexs.push(c.indexs[0]+e.delimiters[1].length);
                e.exp_length = e.indexs[1] - e.indexs[0];
                //creation du contenu
                e.expression = tpl.substring(e.indexs[0],e.indexs[1]);
                e.content = e.expression.substring(e.delimiters[0].length,e.expression.length-e.delimiters[1].length);
                //node complete a partir d'ici
                if(stack.length) stack[stack.length-1].childs.push(e);
                else nodes.push(e);
            }
        }
    }

    var nodeTree = {
        type:'root',
        expression:tpl,
        content: tpl,
        childs: nodes,
        indexs:[0,tpl.length]
    };

    //this template is ready to be cached
    return nodeTree;
}

function getChildAbstractTemplate(node){
    //creer les indices de remplacements {{{i}}} pour le nouveau template
    //en partant depuis le plus haut parent vers l'enfant, modifiant le contenu
    if(!node.childs) return node;
    for(var i = 0; i < node.childs.length; i++) {
        node.content = node.content.replace(node.childs[i].expression, '{{{' + i + '}}}');
        node.childs[i] = getChildAbstractTemplate(node.childs[i]);
    }
    return node;
}

function getAbstractTemplate(nodeTree){
    return getChildAbstractTemplate(nodeTree);
}

function parse(tpl,vars){
    var nodeTree = getNodeTree(tpl);
    var tplToParse = getAbstractTemplate(nodeTree);
    var finalTpl = injectVariable(nodeTree,tplToParse);
    render(finalTpl,vars);
}

function parseExpression(nodeObj,vars){
    switch(nodeObj.type){
        case 'if':
            if(nodeObj.symbol){
                switch(nodeObj.symbol){
                    case '!':
                        return vars[nodeObj.variable] ? '' : nodeObj.content;
                        break;
                }
            }
            return vars[nodeObj.variable] ? '' : nodeObj.content;
            break;
        case 'for':
            if(typeof vars[nodeObj.variable] == "object"){
                for(var i = 0; i < vars[nodeObj.variable].length; i++){
                    if(typeof vars[nodeObj.variable][i] == "object"){
                        nodeObj.result = replace(nodeObj.result,vars[nodeObj.variable])
                    }
                    else
                }
            }
            else if(parseInt(vars[nodeObj.variable]) != NaN){
                for(var i = 0; i < parseInt(vars[nodeObj.variable]); i++){

                }
            }
            break;
    }
}

function renderNodeContent(node,vars){
    if(!node.childs){
        return parseExpression(node);
    }
    else{
        for(var i = 0; i < node.childs.length; i++){
            node.childs[i].result = renderNodeContent(node.childs[i],vars);
        }
    }
}

function render(absTpl,node){


}



function replaceNodes(tpl,vars){

    tpl = tpl.replace(/{{{(\d)+}}}/g,function(){
        var v = vars,
            t = arguments[1].split('.');
        for(var i =0; i<t.length; i++)
            v = v[t[i]];
        return v;
    });

    return tpl;
}

function replace(tpl,vars){

    tpl = tpl.replace(/{{(\d)+}}/g,function(){
        var v = vars,
            t = arguments[1].split('.');
        for(var i =0; i<t.length; i++)
            v = v[t[i]];
        return v;
    });

    return tpl;
}

displayNodeTree(getAbstractTemplate(lorem),0);


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

