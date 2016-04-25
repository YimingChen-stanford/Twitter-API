"use strict";
/*jshint esversion: 6 */

/*
 * This builds a twitter-like web server
 * This server uses - joi to do validation on inputs from user
 *                  - bcrypt to hash and salt the password of the user
 *                  - restify-oauth2 to authenticate a user 
 * This file includes the following two servers:
 * The http server listens at 8080 exports the following URLs:
 * /user METHOD:GET        -  return the most recent crated user in the databse
 * /users/:userid/tweets   -  create a new tweet for a user
 * METHOD:POST               
 * /users/:userid/tweets   -  return the most recent crated tweets in the databse  
 * METHOD:GET
 * The https server listens at 443 exports the following URLs:
 * /user METHOD:POST       -  create a new user
 */

var mongoose = require('mongoose');
// Load the Mongoose schema for User, Tweet
var User = require('./schema/user.js');
var Tweet = require('./schema/tweet.js');

// use oauth2 to authenticate a user
var hooks = require("./hook");

var restifyOAuth2 = require("restify-oauth2");

// use restify to creat the server
var restify = require('restify');

var fs = require('fs');

// use bcrypt to hash and salt the user's password
var bcrypt = require('bcrypt');
const saltRounds = 10;

var Joi = require('joi');

var yaml = require('js-yaml');

var https_options = {
        key: fs.readFileSync('./HTTPS.key'),
        certificate: fs.readFileSync('./HTTPS.cert')
    };

var https_server = restify.createServer(https_options);

var server = restify.createServer({
	name: 'twitter',
	version: '1.0.0',
	formatters: {
    'application/yaml': function formatYaml(req, res, body, cb) {
    	if (body instanceof Error) {
        // snoop for RestError or HttpError, but don't rely on
        // instanceof
        res.statusCode = body.statusCode || 500;

        if (body.body) {
        	body = body.body;
        } else {
        	body = {
        		message: body.message
        	};
        }
    	} else if (Buffer.isBuffer(body)) {
    		body = body.toString('base64');
    	}

    	var data = yaml.dump(body);
    	res.setHeader('Content-Length', Buffer.byteLength(data));
    	return cb(null, data);
    	}
  	}
});

server.use(restify.queryParser());
server.use(restify.authorizationParser());
server.use(restify.bodyParser({ mapParams: false }));

https_server.use(restify.queryParser());
https_server.use(restify.authorizationParser());
https_server.use(restify.bodyParser({ mapParams: false }));



// place throttling on IP
server.use(restify.throttle({
	burst: 50,
	rate: 20,
	ip: true
}));

https_server.use(restify.throttle({
    burst: 20,
    rate: 5,
    ip: true
}));


restifyOAuth2.cc(server, { tokenEndpoint: '/token', hooks: hooks });

/*
 * the validation schema to validate the user info when user tries to create an account 
 */

 var schemaUser = Joi.object().keys({
 	userName: Joi.string().alphanum().min(3).max(30).required(),
 	password: Joi.string().min(6).max(30).required(),
 	email: Joi.string().email().required()
 });


/*
 * URL /user/list METHOD post - create a new user. 
 */

 https_server.post('/user', function (req, res, next) {
 	var userInfo = {};
 	userInfo.userName = req.body.userName;
 	userInfo.password = req.body.password;
 	userInfo.email = req.body.email;
 	// validate the user's info 
 	var err = Joi.validate(userInfo, schemaUser);
 	if(err){ 
 		res.send(400,{message:err});
 		return next(err); 
 	}
 	else{
 		User.findOne({user_name:userInfo.userName},function(err,user){
 			if(err){
 				res.send(500,{message:err});
 				return next(err);
 			}
 			else{
 				if(user){
 					res.send(409);
 					return next();
 				}
 				else{
 					User.create({
	                	user_name: userInfo.userName, // the name of the user
	                	password: userInfo.password,  // salted password of the user
	                	email: userInfo.email         // the email address of the user
	            		}, function(err, newUser) {
	            		if(!err){
	            			newUser.id = newUser._id;
	            			newUser.save();
	            			res.send(201);
	            			return next();
	            		}
	            		else{
	            			res.send(500,{message:err});
	            			return next(err);
	            		}
            		});
 				}
 			}

 		}

 		);
 	}
 });

/*
 * URL /user/list METHOD get - Return the most recent 20 users created.
 */

 server.get('/user', function (req, res, next) {
 	// authenticate the user, for more info see hook.js.
 	if (!req.clientId) {
        return res.sendUnauthenticated();
    }

 	User.find({},'user_name, date_created').sort('-date_created').limit(20).exec(function(err, users){
 		if(err){
 			res.send(500,{message:err});
 			return next(err);
 		}
 		else{
 			if(req.accepts('application/yaml')){
 				res.setHeader('content-type', 'application/yaml');
 			}
 			res.send(200,{data:users});
 			
 			return next();
 		}
 		
 	});
 });

/*
 * URL /users/:userid/tweets METHOD post - create a new tweet of the user.
 */

 server.post('/users/:userid/tweets', function (req, res, next) {
 	// authenticate the user, for more info see hook.js.
 	if (!req.clientId) {
        return res.sendUnauthenticated();
    }
 	var tweetInfo = {};
 	tweetInfo.userId = req.params.userid;
 	tweetInfo.content = req.body.content;
 	var userId = req.params.userid;
 	User.findOne({user_id:userId},function(err,user){
 		if(err){
 			res.send(500,{message:err});
 			return next(err);
 		}
 		else{
 			Tweet.create({
    			user_id: tweetInfo.userId,      // Unique ID identifying the user of this tweet.
			    content: tweetInfo.content, // 	the text content of this tweet.
			    userObject: user            // the user object that owns this tweet
        		}, function(err, newTweet) {
        		if(!err){
        			newTweet.id = newTweet._id;
        			newTweet.save();
        			res.send(201);
        			return next();
        		}
        		else{
        			res.send(500,{message:err});
        			return next(err);
        		}
        	});
 		}
 	});
 });

/*
 * URL /users/:userid/tweets METHOD get - Return most recent 20 tweets of the user.
 */

 server.get('/users/:userid/tweets', function (req, res, next) {
 	// authenticate the user, for more info see hook.js.
 	if (!req.clientId) {
        return res.sendUnauthenticated();
    }

 	Tweet.find({}).sort('-date_created').limit(20).exec(function(err, tweets){
 		if(err){
 			res.send(500,{message:err});
 			return next(err);
 		}
 		else{
 			if(req.accepts('application/yaml')){
 				res.setHeader('content-type', 'application/yaml');
 			}
 			
 			res.send(200,{data:tweets});
 			
 			return next();
 		}
 	});
 });

// Implements an uncaught exception handler, which tells us about any internal server errors
server.on('uncaughtException',function(request, response, route, error){
  console.error(error.stack);
  response.send(error);
});


 server.listen(8080, function () {
 	console.log('%s listening at %s', server.name, server.url);
 });

 https_server.listen(443, function () {
    console.log('https server listening at %s', server.url);
 });


