// Handlers for authentication
const
    passport = require('passport');

let cognitoHandler = passport.authenticate('cognito',  {
    successRedirect:'/',
    failureRedirect:'/home/login'
});

module.exports = {
    cognito : cognitoHandler
}
