var Address = require('../models/address');
var User = require('../models/user');
var Geo = require('../models/geoDivPa');
var Questions = require('../models/questions');
var Category = require('../models/categories');
var Answers = require('../models/answers');

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
    var limit = 10;
    var skipRecord = 0;
    if(params.page && params.page > 0){
      skipRecord = limit * params.page;
    }

    Questions.find({}, {})
    .skip(skipRecord)
    .limit(10)
    .lean()
    .exec(function ( err, resData ) {
      if (err) return res.json({success: false, error: err});
      if (resData) return res.json({success: true, data: resData});
    });
  }
}

module.exports.getQuestionsByRole = function (user_role, res, app) {
  console.log("** getQuestions **");

  var query = {};
  switch(user_role){
      case 'politician':
        query.politician = true;
      break;
      case 'voter':
        query.voter = true;
      break;
      case 'advocate':
        query.advocate = true;
      break;
      case 'press':
        query.press = true;
      break;
  }
  console.log("query: ",query);
  var uids_arr = [];
  User.find(query, {_id: 1})
  .lean()
  .exec(function(err, users){
    if(err) return res.json({success: false, error: err});
    if(users){

      users.forEach(function(val, key){
        uids_arr.push(val._id);
      });

      console.log("uids_arr: ",uids_arr);

      Questions.find({"tagged_users.tagged_by" : {"$in": uids_arr}})
      .exec(function(err, qdata){
        if(err) return res.json({success: false, error: err});
        if(qdata){
          return res.json({success: true, data: qdata});
        }
      });

      // return res.json({success: true, uids: uids_arr});  
    }//if users
  });
}

module.exports.getQuestionsTaggedTo = function (user_id, res, app) {
  console.log("** getQuestionsTaggedTo **: ",user_id);

  Questions.find({"tagged_users.tagged_to" : user_id})
  .exec(function(err, qdata){
    if(err) return res.json({success: false, error: err});
    if(qdata){
      return res.json({success: true, data: qdata});
    }
  });
}

module.exports.getAllQuestionOfSubcat = function (parentCatId, res, app) {
  console.log("* getAllQuestionOfSubcat *");
  //fetch all immediate subcategoies
  Category.find({"parentIds.pid": { $in: parentCatId }}, {_id: 1, title: 1})
  .lean()
  .exec(function (err, catdata) {
    if(err) return res.json({"success": false, error: err});

    var tempCatIds = [];
    catdata.forEach(function (cat, key) {
      tempCatIds.push(cat._id);
    });
    tempCatIds.push(parentCatId);

    Questions.aggregate([
        {
            $match: {
                "categories.cid": {"$in": tempCatIds}
            }
        },
        {
          $project: {
            _id: 1,
            author: 1,
            content: 1,
            created: 1,
            categories: 1
          }
        },
        {
          $sort: {
              "categories.viewOrder": -1 
          }
        },
        {
          "$unwind" : "$categories"
        }
    ], function (err, qdata) {
        if (err) {
            return res.json({"success": false, data: err});
        } else {
            return res.json({"success": true, data: qdata});
        }
    });
  });
}

module.exports.removeQuestion = function ( id, res, app ) {

  console.log("removeQuestion: ", id);
  Answers.count({"question": id})
  .exec(function(err, countData){
    if(err) return res.json({"success": false, "error": err});
    if(countData > 0){
      return res.json({"success": false, "error": "Can't remove question, the question has answers."});
    }
    else{
      Questions.remove({_id: id}, function ( err, delData ) {
        if (err) res.json({success: false, error: err});
        if (delData) res.json({success: true, data: delData});
      });
    }
  });
}


module.exports.tagUserInQuestion = function ( id, author, arrUserIds, res, app ) {

  console.log("tagUserInQuestion: ", author._id);

  // Questions.remove({_id: id}, function ( err, delData ) {
  //       if (err) res.json({success: false, error: err});
  //       if (delData) res.json({success: true, data: delData});
  // });
  var tempArr = [];
  arrUserIds.forEach(function(val, key){
    tempArr.push({
      "tagged_by": author._id,
      "tagged_to": val
    });
  });

  /*Questions.find({"tagged_users": {"$in": tempArr}}, {_id: 1, tagged_users: 1})
  .exec(function(err, data){
    console.log("err: ",err);
    console.log("data: ",data);
  });*/
  
  /*Questions.update({"_id": id}, {"tagged_users": []})
  .exec(function(err, data){
    if(err) console.log("------- error updated ----------"); ;
    if(data){
     console.log("------- updated ----------"); 
    }
  });*/

  
  Questions.update({"_id": id}, {"$addToSet": {"tagged_users": { "$each": tempArr}}})
  .exec(function(err, data){
    if(err) res.json({"success": false, "data": err});
    if(data){
     return res.json({"success": true, "data": "Tagged Successfully."});
    }
  });
  
  // return res.json({success: true, data: tempArr})
}

module.exports.removeTagUserFromQuestion = function ( id, author, arrUserIds, res, app ) {

  console.log("tagUserInQuestion: ", author._id);

  // Questions.remove({_id: id}, function ( err, delData ) {
  //       if (err) res.json({success: false, error: err});
  //       if (delData) res.json({success: true, data: delData});
  // });
  var tempArr = [];
  arrUserIds.forEach(function(val, key){
    tempArr.push({
      "tagged_by": author._id,
      "tagged_to": val
    });
  });

  /*Questions.find({"tagged_users": {"$in": tempArr}}, {_id: 1, tagged_users: 1})
  .exec(function(err, data){
    console.log("err: ",err);
    console.log("data: ",data);
  });*/
  
  /*Questions.update({"_id": id}, {"tagged_users": []})
  .exec(function(err, data){
    if(err) console.log("------- error updated ----------"); ;
    if(data){
     console.log("------- updated ----------"); 
    }
  });*/

  
  Questions.update({"_id": id}, {"$pull": {"tagged_users": { "$in": tempArr}}}, {multiple: true})
  .exec(function(err, data){
    if(err) res.json({"success": false, "data": err});
    if(data){
     return res.json({"success": true, "data": "Removed Successfully"}) 
    }
  });
  
  // return res.json({success: true, data: tempArr})
}
