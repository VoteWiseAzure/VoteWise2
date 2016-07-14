// get an instance of mongoose and mongoose.Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('User', new Schema({
    name:{
      type: String,
      lowercase: true
    },
    username: {
      type: String,
      lowercase: true,
      required: true,
      minlength: 3,
      maxlength: 25
    },
    email: {
      type: String,
      lowercase: true,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    zipcode: {
        type: String,        
        required: true
    },
    //geoDiv: {
    //  type: Schema.Types.ObjectId, ref: 'geoDivPA',
    //  required: true
    //},
    //judicialDistrict1: String,
    //judicialDistrict2: String,
    //judicialDistrict3: String,
    admin: {
      type: Boolean,
      required: true
    },

    politician: {
      type:Boolean,
      required: true
    },

    advocate:{
      type: Boolean,
      required: true
    },

    press: {
      type: Boolean,
      required: true
    },

    voter: {
        type: Boolean,
        required: true
    },

   // address: {
   //   type: Schema.Types.ObjectId, ref: 'Address',
   //   required: true
   //},

   created: { type: Date, default: Date.now }


}));

var User = mongoose.model('User');

User.schema.path('email').validate(function (value, respond) {
    User.findOne({ email: value }, function (err, user) {
        if( user ) respond(false);
        if ( !user ) respond( true )
    });
}, 'This email address is already registered');

User.schema.path('username').validate(function (value, respond) {
    User.findOne({ username: value }, function (err, user) {
        if( user ) respond(false);
        if ( !user ) respond( true )
    });
}, 'This useranme is already registered');
