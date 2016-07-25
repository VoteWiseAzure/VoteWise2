// =======================
// Import Packages========
// =======================

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var config = require('./config'); // get config file
var expressValidator = require('express-validator');
var cors = require('cors');

// =======================
// Import Controllers=====
// =======================

var mailer = require('./app/middleware/mailer');
var Controllers = require('./app/controllers/api/index');

// =======================
// configuration =========
// =======================

var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
console.log(config.database)
mongoose.connect(config.database); // connect to database

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log("Connected to MongoDB at "+ config.database);
});

app.set('superSecret', config.secret); // secret variable

// ======================================
// Allows cross origin requests =========
// ======================================
app.use(cors());
//app.use(express.static(__dirname + '/public'));


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// =======================
// Home page =============
// =======================

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(expressValidator());

// use morgan to log requests to the console
app.use(morgan('dev'));

// API ROUTES -------------------

Controllers( app );
mailer.apply( app );


// =======================
// start the server ======
// =======================
//app.use('/resources',express.static(__dirname + '/public'));
app.use('/resources',express.static(__dirname + '/app/uploads'));
app.listen(port);
console.log('Magic happens at http://localhost:' + port);
