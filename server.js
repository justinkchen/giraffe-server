/* Express server */
var express = require('express');
var app = express();

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

app.get('/', function(req, res) {
    connection.query('SELECT * FROM posts', function(err, results) {
	res.send(results);
    });
});

app.get('/hello.txt', function(req, res) {
    res.send('Hello World');
});

app.listen(PORT_NO);
console.log('Listening on port ' + PORT_NO);