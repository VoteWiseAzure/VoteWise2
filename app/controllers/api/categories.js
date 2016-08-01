var express = require ('express');

// Models
var User = require('../../models/categories');
var jwt = require('jsonwebtoken');

//helpers
var helpers = require('../../helpers/controllers');
var modelHelpers = require('../../helpers/categories');
var commonHelpers = require('../../helpers/common');
var multer  = require('multer');
var Category = require('../../models/categories');

module.exports = function( app ) {

  app.post('/categories/create', function(req, res) {
    // var params = req.body;
    /*
    // Validations
    // var isValidZip = helpers.validZip( params.zip );
    // var isValidEmail = helpers.validEmail( params.email );
    // var isValidPassword = helpers.validPassword( params.password );
    // var isValidUsername = helpers.validUsername( params.username );
    // Uncomment this line for production, validations before database
    // var allValid = helpers.allVallidate( isValidZip, isValidEmail, isValidPassword, isValidUsername );
    // var allValid = true;

    // Returns address model
    //var address = modelHelpers.storeCategory(params.title, params.parentIds, res, app);
    */

    var file_name;
    var upload = multer({ //multer settings
      storage: multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
          cb(null, __dirname+'../../../uploads/');
        },
        filename: function (req, file, cb) {
          var datetimestamp = Date.now();
          var file_original_name = file.originalname;
          var file_new_name = file_original_name.replace(/\s+/g, '-').toLowerCase();

          var prefix = file_new_name.split(".")[0];

          file_name = prefix+ '-'+ datetimestamp +'.'+file_new_name.split('.')[file.originalname.split('.').length -1];
          cb(null, file_name);
        }
      })
    }).single('file');

    upload(req, res, function(err){
      //done uploading or error occured
      if(err) return res.json({"success": false, "error": err});
      else{
        // return res.json({"success": true, "data": file_name});
        
        var params = req.body;
        console.log("req.body: ", params);

        if(!params.id){
          var verifydRes = commonHelpers.verfiyRequiredFields(['title'], params, res); //verify require fields
          if(!verifydRes.success){
            return res.json(verifydRes);
          }
        }

        if(params.cat_type){
          var valid_cat_type = ["B", "F", "Q"];
          if(valid_cat_type.indexOf(params.cat_type) <= -1){
            return res.json({"success": false, "error": "Invalid 'cat_type'."});
          }
        }

        // var arrParentIds = params.parentIds ? params.parentIds.split(",") : [];
        var arrParentIds = params.parentIds ? params.parentIds.split(";") : [];
        var arrViewOrders = params.viewOrders ? params.viewOrders.split(",") : [];

        var allIds = [];
        Array.prototype.unique = function() {
            var a = this.concat();
            for(var i=0; i<a.length; ++i) {
                for(var j=i+1; j<a.length; ++j) {
                    if(a[i] === a[j])
                        a.splice(j--, 1);
                }
            }

            return a;
        };
        arrParentIds.forEach(function(val, key){
          allIds = allIds.concat(val.split(",")).unique();
        });

        if(arrParentIds.length != arrViewOrders.length){
          return res.json({success: false, error: "Parent ids length is not matching with the orders list."});
        }

        if(params.parentIds){
          modelHelpers.isValidParentIds(allIds, function(isValid) {
            if(isValid){
              // Stores category in db
              modelHelpers.storeCategory(params.title, params.description, params.cat_type, params.viewOrder, arrParentIds, arrViewOrders, file_name, res, app);
            }
            else{
              return res.json({success: false, error: "Invalid parentIds"});
            }
          });
        }
        else{
          // Stores category in db
          if(params.id){
            //for updateing existing category
            if(arrParentIds.length <= 0){
              arrParentIds = null;
            }
            modelHelpers.updateCategory(params.id, params.title, params.description, params.cat_type, params.viewOrder, arrParentIds, arrViewOrders, file_name, res, app);
          }
          else
            modelHelpers.storeCategory(params.title, params.description, params.cat_type, params.viewOrder, arrParentIds, arrViewOrders, file_name, res, app);
        }
        
      }//else of file upload
    });
  });

  app.get('/categories/list', function(req, res) {
    var params = req.query;
    modelHelpers.getCategory(params, res, app);
  });

  app.post('/categories/remove', function(req, res) {
    console.log("** categories remove **");
    var params = req.body;

      var verifydRes = commonHelpers.verfiyRequiredFields(['id'], params, res); //verify require fields
      if(!verifydRes.success){
        return res.json(verifydRes);
      }

      modelHelpers.removeCategory(params.id, res, app);

  });

  app.get('/categories/import', function(req, res) {
    console.log("** categories import **");
    var fs = require('fs');
    var path = require('path');
    var async = require('async');

    /* 
    fs.readFile(path.resolve(__dirname+"../../../../JSON_DATA/", 'topics.json'), 'utf8', function (err, data) {
      if (err) return res.json({success: false, error: err});
      var obj = JSON.parse(data);
      var async = require('async');

      var tempArr = [];
      async.forEachOf(obj, function (resCat, key, parentcallback) {

        if(resCat.parent == "5799efd789f19ca82688dcac"){
          Category.find({"_id": resCat.id}, {})
          .lean()
          .exec(function(err, catData){
            if(err){
              console.log("resCat: ", resCat);
              
              var category = new Category({
                title: resCat.description,
                description: resCat.description,
                parentIds: [{
                  pid: '5799efd789f19ca82688dcac',
                  path: ",5799efd789f19ca82688dcac,",
                  viewOrder: resCat.viewOrder
                }],
                icon_image: null
              });
              // Saving adress
              category.save( function ( err, category ) {
                if (err) {
                  //res.status(400);
                  console.log("err: ",err);
                  // return res.json( { success: false, error: "Unable to add category" } );
                  parentcallback();
                }
                if(category){
                  tempArr.push(category);
                  parentcallback();
                }
              });
              // tempArr.push(resCat);
              // parentcallback();
            }
            else
              parentcallback();
          });
        }
        else{
          parentcallback();
        }
      }, function (err) {
          return res.json({success: true, data: tempArr});
      });

      // return res.json({success: true, data: obj});
    });
    */

    var file_path = path.resolve(__dirname+"../../../../JSON_DATA/", 'topics_new.json');
    var back_file = path.resolve(__dirname+"../../../../JSON_DATA/", 'background_new.json');
    topic_obj = fs.readFileSync(file_path);
    back_obj = fs.readFileSync(back_file);

      topic_obj = JSON.parse(topic_obj);
      back_obj = JSON.parse(back_obj);
      
      var getTopicObj = function(backdata){
        var len = topic_obj.length;
        for (var i = 0; i < len; i++) {
          if(backdata.background == topic_obj[i].background){
            return topic_obj[i];
          }
        }
        return null;
      };

      var tempArr = [];
      async.forEachOf(back_obj, function (backdata, key, parentcallback) {
          if(backdata.background){
              var tpc = getTopicObj(backdata);
              console.log("tpc ", tpc);
              if(tpc){
                Category.find({"_id": tpc.id}, {parentIds: 1, _id: 1})
                .lean()
                .exec(function(err, catdata){
                  if(catdata && catdata.length > 0){
                    var parentarr = catdata[0].parentIds;
                    var parentobj = {};
                    if(parentarr.length > 0){
                      var str = parentarr[0].path;
                      var temp = str.split(",");
                      
                      parentobj = {
                        title: backdata.shortDescription,
                        description: backdata.description,
                        parentIds: [{
                          pid:  catdata[0]._id,
                          path: parentarr[0].path+catdata[0]._id+",",
                          viewOrder: 0
                        }],
                        icon_image: null
                      };

                      back_obj[key].parent_obj = parentobj;
                      // console.log("---------- appliying to key", key);
                    }
                  }
                  parentcallback();
                });
              }
              else{
                parentcallback()
              }
          }
          else{
            parentcallback();
          }
      }, function (err) {
        /*
        async.forEachOf(back_obj, function (o, key, callback){
            if(o.parent_obj){
              var category = new Category({
                title: o.parent_obj.title,
                description: o.parent_obj.description,
                parentIds: o.parent_obj.parentIds,
                icon_image: null
              });
              // Saving adress
              category.save( function ( err, category ) {
                if (err) {
                  console.log("************ err while saving ***********: ",key," error: ",err);
                }
                if(category){
                  console.log("---  Saved ---: ",key);
                }
                callback();
              });
            }
            else{
              callback();
            }
        }, function(err){
          return res.json({success: true, data: back_obj})
        });
        */
      });

      // return res.json({success: true, data: obj});
    
  });
}
