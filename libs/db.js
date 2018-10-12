const
    mysql = require('mysql'),
    credentials = require('../configs/credentials');


function init(app) {

    // Connect to database
    let connection = mysql.createConnection({
        host     : credentials.dbProviders.host,
        user     : credentials.dbProviders.user,
        password : credentials.dbProviders.pwd,
        database : credentials.dbProviders.db,
    });

    // Set connection instance to req.db 
    app.use(function(req,res,next){
        req.db = connection;
        next();
    });
}



module.exports = {
    init : init
}