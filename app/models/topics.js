// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Topics', new Schema({
    title: {type: String, required :true},
    description: {type: String, required :true},
    parentcat: {type: Schema.Types.ObjectId, ref: 'Category' },
    subcategories: {type: Schema.Types.ObjectId, ref: 'SubCategory' },
    createdBy: { id: Schema.Types.ObjectId, name: String  },
    createdOn: { type: Date },
    updatedOn: { type: Date, default: Date.now },
    location: { type: String, index: true }, 
    likes: { type: Number },
    dislikes: { type: Number },
    spam: { type: String },
    sticky: { type: String, default: 'N' },
    resolved: { type: String },
    type: { type: String , default: 'B' },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedOn: { type: Date, default: Date.now },
    restictedTo: { type: String, required :true },
    parent: { type: Schema.ObjectId, index: true }
}));
