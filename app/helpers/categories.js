var Address = require('../models/address');
var User = require('../models/user');
var Geo = require('../models/geoDivPa');
var Advocate = require('../models/advocate');
var Category = require('../models/categories');
var Questions = require('../models/questions');

var saltRounds = 10;
var bcrypt = require('bcrypt');
var async = require('async');
var mailer = require('../middleware/mailer');
var jwt = require('jsonwebtoken');

var helpers = require('./controllers');

module.exports.isValidParentIds = function ( ids, cb ) {
  console.log("ids: ",ids);
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


module.exports.storeCategory = function (title, description, parentIds, arrViewOrders, file_name, res, app) {
  // Making new adress
  var tempParentIdsArr = [];
  var len = parentIds.length;
  for(var i=0; i<len; i++){
    tempParentIdsArr.push({
      pid: parentIds[i],
      viewOrder: arrViewOrders[i]
    });
  }
  
  console.log("tempParentIdsArr: ",tempParentIdsArr);

  var category = new Category({
    title: title,
    description: description,
    parentIds: tempParentIdsArr,
    icon_image: file_name
  });

  // Saving adress
  category.save( function ( err, category ) {
    if (err) {
      //res.status(400);
      console.log("err: ",err);
      return res.json( { success: false, error: "Unable to add category" } );
    }

    if(category){
      return res.json({success: true, data: category});
    }
  });
}

module.exports.updateCategory = function (id, title, description, parentIds, arrViewOrders, file_name, res, app) {
  // Making new adress
  var tempParentIdsArr = [];
  if(parentIds){
    var len = parentIds.length;
    for(var i=0; i<len; i++){
      tempParentIdsArr.push({
        pid: parentIds[i],
        viewOrder: arrViewOrders[i]
      });
    } 
  }
  
  console.log("tempParentIdsArr: ",tempParentIdsArr);
  var updateObj = {};
  if(title) updateObj["title"] = title;
  if(description) updateObj["description"] = description;
  if(parentIds) updateObj["parentIds"] = parentIds;
  if(file_name) updateObj["icon_image"] = file_name;
  console.log("updateObj: ",updateObj);
  // Saving adress
  Category.update({"_id": id}, updateObj, function ( err, category ) {
    if (err) {
      //res.status(400);
      console.log("err: ",err);
      return res.json( { success: false, error: "Unable to update category" } );
    }

    if(category){
      return res.json({success: true, data: category});
    }
  });
}

module.exports.getCategory = function (params, res, app) {
  // list all categories
  /*
  Category.remove({}, function ( err, user ) {
    if (err) console.log("unable to delte all");
    if (user) console.log("delte all");
  });
  */

  var count_questions = function (catList) {
    var resArr = [];
    async.forEachOf(catList, function (resCat, key, parentcallback) {

      Category.find({"$or": [{"parentIds.pid": resCat._id}, {"_id": resCat._id}]}, {"_id": 1})
      .lean()
      .exec(function(err, catData){
        if(catData){
          var total_questions = 0;
          async.forEachOf(catData, function (cat, key, callback) {
              Questions.count({"categories.cid": cat._id})
              .exec(function(err, countData){
                var temp_counter = 0;
                if(countData){
                  temp_counter = countData;
                }

                total_questions += temp_counter;
                callback();
              });
              //return callback("exceptino"); //intrupt the loop
          }, function (err) {
              if (err) console.error("count_questions err: ", err);
              // resCat.total_questions = total_questions;
              resArr.push({
                "_id": resCat._id,
                "title": resCat.title,
                "created": resCat.created,
                "parentIds": resCat.parentIds,
                "description": resCat.description,
                "icon_image": resCat.icon_image,
                "order": resCat.order, //if order is present add it
                "total_questions": total_questions
              });
              // resCat.total_questions = total_questions;
              // resArr.push(resCat);
              parentcallback();
          });
        }
        else{
          // resArr.push(resCat);
          // resCat.total_questions = 0;
          
          resArr.push({
            "_id": resCat._id,
            "title": resCat.title,
            "created": resCat.created,
            "parentIds": resCat.parentIds,
            "description": resCat.description,
            "icon_image": resCat.icon_image,
            "total_questions": 0
          });
          
          // resArr.push(resCat);
          parentcallback();
        }
      });
        //return callback("exceptino"); //intrupt the loop
    }, function (err) {
      if(params.parentId)//for subcategories sort by view order
        return res.json({success: true, data: resArr.sort(helpers.keySort("order", 1))});
      else
        return res.json({success: true, data: resArr.sort(helpers.keySortByDate("created", 1))});
    });
    
  };

  var showQuestionCounter = (params.questions_counter == 1) ? true : false;

  console.log("params: ",params);
  if(params.parentId){
    //show all the subcategories of given parent id
    // searchParam = { parentIds: { $elemMatch: { pid: params.parentId } } };
    
    Category.aggregate({$project: {_id: 1, title: 1, description: 1, parentIds: 1, icon_image: 1, created: 1}}, {$unwind: "$parentIds"})
    // .sort({ "parentIds.viewOrder" : 1})
    // .lean()
    .exec(function ( err, resData ) {
      if (err) return res.json({success: false, error: err});
      // if (resData) return res.json({success: false, data: user});
      if (resData){
        var temp = [];
        resData.forEach(function(val, key){
          if(val.parentIds.pid == params.parentId){
            var obj = val
            obj.order = val.parentIds.viewOrder;
            delete obj.parentIds;
            temp.push(obj);
          }
        });
        // return res.json({success: true, data: temp})
        if(showQuestionCounter){
          count_questions(temp);
        }
        else{
          return res.json({success: true, data: temp});
        }
      }//if resData
    });
  }
  else if(params.id){
    Category.find({_id: params.id}, {_id: 1, title: 1, description: 1, parentIds: 1, icon_image: 1, created: 1})
    .exec(function ( err, resData ) {
      if (err) return res.json({success: false, error: err});
      //if (resData) return res.json({success: true, data: resData});
      if(resData && resData.length == 1){
        return res.json({success: true, data: resData[0]});
      }
      else{
        return res.json({success: true, data: null})
      }
    });
  }
  else if(params.root == 1){
    //show all root categories
    Category.find({parentIds: []}, {_id: 1, title: 1, description: 1, parentIds: 1, icon_image: 1, created: 1})
    .lean()
    .exec(function ( err, catData ) {
      if (err) return res.json({success: false, error: err});
      if(catData && showQuestionCounter){
        count_questions(catData);
      }
      else{
        return res.json({success: true, data: catData});        
      }

      // if (catData) return res.json({success: true, data: catData});
    });
  }
  else{
    //show all categories
    Category.find({}, {_id: 1, title: 1, description: 1, parentIds: 1, icon_image: 1, created: 1})
    .exec(function ( err, catData ) {
      if (err) return res.json({success: false, error: err});
      // if (catData) return res.json({success: true, data: catData});
      if(catData && showQuestionCounter){
        count_questions(catData);
      }
      else{
        return res.json({success: true, data: catData});
      }
    });
  }
}

module.exports.removeCategory = function ( id, res, app ) {

  console.log("removeCategory 1:", id);

  Category.find({"_id": id}, {_id: 1, title: 1, parentIds: 1})
  .exec(function ( err, resData ) {
    if (err) return res.json({success: false, error: err});
    if (resData) {
  
      Category.remove({_id: id}, function ( err, delData ) {
        if (err) return res.json({success: false, error: err});
        if (delData) res.json({success: true, data: delData});
      });


      Category.find({ parentIds: { $elemMatch: { pid: id } } }, {_id: 1})
      .exec(function ( err, selData ) {
        if(selData){
          selData.forEach(function(val, key){
            //remove subcategories if any
            console.log("* subcategories: ", val._id);
            Category.update({_id: val._id},
              { $pull:  {parentIds: { pid: id }} },
              {multi: true})
            .exec(function ( err, delData2 ) {
              if (err) return res.json({success: false, error: err});
              if (delData2) console.log("deleted key: "+key+" delData: "+delData2);;
            });
          });
        }
      });
    };//resData
  });//find
}
