var http    = require('http'), 
    httpcli = require('./httpclient');
    io      = require('socket.io'),
    fs      = require('fs');
 
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
        // when the server gets a disconnect, during a connection, broadcast the disconnection
	client.on('disconnect', function(){ client.broadcast({ message: client.sessionId + ' is no longer available' }); });
        // when the server gets a place, during a connection, broadcast the message
    client.on('place', function(place){ client.broadcast({ place: place }); });
        // when the server gets a message, during a connection, broadcast the message
    client.on('message', function(msg){ 
        if (msg.message!=undefined)
            client.broadcast({ message: client.sessionId + ': ' + msg.message }); 
        else if (msg.place!=undefined)
            // "client.listener" is used to also broadcast to me
            client.listener.broadcast({ place: msg.place }); 
        else if (msg.artist!=undefined) {
            var ln_cli = new httpcli.httpclient();	
            // NOTE: An initial empty LiveNation call is required for cookies
            var ln_url = "http://www.livenation.com/json/search/event/national?q=" + encodeURIComponent(msg.artist);
            ln_cli.perform("http://www.livenation.com", "GET", function(ln_res) {
            	ln_cli.perform(ln_url, "GET", function(ln_res) {
                    var docs = JSON.parse(ln_res.response.body).response.docs;
                    var venues = new Array();
                    // TODO: Remove duplicates
                    for(var i = 0; i < docs.length; i++) {
                        venues.push(docs[i].VenueAddress + ", " + docs[i].VenueCityState + " " + docs[i].VenuePostalCode)
                    }
                    // count = JSON.parse(ln_res.response.body).response.numFound
                    // "client.listener" is used to also broadcast to me
                    client.listener.broadcast({ venues: venues }); 
            	}, null, {"Accept-Encoding" : "none,gzip", "Connection" : "Keep-Alive"})                                
        	}, null, {"Accept-Encoding" : "none,gzip", "Connection" : "Keep-Alive"})                                
        }
    });
});