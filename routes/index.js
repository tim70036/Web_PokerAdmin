// Make Express use several custom routers
// Import differnt routers
const
    homeRoute = require('./home');
    authRoute = require('./auth');

 // Make Express use these routers
function init(app) {

    // Some helper functions
    app.get('*', function (req, res, next) {
        console.log('Request was made to: ' + req.originalUrl);
        return next();
    });

    app.get('/', function (req, res) {
        res.redirect('/home');
    });

     // Make Express use these routers
    app.use('/home', homeRoute);
    app.use('/auth', authRoute);

}

module.exports = {
    init: init
};