var express = require ('express');

// Models
var User = require('../../models/categories');
var jwt = require('jsonwebtoken');

//helpers
var helpers = require('../../helpers/controllers');
var modelHelpers = require('../../helpers/categories');
var commonHelpers = require('../../helpers/common');

module.exports = function( app ) {

  app.post('/categories/create', function(req, res) {

    // Validations
    var params = req.body;
    // var isValidZip = helpers.validZip( params.zip );
    // var isValidEmail = helpers.validEmail( params.email );
    // var isValidPassword = helpers.validPassword( params.password );
    // var isValidUsername = helpers.validUsername( params.username );
    // Uncomment this line for production, validations before database
    // var allValid = helpers.allVallidate( isValidZip, isValidEmail, isValidPassword, isValidUsername );
      // var allValid = true;

      // Returns address model
      //var address = modelHelpers.storeCategory(params.title, params.parentIds, res, app);


      var verifydRes = commonHelpers.verfiyRequiredFields(['title'], req.body, res); //verify require fields
      if(!verifydRes.success){
        return res.json(verifydRes);
      }

      var arrParentIds = params.parentIds ? params.parentIds.split(",") : [];
      var arrViewOrders = params.viewOrders ? params.viewOrders.split(",") : [];

      if(arrParentIds.length != arrViewOrders.length){
        return res.json({success: false, error: "Parent ids length is not matching with the orders list."});
      }

      if(params.parentIds){
        modelHelpers.isValidParentIds(arrParentIds, function(isValid) {
          if(isValid){
            // Stores category in db
            modelHelpers.storeCategory(params.title, params.description, arrParentIds, arrViewOrders, res, app);
          }
          else{
            return res.json({success: false, error: "Invalid parentIds"});
          }
        });
      }
      else{
        // Stores category in db
        modelHelpers.storeCategory(params.title, params.description, arrParentIds, arrViewOrders, res, app);
      }

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
