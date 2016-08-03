// get an instance of mongoose and mongoose.Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Gallery', new Schema({
    fileName:{
        type: String,
        lowercase: true
    },
    createdBy: { id: Schema.Types.ObjectId, uname: String, name: String, utype: String  },
    createdOn: { type: Date, default: Date.now }
}));

var Gallery = mongoose.model('Gallery');

