// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports


var essaySchema = new Schema({
    title: {type: String, required :true},
    description: {type: String, required :true},
    parentcat: {type: Schema.Types.ObjectId, ref: 'Category' },
    subcategories: [],
    createdBy: { id: Schema.Types.ObjectId, name: String, utype: String  },
    createdOn: { type: Date },
    updatedOn: { type: Date, default: Date.now },
    location: { type: String, index: true }, 
    informative: [{
        vote: Number,
        user: { id: Schema.Types.ObjectId, name: String, utype: String  }
    }],
    truthful: [{
        vote: Number,
        user: { id: Schema.Types.ObjectId, name: String, utype: String  }
    }], 
    likes: [{
        vote: Number,
        user: { id: Schema.Types.ObjectId, name: String, utype: String  }
    }],
    dislikes: [{
        vote: Number,
        user: { id: Schema.Types.ObjectId, name: String, utype: String  }
    }],
    spam: [{
        vote: Number,
        user: { id: Schema.Types.ObjectId, name: String, utype: String  }
    }],
    postSticky: { type: String, default: 'N' },
    postOrder: { type: Number, default: 0 },
    mediaType: { type: String , default: 'Text' },
    restrictedTo: { type: String }
});

essaySchema.index({
    description: 'text',
    title: 'text'
});


module.exports = mongoose.model('Essay', essaySchema);