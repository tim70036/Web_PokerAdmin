// Configure passport for express
const
    passport = require('passport'), 
    passportLocalStrategy = require('passport-local').Strategy,
    credentials = require('../configs/credentials');

function init(app) {

    // Mapping user between session store <-> server <-> req.user
    // Particulary, serialized user in session <-> user instance req.user
    // http://toon.io/understanding-passportjs-authentication-flow/
    // Since we are using Redis, we choose to store the whole user object in redis
    // Thus no serialize and deserialize
    passport.serializeUser(function(user, done){ 
        // Serialize user instance to store in session storage, used for checking authentication for each request later
        done(null,user);
    });
    passport.deserializeUser(function(serializedUser, done){ 
        // deSerialize user instance, so passport can put it in req.user (after authentication of each request)
        done(null,serializedUser);
    });

    // Config each strategy
    configLocalStrategy();

    // Initialize Passport and restore authentication state, if any, from the session.
    app.use(passport.initialize());
    app.use(passport.session());
}

// Set up local strategy
function configLocalStrategy() {
    passport.use(new passportLocalStrategy(
        // Set the field we want to process in the form
        {
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true // Let callback receive req
        },

        // Callback function, perform authorization
        function(req, username, password, done) {

            // Encrypt password

            // Prepare query
            let sqlString = "SELECT id, account, name, email, role, roleId FROM UserAccount WHERE account=? AND password=?";
            let values = [username, password];
            sqlString = req.db.format(sqlString, values);

            // Search user in database
            req.db.query(sqlString, function(error, results, fields){
                // error will be an Error if one occurred during the query
                // results will contain the results of the query
                // fields will contain information about the returned results fields (if any)
                if(error) { 
                    return done(err); 
                }                
                // Not found user
                else if (results.length <= 0) {
                    return done(null, false);
                    
                }

                // Arrive here only if user found
                console.log(results[0]);
                return done(null, results[0]); // result[0] is the user instance in db
            });
        }
      ));
}

// Set up cognito strategy
// function configCognitoStrategy(){
//     passport.use(new passportCognitoStrategy({
//         userPoolId: credentials.authProviders.cognito.userPoolId,
//         clientId: credentials.authProviders.cognito.clientId,
//         region: credentials.authProviders.cognito.region
//         }, function(accessToken, idToken, refreshToken, profile, done) {

//             console.log("We get aws user profile ");
//             console.log(profile);
//             return done(null, profile.sub);
//         }
//     )); 
// }

module.exports = {
    init : init
}