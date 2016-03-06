'use strict';

var GitHubStrategy = require('passport-github').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var User = require('../models/users');
var configAuth = require('./auth');

module.exports = function (passport) {
	passport.serializeUser(function (user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function (id, done) {
		User.findById(id, function (err, user) {
			done(err, user);
		});
	});

	passport.use(new GitHubStrategy({
		clientID: configAuth.githubAuth.clientID,
		clientSecret: configAuth.githubAuth.clientSecret,
		callbackURL: configAuth.githubAuth.callbackURL
	},
	function (token, refreshToken, profile, done) {
		process.nextTick(function () {
			User.findOne({ 'github.id': profile.id }, function (err, user) {
				if (err) {
					return done(err);
				}

				if (user) {
					return done(null, user);
				} else {
					var newUser = new User();

					newUser.github.id = profile.id;
					newUser.github.username = profile.username;
					newUser.github.displayName = profile.displayName;
					newUser.github.publicRepos = profile._json.public_repos;
					newUser.nbrClicks.clicks = 0;

					newUser.save(function (err) {
						if (err) {
							throw err;
						}

						return done(null, newUser);
					});
				}
			});
		});
	}));
	
	passport.use(new FacebookStrategy({
	    clientID: '1055888537786297',
	    clientSecret: '6e06c846d9cd4d0d744d6a3453bfb6ca',
	    callbackURL: "https://fcc-basejump-2-subnak.c9users.io/auth/facebook/callback",
	    passReqToCallback: true
	  },
	  function(req,accessToken, refreshToken, profile, done) {
	  	console.log('inside facebook passport');
	  	process.nextTick(function(){
		  	User.findOne({"facebook.id":profile.id}, function(err,user){
		  		if(err){
		  			return done(err);
		  		}
		  		if(user){
		  			return done(null,user);
		  		}else{
		  			var newUser = new User();
		  			newUser.facebook.id=profile.id;
		  			newUser.facebook.username=profile.displayName;
		  			newUser.universalInfo.username=profile.username;
		  			newUser.save(function(err){
		  				if(err) throw err;
		  				return done(null,newUser);
		  			})
		  		}
		  	});
		});
	}));
	
};
