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

        var posts = {posts:[
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
          },
          {
            "id": 33,
            "message": "Is it possible for a presentation to be too good? ",
            "image_url": null,
            "latitude": 37.426854,
            "longitude": -122.171853,
            "radius": 165,
            "direction_x": 0,
            "direction_y": 0,
            "direction_z": 0,
            "num_likes": 0,
            "date_created": "2013-03-14T00:51:39.000Z",
            "user_id": 2,
            "num_flagged": 0
          },
          {
            "id": 32,
            "message": "<script type='text/javascript'>alert('I want dinner')</script>",
            "image_url": null,
            "latitude": 37.426854,
            "longitude": -122.171853,
            "radius": 165,
            "direction_x": 0,
            "direction_y": 0,
            "direction_z": 0,
            "num_likes": 0,
            "date_created": "2013-03-14T00:50:40.000Z",
            "user_id": 2,
            "num_flagged": 0
          },
          {
            "id": 31,
            "message": ":)))))))",
            "image_url": null,
            "latitude": 37.426854,
            "longitude": -122.171853,
            "radius": 25,
            "direction_x": 0,
            "direction_y": 0,
            "direction_z": 0,
            "num_likes": 0,
            "date_created": "2013-03-14T00:50:31.000Z",
            "user_id": 2,
            "num_flagged": 0
          },
          {
            "id": 30,
            "message": "Cool demo!",
            "image_url": null,
            "latitude": 37.2537,
            "longitude": 127.055,
            "radius": 25,
            "direction_x": 0,
            "direction_y": 0,
            "direction_z": 0,
            "num_likes": 0,
            "date_created": "2013-03-14T00:50:27.000Z",
            "user_id": 1,
            "num_flagged": 0
          },
          {
            "id": 29,
            "message": "Wow, my group was nowhere near this cool... ",
            "image_url": null,
            "latitude": 37.426854,
            "longitude": -122.171853,
            "radius": 305,
            "direction_x": 0,
            "direction_y": 0,
            "direction_z": 0,
            "num_likes": 0,
            "date_created": "2013-03-14T00:50:01.000Z",
            "user_id": 2,
            "num_flagged": 0
            }]};
            res.render('index',posts);
    });
  
});


















