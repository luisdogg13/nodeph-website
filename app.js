var express = require('express')
  , routes = require('./routes/index')
  , events = require('./routes/events')
  , tweets = require('./routes/twitter')
  , geeks = require('./routes/geeklist');

var app = module.exports = express.createServer()
  , io = require('socket.io').listen(app);

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.get('/', routes.index);

app.get('/events/:year/:month', events.index);
app.get('/geeks', geeks.all);
app.get('/nextgeek/not/{currentgeek}', geeks.next);
app.get('/tweets', tweets.all);
app.get('/nexttweet/not/{currenttweet}', tweets.next);

app.listen(3000, function() {
  console.log('server started on port 3000');
});