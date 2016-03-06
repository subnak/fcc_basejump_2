'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var savedSearch = new Schema({
    sessionID:String,
    searchCity:String
});

module.exports = mongoose.model('savedSearch', savedSearch);