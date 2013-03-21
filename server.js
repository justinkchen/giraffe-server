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

    app.use(passport.initialize());
    app.use(passport.session());
});

/* Port numbers */
var HTTP_PORT_NO = 3000; // cannot use 80
var HTTPS_PORT_NO = 8000; // cannot use 443

/* HTTPS options */
var options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

/* bcrypt constants */
var SALT_ROUNDS = 10;

/* Database */
/* Connect to MySQL */
var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'jayborenstein',
    database : 'giraffe'
});
 
passport.use(new LocalStrategy({
        usernameField: 'usernameEmail',
        passwordField: 'password',
    },
    function(usernameEmail, password, done) {
	connection.query('SELECT * FROM users WHERE username=? OR email=? LIMIT 1',[usernameEmail, usernameEmail], function(err, results) {
	    user = null;
	    if (err) {
		return done(err);
	    }
	    if (!results || results.length == 0) {
		return done(null, false, { message: 'Incorrect username or password.' });
	    } else {
		user = results[0]
	    }
	    
	    if (!bcrypt.compareSync(password, user.password_hash)) {
		return done(null, false, { message: 'Incorrect username or password.' });
	    }
	    delete user.password_hash;
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
	    // TODO: send err message
	    return next(err);
	}
	if (!user) {
	    // TODO: send err message info
	    return res.redirect('/login');
	}
	req.login(user, function(err) { // establish session??
	    if (err) {
		// TODO: send err message?
		return next(err);
	    }
	    // TODO: return user in response
	    res.send(user);
	    //return res.redirect('/users/' + user.username);
	});
    })(req, res, next);
});

app.post('/signup', function(req, res) {
    if(req.body){
	connection.query('INSERT INTO users (username, email, password_hash) VALUES (?,?,?);', [req.body.username, req.body.email, bcrypt.hashSync(req.body.password, SALT_ROUNDS)], function(err, result) {
	    if (err) {
		// return res.send("Username or email taken already"/err)??
	    }

	    // Log user in, send back user data
	    connection.query('SELECT * FROM users WHERE id=?', [result.insertId], function(err, results) {
		if (err) {
		    // return res.send("Cannot login now, please try again later.")?? should work most of the time
		}

		// TODO: error check for getting results?
		var user = results[0];
		delete user.password_salt;

		req.login(user, function(err) {
		    if (err) {
			// return err? res.send("Cannot login now, please try again later.")
		    }
		    res.send(user);
		});
	    });
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
        // var posts = {'posts' : results.reverse()}
        var posts = {"posts" : [{
    "id": 36,
    "message": "Asdf",
    "image_url": null,
    "latitude": 37.2537,
    "longitude": 127.055,
    "radius": 25,
    "direction_x": 0,
    "direction_y": 0,
    "direction_z": 0,
    "num_likes": 0,
    "date_created": "2013-03-20T05:03:02.000Z",
    "user_id": 1,
    "num_flagged": 0
  },
  {
    "id": 35,
    "message": "Penis",
    "image_url": null,
    "latitude": 37.426854,
    "longitude": -122.171853,
    "radius": 25,
    "direction_x": 0,
    "direction_y": 0,
    "direction_z": 0,
    "num_likes": 0,
    "date_created": "2013-03-14T00:52:11.000Z",
    "user_id": 2,
    "num_flagged": 0
  },
  {
    "id": 34,
    "message": "Wow\r\n",
    "image_url": null,
    "latitude": 37.426854,
    "longitude": -122.171853,
    "radius": 25,
    "direction_x": 0,
    "direction_y": 0,
    "direction_z": 0,
    "num_likes": 0,
    "date_created": "2013-03-14T00:51:56.000Z",
    "user_id": 2,
    "num_flagged": 0
  }]};
        

        for (var i = 0; i < posts.posts.length; i++){
            var date = new Date(posts.posts[i].date_created);
            posts.posts[i].date_created = date.getMonth()+1+'/'+date.getDate()+'/'+date.getFullYear()+' at '+date.getHours()%12+':'+date.getMinutes();
            
        }
        res.render('index',posts); 
    });
  
});




