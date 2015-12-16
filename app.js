var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var config = require('./config');

var routes = require('./routes/index');
var parkings = require('./routes/parkings');
var users = require('./routes/users');
var User = require('./models/users').User;
var UserSchema = require('./models/users').UserSchema;
var reservations = require('./routes/reservations');
var token = require('./routes/token');



var jwt = require('./routes/jwtauth');

var app = express();

var conf = null;

if (app.get('env') === 'dev') {
    conf = config.dev;
}
else{
    conf = config.production;
}
//require('./models/db')
//connect to DB
///...

var db = require('./models/db');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.set('jwtTokenSecret', 'YOUR_SECRET_STRING');


// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// passport-local-mongoose initialization
passport.use(new LocalStrategy(User.authenticate()));




app.use('/', routes);
app.use('/parkings', [jwt], parkings); //parkings and lots
app.use('/users', [jwt], users); //users and cars
app.use('/reservations', [jwt], reservations); //users and cars
app.use('/token', token); //users and cars

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
