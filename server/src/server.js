////////////////////////////////////////////////////////////////////////
// server.js


var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var session = requore('express-session');

app.use(cookieParser());
app.use(session({secret: '568c3c9jgwyx8vis'}));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static('static'));

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {

    console.log("__dirname:", __dirname, "app:", req.add, "baseUrl:", req.baseUrl, "body:", req.body, "cookies:", req.cookies, "hostname:", req.hostname, "ip:", req.ip, "method:", req.method, "params:", req.params, "path:", req.path, "protocol:", req.protocol, "query:", req.query, "secure:", req.secure, "signedCookies:", req.signedCookies, "xhr:", req.xhr);

    res.sendFile(__dirname + '/index.html');

    //res.send(string);
    //res.json(json);

});

var userId = 0;

io.on('connection', function(socket) {

    socket.userId = userId++;
    console.log('a user connected, user id: ' + socket.userId);

    socket.on('chat', function(msg) {
        console.log('message from user#' + socket.userId + ": " + msg);

        io.emit('chat', {
            id: socket.userId,
            msg: msg
        });

    });

});

http.listen({
        host: 'localhost',
        port: 3000
    },
    function() {
        console.log('listening on localhost:3000');
    });
