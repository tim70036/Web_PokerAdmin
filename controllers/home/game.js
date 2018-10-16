const 
    credentials = require('../../configs/credentials');

let verifyHandler = function(req,res){
    res.render('home/game/verify', {layout : 'home'});
}   

let presentGamesHandler = function(req,res){
    res.render('home/game/present-games', {layout : 'home'});
}

let historyHandler = function(req,res){
    res.render('home/game/history', {layout : 'home'});
}

let importHandler = function(req,res){
    res.render('home/game/import', {layout : 'home'});
}

module.exports = {
    verify : verifyHandler,
    presentGames : presentGamesHandler,
    history : historyHandler,
    import : importHandler
};