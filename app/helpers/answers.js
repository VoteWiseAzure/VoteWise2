var User = require('../models/user');
var Questions = require('../models/questions');
var Answers = require('../models/answers');
// import eachOf from 'async/eachOf';
var async = require('async');

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
    // console.log("err: ",err);
    // console.log("resData: ",resData);

    if (err) return cb(false);
    if (resData) {
      return (resData.length > 0) ? cb(true) : cb(false); 
    };
  });
};

module.exports.getUserData = function ( id, cb ) {
  console.log("getUserData id: ",id);
  User.find({
    _id: id
  }, {}, function ( err, resData ) {
    console.log("err: ",err);
    //console.log("resData: ",resData);

    if (err) return cb(false);
    if (resData) {
      return (resData.length > 0) ? cb(resData[0]) : cb(false); 
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

module.exports.isAlreadyAnswered = function ( authorId, questionId, cb ) {
  Answers.find({
    author: authorId,
    question: questionId
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

module.exports.storeAnswer = function (author, questionId, importance, answer, comment, res, app) {

  //return res.json({success: true, data: "Yes!"});

  var answer = new Answers({
    author: author,
    question: questionId,
    importance: importance,
    answer: answer,
    comment: comment
  });

  // Saving answer
  answer.save( function ( err, resData ) {
    if (err) {
      //res.status(400);
      return res.json( { success: false, error: err } );
    }

    if(resData){
      return res.json({success: true, data: resData});
    }
  });
}

module.exports.getAnswers = function (params, res, app) {
  console.log("** getQuestions **");
  // list all categories
  /*
  Questions.remove({}, function ( err, user ) {
    if (err) console.log("Unable to delte all");
    if (user) console.log("delte all");
  });
  */

  var query = {};
  if(params.questionId){
    query.question = params.questionId;
  }
  if(params.authorId){
    query.author = params.authorId;
  }
  if(params.id){
    query._id = params.id; 
  }

  console.log("query: ",query);
  
  //show all categories
  Answers.find(query, {author: 1, question: 1, importance: 1, answer: 1, comment: 1, created: 1})
  .exec(function ( err, resData ) {
    if (err) return res.json({success: false, error: err});
    if (resData) return res.json({success: true, data: resData});
  });
}

module.exports.getPopularAnswers = function (categoryIds, authorData, res, app) {
  console.log("** getPopularAnswers **");

  /*
  "voter": false,
  "advocate": false,
  "press": false,
  "politician": true,
  "admin": false,
  */

  console.log("authorData: ",authorData.voter);
  var query = {};
  if(authorData.voter){
    query.politician = true;
  }
  else if(authorData.politician){
    query.voter = true;
  }

  //get all questoins
  Questions.find({"categories.cid": { $in: categoryIds }}, {}).exec(function ( err, qRes ) {
    if (err) return res.json({success: false, error: err});
    //if (resData) return res.json({success: true, data: qRes});
    
    if(qRes){
      //first get all users who are voters/pliticians
      console.log("query: ",query);
      var userArr = [];
      User.find(query, {_id: 1}).exec(function(err, uidRes){
        if(err) return res.json({success: false, error: err});
        if(uidRes){
          uidRes.forEach(function(uVal, key){
            userArr.push(uVal._id);
          });

          console.log("userArr: ",userArr);

          var tempQArr = [];
          async.forEachOf(qRes, function (question, key, callback) {
            Answers.count({"question": question._id, "author": { $in: userArr } }).exec(function(err, countData){
              
              if(err) countData = 0;
              if(countData > 0){
                //if no answerrs skip this question
                
                tempQArr.push({
                  "_id": question._id,
                  "author": question.author,
                  "content": question.content,
                  "created": question.created,
                  "categories": question.categories,
                  "order": question.order,
                  "answer_count": countData
                });
              }

              callback();
            });
            //return callback("exceptino"); //intrupt the loop
          }, function (err) {
              if (err) console.error(err.message);
              //all traversed

              function keySort(key) {
                //sort on key
                return function(a,b){
                  if (a[key] < b[key]) return 1;
                  if (a[key] > b[key]) return -1;
                  return 0;
                }
              }
              return res.json({success: true, data: tempQArr.sort(keySort("answer_count"))});
          });
        }
      });
    }

  });
}

module.exports.removeAnswer = function ( id, res, app ) {

  console.log("removeAnswer: ", id);

  Answers.remove({_id: id}, function ( err, delData ) {
        if (err) res.json({success: false, error: err});
        if (delData) res.json({success: true, data: delData});
  });
}
