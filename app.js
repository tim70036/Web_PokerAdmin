
// Import
const   
    express = require('express'),
    exphbs  = require('express-handlebars'),
    exphbsSections = require('express-handlebars-sections'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    compression = require('compression'),
    morgan = require('morgan');


// Init
const app = express();

// Databases


// Express Setting
app.engine('handlebars', exphbs({
    defaultLayout: false,
    helpers : {
        section: function (name, options) { // helper used to manage sections in handlebar templates
            var helper = this;
            if (!this._sections) {
                this._sections = {};
                this._sections._get = function(arg){
                    if(typeof helper._sections[arg] === 'undefined'){
                        throw new Error('The section "' + arg + '" is required.')
                    }
                    return helper._sections[arg];
                }
            }
            if(!this._sections[name]){
                this._sections[name] = options.fn(this);
            }
            return null;
        }
    }
}));
app.set('view engine', 'handlebars');
app.enable('trust proxy'); 

// Static content middleware
app.use('/home', express.static(__dirname + '/public/home')); // for static content request start like '/home', use static file in public/home

// Other Middleware
app.use(cookieParser());   
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(compression()); // compress all responses
app.use(morgan('dev')); // logger

// Session & Redis init
const session = require('./libs/session');
session.init(app); // Now session based on redis is set, and we can use req.redis to access connection instance to redis server

// Authorization init
const auth = require('./libs/auth')
auth.init(app); // must set up express-session before initializing passport

// Database init
const db = require('./libs/database');
db.init(app); // Now we can use req.db to access database connection instance

// Routes
const routes = require('./routes');
routes.init(app);

// Start App
var port = process.env.PORT || 8080;
app.listen(port);
console.log('Using http at ' + port + ' port');