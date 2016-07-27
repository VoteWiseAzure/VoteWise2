// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Category', new Schema({
    title: {
      type: String,
      required: true
    },
    icon_image: {
      type: String,
      default: null
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
        path: {
          type: String,
          index: true,
          default: null
        },
        viewOrder:{
        	type: Number,
        	default: 0
        }
      }
    ],
    cat_type: {
      type: String, //F = for forum,Q = for questoin, B = for both question and forum 
      default: "B"
    },
    viewOrder: {
      type: Number,
      default: 0,
    },
    created: { type: Date, default: Date.now }
}));
