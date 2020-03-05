var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session');
const redis = require("redis");
const bluebird = require("bluebird");
bluebird.promisifyAll(redis);
const client = redis.createClient();

const dotenv = require('dotenv');
dotenv.config();

/* var logger = require('morgan'); */



var socket_io    = require( "socket.io" );


var app = express();



// Socket.io
var io           = socket_io();
app.io           = io;

var indexRouter = require('./routes/index')(io);
var usersRouter = require('./routes/users')(io);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/* app.use(logger('dev')); */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({secret: "Shh, its a secret!"}));
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
app.use('/users', usersRouter);


app.locals = {
  base_url: process.env.BASE_URL,
  socket_server_url:process.env.SOCKET_SERVER_URL
};


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;
