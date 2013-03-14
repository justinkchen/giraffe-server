/* Express server */
var express = require('express');
var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , bcrypt = require('bcrypt');

app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());

var PORT_NO = 3000;

/* Database */
/* Connect to MySQL */
var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'jayborenstein',
    database : 'giraffe'
});
 
passport.use(new LocalStrategy(
    function(username, password, cb) {
	connection.query('SELECT * FROM users WHERE email=? LIMIT 1',[req.body.email], function(err, results) {
	    user = null;
	    if (err) {
		return cb(err);
	    }
	    if (!results) {
		return done(null, false, { message: 'Incorrect username or password.' });
	    } else {
		user = results[0]
	    }
	    if (!bcrypt.compareSync(password, user.password_hash)) {
		return done(null, false, { message: 'Incorrect username or password.' });
	    }
	    delete user.password_hash
	    delete user.salt
	    return done(null, user);
	});
    }
));

// listen for incoming connections from client
io.sockets.on('connection', function (socket) {
 
  // start sending out coords
  connection.query('SELECT * FROM posts;', function(err, results) {
      socket.emit('load:coords', results.reverse());
  });

});

app.get('/', function(req, res) {
  connection.query('SELECT * FROM posts;', function(err, results) {
    res.send(results.reverse());
  });
});


app.get('/hello', function(req, res) {
    res.send('Hello World');
});

app.post('/addgraffiti', function(req, res) {
    if(req.body.message){
        connection.query('INSERT INTO posts (message, latitude, longitude, radius, user_id) values (?,?,?,?,?);',[req.body.message, req.body.latitude, req.body.longitude, req.body.radius, req.body.userid], function(err, results) {
            res.send(results);
        });
    }else{
        res.send("No POST data read");
    }
});

app.post('/demoresponse', function(req, res) {
    if(req.body.message){
        connection.query('INSERT INTO posts (message, latitude, longitude, radius, user_id) values (?,?,?,?,?);',[req.body.message, req.body.latitude, req.body.longitude, req.body.radius, req.body.userid], function(err, results) {
            res.redirect("/demolist.html");
        });
    }
});

app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
	if (err) {
	    return next(err);
	}
	if (!user) {
	    // print info.message
	    return res.redirect('/login');
	}
	req.logIn(user, function(err) {
	    if (err) {
		return next(err);
	    }
	    return res.redirect('/users/' + user.username);
	});
    })(req, res, next);
});

app.post('/signup', function(req, res) {
    if(req.body){
	connection.query('INSERT INTO users (username, email, password_hash) VALUES (?,?,?);', [req.body.username, req.body.email, bcrypt.hashSync(req.body.password, saltRounds)], function(err, results) {
	    // TODO: log user in
	    res.send(results);
	});
    } else {
	// TODO: proper response
        res.send("No POST data read");
    }
});

server.listen(PORT_NO);
console.log('Listening on port ' + PORT_NO);
