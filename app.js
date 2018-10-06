
// Import
const   
    express = require('express'),
    exphbs  = require('express-handlebars'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    uuid = require('uuid/v4');


// Init
const app = express();

// Databases

// Express Setting
app.engine('handlebars', exphbs({defaultLayout: false}));
app.set('view engine', 'handlebars');

// Middleware
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());   
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(session({
    genid: (req) => {
      console.log('Inside the session middleware');
      return uuid(); // use UUIDs for session IDs
    },
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));


const auth = require('./libs/auth')
auth.init(app); // must use express-session before initializing passport


// Routes
const routes = require('./routes');
routes.init(app);

// Start App
var port = process.env.PORT || 8080;
app.listen(port);
console.log('Using http at ' + port + ' port');