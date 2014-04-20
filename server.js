var request = require('request');
var url = require('url');
var http = require('http');
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'spr1ng3r',
  database : 'mainDB'
});
connection.connect();

var key = "AIzaSyDuIB59V7YxEIGzM1XUM31eOehB6PQYxI8";

var server = http.createServer(function(req, res) {

    res.writeHead(200, {'content-type': 'text/plain'});
    var parsedUrl = url.parse(req.url, true);
   
console.log(parsedUrl.pathname);

    if (parsedUrl.pathname == "/receive") { 
    	
	connection.query("SELECT fromUser, message, sourceLang, time_stamp FROM messages WHERE toUser = '"+username+"' AND status = 'unread'", function (err, rows, fields) {
	
		console.log(rows);
	//    var targetLang = encodeURIComponent(parsedUrl.query.targetLang);
	  /*  var gt_url = "https://www.googleapis.com/language/translate/v2?key="+key+"&source="+sourceLang+"&target="+targetLang+"&q="+text;

	    request(gt_url, function(err, response, body) {
		res.write("Translating\n");
                res.end(body.data.translations[0].translatedText);
	    });*/
	});
    } 

// ----------------------------------------------------------------- //

    else if (parsedUrl.pathname == "/send") {
	var sourceLang = parsedUrl.query.sourceLang;
	var toUser = parsedUrl.query.toUser;
	var fromUser = parsedUrl.query.fromUser;
	var message = parsedUrl.query.message;
	connection.query("INSERT INTO messages SET toUser = '"+toUser+"', fromUser = '"+fromUser+"', message = '"+message+"', sourceLang = '"+sourceLang+"', time_stamp = NOW(), status = 'unread'", function(err, rows, fields) {
	    if (err) throw err;
	    res.end("Message sent successfully");
	});

    } // End of /send

// ----------------------------------------------------------------- //
	
    else if (parsedUrl.pathname == "/register") {
	var username = parsedUrl.query.name;
	var userpin = parsedUrl.query.pin;
	connection.query("SELECT id FROM users WHERE name = '"+username+"'", function (err, rows, fields) {
	    if (rows.length == 0) {
		connection.query("INSERT INTO users (name, pin) VALUES ('"+username+"','"+userpin+"')", function(err, rows, fields) {
 	   	    if (err) throw err;
 	    	    console.log('Inserted', rows[0]);
		    res.end ("User registered. ID = ");
		});
	    }
	    else {
		res.end('Username already taken');
	    }
	}); 
    } // End of /register

// --------------------------------------------------------------- //

    else if (parsedUrl.pathname == "/login") {
	var username = parsedUrl.query.name;
	var userpin = parsedUrl.query.pin;
	connection.query("SELECT id FROM users WHERE name='"+username+"' AND pin='"+userpin+"'", function(err, rows, fields) {
	    if (rows.length == 1) {
		res.end("Logged in successfully. ID = "+rows[0].id);
	    }
	    else {
		res.end("Login failed");
	    }
	});
    } // End of /login

// -------------------------------------------------------------- //

    else {
	res.end("Fuck favico");
    }
     
}).listen(8080);
