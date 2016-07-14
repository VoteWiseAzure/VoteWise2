var express = require ('express');

// Models
var Questions = require('../../models/questions');
var jwt = require('jsonwebtoken');

//helpers
var helpers = require('../../helpers/controllers');
var modelHelpers = require('../../helpers/questions');
var commonHelpers = require('../../helpers/common');

module.exports = function( app ) {

  app.post('/questions/create', function(req, res) {
    var params = req.body;
    
      var verifydRes = commonHelpers.verfiyRequiredFields(['author', 'content', "categoryIds"], req.body, res); //verify require fields
      if(!verifydRes.success){
        return res.json(verifydRes);
      }

      modelHelpers.isValidUser(params.author, function (isValidAuthor) {
        if(isValidAuthor){
          var arrCatIds = params.categoryIds ? params.categoryIds.split(",") : [];
          var arrViewOrders = params.viewOrders ? params.viewOrders.split(",") : [];
          
          if(arrCatIds.length != arrViewOrders.length){
            return res.json({success: false, error: "Category ids length is not matching with the order's list."});
          }

          modelHelpers.isValidCategoryIds(arrCatIds, function(isValidCategory) {
            if(isValidCategory){
              modelHelpers.storeQuestion(params.author, params.content, arrCatIds, arrViewOrders, res, app);
            }
            else{
              return res.json({success: false, error: "Invalid category IDs."});
            }
          });
        }
        else{
          return res.json({success: false, error: "Author ID is invalid."});
        }
      });
      /*
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
      */
  });

  app.post('/questions/update', function(req, res) {
    var params = req.body;
    
      var verifydRes = commonHelpers.verfiyRequiredFields(['id'], req.body, res); //verify require fields
      if(!verifydRes.success){
        return res.json(verifydRes);
      }

      modelHelpers.isQuestionExist(params.id, function (isValidQues) {
        if(isValidQues){
          
          var arrCatIds = params.categoryIds ? params.categoryIds.split(",") : [];
          var arrViewOrders = params.viewOrders ? params.viewOrders.split(",") : [];
          
          if(arrCatIds.length != arrViewOrders.length){
            return res.json({success: false, error: "Category ids length is not matching with the order's list."});
          }

          modelHelpers.isValidCategoryIds(arrCatIds, function(isValidCategory) {
            if(isValidCategory){
              modelHelpers.updateQuestion(params.id, params.content, arrCatIds, arrViewOrders, res, app);
            }
            else{
              return res.json({success: false, error: "Invalid category IDs."});
            }
          });
          
          //return res.json({success: false, error: "Question exist."});
        }
        else{
          return res.json({success: false, error: "Question doesn't exist."});
        }
      });
  });

  app.get('/questions/list', function(req, res) {
    var params = req.query;
    modelHelpers.getQuestions(params, res, app);
  });

  app.post('/questions/remove', function(req, res) {
    console.log("** categories remove **");
    var params = req.body;

      var verifydRes = commonHelpers.verfiyRequiredFields(['id'], params, res); //verify require fields
      if(!verifydRes.success){
        return res.json(verifydRes);
      }

      modelHelpers.removeQuestion(params.id, res, app);

  });
}
