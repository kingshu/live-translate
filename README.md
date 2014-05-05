live-translate
==============

This is the backend for the app allows users communicate in different languages. Sender sends messages in their language, Receiver receives the message in another language according to their settings.

Example request: http://urlredactedforsecurity.amazonaws.com/register?name=jdoe&pin=876433&realname=John%20Doe&phone=765-123-4567&gender=M

Language codes: https://developers.google.com/translate/v2/using_rest#language-params

========================================================


/register
	parameters: name, pin, realname, phone, gender
	# phone should be in format- 999-999-9999 
	# gender has to be uppercase M, F, or O
	possible responses:

		{
			"success":"true",
			"message":"User registered",		
			"user_name":"rob",
			"real_name":"Robert Rosendale",
			"phone_number":"769-744-3723"
		}

		-------------------- OR --------------------
		
		{
			"success":"false",
			"message":"Username already taken"
		}


========================================================


/login
	parameters: name, pin
	possible responses:
	
		{
			"success":"true",
			"message":"Logged in successfully"
		}

		-------------------- OR --------------------
		
		{
			"success":"false",
			"message":"Login failed"
		}


=========================================================


/send
	parameters: sourceLang, toUser, user, pin, message
	# toUser can be single or multiple. eg- ?toUser=log or ?toUser=log&toUser=kmedhi&toUser=kartik
	# 'user' will be the user's username stored in your settings after login.
	response: 
	
		{
			"success":"true",
			"message":"Message sent successfully"
		}


=========================================================


/receive
	# right now only receives unread messages
	parameters: user, pin, userLang [, fromUser (optional) ]
	#userLang is the user's language that he wants to receive messages in.
	fromUser is optional, will retrieve messages sent by only the fromUser specified 
	example response: #assuming userLang=de (German) and assuming there are 2 unread messages.

		{
			"success":"true", 
			"message":"Messages retrieved",
			"results":[
				{
					"from":"Kingshu",
					"timestamp":"2014-04-20T21:30:38.000Z",
					"message":"hallo, wie geht es dir?"
				},
				{
					"from":"Kartik",
					"timestamp":"2014-04-20T21:45:16.000Z",
					"message":"Ich werde Sie in einer Stunde zu treffen"
				}
			]
		}
		

=========================================================


/profile
	parameter: username
	possible responses:

		{
			"success":"true",
			"message":"User found",
			"user_id":1,
			"user_realName":"Krishnabh Medhi",
			"user_gender":"M",
			"user_phoneNumber":"765-775-6684",
			"user_status":"I'm using LiveTranslate"
		}

		-------------------- OR --------------------
	
		{
			"success":"false",
			"message":"No users found by that username"
		}


=========================================================


/search
	parameters: phone
	# use phone as many times as you want (one is ok too), like-
	# /search?phone=765-775-6684&phone=734-744-9723
	possible responses:

		{
			"success":"true",
			"message":"2 users found",
			"numberOfMatches":"2",
			"results":[
				{
					"id":1,	
					"name":"Kingshu",
					"real_name":"Krishnabh Medhi",
					"gender":"M",
					"phone_number":"765-775-6684",
					"status":"I'm dead"
				},
				{
					"id":7,
					"name":"chris",
					"real_name":"Christopher Wirt",
					"gender":"M",
					"phone_number":"734-744-9723",
					"status":"I'm using LiveTranslate"
				}
			]
		}

		-------------------- OR --------------------
	
		{
			"success":"false",
			"message":"No users have these numbers",
			"numberOfMatches":"0",
			"results":[]
		}


=========================================================


/setStatus
	parameters: user, statusmsg, pin
	possible responses:

		{
			"success":"true",
			"message":"Status updated",
			"user_name":"Kingshu",
			"status":"Watching Frozen"
		}

		-------------------- OR --------------------

		{
			"success":"false",
			"message":"Could not set status"
		}


=========================================================


/changePin
	parameters: username, oldPin, newPin (Don't forget to confirm newPin twice on your side)
	possible responses:

		{
			"success":"true",
			"message":"Password changed successfully"
		}

		-------------------- OR --------------------

		{
			"success":"false",
			"message":"Could not change password"
		}

