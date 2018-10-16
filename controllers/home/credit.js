const 
    credentials = require('../../configs/credentials');

let transferHandler = function(req,res){
    res.render('home/credit/transfer', {layout : 'home'});
}

let historyHandler = function(req,res){
    res.render('home/credit/history', {layout : 'home'});
}


module.exports = {
    transfer : transferHandler,
    history : historyHandler
};