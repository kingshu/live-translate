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

var key = "AIzaSyDuIB59V7YxEIGzM1XUM31eOehB6PQYxI8";

var server = http.createServer(function(req, res) {
    
    res.writeHead(200, {'content-type': 'application/json'});
    var parsedUrl = url.parse(req.url, true);
   
    if (parsedUrl.pathname == "/receive") { 
	var username = parsedUrl.query.user;
    	var targetLang = parsedUrl.query.userLang;

	connection.query("SELECT fromUser, message, sourceLang, time_stamp FROM messages WHERE toUser = '"+username+"' AND status = 'unread'", function (err, rows, fields) {
	    var respObj = { success: "true", message: "Messages retrieved", results: new Array() };
	    for (var i in rows) {
		var resultRow = {};
		resultRow.from = rows[i].fromUser;
		resultRow.timestamp = rows[i].time_stamp;
		if (targetLang != rows[i].sourceLang) {
		    var urlencMsg = encodeURIComponent(rows[i].message);
	 	    var gt_url = "https://www.googleapis.com/language/translate/v2?key="+key+"&source="+rows[i].sourceLang+"&target="+targetLang+"&q="+urlencMsg;
		    request.get(gt_url, function(err, response, body) {
			if (err) throw err;
			if (response.statusCode == 200) {
			    var bodyJSON = JSON.parse(body) ;
			    resultRow.message = String(bodyJSON.data.translations[0].translatedText);
			    respObj.results.push(resultRow);
			}
	    	    });
		}
		else {
		    resultRow.message = rows[i].message;
		    respObj.results.push(resultRow);
		}
	    }
	    setTimeout ( function() {
	    	res.end(JSON.stringify(respObj));
	    }, 250);
	});
    } 

// ----------------------------------------------------------------- //

    else if (parsedUrl.pathname == "/send") {
	var sourceLang = parsedUrl.query.sourceLang;
	var toUser = parsedUrl.query.toUser;
	var fromUser = parsedUrl.query.user;
	var message = parsedUrl.query.message;
	connection.query("INSERT INTO messages SET toUser = '"+toUser+"', fromUser = '"+fromUser+"', message = '"+message+"', sourceLang = '"+sourceLang+"', time_stamp = NOW(), status = 'unread'", function(err, rows, fields) {
	    if (err) throw err;
	    var respObj = { success: "true", message: "Message sent successfully" };
	    res.end(JSON.stringify(respObj));
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
		    var respObj = { success: "true", message: "User registered", username: username, userpin: userpin };
		    res.end (JSON.stringify(respObj));
		});
	    }
	    else {
		var respObj = { success: "false", message: "Username already taken"};
		res.end(JSON.stringify(respObj));
	    }
	}); 
    } // End of /register

// --------------------------------------------------------------- //

    else if (parsedUrl.pathname == "/login") {
	var username = parsedUrl.query.name;
	var userpin = parsedUrl.query.pin;
	connection.query("SELECT id FROM users WHERE name='"+username+"' AND pin='"+userpin+"'", function(err, rows, fields) {
	    if (rows.length == 1) {
		var respObj = { success: "true", message: "Logged in successfully" } ;
	    }
	    else {
		var respObj = { success: "false", message: "Login failed" };
	    }
	    res.end (JSON.stringify(respObj));
	});
    } // End of /login

// -------------------------------------------------------------- //

    else {
	res.end("Fuck favico");
    }
     
}).listen(8080);
