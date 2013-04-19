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
var _ = require('underscore');
var tools = require('./tools');

app.configure(function() {
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser({keepExtensions: true, uploadDir: 'uploads'}));
    app.set('views',__dirname + '/views');
    app.set('view engine','jade');

    app.use(express.cookieParser());
    app.use(express.session({secret: 'cheezburger'}));
    app.use(passport.initialize());
    app.use(passport.session());
});

/* Port numbers */
var HTTP_PORT_NO = 3000; // cannot use 80
var HTTPS_PORT_NO = 8000; // cannot use 443

/* HTTPS options */
var options = {
    key: fs.readFileSync('https/key.pem'),
    cert: fs.readFileSync('https/cert.pem')
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
 
/* Passport configurations */
passport.use(new LocalStrategy({
        usernameField: 'usernameEmail',
        passwordField: 'password',
    },
    function(usernameEmail, password, done) {
	connection.query('SELECT * FROM users WHERE username=? OR email=? LIMIT 1;',[usernameEmail, usernameEmail], function(err, results) {
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

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    connection.query('SELECT id, full_name, username, email, fb_email, date_joined, num_flagged FROM users WHERE id=? LIMIT 1;', [id], function(err, results) {
	done(err, results[0]);
    });
});

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

var range = 0.5; // 500m
// 111693.9173 - 110574.2727 (meters) latitude deg to meters
// 0 - 111319.458 (meters) longitude deg to meters
app.get('/nearby', function(req, res) {
    if (req.query && req.query.latitude && req.query.longitude) {
	connection.query('SELECT * FROM (SELECT * FROM posts) AS p, (SELECT id, username FROM users) AS u WHERE p.user_id = u.id AND latitude > ? AND latitude < ? AND longitude > ? AND longitude < ?;', [req.query.latitude - 0.01, req.query.latitude + 0.01, req.query.longitude - 1, req.query.longitude + 1], function(err, results) {
	    nearby = [];
	    for (var i in results) {
		if (tools.distance(req.query.latitude, req.query.longitude, results[i].latitude, results[i].longitude) < range) {
		    nearby.push(results[i]);
		}
	    }
	    
	    res.send({posts: nearby});
	});
    } else {
	res.send("No GET data read");
    }
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

app.post('/user/login', function(req, res, next) {
    console.log("login");
    console.log(req.headers);
    passport.authenticate('local', function(err, user, info) {
	if (err) {
	    return res.send({error: "Error logging in, please try again."});
	}
	if (!user) {
	    return res.send({error: info.message});
	}

	req.login(user, function(err) { // establish session??
	    if (err) {
		return res.send({error: "Error logging in, please try again."});
	    }
	    // TODO: return user in response
	    res.send({user: user, message: "Successfully logged in."});
	});
    })(req, res, next);
});

app.post('/user/signup', function(req, res) {
    if(req.body){
	if (req.body.email) {
	    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	    if (!re.test(req.body.email))
		return res.send({error: "Not a valid email address."});
	}
	connection.query('INSERT INTO users (username, email, password_hash) VALUES (?,?,?);', [req.body.username, req.body.email, bcrypt.hashSync(req.body.password, SALT_ROUNDS)], function(err, result) {
	    if (err) {
		if (err.code == "ER_DUP_ENTRY") {
		    return res.send({error: "Username or email already taken."});
		} else {
		    return res.send({error: "Error signing up, please try again."});
		}
	    }

	    // Log user in, send back user data
	    connection.query('SELECT * FROM users WHERE id=?;', [result.insertId], function(err, results) {
		if (err) {
		    return res.send({error: "Error logging in, please try again."});
		}

		// TODO: error check for getting results?
		var user = results[0];
		delete user.password_hash;

		req.login(user, function(err) {
		    if (err) {
			return res.send({error: "Error logging in, please try again."});
		    }
		    res.send({user: user, message: "Signed up and logged in."});
		});
	    });
	});
    } else {
	// TODO: proper response
        res.send("No POST data read");
    }
});

app.put('/user/update', function(req, res) {
    console.log('update');
    console.log(req.headers);
    if (!_.isEmpty(req.body)) {
	if (req.body.username && req.body.email) {
	    // Update username or email

	    // Check valid email
	    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	    if (!re.test(req.body.email))
                return res.send({error: "Not a valid email address."});
	    
	    connection.query('UPDATE users SET username=?, email=? WHERE id=?;', [req.body.username, req.body.email, req.user.id], function(err, results) {
		if (err) {
		    if (err.code == "ER_DUP_ENTRY") {
			return res.send({error: "Username or email already taken."});
		    } else {
			return res.send({error: "Error updating, please try again."});
		    }
		} else {
		    selectUser(req.user.id, function(err, user) {
			if (err) {
			    return res.send({error: "Error updating, please try again."});
			} else {
			    res.send({user: user, message: "Succesfully updated user."});
			}
		    });
		}
	    });
	} else if (req.body.oldPassword && req.body.password) {
	    // Update password
	    connection.query('SELECT * FROM users WHERE id=? LIMIT 1;', [req.user.id], function(err, results) {
		if (err) {
		    return res.send({error: "Error updating user, please try again."});
		}

		// TODO: error check results
		var user = results[0];
		if (bcrypt.compareSync(req.body.password, user.password_hash)) {
		    return res.send({error: "Password unchanged."});
		}

		if (!bcrypt.compareSync(req.body.oldPassword, user.password_hash)) {
		    return res.send({error: "Current password incorrect."});
		} else {
		    connection.query('UPDATE users SET password_hash=? WHERE id=?;', [bcrypt.hashSync(req.body.password, SALT_ROUNDS), req.user.id], function(err, result) {
			if (err) {
			    return res.send({error: "Error updating user, please try again."});
			}
			delete user.password_hash;
			res.send({user: user, message: "Succesfully updated user."});
		    });
		}
	    });
	}
    } else if (!_.isEmpty(req.files)) {
	if (req.files.avatar) {
	    // use fs to copy the image
	    // use name to preserve file format?
	    // req.files.avatar.path
	    console.log(req.files.avatar);
	    var ext = req.files.avatar.path.split('.').pop();
	    //var path = req.files.avatar.path.split('/');
	    var hash = crypto.createHash('sha256');
	    fs.readFile(req.files.avatar.path, function(err, data) {
		if (err) {
		    return res.send({error: "Error updating, please try again."});
		}
		
		hash.update(data);
		var digest = hash.digest('hex');
		var filePath = 'images/user/' + digest + '.' + ext;
		fs.rename(req.files.avatar.path, filePath, function(err) {
		    console.log(filePath);
	    
		    connection.query('UPDATE users SET avatar=? WHERE id=?;', [filePath, req.user.id], function(err, results) {
			if (err) {
			    return res.send({error: "Error updating, please try again."});
			} else {
			    selectUser(req.user.id, function(err, user) {
				if (err) {
				    return res.send({error: "Error updating, please try again."});
			    	} else {
				    res.send({user: user, message: "Successfully updated user."});
				}
			    });
			}
		    });
		});
	    });
	}
    } else {
	res.send("No PUT data read");
    }
});

// Returns the user's posts
app.get('/user/posts', function(req, res) {
    if (req.user && req.user.id) {
	connection.query('SELECT * FROM posts WHERE user_id=?', [req.user.id], function(err, results) {
	    res.send({posts: results});
	});
    }
});

/*
app.post('/user/avatar', function(req, res) {
    if (req.body) {
	console.log(req);
    } else {
	res.send("No POST data read");
    }
});
*/

app.post('/user/logout', function(req, res) {
    console.log("logout");
    req.logout();
    res.send({logout: "Successfully logged out."});
});

console.log('Listening to HTTP on port ' + HTTP_PORT_NO);
server.listen(HTTP_PORT_NO);
console.log('Listening to HTTPS on port ' + HTTPS_PORT_NO);
https.createServer(options, app).listen(HTTPS_PORT_NO)

app.get('/home', function(req, res) {
     // connection.query('SELECT * FROM posts;', function(err, results) {
        // res.send(results.reverse());
        //test post for local machine
        // var posts = {'posts' : results.reverse()}
        var posts = {'posts' : 
[
  {
    "id": 12,
    "message": "In cs210, about to present software demo...hope everything works out!",
    "image_url": null,
    "latitude": 37.426854,
    "longitude": -122.171853,
    "radius": 25,
    "direction_x": 0,
    "direction_y": 0,
    "direction_z": 0,
    "num_likes": 0,
    "date_created": "2013-04-10T05:25:57.000Z",
    "user_id": 2,
    "num_flagged": 0
  },
  {
    "id": 11,
    "message": "Almost at cs210 class!! Can't wait!",
    "image_url": null,
    "latitude": 37.427008,
    "longitude": -122.171499,
    "radius": 25,
    "direction_x": 0,
    "direction_y": 0,
    "direction_z": 0,
    "num_likes": 0,
    "date_created": "2013-04-10T05:25:57.000Z",
    "user_id": 2,
    "num_flagged": 0
  },
  {
    "id": 10,
    "message": "This path through the main quad is actually really awesome...",
    "image_url": null,
    "latitude": 37.426816,
    "longitude": -122.171144,
    "radius": 25,
    "direction_x": 0,
    "direction_y": 0,
    "direction_z": 0,
    "num_likes": 0,
    "date_created": "2013-04-10T05:25:57.000Z",
    "user_id": 2,
    "num_flagged": 0
  },
  {
    "id": 9,
    "message": "Just saw the Pope inside the Round Room of the Memorial Church!",
    "image_url": null,
    "latitude": 37.426565,
    "longitude": -122.170817,
    "radius": 25,
    "direction_x": 0,
    "direction_y": 0,
    "direction_z": 0,
    "num_likes": 0,
    "date_created": "2013-04-10T05:25:57.000Z",
    "user_id": 2,
    "num_flagged": 0
  },
  {
    "id": 8,
    "message": "FML just tripped and fell in front of a group of tourists...",
    "image_url": null,
    "latitude": 37.426373,
    "longitude": -122.17057,
    "radius": 25,
    "direction_x": 0,
    "direction_y": 0,
    "direction_z": 0,
    "num_likes": 0,
    "date_created": "2013-04-10T05:25:57.000Z",
    "user_id": 2,
    "num_flagged": 0
  },
  {
    "id": 7,
    "message": "Go Stanford! #freshman",
    "image_url": null,
    "latitude": 37.426531,
    "longitude": -122.170157,
    "radius": 25,
    "direction_x": 0,
    "direction_y": 0,
    "direction_z": 0,
    "num_likes": 0,
    "date_created": "2013-04-10T05:25:57.000Z",
    "user_id": 2,
    "num_flagged": 0
  },
  {
    "id": 6,
    "message": "JC wuz here #mensbathroom",
    "image_url": null,
    "latitude": 37.426535,
    "longitude": -122.169701,
    "radius": 25,
    "direction_x": 0,
    "direction_y": 0,
    "direction_z": 0,
    "num_likes": 0,
    "date_created": "2013-04-10T05:25:57.000Z",
    "user_id": 2,
    "num_flagged": 0
  },
  {
    "id": 5,
    "message": "First time using this application...pretty cool!!",
    "image_url": null,
    "latitude": 37.426607,
    "longitude": -122.16924,
    "radius": 25,
    "direction_x": 0,
    "direction_y": 0,
    "direction_z": 0,
    "num_likes": 0,
    "date_created": "2013-04-10T05:25:57.000Z",
    "user_id": 2,
    "num_flagged": 0
  },
  {
    "id": 4,
    "message": "The Stanford Memorial church is a must-see on your trip to Stanford.  Absolutely inspiring when you go in",
    "image_url": null,
    "latitude": 37.427174,
    "longitude": -122.170377,
    "radius": 25,
    "direction_x": 0,
    "direction_y": 0,
    "direction_z": 0,
    "num_likes": 0,
    "date_created": "2013-04-10T05:25:57.000Z",
    "user_id": 2,
    "num_flagged": 0
  },
  {
    "id": 3,
    "message": "Hey I wanna chat! what's up? #bldg110",
    "image_url": null,
    "latitude": 37.428004,
    "longitude": -122.170635,
    "radius": 25,
    "direction_x": 0,
    "direction_y": 0,
    "direction_z": 0,
    "num_likes": 0,
    "date_created": "2013-04-10T05:25:57.000Z",
    "user_id": 2,
    "num_flagged": 0
  },
  {
    "id": 2,
    "message": "This class in bldg 110 is so boring...anyone wanna chat? #bldg110",
    "image_url": null,
    "latitude": 37.428004,
    "longitude": -122.170635,
    "radius": 25,
    "direction_x": 0,
    "direction_y": 0,
    "direction_z": 0,
    "num_likes": 0,
    "date_created": "2013-04-10T05:25:57.000Z",
    "user_id": 2,
    "num_flagged": 0
  },
  {
    "id": 1,
    "message": "I'm alive! survived that midterm!",
    "image_url": null,
    "latitude": 37.427791,
    "longitude": -122.169675,
    "radius": 25,
    "direction_x": 0,
    "direction_y": 0,
    "direction_z": 0,
    "num_likes": 0,
    "date_created": "2013-04-10T05:25:57.000Z",
    "user_id": 2,
    "num_flagged": 0
  }]



        };
        
    
        for (var i = 0; i < posts.posts.length; i++){
            var date = new Date(posts.posts[i].date_created);
            posts.posts[i].date_created = date.getMonth()+1+'/'+date.getDate()+'/'+date.getFullYear()+' at '+date.getHours()%12+':'+date.getMinutes();
            
        }
        res.render('index',posts); 
     // });
  
});


var selectUser = function(id, cb) {
    connection.query('SELECT * FROM users WHERE id=? LIMIT 1;', [id], function(err, results) {
	var user = null;
	if (results && results[0]) {
	    user = results[0];
	    delete user.password_hash;
	}
	cb(err, user);
    });
}
