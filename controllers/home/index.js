
// Import hadnlers from each sub module
const 
    personnelHandlers = require('./personnel'),
    creditHandlers = require('./credit'),
    gameHandlers = require('./game'),
    accountHandlers = require('./account'),
    authHandlers = require('./auth');

// Handler for home page
let indexHandler = function(req,res) {
    res.render('home/index', {layout : 'home'});
};

// Handler for login page
let loginHandler = function(req, res) {
    res.render('home/login', {layout : false});
};





module.exports = {
    index : indexHandler,
    login : loginHandler,
    auth : authHandlers,

    personnel : personnelHandlers,
    credit : creditHandlers,
    game : gameHandlers,
    account : accountHandlers,
};

// ----------------------------------------------------- //