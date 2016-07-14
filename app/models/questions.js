// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Questions', new Schema({
    author: {
    	type: Schema.Types.ObjectId, ref: 'User',
    	required: true
    },
    content: {type: String, required :true},
    categories: [{
    		cid: {
    			type: Schema.Types.ObjectId, ref: 'Category',
    		},
    		viewOrder: Number
        }],
    created: { type: Date, default: Date.now }
}));
