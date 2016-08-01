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
var fs = require('fs');
var path = require('path');

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


module.exports.storeCategory_old = function (title, description, parentIds, arrViewOrders, file_name, res, app) {
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

module.exports.storeCategory = function (title, description, cat_type, viewOrder, parentIds, arrViewOrders, file_name, res, app) {
  var tempParentIdsArr = [];
  var len = parentIds.length;
  for(var i=0; i<len; i++){
    var arr = parentIds[i].split(",");
    tempParentIdsArr.push({
      pid: arr[arr.length - 1],
      path: ","+parentIds[i]+",",
      viewOrder: arrViewOrders[i]
    });
  }

  var category = new Category({
    "title": title,
    "description": description,
    "cat_type": cat_type,
    "viewOrder": viewOrder,
    "parentIds": tempParentIdsArr,
    "icon_image": file_name
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

}//store category

module.exports.updateCategory = function (id, title, description, cat_type, viewOrder, parentIds, arrViewOrders, file_name, res, app) {
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
  
  // Saving adress
  Category.find({"_id": id}, {}, function ( err, selcat ) {
    if(err) return res.json({"success": false, "error": "Category does't exist."});
    if(selcat && selcat.length > 0){
      var selcatObj = selcat[0];

      var updateObj = {};
      if(title) updateObj["title"] = title;
      if(description) updateObj["description"] = description;
      if(parentIds) updateObj["parentIds"] = parentIds;
      if(cat_type) updateObj["cat_type"] = cat_type;
      if(file_name) {
        updateObj["icon_image"] = file_name;
        
        try{
          if(selcatObj.icon_image){
            console.log("removing image file");
            var file_loc = path.join(__dirname, '../uploads/', selcatObj.icon_image);
            console.log("remove file : ",file_loc);
            fs.unlinkSync(file_loc);
          }
        }
        catch(e){
          console.log("File delete exception: ",e);
        }
      }
      if(viewOrder) updateObj["viewOrder"] = viewOrder;
      console.log("updateObj: ",updateObj);

      Category.update({"_id": id}, updateObj, function ( err, category ) {
        if (err) {
          //res.status(400);
          console.log("err: ",err);
          return res.json( { success: false, error: "Unable to update category" } );
        }
        if(category){
          // updated successfully
          return res.json({success: true, data: category});
        }
      });
    }
    else{
      res.json({"success": false, "error": "Category does't exist."});
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

  var count_questions_old = function (catList) {
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
                "cat_type": resCat.cat_type,
                "order": resCat.viewOrder,
                "parentIds": resCat.parentIds,
                "description": resCat.description,
                "icon_image": resCat.icon_image,
                // "order": resCat.order, //if order is present add it
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

  var count_questions = function (catList) {
    var resArr = [];
    async.forEachOf(catList, function (resCat, key, parentcallback) {
      var qur = new RegExp(","+resCat._id+",");
      console.log("qur this 1: ",qur);
      Category.find({"parentIds.path": qur}, {})
      .exec(function(err, catData){
        //get all subcategories of all levels
        if(catData){
          var cids = []; //store all subcategory ids
          console.log("catData len: ",catData.length);
          catData.forEach(function(val, key){
            cids.push(val._id);
          });

          Questions.count({"categories.cid": {$in: cids}})
          .exec(function(err, countData){
            var total_questions = 0;
            if(countData){
              total_questions = countData;
            }

            resArr.push({
                "_id": resCat._id,
                "title": resCat.title,
                "created": resCat.created,
                "cat_type": resCat.cat_type,
                "order": resCat.viewOrder,
                "parentIds": resCat.parentIds,
                "description": resCat.description,
                "icon_image": resCat.icon_image,
                // "order": resCat.order, //if order is present add it
                "total_questions": total_questions
              });
              parentcallback();
          });
        }
        else{
          resArr.push({
            "_id": resCat._id,
            "title": resCat.title,
            "created": resCat.created,
            "parentIds": resCat.parentIds,
            "description": resCat.description,
            "icon_image": resCat.icon_image,
            "total_questions": 0
          });
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
    var qur = new RegExp(","+params.parentId+",$"); //get immediate subcat
    // Category.aggregate({$project: {_id: 1, title: 1, description: 1, parentIds: 1, icon_image: 1, created: 1, cat_type: 1, viewOrder: 1}}, {$unwind: "$parentIds"})
    Category.aggregate({"$match": {"parentIds.path": qur}}, {$unwind: "$parentIds"})
    .sort({ "parentIds.viewOrder" : 1})
    // .lean()
    .exec(function ( err, resData ) {
      if (err) return res.json({success: false, error: err});
      // if (resData) return res.json({success: false, data: user});
      if (resData){
        var temp = [];
        resData.forEach(function(val, key){
          if(val.parentIds.pid == params.parentId){
            var obj = val
            obj.viewOrder = val.parentIds.viewOrder;
            // delete obj.parentIds;
            temp.push(obj);
          }
        });
        // return res.json({success: true, data: temp})
        if(showQuestionCounter){
          count_questions(temp);
        }
        else{
          var tempArr = [];
          temp.forEach(function(val, key){
              var obj = val
              obj.order = val.viewOrder;
              delete obj.viewOrder;
              // delete obj.parentIds;
              tempArr.push(obj);
          });
          return res.json({success: true, data: tempArr});
          // return res.json({success: true, data: temp});
        }
      }//if resData
    });
  }
  else if(params.id){
    Category.find({_id: params.id}, {_id: 1, title: 1, description: 1, parentIds: 1, icon_image: 1, created: 1, cat_type: 1, viewOrder: 1})
    .lean()
    .exec(function ( err, resData ) {
      if (err) return res.json({success: false, error: err});
      //if (resData) return res.json({success: true, data: resData});
      if(resData && resData.length == 1){
        /*
        resData[0].editParentIds = []
        async.forEachOf(resData[0].parentIds, function (pids, key, callback) {
            var temp_ids_arr = pids.path.split(",");
            temp_ids_arr.shift();  // Removes the first element from an array and returns only that element.
            temp_ids_arr.pop(); // Removes the last element from an array and returns only that element.

            console.log("temp_ids_arr: ",temp_ids_arr);
            Category.find({_id: {"$in": temp_ids_arr}}, {parentIds: 0})
            .exec(function(err, data){
              console.log("** err: ",err);
              function sortfun (arr, order) {
                  //create a new array for storage
                  var newArray = [];
                  
                  //loop through order to find a matching id
                  for (var i = 0; i < order.length; i++) { 
                      
                      //label the inner loop so we can break to it when match found
                      dance:
                      for (var j = 0; j < arr.length; j++) {
                          
                          //if we find a match, add it to the storage
                          //remove the old item so we don't have to loop long nextime
                          //and break since we don't need to find anything after a match
                          if (arr[j]._id == order[i]) {
                              newArray.push(arr[j]);
                              arr.splice(j,1);
                              break dance;
                          }
                      }
                  }
                  return newArray;
              };

              console.log("-------------------- data : ",data);
              if(data && data.length > 0){
                resData[0].editParentIds = sortfun(data, temp_ids_arr);
              }

              callback();
            });
            //return callback("exceptino"); //intrupt the loop
        }, function (err) {
            if (err) console.error("count_questions err: ", err);
            return res.json({success: true, data: resData[0]});
        });
        */
        return res.json({success: true, data: resData[0]});
      }
      else{
        return res.json({success: true, data: null})
      }
    });
  }
  else if(params.root == 1){
    //show all root categories
    Category.find({parentIds: []}, {_id: 1, title: 1, description: 1, parentIds: 1, icon_image: 1, created: 1, cat_type: 1, viewOrder: 1})
    .lean()
    .exec(function ( err, catData ) {
      if (err) return res.json({success: false, error: err});
      if(catData && showQuestionCounter){
        count_questions(catData);
      }
      else{
        var tempArr = [];
        catData.forEach(function(val, key){
            var obj = val
            obj.order = val.viewOrder;
            delete obj.viewOrder;
            // delete obj.parentIds;
            tempArr.push(obj);
        });
        return res.json({success: true, data: tempArr});
        //  return res.json({success: true, data: catData});        
      }
      // if (catData) return res.json({success: true, data: catData});
    });
  }
  else{
    //show all categories
    Category.find({}, {_id: 1, title: 1, description: 1, parentIds: 1, icon_image: 1, created: 1, cat_type: 1, viewOrder: 1})
    .lean()
    .exec(function ( err, catData ) {
      if (err) return res.json({success: false, error: err});
      // if (catData) return res.json({success: true, data: catData});
      if(catData && showQuestionCounter){
        count_questions(catData);
      }
      else{
        var tempArr = [];
        catData.forEach(function(val, key){
            var obj = val
            obj.order = val.viewOrder;
            delete obj.viewOrder;
            // delete obj.parentIds;
            tempArr.push(obj);
        });
        return res.json({success: true, data: tempArr});
      }
    });
  }
}

module.exports.getCategoryNew_for_testing = function (params, res, app) {
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
    
    // Category.aggregate({$project: {_id: 1, title: 1, description: 1, parentIds: 1, icon_image: 1, created: 1}}, {$unwind: "$parentIds"})
    // .sort({ "parentIds.viewOrder" : 1})
    // .lean()
    var qur = new RegExp("^,"+params.parentId+",$");
    console.log("qur this 1: ",qur);
    // /^,579716066e3408a40fe24130,/
    // Category.find({"parentIds.path": qur}, {})
    Category.aggregate({"$match": {"parentIds.path": qur}}, {$unwind: "$parentIds"})
    .sort({ "parentIds.viewOrder" : 1})
    .exec(function ( err, resData ) {
      if (err) return res.json({success: false, error: err});
      // if (resData) return res.json({success: false, data: user});
      if (resData){
        var temp = [];
        resData.forEach(function(val, key){
          if(qur.test(val.parentIds.path)){
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
        console.log("----------------- resData ---------------------");
         // return res.json({success: true, data: resData});
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
      Category.find({_id: id}, {"icon_image": 1}).lean()
      .exec(function ( err, catData ) {
        if (err) return res.json({success: false, error: err});
        if (catData){
          console.log("*** catData: ", catData);
          if(catData.length > 0 && catData[0].icon_image){
            console.log("removing image file");
            var file_loc = path.join(__dirname, '../uploads/', catData[0].icon_image);
            console.log("file_loc: ",file_loc);
            fs.unlinkSync(file_loc);
          }

          Category.remove({"_id": id}, function ( err, delData ) {
            if (err) return res.json({success: false, error: err});
            if (delData) res.json({success: true, data: delData});

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
          });
        }
      });
    };//resData
  });//find
}
