const 
    credentials = require('../../configs/credentials');

let miscHandler = function(req,res){
    res.render('home/account/misc', {layout : 'home'});
}

let gameHandler = function(req,res){
    res.render('home/account/game', {layout : 'home'});
}

let clubHandler = function(req,res){
    res.render('home/account/club', {layout : 'home'});
}


module.exports = {
    misc : miscHandler,
    game : gameHandler,
    club : clubHandler
};