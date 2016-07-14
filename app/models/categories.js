// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Category', new Schema({
    title: {
      type: String,
      required: true
    },
    description: {
    	type: String,
    	default: null
    },
    parentIds: [
      {
      	pid: {
      		type: Schema.ObjectId,
      		index: true
      	},
        viewOrder:{
        	type: Number,
        	default: 0
        }
      }
    ],
    created: { type: Date, default: Date.now }
}));
