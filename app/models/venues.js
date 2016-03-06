'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Venue = new Schema({
    uniqueID:String,
    numPplGoing:Number(),
    pplGoing:[String]
});

module.exports = mongoose.model('Venue', Venue);
