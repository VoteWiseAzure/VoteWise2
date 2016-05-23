// get an instance of mongoose and mongoose.Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('User', new Schema({
    name: String,
    username: String,
    password: String,
    admin: Boolean,
    address: { street: String, city: String, state: String ,zip: String }

}));