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
//  	    	    connection.query("UPDATE messages SET status='read' WHERE id IN "+idList, function(err,rows,fields) {if(err) throw err;} );
		    res.end (JSON.stringify(respObj));
		}
		else
		    setResp (i-1, rows, targetLang, res, respObj, idList+rows[i]+",");
	    });
	}
	else {
	    resultRow.message = rows[i].message;
	    respObj.results.push(resultRow);
	    if (i==0) {
		idList += rows[i].id+")";		
//  	        connection.query("UPDATE messages SET status='read' WHERE id IN "+idList, function(err,rows,fields) {if(err) throw err;} );
		res.end (JSON.stringify(respObj));
	    }
	    else
		setResp (i-1, rows, targetLang, res, respObj, idList+rows[i]+",");
	} 	    
    }




var server = http.createServer(function(req, res) {
    
    res.writeHead(200, {'content-type': 'application/json;charset=utf-8'});
    var parsedUrl = url.parse(req.url, true);
   
    if (parsedUrl.pathname == "/receive") { 
	var username = connection.escape(parsedUrl.query.user);
    	var targetLang = connection.escape(parsedUrl.query.userLang);

	connection.query("SELECT id, fromUser, message, sourceLang, time_stamp FROM messages WHERE toUser = "+username+" AND status = 'unread'", function (err, rows, fields) {
	    var respObj = { success: "true", message: "Messages retrieved", results: [] };
	    setResp(rows.length-1, rows, targetLang, res, respObj, "(");   
	});
    } // End of /receive

// ----------------------------------------------------------------- //

    else if (parsedUrl.pathname == "/send") {
	var sourceLang = connection.escape(parsedUrl.query.sourceLang);
	var toUser     = connection.escape(parsedUrl.query.toUser);
	var fromUser   = connection.escape(parsedUrl.query.user);
	var message    = connection.escape(parsedUrl.query.message);
	connection.query("INSERT INTO messages SET toUser = "+toUser+", fromUser = "+fromUser+", message = "+message+", sourceLang = "+sourceLang+", time_stamp = NOW(), status = 'unread'", function(err, rows, fields) {
	    if (err) throw err;
	    var respObj = { success: "true", message: "Message sent successfully" };
	    res.end(JSON.stringify(respObj));
	});

    } // End of /send

// ----------------------------------------------------------------- //
	
    else if (parsedUrl.pathname == "/register") {
	var username = connection.escape(parsedUrl.query.name);
	var userpin  = connection.escape(parsedUrl.query.pin);
	var realname = connection.escape(parsedUrl.query.realname);
	var phonenum = connection.escape(parsedUrl.query.phone);
	var gender   = connection.escape(parsedUrl.query.gender);
	connection.query("SELECT id FROM users WHERE name = "+username, function (err, rows, fields) {
	    if (rows.length == 0) {
		connection.query("INSERT INTO users (name, pin, real_name, phone_number, gender, status) VALUES ("+username+","+userpin+","+realname+","+phonenum+","+gender+",'Hi, I\'m using LiveTranslate')", function(err, rows, fields) {
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
	connection.query("SELECT id, status, gender, name FROM users WHERE name="+username+" AND pin="+userpin, function(err, rows, fields) {
	    if (rows.length == 1)
		var respObj = { success: "true", message: "Logged in successfully", name: rows[0].name, gender: rows[0].gender, status: rows[0].status } ;
	    else
		var respObj = { success: "false", message: "Login failed" };
	    res.end (JSON.stringify(respObj));
	});
    } // End of /login

// -------------------------------------------------------------- //

    else {
	res.end("Fuck favico");
    }
     
}).listen(8080);
