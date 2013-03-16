/* Express server */
var express = require('express');
var app = express();
var http = require('http');
var https = require('https');
var fs = require('fs');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
var crypto = require('crypto');

app.configure(function() {
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser());
    app.set('views',__dirname + '/views');
    app.set('view engine','jade');

});

/* Port numbers */
var HTTP_PORT_NO = 3000; // cannot use 80
var HTTPS_PORT_NO = 8000; // cannot use 443

/* HTTPS options */
var options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};


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


console.log('Listening to HTTP on port ' + HTTP_PORT_NO);
server.listen(HTTP_PORT_NO);
console.log('Listening to HTTPS on port ' + HTTPS_PORT_NO);
https.createServer(options, app).listen(HTTPS_PORT_NO)



app.get('/home', function(req, res) {
    connection.query('SELECT * FROM posts;', function(err, results) {
        //res.send(results.reverse());
        //test post for local machine
        var posts = {'posts' : results.reverse()}
        res.render('index',posts); 
    });
  
});



https.createserver(options, app).listen(https_port_no)

