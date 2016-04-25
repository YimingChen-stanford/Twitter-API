"use strict";
/*jshint esversion: 6 */

var crypto = require("crypto");

var mongoose = require('mongoose');

var Token = require('./schema/token.js');

function generateToken(data) {
    var random = Math.floor(Math.random() * 100001);
    var timestamp = (new Date()).getTime();
    var sha256 = crypto.createHmac("sha256", random + "WOO" + timestamp);

    return sha256.update(data).digest("base64");
}

/*wait to be implemented. when user logs in, call grantClientToken to set up the token;
tokens are saved in database in the schema defined in schema/token.js*/


/*exports.grantClientToken = function (credentials, req, cb) {
    
};*/

exports.authenticateToken = function (token, req, cb) {
    Token.findOne({tokenString:token}, function(err,result){
        if(err){
            cb(null, false);
        }
        else{
            // If the token does not authenticate, call back with `false` to signal that.
            // Calling back with an error would be reserved for internal server error situations.
            if(result===null||result.user_id!==req.userId){
                cb(null, false);
            }
            // If the token authenticates, set the corresponding property on the request, and call back with `true`.
            // The routes can now use these properties to check if the request is authorized and authenticated.
            else{
                req.clientId = result.user_id;
                return cb(null, true);
            }
        }
    });
};