"use strict";
/*jshint esversion: 6 */

/*
 * Defined the Mongoose Schema and return a Model for a tweet
 */


var mongoose = require('mongoose');



/*
 * tweet can have comments and we stored them in the Tweet object itself using
 * this Schema:
 */


// create a schema for Tweet
var tweetSchema = new mongoose.Schema({
    tweet_id: String,     // Unique ID identifying this tweet.
    user_id: String,      // Unique ID identifying the user of this tweet.
    content: String, // 	the text content of this tweet.
    date_created: {type: Date, default: Date.now}, // 	The date and time when the tweet was added to the database
    userObject: mongoose.Schema.Types.ObjectId, // The user object of the user who created the photo.

});

var Tweet = mongoose.model('Tweet', tweetSchema);

// make tweets in our Node applications
module.exports = Tweet;
