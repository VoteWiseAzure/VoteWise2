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
    voter_answer: [], //array user id's of 
    politician_answer: [], //array user id's of
    advocate_answer: [], //array user id's of
    press_answer: [], //array user id's of
    total_answers: { type: Number, default: 0 }, //array user id's of
    created: { type: Date, default: Date.now }
}));
