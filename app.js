var createError = require('http-errors');
var express = require('express');
const session = require('express-session');
const store = new session.MemoryStore()
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv/config')
const mongoose = require('mongoose');
const passport = require('passport')
const local = require('./services/passport-config')
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cron = require('node-cron')
var UserCount = require('./models/signupCount')
var counters = require('redis-counter').createCounters({ redisUrl: process.env.REDIS_URL });

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// CRON schduler to be schduled at every night at 11:59pm
var task = cron.schedule("59 23 * * *", function () {
  counters('requests').get(function (err, val) {
    const userCount = new UserCount({
      'count': val,
      'date': new Date.now()
    });
    userCount.save().then(data => {
      console.log(data)
    }).catch(err => {
      console.log(err)
    })
  });
  console.log("cron ran")
}, { scheduled: true, });

app.init = function init() {
  //task.start(); ---> uncomment this to start cron scheduler
}


// implementation of socket.io
io.on('connection', function (socket) {
  console.log('A user connected');

  //Whenever someone disconnects this piece of code executed
  socket.on('disconnect', function () {
    console.log('A user disconnected');
  });
});



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
mongoDb = mongoose.connect(
  process.env.MONGO_CONNECTION_URI,
  { useNewUrlParser: true }, () => {
    console.log('connected to mongoDb')
  });

app.use(session({
  secret: process.env.SECRET_KEY,
  cookie: { maxAge: 60000 },
  saveUninitialized: false,
  resave: false,
  store
})
)

app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  task.start();
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
