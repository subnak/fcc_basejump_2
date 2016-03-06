'use strict';

var path = process.cwd();
var ClickHandler = require(path + '/app/controllers/clickHandler.server.js');
var Yelp= require('yelp');
var User = require('../models/users');
var Venue = require('../models/venues');
var SavedSearch = require('../models/savedSearches');


module.exports = function (app, passport) {

var loggedIn=false;

	function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) {
			loggedIn=true;
		} else {
			loggedIn=false;
		}
		return next();
	}

	var yelp = new Yelp({
		consumer_key:'oZdRqVw_uUHAkauNOqCAkg',
		consumer_secret:'BRwpmyCL616zCCbrlhLRa1CLSx0',
		token: 'jQ5SikcD7evOOmXm4zxeeaPooMQoKQsY',
		token_secret: 'lEBJTUFvZmQjZm0HsnMPm9hWg4A'
	});
	
	function yelpSearch(req,res,next){
		yelp.search({term:'bar',location:req.body.searchLocation,limit:5})
			.then(function(data){
				var savedSearch = new SavedSearch;
				savedSearch.sessionID=req.sessionID.toString();
				savedSearch.searchCity=req.body.searchLocation;
				savedSearch.save();
				
				req.yelpData=data;
				req.index=0;
				req.maxIndex=data.businesses.length;
				req.yelpData.currentUserID=req.user._id;
				next();
			})
			.catch(function(err){
				console.error(err);
				next();
			})
	}


	function logPeopleGoingToVenue(req,res,next){
		Venue.findOne({'uniqueID':req.yelpData.businesses[req.index].id},function(err,venue){
			if(err) throw err;
			if(venue){
				req.yelpData.businesses[req.index].numPplGoing=venue.numPplGoing;
				req.yelpData.businesses[req.index].pplGoing=venue.pplGoing;
			}else{
				req.yelpData.businesses[req.index].numPplGoing=0;
				req.yelpData.businesses[req.index].pplGoing=[];
			}
			if(req.index+1<req.maxIndex){
				req.index++;
				logPeopleGoingToVenue(req,res,next);
			}else{
				res.send(req.yelpData);
			}
		});
	}
	
	function sendToClient(data,req,res,next){
		console.log('the first modified datapoint: '+JSON.stringify(data.businesses[0]));
		res.send(data);
	}
	
	function changeNumPplGoing(putRequest,userID){
		Venue.findOne({'uniqueID':putRequest.id},function(err,venue){
			if(err) throw err;
			if(venue){
				if(putRequest.postingType==='increment'){
					venue.numPplGoing++;
					logUserIDToVenue(venue.uniqueID,userID);
				}else{
					venue.numPplGoing--;
					removeUserIDFromVenue(userID,venue);
				}
				venue.save();
			}else{
				console.log('trying to save new venue');
				var newVenue = new Venue();
				newVenue.uniqueID=putRequest.id;
				newVenue.pplGoing.push(userID);
				newVenue.numPplGoing=1;
				newVenue.save();
			}
		})
	}
	
	function removeUserIDFromVenue(userId,venue){
		for(var i=0;i<venue.pplGoing.length;i++){
			if(venue.pplGoing[i]===userId.toString()){
				console.log('the user is no longer going to this venue');
				venue.pplGoing.splice(i,1);
				venue.save();
				return;
			}
		}
		return;
	}
	
	function lookupSavedSearch(req,res,next){
		if(loggedIn){
			SavedSearch.findOne({'sessionID':req.sessionID},function(err,session){
				if(err) throw err;
				if(session){
					req.savedSearchTerm=session.searchCity;
					session.searchCity=undefined;
					session.save();
				}
				next();
			});
		}else{
			next();
		}
	}

	
	function logUserIDToVenue(venueId,userId){
		// console.log('the venue that im searching for: '+venueId);

		Venue.findOne({'uniqueID':venueId},function(err,venue){
			if(err) throw err;
			if(venue){
				console.log('this is what the venue looks like: '+venue);
				if(checkForUserIdInVenue(userId,venue.pplGoing)){
					console.log('this user is already going to this venue!');
					return;
				}else{
					console.log('this user is now going to the venue');
					venue.pplGoing.push(userId);
					venue.save();
					return;
				}
			}
			return;
		});
	}
	
	
	//says ppl are going when they arent
	function checkForUserIdInVenue(userId,pplGoing){
		for(var i=0;i<pplGoing.length;i++){
			if(pplGoing[i]===userId.toString()){
				return true;
			}
		}
		return false;
	}

	var clickHandler = new ClickHandler();

	app.route('/')
		.get(isLoggedIn,lookupSavedSearch,function (req, res) {
			loggedIn = false;
			if(req.user) loggedIn=true;
			var passedInTerm={loggedIn:loggedIn,savedSearch:req.savedSearchTerm};
			res.render(path + '/public/index.ejs',{passedInTerm:passedInTerm});
		})
		.post(yelpSearch,logPeopleGoingToVenue,function (req,res){
			res.send('error');
		})
		.put(function(req,res){
			changeNumPplGoing(req.body,req.user._id);
			res.send('successfully changed the number of people going');
		});
		
		// THIS IS EXACTLY WHAT I NEED
// passport.authenticate('basic', { session: false }),
//   function(req, res) {
//     res.json({ id: req.user.id, username: req.user.username });
//   });
		
		
	app.route('/facebookLogin')
		.post(passport.authenticate('facebook'),function(req,res){
			console.log('trying to login with facebook. Search term: '+JSON.stringify(req.body));
		});

	app.route('/login')
		.get(function (req, res) {
			res.sendFile(path + '/public/login.html');
		});

	app.route('/logout')
		.get(function (req, res) {
			req.logout();
			res.redirect('/login');
		});
		

	app.route('/logUsers')
		.get(logAllUsers,function(req,res){
			res.sendFile(path+'/public/logUsers.html');
		})

	app.route('/api/:id/clicks')
		.get(isLoggedIn, clickHandler.getClicks)
		.post(isLoggedIn, clickHandler.addClick)
		.delete(isLoggedIn, clickHandler.resetClicks);
		
		
		
	// Redirect the user to Facebook for authentication.  When complete,
	// Facebook will redirect the user back to the application at
	//     /auth/facebook/callback
	app.get('/auth/facebooks', passport.authenticate('facebook'));
	
	// Facebook will redirect the user to this URL after approval.  Finish the
	// authentication process by attempting to obtain an access token.  If
	// access was granted, the user will be logged in.  Otherwise,
	// authentication has failed.
	
	
// passport.authenticate('basic', { session: false }),
//   function(req, res) {
//     res.json({ id: req.user.id, username: req.user.username });
//   });
	app.get('/auth/facebook/callback',
	  passport.authenticate('facebook', { successRedirect: '/',
	                                      failureRedirect: '/login' }));
	  //passport.authenticate('facebook'),
   //       function(req,res){
   //     	console.log('callback function req: '+JSON.stringify(req.body)); 	
   //       },{ successRedirect: '/',
   //                                   failureRedirect: '/login' });

	function logAllUsers(req,res,next){
		User.find({},function(err,users){
			if(err) throw err;
			console.log("all registered users: "+users);
		})
		next();
		
	}
};
