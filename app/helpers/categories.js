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

module.exports.updateCategory = function (id, title, description, cat_type, viewOrder, parentIds, arrViewOrders, file_name, parent_path_id, parent_path_order, res, app) {
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
      var queryObj = {"_id": id};
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

      if(parent_path_id){
        if(!parent_path_order){
          return res.json({"success": false, "error": "'parent_path_order' is required along with 'parent_path_id'."});
        }
        
        queryObj["parentIds._id"]  = parent_path_id;

        updateObj["$set"] = {
          "parentIds.$.viewOrder": parent_path_order,
        };
      }
      
      console.log("updateObj: ",updateObj);

      Category.update(queryObj, updateObj, function ( err, category ) {
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


module.exports.updateParentCategory = function (id, parentIds, arrViewOrders, old_path_ids, viewOrder, res, app) {
  // Making new adress
  var tempParentIdsArr = [];
  if(parentIds){
    var len = parentIds.length;
    for(var i=0; i<len; i++){
      var arr = parentIds[i].split(",");
      tempParentIdsArr.push({
        pid: arr[arr.length - 1],
        path: ","+parentIds[i]+",",
        viewOrder: Number(arrViewOrders[i])
      });
    }
  }
  //for validation
  if(tempParentIdsArr.length > 1){
    return res.json({success: false, error: "Can not update on multiple parent paths."});
  }

  console.log("tempParentIdsArr: ",tempParentIdsArr);
  
  // Saving adress
  Category.find({"_id": id}, {})
  .lean()
  .exec(function ( err, selcat ) {
    if(err) return res.json({"success": false, "error": "Category does't exist."});
    if(selcat && selcat.length > 0){
      var selcatObj = selcat[0];

      var updateObj = {};
      
      // if(parentIds) updateObj["parentIds"] = parentIds;
      // if(viewOrder) updateObj["viewOrder"] = viewOrder;
      
      var old_parent_obj = null;
      var search_path = null;
      var update_path = null;
      if(parentIds){
        var len = selcatObj.parentIds.length;
        console.log("len : ",len);
        if(len <= 0){
          // console.log("--------- shifting root category to child of a node-------");
          search_path = ","+selcatObj._id+",";
          // update_path = 
        }
        else if(len > 0 && old_path_ids){
          for(var i=0; i<len; i++){
            // console.log("i= ",i+" _id: ",selcatObj.parentIds[i]._id);
            if(selcatObj.parentIds[i]._id == old_path_ids){
              // console.log("matched ", selcatObj.parentIds[i]._id, "==", old_path_ids);
              old_parent_obj = selcatObj.parentIds[i];
              search_path = selcatObj.parentIds[i].path+selcatObj._id+",";
              break;
            }
          }
        }
      }

      console.log("old_path_id: ",old_path_ids);
      console.log("search_path: ",search_path);
      console.log("update_path: ",update_path);
      console.log("-----------------------------------");
      console.log("tempParentIdsArr: ",tempParentIdsArr);

      if(search_path && tempParentIdsArr.length > 0){
        var regex = new RegExp("^"+search_path);
        // if(search_path == tempParentIdsArr[0].path){
        if(regex.test(tempParentIdsArr[0].path)){
          return res.json({"success": false, "error": "Can not update on same route."});
        }
      }

      var updateChildCatArr = [];
      var qur = new RegExp("^"+search_path);
      console.log("RegExp Quer: ",qur);

      var preantIdslen = selcatObj.parentIds.length;
      // console.log("selcatObj: ",selcatObj);
      console.log("preantIdslen: ",preantIdslen);
      
      if(preantIdslen <= 0 && tempParentIdsArr.length > 0){
        //it was a root
        console.log("----- udpating root category ------");
        var newUpdatedPath = tempParentIdsArr[0].path+selcatObj._id+",";
        console.log("newUpdatedPath : ",newUpdatedPath);
        
        // Category.update({"_id": id}, {"$addToSet": {"parentIds": { "$each": tempParentIdsArr}}})
        // .exec(function ( err, category ){
        //   if(err) return res.json({"success": false, "error": "Update failed."});
        //   if(category){
        //     Category.update({"parentIds.path": qur}, {"$set": {"parentIds.$.path": newUpdatedPath}})
        //     .exec(function ( err, category ){
        //       if(err) return res.json({"success": false, "error": "Category updated, but child noeds are not updated."});
        //       if(category)
        //         return res.json({"success": true, "data": "Updated successfully."});
        //     });
        //   }
        // });
        
        Category.update({"_id": id}, {"$addToSet": {"parentIds": { "$each": tempParentIdsArr}}})
        .exec(function ( err, data ){
          if(err) return res.json({"success": false, "error": "Update failed."});
          if(data){
            Category.find({"parentIds.path": qur})
            .lean()
            .exec(function ( err, category ){
              if(err) return res.json({"success": false, "error": "Category updated, but child noeds are not updated."});
              if(category){
                async.forEachOf(category, function (cat, key, callback) {
                  cat.parentIds.forEach(function(val, i){
                    var tempParentObj = category[key].parentIds[i];
                    if(qur.test(tempParentObj.path)){
                      tempParentObj.path = tempParentObj.path.replace(qur, newUpdatedPath);
                       Category.update({"parentIds._id": tempParentObj._id}, {"$set": {"parentIds.$.path": tempParentObj.path}})
                      .exec(function ( err, category ){
                        if(err) console.log("error: ",err);
                        if(category){
                          console.log("--saved--");
                        } 
                      });
                    }
                  });
                  callback();
                }, function (err) {
                  return res.json({"success": true, "data": "Updated successfully."});
                });
              }//if data
            });
          }
        });
      }// if updated category was a root //completed
      else if(preantIdslen > 0 && tempParentIdsArr.length > 0){
        console.log("----- udpating sub category ------");
        var newUpdatedPath = tempParentIdsArr[0].path+selcatObj._id+",";
        console.log("newUpdatedPath : ",newUpdatedPath);

        if(!old_path_ids){
          //old_path_ids is required
          return res.json({"success": false, "error": "'old_path_ids' parameter is required for this category."});
        }

        Category.update({"parentIds._id": old_path_ids}, 
          {
            "$set": {
              "parentIds.$.pid": tempParentIdsArr[0].pid,
              "parentIds.$.path": tempParentIdsArr[0].path,
              "parentIds.$.viewOrder": tempParentIdsArr[0].viewOrder,
            }
          }
        )
        .exec(function (err, data ){
          if(err) return res.json({"success": false, "error":"Update failed."});
          if(data){
            Category.find({"parentIds.path": qur})
            .lean()
            .exec(function ( err, category ){
              if(err) return res.json({"success": false, "error": "Category updated, but child noeds are not updated."});
              if(category){
                async.forEachOf(category, function (cat, key, callback) {
                  cat.parentIds.forEach(function(val, i){
                    var tempParentObj = category[key].parentIds[i];
                    if(qur.test(tempParentObj.path)){
                      tempParentObj.path = tempParentObj.path.replace(qur, newUpdatedPath);
                      
                      var tParentIds = tempParentObj.path.split(",");
                      tParentIds.pop();//remove last "" char from array
                      var imediateParentId = tParentIds.pop();

                      Category.update(
                        {"parentIds._id": tempParentObj._id},
                        {
                          "$set": {
                            "parentIds.$.path": tempParentObj.path,
                            "parentIds.$.pid": imediateParentId
                          }
                        }
                      )
                      .exec(function ( err, category ){
                        if(err) console.log("error: ",err);
                        if(category){
                          console.log("--saved--");
                        }
                      });
                    }
                  });
                  callback();
                }, function (err) {
                  return res.json({"success": true, "data": "Updated successfully."});
                });
              }//if category
            });
          }//if data
        });
      }//if updatting sub categoy //completed
      else if(tempParentIdsArr.length == 0){
        console.log("----- make this category as root category -----");
        viewOrder = viewOrder ? viewOrder : 0;
        var qurArr = [];
        selcatObj.parentIds.forEach(function(val, key){
          qurArr.push({
            "search_path": new RegExp("^"+val.path+selcatObj._id+","),
            "new_path": ","+selcatObj._id+","
            // "pid": no need to update pid, it will be at last of the path so no problem here
          });
        });

        console.log("qurArr: ",qurArr);

        Category.update(
          {"_id": id}, 
          { 
            "viewOrder": viewOrder,
            "parentIds": []
          }
        )
        .exec(function (err, data){
          if(err) return res.json({"success": false, "error": err});
          if(data){
            // var tempUpdateCatArr = [];
            async.forEachOf(qurArr, function (qobj, key, callback) {
              Category.find(
                {"parentIds.path": qobj.search_path}, 
                {"parentIds": 1, "title": 1}
              )
              .exec(function (err, data) {
                if(err) console.log("select error: ",err);
                if (data){
                  data.forEach(function(cat, i){
                    cat.parentIds.forEach(function(parentObj, j){
                      if(qobj.search_path.test(parentObj.path)){
                        parentObj.path = parentObj.path.replace(qobj.search_path, qobj.new_path);
                        data[i].parentIds[j] = parentObj;
                        Category.update({"parentIds._id": parentObj._id}, {"$set": {"parentIds.$.path": parentObj.path}})
                        .exec(function ( err, cupdate ){
                          if(err) console.log("error: ", err);
                          if(cupdate){
                            console.log("-- saved --");
                          } 
                        });
                      }
                    });
                  });
                  // tempUpdateCatArr = tempUpdateCatArr.concat(data);
                }//if data

                callback();
              });
            },
            function(err) {
              console.log("completed");
              return res.json({"success": true, "data": "Updated successfully."});
            });
          }
        });
      }
      else{
        return res.json({"success": false, "error": "Unable to execute API."});
      }
      
      /*
      var newUpdatedPath = tempParentIdsArr[0].path+selcatObj._id+",";
      console.log("newUpdatedPath : ",newUpdatedPath);
      Category.find({"parentIds.path": qur})
      .lean()
      .exec(function ( err, category ){
        if(err) return res.json({"success": false, "error": "Category updated, but child noeds are not updated."});
        if(category){
          async.forEachOf(category, function (cat, key, callback) {
            cat.parentIds.forEach(function(val, i){
              var tempParentObj = category[key].parentIds[i];
              if(qur.test(tempParentObj.path)){
                tempParentObj.path = tempParentObj.path.replace(qur, newUpdatedPath);
                var tempParentIds = tempParentObj.path.split(",");
                tempParentIds.pop();//remove last "" char from array
                var imediateParentId = tempParentIds.pop();
                console.log("tempParentObj.path *** : ",tempParentObj.path);
                category[key].parentIds[i].path = tempParentObj.path;
                category[key].parentIds[i].viewOrder = tempParentIdsArr[0].viewOrder;
                category[key].parentIds[i].pid = imediateParentId;
                //  Category.update({"parentIds._id": tempParentObj._id}, {"$set": {"parentIds.$.path": tempParentObj.path}})
                // .exec(function ( err, category ){
                //   if(err) console.log("error: ",err);
                //   if(category){
                //     console.log("--saved--");
                //   }
                // });
              }
            });
            callback();
          }, function (err) {
            return res.json({"success": true, "data": category});
          });
        }//if category
      });
      */
      // return res.json({"success": false, "error": "Can update."});
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
      // console.log("count qur: : ",qur);
      Category.find({"parentIds.path": qur}, {})
      .exec(function(err, catData){
        //get all subcategories of all levels
        /*
        if(catData){
          var cids = []; //store all subcategory ids
          cids.push(resCat._id);
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
        */

        var cids = []; //store all subcategory ids
        cids.push(resCat._id);
        // console.log("catData len: ",catData.length);
        catData.forEach(function(val, key){
          cids.push(val._id);
        });

        Questions.count({"categories.cid": {"$in": cids}})
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

module.exports.getAnswerCount = function (arrCatIds, res, app) {
  /*Questions.find({"categories.cid": id, "total_answers": {"$gt": 0}}, {})
  .exec(function (err, qdata) {
    if(err) return res.json({"success": false, "error": err});
    if(qdata){
      return res.json({"success": true, "data": qdata});
    }
  });*/

  Questions.count({"categories.cid": {"$in": arrCatIds}, "total_answers": {"$gt": 0}})
  .exec(function(err, countData){
    if(err) return res.json({"success": false, "error": err});

    return res.json({"success": true, "data": countData});
  });
}

module.exports.getPopularBackground = function (parentId, res, app) {
  //get all questoins
  Category.find({"parentIds.pid": parentId}, {_id: 1, title: 1, description: 1})
  .sort({ "parentIds.viewOrder" : 1})
  .lean()
  .exec(function (err, catdata) {
    if(err) return res.json({"success": false, error: err});
    // return res.json({"success": true, data: catdata});
    var tempCatIds = [];
    catdata.forEach(function (cat, key) {
      tempCatIds.push(cat._id);
    });

    Questions.distinct("categories.cid", {
        "total_answers": {"$gt": 0},
        "categories.cid": {"$in": tempCatIds}
      }, function (err, arrCatids) {
      if (err) return res.json({success: false, error: err});
      // return res.json({success: true, data: arrCatids});
      // got most popular categories
      console.log("arrCatids: ",arrCatids);

      var getCatFromArr = function  (id) {
        console.log("id: ", id);
        var len = catdata.length;
        for (var i = 0; i < len; i++) {
          if(id.toString() == catdata[i]._id.toString()){
            return catdata[i];
          }
        };
        return null;
      };

      var tempResArr = [];
      arrCatids.forEach(function (val, key) {
        var catobj = getCatFromArr(val);
        if(catobj) tempResArr.push(catobj);
      });

      return res.json({"success": true, data: tempResArr});
    });
  });
}//getPopularBackground

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

function getAllTree(parentId, subcategories, finalData, mycallback) {
    Category.find({"parentIds.pid": parentId})
      .exec(function ( err, resData ) {
        if (err) return res.json({success: false, error: err});
        if (resData && resData.length > 0) {
              //var finalsub = [];
              var finData = [];
              //if(resData.length > 1) {
                  async.forEachOf(resData, function (val, key, callback) {
                    var finalOnj = val.toObject();
                    getAllTree(val._id, subcategories, finalData, function(sub) {
                        finalOnj.subcategories = sub;
                        
                        finData.push(finalOnj);
                        callback();
                      });

                  }, function(err) {

                      mycallback(finData);
                  });
 
          
        } else {
                
              mycallback(false);  
        }
    });
}

module.exports.getAllSubCategory = function(data,res,app) {
  console.log(data);
  console.log(data.parentId);
  var parentId = data.parentId;
  if(parentId) {
    var finalData = [];
    var subcategories = [];
       //getAllTree(parentId, subcategories, finalData,res,app);
        Category.find({"parentIds.pid": parentId})
        .exec(function ( err, resData ) {
          if (err) return res.json({success: false, error: err});
          if (resData && resData.length > 0) {

                async.forEachOf(resData, function (val, key, callback) {
                  var finalOnj = val.toObject();
                 
                  
                  
                  // tempUpdateCatArr = tempUpdateCatArr.concat(data);
                  getAllTree(val._id, subcategories, finalData, function(sub) {
                    finalOnj.subcategories = sub;
                    console.log("=====Final called=========");
                    finalData.push(finalOnj);  
                    callback();
                  });
                  
                  
                  
                }, 
                function (err) {
                  // body...
                  //console.log("Final Data");
                  //console.log(finalData);
                  return res.json({success: true, data: finalData});
                });
            
          } else {
              return res.json({success: false, data: resData});
          }
      });

  } else {
    return res.json({success: false, data: "No parent id."});
  }
}

module.exports.removeCategory = function ( id, old_path_ids, res, app ) {

  console.log("removeCategory :", id);

  Category.find({"_id": id}, {_id: 1, title: 1, parentIds: 1})
  .exec(function ( err, resData ) {
    if (err) return res.json({success: false, error: err});
    if (resData && resData.length > 0) {
      resData = resData[0];
      
      /*var catData = resData;
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
      });*/
      
      
      Questions.count({"categories.cid": id})
      .exec(function(err, countData){
        if(err) return res.json({"success": false, "error": err});
        if(countData > 0){
          return res.json({"success": false, "error": "Can not remove this category, there are questions in it."});  
        }

        
        var len = resData.parentIds.length;
        var search_path = null;
        var new_path = null;
        if(len > 0){
          for(var i=0; i<len; i++){
            var tempParentObj = resData.parentIds[i];
            if(tempParentObj._id == old_path_ids){
              search_path = tempParentObj.path+resData._id+",";
              // var tempParentIdsArr = resData.parentIds[i].path.split(",");
              // tempParentIdsArr.shift();//remove first "" char from array
              // tempParentIdsArr.pop();//remove last "" char from array
              // var imediateParentId = tempParentIdsArr.pop();
              new_path = tempParentObj.path;
              break;
            }
          }  
        }
        else{
          //we are removing root category
          search_path = ","+resData._id+",";
        }
        
        var removeImageIcon = function (argument) {
          console.log("removing image file");
          try{
            if(resData.icon_image){
              var file_loc = path.join(__dirname, '../uploads/', resData.icon_image);
              console.log("file_loc: ",file_loc);
              fs.unlinkSync(file_loc);
            }
          }
          catch(e){
            console.log("Exception in remove image: ",e);
          }
        };

        var updateChildCategoriesOfSubcat  = function  () {
          console.log("Category updated");

          var qur = new RegExp("^"+search_path);
          console.log("qur: ", qur);
          console.log("new_path: ", new_path);

          Category.find(
            {"parentIds.path": qur},
            {title: 1, parentIds: 1}
          )
          .lean()
          .exec(function (err, catData) {
            if(err) return res.json({success: false, error: "Unable to remove."});
            if(catData){
              var tempUpdateCatArr = [];
              console.log("found  Category : ", catData.length);
              async.forEachOf(catData, function (cat, key, callback) {
                cat.parentIds.forEach(function(val, i){
                  if(qur.test(val.path)){
                    var tempNewPath = val.path.replace(qur, new_path);
                    var tempParentIdsArr = tempNewPath.split(",");
                    tempParentIdsArr.pop(); //remove last blank item from array
                    var imediateParentId = tempParentIdsArr.pop(); //get imediate paten
                    // catData[key].parentIds[i].path = tempNewPath;
                    Category.update(
                      {"parentIds._id": val._id}, 
                      {
                        "$set": {
                          "parentIds.$.path": tempNewPath,
                          "parentIds.$.pid": imediateParentId
                        }
                      }
                    )
                    .exec(function(err, cupdate){
                      if(err) console.log("update error: ",err);
                      if(cupdate) console.log("-- saved --");
                    });
                  }
                });
                // tempUpdateCatArr = tempUpdateCatArr.concat(data);
                callback();
              }, 
              function (err) {
                // body...
                return res.json({success: true, data: "Updated successfully."});
              });
            }
          });
        };

        var updateChildCategoriesOfRootCat  = function  () {
          console.log("Category updated");

          var qurImediateChild = new RegExp("^"+search_path+"$");
          var qur = new RegExp("^"+search_path);

          console.log("qur: ", qur);
          console.log("new_path: ", new_path);

          Category.update(
            { "parentIds.path": qurImediateChild },
            { "$pull": { 'parentIds': {"path": { "$regex": qurImediateChild } } } },
            { multi: true }
          )
          .exec(function (err, updateData) {
            if(err) return res.json({"success": false, "error": "Unable to update child categories."});
            if(updateData){
              //update subcategories
              Category.find(
                {"parentIds.path": qur},
                {title: 1, parentIds: 1}
              )
              .lean()
              .exec(function (err, catData) {
                if(err) return res.json({success: false, error: "Unable to remove."});
                if(catData){
                  var tempUpdateCatArr = [];
                  console.log("found  Category : ", catData.length);
                  async.forEachOf(catData, function (cat, key, callback) {
                    cat.parentIds.forEach(function(val, i){
                      if(qur.test(val.path)){
                        var tempNewPath = val.path.replace(qur, ",");
                        var tempParentIdsArr = tempNewPath.split(",");
                        tempParentIdsArr.pop(); //remove last blank item from array
                        var imediateParentId = tempParentIdsArr.pop(); //get imediate paten

                        catData[key].parentIds[i].path = tempNewPath;
                        
                        Category.update(
                          {"parentIds._id": val._id}, 
                          {
                            "$set": {
                              "parentIds.$.path": tempNewPath,
                              "parentIds.$.pid": imediateParentId
                            }
                          }
                        )
                        .exec(function(err, cupdate){
                          if(err) console.log("update error: ",err);
                          if(cupdate) console.log("-- saved --");
                        });
                        
                      }
                    });
                    // tempUpdateCatArr = tempUpdateCatArr.concat(data);
                    callback();
                  }, 
                  function (err) {
                    // body...
                    return res.json({success: true, data: catData});
                  });
                }
              });
            }//if data
          });//category update
        };

        if(len > 0){
          //we are removing subcategory 
          if(search_path){
            if(len == 1){
              //if there is only one item in parentIds array, completly remove the category
              Category.remove({"_id": id}, function ( err, delData ) {
                if (err) return res.json({success: false, error: err});
                if (delData) {
                  removeImageIcon();
                  updateChildCategoriesOfSubcat();
                };
              });
            }
            else{
              //there are multiple items in parentIds array, reomve only matched item from parentIds array and update child categories parents
              Category.update(
                {"_id": id}, 
                { "$pull": { 'parentIds': { "_id": old_path_ids } } }
              )
              .exec(function (err, updateData) {
                if(err) return res.json({"success": false, "error": "Unable to remove."});
                if(updateData){
                  updateChildCategoriesOfSubcat();
                }//if data
              });//category update
            }
          }//if search_path
          else{
            return res.json({success: false, error: "Invalid 'old_path_ids'."});
          }
        }
        else{
          //we are removing root category
          // return res.json({"success": true, "data": search_path});
          Category.remove({"_id": id}, function ( err, delData ) {
            if (err) return res.json({success: false, error: err});
            if (delData) {
              removeImageIcon();
              updateChildCategoriesOfRootCat();
            };
          });
        }
        
      });//count questions in category
      
    }//resData
    else{
      return res.json({success: false, error: "Category doesn't exist."});
    }
  });//find
}
