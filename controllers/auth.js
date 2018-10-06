// Handlers for authentication
const
    passport = require('passport');

let cognitoHandler = passport.authenticate('cognito',  {
    successRedirect:'/',
    failureRedirect:'/home/login'
});

let logoutHandler = function(req,res){
    // Using only req.logout is not sufficient
    req.session.destroy((err) => {
        if(err) return next(err);
        req.logout();
        res.redirect(303, '/');
    });
}

module.exports = {
    cognito : cognitoHandler,
    logout : logoutHandler
}
