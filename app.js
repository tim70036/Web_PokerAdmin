
// Import
const   
    express = require('express'),
    exphbs  = require('express-handlebars'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    uuid = require('uuid/v4'),
    compression = require('compression'),
    morgan = require('morgan');


// Init
const app = express();

// Databases


// Express Setting
app.engine('handlebars', exphbs({defaultLayout: false}));
app.set('view engine', 'handlebars');
app.enable('trust proxy'); 

// Middleware
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());   
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(session({
    genid: (req) => {
      return uuid(); // use UUIDs for session IDs
    },
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

app.use(compression()); // compress all responses

app.use(morgan('dev')); // logger

// Authorization init
const auth = require('./libs/auth')
auth.init(app); // must use express-session before initializing passport

// Database init
const db = require('./libs/db');
db.init(app); // Now we can use req.db to access database connection instance

// Routes
const routes = require('./routes');
routes.init(app);

// Start App
var port = process.env.PORT || 8080;
app.listen(port);
console.log('Using http at ' + port + ' port');