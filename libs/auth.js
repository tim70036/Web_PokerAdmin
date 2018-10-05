const
    passport = require('passport'), 
    passportCognitoStrategy = require('passport-cognito'),
    credentials = require('../configs/credentials');


function init(app) {

    // Mapping user between client <-> server <-> database
    // Particulary, userid in session <-> user instance in database
    passport.serializeUser(function(user, done){ 
        // Map user instance to id
        done(null,user);
    });

    passport.deserializeUser(function(id, done){ 
        done(null,id);
    });

    configCognitoStrategy();

    // Initialize Passport and restore authentication state, if any, from the session.
    app.use(passport.initialize());
    app.use(passport.session());
}

function configCognitoStrategy(){
    passport.use(new passportCognitoStrategy({
        userPoolId: credentials.authProviders.cognito.userPoolId,
        clientId: credentials.authProviders.cognito.clientId,
        region: credentials.authProviders.cognito.region
        }, function(accessToken, idToken, refreshToken, profile, done) {

            console.log("We get aws user profile ");
            console.log(profile);
            return done(null, profile.sub);
        }
    )); 
}

module.exports = {
    init : init
}