var http = require('http'), 
    io   = require('socket.io'),
    fs   = require('fs');
 
// run a standard server on port 8080
server = http.createServer(function(req, res){
    res.writeHead(200, {'Content-Type': 'text/html'});
    var output = fs.readFileSync('./index.html', 'utf8');
    res.end(output);
});
server.listen(8080);
 
// listen to the server
var socket = io.listen(server);
// on a connection, do stuff
socket.on('connection', function(client){
        // broadcast the connection
	client.broadcast({message: client.sessionId + ' is now available'});
        // when the server gets a message, during a connection, broadcast the message
	client.on('message', function(msg){ client.broadcast({ message: client.sessionId + ': ' + msg.message }); });
        // when the server gets a disconnect, during a connection, broadcast the disconnection
	client.on('disconnect', function(){ client.broadcast({ message: client.sessionId + ' is no longer available' }); });
});