var tpl = {
    chunk : '<%for {{e}}%>'+
        '<div class="jeanlouis">'+
        '<%if {{greet}}%>'+
        '{{>greet}}'+
        '<%endif%>'+
        '</div>'+
        '<%endfor%>',
    iftpl : "<div> hello {{user.name}}" +
    "<%if {{user.marks}}%>" +
    "<li>{{:mark}} - {{user.display}}</li>" +
    "<%endif%>" +
    "</div>",
    oiftpl : {
        user:{
            name:'Jean',
            mark:'18/20',
            marks:{
                comment:'nul !'
            },
            display:'Family Name'
        }
    },
    basictpl:'Error {{class}} n°{{code}} : {{message}}',
    obasictpl:{
        class:4,
        code:4587,
        message:'access denied'
    },
    subtpl : '<div class="greeting"><%for {{e}}%>Greet {{name}} !<%endfor%></div>',
    lorem : "Lorem {{>lorem1}} ipsum dolor {{>lorem2}} sit amet, consectetur adipiscing elit. Phasellus semper velit quis lorem pulvinar, sed consequat orci pellentesque. Etiam tincidunt " +
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
    " "
}

module.exports = tpl;