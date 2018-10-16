const   
    redis = require("redis"),
    session = require('express-session'),
    uuid = require('uuid/v4'),
    redisStore = require('connect-redis')(session),
    credentials = require('../configs/credentials');
    




function init(app){

    // Connect to redis
    let client = redis.createClient({
        host     : credentials.redisProviders.host,
        port     : credentials.redisProviders.port,
    });

    // Set logging function
    client.on('connect', function() {
        console.log('Redis client connected');
    });

    client.on("error", function (err) {
        console.log("Redis error : " + err);
    });

    // Set connection instance to req.redis
    // Then we can use req.redis to access redis connection instance in express
    app.use(function(req,res,next){
        req.redis = client;
        next();
    });


    // Config express to use express-session based on redis store
    let sessionStore = new redisStore({ client : client });
    app.use(session({
        store: sessionStore, // use redis store
        secret: credentials.sessionProviders.key, // key for encrypting signed cookie
        resave: false,
        saveUninitialized: true,
        genid: (req) => {
            return uuid(); // use UUIDs for session IDs
          }
    }));


}



module.exports = {
    init : init
}