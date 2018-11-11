// Handler for authorization
let isLoginHandler = function(req, res, next){

    // User not login, just redirect
    if(!req.isAuthenticated()) {
        console.log('not authorized');
        return res.redirect(303, '/home/login');
    }

    // User has logined
    // Add user session data to res.locals for handlebars templating
    res.locals.user = {...req.user}; // must use spread operator... to make a copy, otherwise req.user will be changed

    // Translate role to Chinese
    let roleMapping = {
        'member' : '會員',
        'agent' : '代理',
        'head-agent' : '總代理',
        'service-agent' : '客服',
        'admin' : '管理員',
    };
    res.locals.user.roleName = roleMapping[res.locals.user.role];

    // Set user role for rendering
    if(req.user.role === 'member')              res.locals.user.isMember = true;
    else if(req.user.role === 'agent')          res.locals.user.isAgent = true;
    else if(req.user.role === 'headAgent')      res.locals.user.isHeadAgent = true;
    else if(req.user.role === 'serviceAgent')   res.locals.user.isServiceAgent = true;
    else if(req.user.role === 'admin')          res.locals.user.isAdmin = true;

    return next();
};

// Generate a handler to authorize based on given input
let allowRole = function(...validRoles){
    return function(req, res, next){
        for(let i=0 ; i<validRoles.length ; i++){
            if(req.user.role === validRoles[i])
                return next(); // return if we find this user is allowed
        }

        // Not valid role
        console.log(`${req.user.role} is not allowed`);
        return res.redirect(303, '/');
    };
};

module.exports = {
    isLogin : isLoginHandler,
    allowRole : allowRole,
};