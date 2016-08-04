// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;




var essayCommentsSchema = new Schema({
    essayId: {type: Schema.Types.ObjectId, required :true},
    comments: {type: String, required :true},
    createdBy: { id: Schema.Types.ObjectId, name: String, utype: String  },
    createdOn: { type: Date, default: Date.now },
    totalLikes: {type: Number, default: 0},
    totalDislike: {type: Number, default: 0},
    totalSpam: {type: Number, default: 0},
    likes: [],
    dislikes: [],
    spam: [],
    parent: { type: Schema.Types.ObjectId, null: true },
});

essayCommentsSchema.index({
    comments: 'text'
});


module.exports = mongoose.model('EssayComments', essayCommentsSchema);
