"use strict";
/*jshint esversion: 6 */

/*
 * Defined the Mongoose Schema and return a Model for tokens
 */


var mongoose = require('mongoose');



/*
 * tweet can have comments and we stored them in the Tweet object itself using
 * this Schema:
 */


// create a schema for Tweet
var tokenSchema = new mongoose.Schema({
    user_id: String,     // Unique ID identifying this client.
    tokenString: String,         // the token of that client.
});

var Token = mongoose.model('Token', tokenSchema);

module.exports = Token;
