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

/*
app.get('/', function(req, res) {

  connection.query('SELECT * FROM posts;', function(err, results) {
    res.send(results.reverse());
  });
});
*/

var range = 0.5; // 500m
// 111693.9173 - 110574.2727 (meters) latitude deg to meters
// 0 - 111319.458 (meters) longitude deg to meters
app.get('/nearby', function(req, res) {
    if (req.query && req.query.latitude && req.query.longitude) {
	connection.query('SELECT * FROM (SELECT * FROM posts) AS p, (SELECT id, username FROM users) AS u WHERE p.user_id = u.id AND latitude >= ? AND latitude <= ? AND longitude >= ? AND longitude <= ?;', [req.query.latitude - 0.1, req.query.latitude + 0.1, req.query.longitude - 1, req.query.longitude + 1], function(err, results) {
	    nearby = [];
	    for (var i in results) {
	    	range = results[i].radius/1000.0;
		if (tools.distance(req.query.latitude, req.query.longitude, results[i].latitude, results[i].longitude) <= range) {
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
        connection.query('INSERT INTO posts (message, latitude, longitude, radius, user_id) VALUES (?,?,?,?,?);',[req.body.message, req.body.latitude, req.body.longitude, req.body.radius, req.body.userid], function(err, results) {
            res.send(results);
        });
    }else{
        res.send("No POST data read");
    }
});

/*
app.post('/demoresponse', function(req, res) {
    if(req.body.message){
        connection.query('INSERT INTO posts (message, latitude, longitude, radius, user_id) VALUES (?,?,?,?,?);',[req.body.message, req.body.latitude, req.body.longitude, req.body.radius, req.body.userid], function(err, results) {
            res.redirect("/demolist.html");
        });
    }
});
*/

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

app.get('/user/stats', function(req, res) {
    if (req.user && req.user.id) {
	connection.query('SELECT * FROM (SELECT COUNT(*) AS posts FROM posts WHERE user_id=?) as p, (SELECT COUNT(*) AS likes FROM likes WHERE user_id=1) as l', [req.user.id, req.user.id], function(err, results) {
	    if (err) {
		return res.send({error: "Error retreiving stats, please try again."});
	    }

	    res.send({stats: results[0]});
	});
    } else {
	// Just for testing
	connection.query('SELECT * FROM (SELECT COUNT(*) AS posts FROM posts WHERE user_id=?) as p, (SELECT COUNT(*) AS likes FROM likes WHERE user_id=1) as l', [1,1], function(err, results) {
	    res.send({stats: results[0]});
	});
    }
});

app.post('/user/logout', function(req, res) {
    console.log("logout");
    req.logout();
    res.send({logout: "Successfully logged out."});
});

app.post('/post/like', function(req, res) {
    if (req.user && req.user.id) {
	if (!_.isEmpty(req.body)) {
	    connection.query('INSERT INTO likes (post_id, user_id, `like`) VALUES (?,?,?) ON DUPLICATE KEY UPDATE `like`=?;', [req.body.post_id, req.user.id, req.body.like, req.body.like], function(err, results) {
		if (err) {
		    return res.send({error: "Error liking, please try again."});
		}
		
		// TODO: figure out what to send
		res.send(results);
	    });
	} else {
	    res.send("No POST data read.");
	}
    } else {
	res.send({error: "Please log in to like."});
    }
});

app.post('/post/flag', function(req, res) {
    if (req.user && req.user.id) {
	
    } else {
	// anonymous flag??
    }
});

console.log('Listening to HTTP on port ' + HTTP_PORT_NO);
server.listen(HTTP_PORT_NO);
console.log('Listening to HTTPS on port ' + HTTPS_PORT_NO);
https.createServer(options, app).listen(HTTPS_PORT_NO)

app.get('/home', function(req, res) {
     connection.query('SELECT * FROM posts;', function(err, results) {
        var posts = {'posts' : results.reverse()};
        
    
        for (var i = 0; i < posts.posts.length; i++){
            var date = new Date(posts.posts[i].date_created);
            posts.posts[i].date_created = date.getMonth()+1+'/'+date.getDate()+'/'+date.getFullYear()+' at '+date.getHours()%12+':'+date.getMinutes();
            
        }
        res.render('index',posts); 
     });
  
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
