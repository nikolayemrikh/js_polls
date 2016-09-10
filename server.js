var port = process.env.PORT || 3000;
var host = process.env.HOST || '0.0.0.0';
var conf = process.env.CONFIG || './config.json';

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var qs = require('qs');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var passport = require('passport');
var config = require('nconf').file(conf);
var logger = require('./common/logger');
var db = require('./db');
var MongoStore = require('connect-mongo')(session);
var mongoStore = new MongoStore({
  mongooseConnection: db.mongoose.connection,
  ttl: config.get("cookie:ttl") * 24 * 60 * 60 // days
});
var app = express();
var server;
if (config.get('ssl')) {
  var fs = require('fs');
  var options = {
    key: fs.readFileSync(config.get('ssl:key')),
    cert: fs.readFileSync(config.get('ssl:cert'))
  };
  server = require('https').Server(options, app);
}
else {
  server = require('http').Server(app);
}
var io = require('./common/socket')(server);
var passportSocketIo = require("passport.socketio");
app.enable('trust proxy');
app.set('query parser', function(str) {
  return qs.parse(str, {
    allowPrototypes: true,
    strictNullHandling: true
  });
});
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon(path.join(__dirname, 'public/images/favicon.png')));
app.use(morgan("short", {
  "stream": logger.stream
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(session({
  name: 'js_polls',
  secret: config.get("cookie:secret"),
  store: mongoStore,
  proxy: true,
  resave: true,
  saveUninitialized: true,
  cookie: {
    session: false,
    maxAge: config.get("cookie:ttl") * 24 * 60 * 60 * 1000 // days
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
// socket.io authorization
io.use(passportSocketIo.authorize({
  passport: passport,
  cookieParser: cookieParser,
  key: 'proctor',
  secret: config.get("cookie:secret"),
  store: mongoStore,
  success: function(data, accept) {
    accept();
  },
  fail: function(data, message, error, accept) {
    if (error) accept(new Error(message));
  }
}));
// routing
require('./routes')(app);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.format = 'html';
  res.status(404);
  next(err);
});
// development error handler
// will print stacktrace
db.mongoose.set('debug', logger.db);
app.use(function(err, req, res, next) {
  if (res.statusCode === 200) res.status(500);
  if (err.format === 'html') res.render('error', {
    name: err.name,
    message: err.message,
    status: res.statusCode,
    error: err
  });
  else res.json({
    name: err.name,
    message: err.message,
    errors: Object.keys(err.errors || {}).reduce(function(obj, key) {
      obj[key] = {
        name: err.errors[key].name,
        message: err.errors[key].message
      };
      return obj;
    }, {})
  });
});
server.listen(port, host, function() {
  logger.info('Server listening on port ' + server.address().port);
});
