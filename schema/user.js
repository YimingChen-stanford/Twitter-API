"use strict";
/*jshint esversion: 6 */

/*
 *  Defined the Mongoose Schema and return a Model for a User
 */


var mongoose = require('mongoose');

// Use bcrypt to protect user's password
var bcrypt = require('bcrypt');
const SALT = 10;

// create a schema
var userSchema = new mongoose.Schema({
    user_id : String,     // the unique id identifying the user
    user_name: String,    // Location  of the user.
    password: String,  // the password of a user in hashing.
    date_created: {type: Date, default: Date.now},  // the date when the user is created
    email : String  // the email address of the user 
    
});

userSchema.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')){
        return next();
    } 

    // generate a salt
    else{
    	bcrypt.genSalt(SALT, function(err, salt) {
        if (err){
            return next(err);
        } 

        // hash the password using our the salt
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err){
                return next(err);
            } 

            // save the hashed one instead
            user.password = hash;
            next();
        });
    });
    }
    
});

//provide a way to compare  the password

userSchema.methods.comparePassword = function(password, cb) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        if (err){
            return cb(err);
        } 
        cb(null, isMatch);
    });
};

/*
example of usage: 
user.comparePassword('abcde', function(err, isMatch) {
            if (err) throw err;
            console.log('abcde:', isMatch); 
        });
result: --> abcde: true
*/
 



var User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;
