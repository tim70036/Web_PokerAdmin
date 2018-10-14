// Handlers for authentication
const
    passport = require('passport');


let loginHandler = function(req,res, next) {

    // Use custom callback to send resposne to ajax request, since passport can't deal with ajax form by default
    passport.authenticate('local', function(err, user, info){
        // errCode 
        // 0 : auth success
        // 1 : auth failed
        // 2 : server error

        // Error occured
        if (err) { 
            return res.status(200).json({errCode : 2});
        }

        // Authentication failed
        if (!user) {
            return res.status(200).json({errCode : 1});
        }

        // Authentication success, make passport logIn manually
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.status(200).json({errCode : 0});
        });

    })(req, res, next); // pass req, res, next into passport
}


let logoutHandler = function(req,res){
    // Using only req.logout is not sufficient
    req.session.destroy((err) => {
        if(err) return next(err);
        req.logout();
        res.redirect(303, '/');
    });
}

module.exports = {
    login : loginHandler,
    logout : logoutHandler
}
