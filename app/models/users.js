'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
	github: {
		id: String,
		displayName: String,
		username: String,
      publicRepos: Number
	},
	facebook:{
	    id: String,
	    displayName: String,
	    username: String
	},
   nbrClicks: {
      clicks: Number
   },
   universalInfo:{
   	displayName:String,
   }
});

module.exports = mongoose.model('User', User);
