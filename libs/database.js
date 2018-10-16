// Configure database for express
const
    mysql = require('mysql'),
    credentials = require('../configs/credentials');


function init(app) {

    // Connect to database
    let client = mysql.createConnection({
        host     : credentials.dbProviders.host,
        user     : credentials.dbProviders.user,
        password : credentials.dbProviders.pwd,
        database : credentials.dbProviders.db,
    });

    // Set connection instance to req.db
    // Then we can use req.db to access database connection instance in express
    app.use(function(req,res,next){
        req.db = client;
        next();
    });
}



module.exports = {
    init : init
}