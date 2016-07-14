var Address = require('../models/address');
var User = require('../models/user');
var Geo = require('../models/geoDivPa');
var Questions = require('../models/questions');
var Category = require('../models/categories');

var saltRounds = 10;
var bcrypt = require('bcrypt');

var mailer = require('../middleware/mailer');
var jwt = require('jsonwebtoken');

var helpers = require('./controllers');

module.exports.isValidUser = function ( id, cb ) {
  console.log("isValidUser id: ",id);
  User.find({
    _id: id
  }, {_id: 1}, function ( err, resData ) {
    console.log("err: ",err);
    console.log("resData: ",resData);

    if (err) return cb(false);
    if (resData) {
      return (resData.length > 0) ? cb(true) : cb(false); 
    };
  });
};

module.exports.isQuestionExist = function ( id, cb ) {
  console.log("isQuestionExist id: ",id);
  Questions.find({
    _id: id
  }, {_id: 1}, function ( err, resData ) {
    console.log("err: ",err);
    console.log("resData : ",resData);

    if (err) return cb(false);
    if (resData) {
      return (resData.length > 0) ? cb(true) : cb(false); 
    };
  });
};

module.exports.isValidCategoryIds = function ( ids, cb ) {
  console.log("isValidCategoryIds: ",ids);
  Category.find({
    _id: {$in: ids}
  }, {_id: 1}, function ( err, category ) {
    console.log("err: ",err);
    console.log("category: ",category);

    if (err) return cb(false);
    if (category) {
      if(category.length == ids.length){
        return cb(true);
      }
      else
        return cb(false);
    };
  });
}

module.exports.storeQuestion = function (author, content, categories, viewOrders, res, app) {
  // Adding new question
  var arrCategories = [];
  //length of categories and vieworders must be same
  categories.forEach(function (val, key) {
    arrCategories.push({cid: val, viewOrder: viewOrders[key]});
  });

  console.log("arrCategories: ", arrCategories);

  var question = new Questions({
    author: author,
    content: content,
    categories: arrCategories
  });


  //return res.json({success: true, error: "Unable to add question."});
  
  // Saving question
  question.save( function ( err, resData ) {
    if (err) {
      //res.status(400);
      return res.json( { success: false, error: err } );
    }

    if(resData){
      return res.json({success: true, data: resData});
    }
  });
}

module.exports.updateQuestion = function (id, content, categories, viewOrders, res, app) {
  // Updating existing question
  
  var query = {  };
  if(content){
    query.content = content;
  }

  if(categories && categories.length > 0){
    categories.forEach(function (val, key) {
      arrCategories.push({cid: val, viewOrder: viewOrders[key]});
    });

    query.categories = arrCategories;  
  }

  console.log("update query: ", query);

  Questions.update({_id: id}, query, {multi: false}, function (err, resData) {
    if(err) return res.json({success: false, error: err});
    if(resData) return res.json({success: true, data: resData});
  });
}

module.exports.getQuestions = function (params, res, app) {
  console.log("** getQuestions **");
  // list all categories
  /*
  Questions.remove({}, function ( err, user ) {
    if (err) console.log("Unable to delte all");
    if (user) console.log("delte all");
  });
  */
  
  console.log("params: ",params);
  if(params.categoryId){
    Questions.aggregate({$project: {_id: 1, author: 1, content: 1, created: 1, categories: 1}}, {$unwind: "$categories"})
    .sort({ "categories.viewOrder" : 1})
    .exec(function ( err, resData ) {
      if (err) return res.json({success: false, error: err});
      // if (resData) return res.json({success: false, data: resData});
      if (resData){
        var temp = [];
        resData.forEach(function(val, key){
          if(val.categories.cid == params.categoryId){
            var obj = val
            obj.order = val.categories.viewOrder;
            //delete obj.categories;
            temp.push(obj);
          }
        });
        return res.json({success: true, data: temp})
      }
    });
  }
  else if(params.authorId){
    //show all categories
    Questions.find({author: params.authorId}, {})
    .exec(function ( err, resData ) {
      if (err) return res.json({success: false, error: err});
      if (resData) return res.json({success: true, data: resData});
    });
  }
  else if(params.id){
    //show all categories
    console.log("showing for id *");
    Questions.find({_id: params.id}, {})
    .exec(function ( err, resData ) {
      if (err) return res.json({success: false, error: err});
      if (resData) return res.json({success: true, data: resData});
    });
  }
  else{
    //show all categories
    Questions.find({}, {})
    .exec(function ( err, resData ) {
      if (err) return res.json({success: false, error: err});
      if (resData) return res.json({success: true, data: resData});
    });
  }
  
}

module.exports.removeQuestion = function ( id, res, app ) {

  console.log("removeQuestion: ", id);

  Questions.remove({_id: id}, function ( err, delData ) {
        if (err) res.json({success: false, error: err});
        if (delData) res.json({success: true, data: delData});
  });
}
