var express = require ('express');

// Models
var User = require('../../models/categories');
var jwt = require('jsonwebtoken');

//helpers
var helpers = require('../../helpers/controllers');
var modelHelpers = require('../../helpers/categories');
var commonHelpers = require('../../helpers/common');
var multer  = require('multer');

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
}
