var User = require('../models/user');
var Questions = require('../models/questions');
var Answers = require('../models/answers');
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
  }, {}, function ( err, resData ) {
    // console.log("err: ",err);
    // console.log("resData: ",resData);

    if (err) return cb(null);
    if (resData) {
      return (resData.length > 0) ? cb(resData[0]) : cb(null); 
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

module.exports.getCompareAnswers = function (user, params, userIds, res, app) {
  console.log("** getCompareAnswers **");
  
  var userQuery = {};

  if(!userIds || userIds.length <= 0){
    switch(params.compare_with){
      case 'politician':
        userQuery.politician = true;
      break;
      case 'voter':
        userQuery.voter = true;
      break;
      case 'advocate':
        userQuery.advocate = true;
      break;
      case 'press':
        userQuery.press = true;
      break;
    }
  }
  else{
    userQuery = {"_id": {"$in": userIds}};
  }

  console.log("userQuery: ",userQuery);

  var categoryIds = params.categoryIds ? params.categoryIds.split(",") : [];
  var catQuery = {};
  if(categoryIds.length > 0){
    catQuery = {"categories.cid": { $in: categoryIds }};
  }

  Questions.find(catQuery, {})
  .lean()
  .exec(function(err, quesData){
    console.log("** got questions data **");
    if(err) return res.json({success: false, error: err});
    if(quesData) {
      User.find(userQuery, {"_id": 1, "name": 1})
      .lean()
      .exec(function(err, userData){
        // if(err) return res.json({success: false, error: err});
        
        // var selUserIds = [];
        // if(userData) {
        //   userData.forEach(function(uVal, key){
        //     selUserIds.push(uVal._id);
        //   });
        // }

        var getAnswerByUserIds = function(question_id, userData, compareObj, cb){
          
          var anserArray = [];
          async.forEachOf(userData, function (user_data, key, callback) {
            
            Answers.find({"question": question_id, "author": user_data._id}, {})
            .exec(function(err, ansData){
              if(err) console.log("err: ",err);
              if(ansData && ansData.length > 0){
                anserArray.push({
                  // author: user_data,
                  "author": user_data,
                  "_id": ansData[0]._id,
                  "created": ansData[0].created,
                  "comment": ansData[0].comment,
                  "answer": ansData[0].answer,
                  "importance": ansData[0].importance,
                  "match": 100-20*(Math.abs(compareObj.answer-ansData[0].answer))
                });
              }
              callback();
            });
          }, function (err) {
              if (err) console.error(err.message);
              cb(anserArray);
          });
        };

        var tempQArr = [];

        async.forEachOf(quesData, function (question, key, callback) {
            Answers.find({author: user._id, "question": question._id})
            .lean()
            .exec(function(err, compareObj){
              if(compareObj && compareObj.length > 0){
                getAnswerByUserIds(question._id, userData, compareObj[0], function(obj){
                  tempQArr.push({
                    "_id": question._id,
                    "content": question.content,
                    "categories": question.categories,
                    "my_answer": {
                      // author: user,
                      "_id": compareObj[0]._id,
                      "author": compareObj[0].author,
                      "created": compareObj[0].created,
                      "comment": compareObj[0].comment,
                      "answer": compareObj[0].answer,
                      "importance": compareObj[0].importance
                    },
                    "answers": obj
                  });
                  callback();  
                });
              }
              else{
                // tempQArr.push({
                //   _id: question._id,
                //   content: question.content,
                //   my_answer: null,
                //   answers: null
                // });
                callback();
              }
            });
          //return callback("exceptino"); //intrupt the loop
        }, function (err) {
          if (err) console.error(err.message);
          //all traversed
          return res.json({success: true, data: tempQArr});
        });
      });
    }//if quesData
  });
}

module.exports.getCompareAnswersNew = function (user, params, userIds, res, app) {
  console.log("** getCompareAnswers **");
  
  var userQuery = {};

  if(!userIds || userIds.length <= 0){
    switch(params.compare_with){
      case 'politician':
        userQuery.politician = true;
      break;
      case 'voter':
        userQuery.voter = true;
      break;
      case 'advocate':
        userQuery.advocate = true;
      break;
      case 'press':
        userQuery.press = true;
      break;
    }
  }
  else{
    userQuery = {"_id": {"$in": userIds}};
  }

  console.log("userQuery: ",userQuery);

  var categoryIds = params.categoryIds ? params.categoryIds.split(",") : [];

  Answers.find({"author": {"$in": userIds}}, {})
  .lean()
  .exec(function(err, ansData){
    if(err) console.log("err: ",err);
    // if(ansData && ansData.length > 0){
    //   anserArray.push({
    //     // author: user_data,
    //     "author": user_data,
    //     "_id": ansData[0]._id,
    //     "created": ansData[0].created,
    //     "comment": ansData[0].comment,
    //     "answer": ansData[0].answer,
    //     "importance": ansData[0].importance,
    //     "match": 100-20*(Math.abs(compareObj.answer-ansData[0].answer))
    //   });
    // }

    if(ansData){
      var questionArr = [];
      async.forEachOf(ansData, function (ans, key, callback) {
        Questions.find({"_id": ans.question}, {})
        .lean()
        .exec(function(err, quesData){
          questionArr.push(quesData[0]);
          callback();
        });
        //return callback("exceptino"); //intrupt the loop
      }, function (err) {
        if (err) console.error(err.message);
        //all traversed
        return res.json({success: true, data: questionArr});
      }); 
      // return res.json({success: true, data: ansData});
    }
    else return res.json({success: true, data: []});
  });        



  //-------------------------------------

  /*
  Questions.find({"categories.cid": { $in: categoryIds }}, {})
  .exec(function(err, quesData){
    console.log("** got questions data **");
    if(err) return res.json({success: false, error: err});
    if(quesData) {
      User.find(userQuery, {password: 0})
      .exec(function(err, userData){

        var getAnswerByUserIds = function(question_id, userData, compareObj, cb){
          
          var anserArray = [];
          async.forEachOf(userData, function (user_data, key, callback) {
            
            Answers.find({"question": question_id, "author": user_data._id}, {})
            .exec(function(err, ansData){
              if(err) console.log("err: ",err);
              if(ansData && ansData.length > 0){
                anserArray.push({
                  // author: user_data,
                  "author": user_data,
                  "_id": ansData[0]._id,
                  "created": ansData[0].created,
                  "comment": ansData[0].comment,
                  "answer": ansData[0].answer,
                  "importance": ansData[0].importance,
                  "match": 100-20*(Math.abs(compareObj.answer-ansData[0].answer))
                });
              }
              callback();
            });
          }, function (err) {
              if (err) console.error(err.message);
              cb(anserArray);
          });
        };

        var tempQArr = [];

        async.forEachOf(quesData, function (question, key, callback) {
            Answers.find({author: user._id, "question": question._id})
            .exec(function(err, compareObj){
              if(compareObj && compareObj.length > 0){
                getAnswerByUserIds(question._id, userData, compareObj[0], function(obj){
                  tempQArr.push({
                    _id: question._id,
                    content: question.content,
                    my_answer: {
                      // author: user,
                      "_id": compareObj[0]._id,
                      "author": compareObj[0].author,
                      "created": compareObj[0].created,
                      "comment": compareObj[0].comment,
                      "answer": compareObj[0].answer,
                      "importance": compareObj[0].importance
                    },
                    answers: obj
                  });
                  callback();  
                });
              }
              else{
                tempQArr.push({
                  _id: question._id,
                  content: question.content,
                  my_answer: null,
                  answers: null
                });
                callback();
              }
            });
          //return callback("exceptino"); //intrupt the loop
        }, function (err) {
          if (err) console.error(err.message);
          //all traversed
          return res.json({success: true, data: tempQArr});
        });
      });
    }//if quesData
  });
  */
  //--------------------------------------

}