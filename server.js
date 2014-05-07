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

    function setResp (i, rows, targetLang, res, respObj, idList) {
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
		    resultRow.message = bodyJSON.data.translations[0].translatedText;
		    respObj.results.push(resultRow);
		}
		if (i==0) {
		    idList += rows[i].id+")";
  	    	    connection.query("UPDATE messages2 SET status='read' WHERE id IN "+idList, function(err,rows,fields) {if(err) throw err;} );
		    res.end (JSON.stringify(respObj));
		}
		else
		    setResp (i-1, rows, targetLang, res, respObj, idList+rows[i].id+",");
	    });
	}
	else {
	    resultRow.message = rows[i].message;
	    respObj.results.push(resultRow);
	    if (i==0) {
		idList += rows[i].id+")";
  	        connection.query("UPDATE messages2 SET status='read' WHERE id IN "+idList, function(err,rows,fields) {if(err) throw err;} );
		res.end (JSON.stringify(respObj));
	    }
	    else
		setResp (i-1, rows, targetLang, res, respObj, idList+rows[i].id+",");
	} 	    
    }




var server = http.createServer(function(req, res) {
    
    res.writeHead(200, {'content-type': 'application/json;charset=utf-8'});
    var parsedUrl = url.parse(req.url, true);   


    if (parsedUrl.pathname == "/receive") { 
	var username = connection.escape(parsedUrl.query.user);
    	var targetLang = parsedUrl.query.userLang;
	var userpin = connection.escape(parsedUrl.query.pin);
	
	var retrieveQuery;
		
	if ( parsedUrl.query.fromUser === undefined ) {
	    retrieveQuery = "SELECT id, fromUser, message, sourceLang, time_stamp FROM messages2 WHERE toUser = "+username+" AND status = 'unread'";
	}
    	else {
	    var fromUsers = parsedUrl.query.fromUser;
	    if ( typeof fromUsers === 'string') 
	    	fromUsers = [ parsedUrl.query.fromUser ];
   	    var fromSet = "(";
	    for (var i in fromUsers)
	    	fromSet += connection.escape(fromUsers[i])+",";
	    fromSet = fromSet.substring(0, fromSet.length-1)+")";
	    retrieveQuery = "SELECT id, fromUser, message, sourceLang, time_stamp FROM messages2 WHERE toUser = "+username+" AND fromUser IN "+fromSet+" AND status = 'unread'";
	}

	connection.query("SELECT id FROM users2 WHERE name="+username+" AND pin="+userpin, function (err, rows, fields) {
	    if (err) throw err;
	    if (rows.length == 1) {
		connection.query( retrieveQuery, function (err, rows, fields) {
	    	    if (err) throw err;
		    var respObj = { success: "true", message: "Messages retrieved", results: [] };
		    if ( rows.length > 0 )
	    	    	setResp(rows.length-1, rows, targetLang, res, respObj, "(");
		    else
			res.end(JSON.stringify(respObj));
		});
	    }
	    else {
		respObj = { success: "false", message: "Incorrect username or pin" } ;
		res.end(JSON.stringify(respObj));
	    }   
	});
    } // End of /receive

// ----------------------------------------------------------------- //

    else if (parsedUrl.pathname == "/send") {
	var sourceLang = connection.escape(parsedUrl.query.sourceLang);
	var toUsers    = parsedUrl.query.toUser;
	var userpin    = connection.escape(parsedUrl.query.pin);
	var fromUser   = connection.escape(parsedUrl.query.user);
	var message    = connection.escape(parsedUrl.query.message);

	if ( typeof toUsers === "string" )
	    toUsers = [ toUsers ];
	
	connection.query("SELECT id FROM users2 WHERE name="+fromUser+" AND pin="+userpin, function (err, rows, fields) {
	    if (err) throw err;
	    if (rows.length == 1) {
	  	for ( var i in toUsers ) {
		    $q = "INSERT INTO messages2 SET toUser = "+connection.escape(toUsers[i])+", fromUser = "+fromUser+", message = "+message+", sourceLang = "+sourceLang+", time_stamp = UTC_TIMESTAMP(), status = 'unread'";
		    
		    connection.query( $q, function(err, rows, fields) {
	    	        if (err) throw err;
			if ( i == toUsers.length-1 ) {
	    	            var respObj = { success: "true", message: "Message sent successfully" };
	    	    	    res.end(JSON.stringify(respObj));
			}
		    });
		}
	    }
	    else {
	        var respObj = { success: "false", message: "Incorrect username or pin" };
		res.end ( JSON.stringify(respObj) ) ;
	    }
	
	});

    } // End of /send

// ----------------------------------------------------------------- //
	
    else if (parsedUrl.pathname == "/register") {
	var username = connection.escape(parsedUrl.query.name);
	var userpin  = connection.escape(parsedUrl.query.pin);
	var realname = connection.escape(parsedUrl.query.realname);
	var phonenum = connection.escape(parsedUrl.query.phone);
	var gender   = connection.escape(parsedUrl.query.gender);
	connection.query("SELECT id FROM users2 WHERE name = "+username, function (err, rows, fields) {
	    if (err) throw err;
	    if (rows.length == 0) {
		connection.query("INSERT INTO users2 (name, pin, real_name, phone_number, gender, status) VALUES ("+username+","+userpin+","+realname+","+phonenum+","+gender+",'Hi, I am using LiveTranslate')", function(err, rows, fields) {
 	   	    if (err) throw err;
		    var respObj = { success: "true", message: "User registered", user_name: username, real_name: realname, phone_number: phonenum, gender: gender };
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
	var username = connection.escape(parsedUrl.query.name);
	var userpin  = connection.escape(parsedUrl.query.pin);
	connection.query("SELECT id, name, real_name, phone_number, status, gender FROM users2 WHERE name="+username+" AND pin="+userpin, function(err, rows, fields) {
	    if (err) throw err;
	    if (rows.length == 1)
		var respObj = { 
			success: "true", 
			message: "Logged in successfully",
			id: rows[0].id, 
			name: rows[0].name, 
			real_name: rows[0].real_name,
			gender: rows[0].gender,
			phone_number: rows[0].phone_number,
			status: rows[0].status 
		    } 
	    else
		var respObj = { success: "false", message: "Login failed" };
	    res.end (JSON.stringify(respObj));
	});
    } // End of /login

// -------------------------------------------------------------- //
    
    else if (parsedUrl.pathname == "/search") {
	var phones = parsedUrl.query.phone;
	if ( typeof phones === 'string') 
	    phones = [ parsedUrl.query.phone ];
	    
	var respObj = { success: "false", message: "No users have these numbers", numberOfMatches: "0", results: [] };
	var phoneSet = "(";
	for (var i in phones)
	    phoneSet += connection.escape(phones[i])+",";
	phoneSet = phoneSet.substring(0, phoneSet.length-1)+")";

	connection.query("SELECT id, name, real_name, gender, phone_number, status FROM users2 WHERE phone_number IN "+phoneSet, function (err, rows, fields) {
	    if (err) throw err;
	    if (rows.length > 0) {
	    	respObj = { success: "true", message:"Users found", numberOfMatches: rows.length, results: [] } ;
	    	for (var i in rows) {
		    var resultRow = {};
		    resultRow.id = rows[i].id;
		    resultRow.name = rows[i].name;
		    resultRow.real_name = rows[i].real_name;
		    resultRow.gender = rows[i].gender;
		    resultRow.phone_number = rows[i].phone_number;
		    resultRow.status = rows[i].status;
		    respObj.results.push(resultRow);
		}
	    }
	    res.end(JSON.stringify(respObj));
	}); 
    } // End of /search

// --------------------------------------------------------------- //

    else if (parsedUrl.pathname == '/profile') {
	var username = connection.escape(parsedUrl.query.username) ;
	var respObj = { success: "false", message: "No users found by that username" };
	connection.query("SELECT id, name, real_name, gender, phone_number, status FROM users2 WHERE name = "+username, function (err, rows, fields) {
	    if (err) throw err;
	    if (rows.length == 1) {
		respObj = { 
				success: "true", 
				message: "User found", 
				user_id: rows[0].id, 
				user_name: rows[0].user_name,
				user_realName: rows[0].real_name,
				user_gender: rows[0].gender,
				user_phoneNumber: rows[0].phone_number,
				user_status: rows[0].status
			  } ;
	    }
	    res.end(JSON.stringify(respObj));
	});
    } // End of /profile

// -------------------------------------------------------------- //

    else if (parsedUrl.pathname == '/setStatus') {
	var username = connection.escape(parsedUrl.query.user);
	var status = connection.escape(parsedUrl.query.statusmsg);
	var userpin = connection.escape(parsedUrl.query.pin);
	connection.query("SELECT id FROM users2 WHERE name = "+username+" AND pin = "+userpin, function(err, rows, fields) {
	    if (err) throw err;
	    if (rows.length == 0) {
		var respObj = { success: "false", message: "Could not set status" };
		res.end(JSON.stringify(respObj));
	    }
	    else {
	    	connection.query("UPDATE users2 SET status = "+status+" WHERE name = "+username, function(err, rows, fields) {
	            if (err) throw err;
	            respObj = { success: "true", message: "Status updated", user_name: parsedUrl.query.user, status: parsedUrl.query.statusmsg };
	            res.end(JSON.stringify(respObj));
	    	});
	    }
	});
    }

// ------------------------------------------------------------- //

    else if (parsedUrl.pathname == '/changePin') {
	var username = connection.escape(parsedUrl.query.username);
	var oldPin = connection.escape(parsedUrl.query.oldPin);
	var newPin = connection.escape(parsedUrl.query.newPin);
	var respObj = {};
	connection.query("SELECT id FROM users2 WHERE name = "+username+" AND pin = "+oldPin, function(err, rows, fields) {
	    if (err) throw err;
	    if (rows.length == 0) {
		respObj = { success: "false", message: "Could not change password" } ;
		res.end(JSON.stringify(respObj));
	    }
	    else {
		connection.query("UPDATE users2 SET pin = "+newPin+" WHERE name = "+username+" AND pin = "+oldPin, function(err, rows, fields) {
		    if (err) throw err;
		    respObj = { success: "true", message: "Pin changed successfully" } ;
		    res.end(JSON.stringify(respObj));
		});
	   }
	});
    }

// ------------------------------------------------------------- //

    else {
	res.end("Unrecognized request, probably favico");
    }
     
}).listen(8080);
