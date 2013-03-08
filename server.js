/* Express server */
var express = require('express');
var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

app.use(express.static(__dirname + '/public'));

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
 
// listen for incoming connections from client
io.sockets.on('connection', function (socket) {
 
  // start listening for coords
  socket.on('send:coords', function (data) {
 
    // broadcast your coordinates to everyone except you
    socket.broadcast.emit('load:coords', data);
  });

});

app.get('/', function(req, res) {
    connection.query('SELECT * FROM posts', function(err, results) {
	res.send(results);
    });
});

/*
app.get('/hello.txt', function(req, res) {
    res.send('Hello World');
});
*/

server.listen(PORT_NO);
console.log('Listening on port ' + PORT_NO);
