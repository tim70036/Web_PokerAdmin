
// Import hadnlers from each sub module
const 
    personnelHandlers = require('./personnel'),
    creditHandlers = require('./credit'),
    gameHandlers = require('./game'),
    accountHandlers = require('./account');

// Handler for home page
let indexHandler = function(req,res) {
    res.render('home/index', {layout : 'home'});
}

// Handler for login page
let loginHandler = function(req, res) {
    res.render('home/login', {layout : false});
}

// Handler for authorization
let authorizeHandler = function(req, res, next){

    // User not login, just redirect
    if(!req.isAuthenticated()) {
        console.log('not authorized');
        res.redirect(303, '/home/login');
        return;
    }

    // User has logined
    // Add user session data to res.locals for handlebars templating
    res.locals.user = req.user;
    res.locals.user = {...req.user}; // must use spread operator... to make a copy, otherwise req.user will be changed

    // Translate role to Chinese
    let roleMapping = {
        'member' : '會員',
        'agent' : '代理',
        'head-agent' : '總代理',
        'service-agent' : '客服',
        'admin' : '管理員',
    }
    res.locals.user.role = roleMapping[res.locals.user.role];
    return next();
}



module.exports = {
    index : indexHandler,
    login : loginHandler,
    authorize : authorizeHandler,

    personnel : personnelHandlers,
    credit : creditHandlers,
    game : gameHandlers,
    account : accountHandlers,
    
};

// ----------------------------------------------------- //