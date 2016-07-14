// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Answers', new Schema({
    author: {
    	type: Schema.Types.ObjectId, ref: 'User',
    	required: true
    },
    question: {
        type: Schema.Types.ObjectId, ref: 'Questions',
        required: true
    },
    importance: {type: Number, default: null}, //0 : question is not answerable
    answer: {type: Number, default: null},
    comment: {type: String, default: null},
    created: { type: Date, default: Date.now }
}));
