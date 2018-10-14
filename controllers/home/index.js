// Handlers for home page
const 
    credentials = require('../../configs/credentials');
    

// Import hadnlers from each sub module
let 
    personnelHandler = require('./personnel'),
    creditHandler = require('./credit'),
    gameHandler = require('./game'),
    accountHandler = require('./account');

let indexHandler = function(req,res) {
    res.render('home/index', {layout : 'home'});
}
    
let authorizeHandler = function(req, res, next){

    // User not login, just redirect
    if(!req.isAuthenticated()) {
        console.log('not authorized');
        res.redirect(303, '/home/login');
        return;
    }

    // User has logined, moving forward
    return next();
}

let cmsHandler = function(req, res, next) {
    // check connection?

}

let loginHandler = function(req, res) {
    res.render('home/login', {layout : false});
}

module.exports = {
    index : indexHandler,
    personnel : personnelHandler,
    credit : creditHandler,
    game : gameHandler,
    account : accountHandler,
    login : loginHandler,
    authorize : authorizeHandler,
    cms : cmsHandler,

};


// ----------------------------------------------------- //