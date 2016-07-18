// get an instance of mongoose and mongoose.Schema
mongoose = require('mongoose');
Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('lookup', new Schema({

  zcta5: Number,
  zipname: String,
  state: Number,
  stab:String,
  county:Number,
  cntyname:String,
  cousubfp:Number,
  cousubnm:String,
  placefp:Number,
  placenm:String,
  vtd:Number,
  vtdname:String,
  cd113:Number,
  sldu12:Number,
  sldl12:Number,
  sduni:Number,
  uschlnm:String,
  sdelm:Number,
  eschlnm:String,
  sdsec:Number,
  sschlnm:String,
  pop10:Number,
  afact:Number

}));