var express = require ('express');

// Models
var Questions = require('../../models/questions');
var jwt = require('jsonwebtoken');

//helpers
var helpers = require('../../helpers/controllers');
var modelHelpers = require('../../helpers/questions');
var commonHelpers = require('../../helpers/common');
var config = require('../../../config'); // get config file

module.exports = function( app ) {

  app.post('/questions/create', function(req, res) {
    var params = req.body;
    
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if(!token){
      return res.status(403).send({ 
          success: false, 
          error: 'No token provided.' 
      }); 
    }

    var verifydRes = commonHelpers.verfiyRequiredFields(['content', "categoryIds"], req.body, res); //verify require fields
    if(!verifydRes.success){
      return res.json(verifydRes);
    }

    commonHelpers.getUserFromToken(token, app, function(tokenData){
      if(tokenData.success){
        var authorId = tokenData.data._id;
        modelHelpers.isValidUser(authorId, function (isValidAuthor) {
          if(isValidAuthor){
            var arrCatIds = params.categoryIds ? params.categoryIds.split(",") : [];
            var arrViewOrders = params.viewOrders ? params.viewOrders.split(",") : [];
            
            if(arrCatIds.length != arrViewOrders.length){
              return res.json({success: false, error: "Category ids length is not matching with the order's list."});
            }

            modelHelpers.isValidCategoryIds(arrCatIds, function(isValidCategory) {
              if(isValidCategory){
                modelHelpers.storeQuestion(authorId, params.content, arrCatIds, arrViewOrders, res, app);
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
      }
      else{
        return res.json({success: false, data: tokenData.data});
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
    if(params.tagged_by_role){
      //get questions tagged my particular group of users
      if(config.valid_user_roles.indexOf(params.tagged_by_role) <= -1)
        return res.json({success: false , error: "Invalid 'tagged_by_role'. Valid values are: "+config.valid_user_roles.join(",")});
      else
        modelHelpers.getQuestionsByRole(params.tagged_by_role, res, app);
    }
    else if(params.tagged_to){
      if(params.tagged_to == "me"){
          var token = req.body.token || req.query.token || req.headers['x-access-token'];
          if(!token){
            return res.status(403).send({ 
                success: false, 
                error: 'No token provided.' 
            }); 
          }

          commonHelpers.getUserFromToken(token, app, function(tokenData){
            if(tokenData.success){
              var author = tokenData.data;
              modelHelpers.getQuestionsTaggedTo(author._id, res, app);
            }
            else{
              return res.json({success: false, data: tokenData.data});
            }
          });
      }
      else{
        var authorId = params.tagged_to;
        modelHelpers.isValidUser(authorId, function (isValidAuthor) {
          if(isValidAuthor){
            modelHelpers.getQuestionsTaggedTo(authorId, res, app);
          }
          else{
            return res.json({success: false, error: "User ID is invalid."});
          }
        });
      }
    }
    else{
      modelHelpers.getQuestions(params, res, app);
    }
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

  app.post('/questions/add_tag', function(req, res) {
    console.log("** tag questions **");
    var params = req.body;
      var token = req.body.token || req.query.token || req.headers['x-access-token'];
      if(!token){
        return res.status(403).send({ 
            success: false, 
            error: 'No token provided.' 
        }); 
      }

      var verifydRes = commonHelpers.verfiyRequiredFields(['id', 'user_ids'], params, res); //verify require fields
      if(!verifydRes.success){
        return res.json(verifydRes);
      }
      var arrUserIds = params.user_ids ? params.user_ids.split(",") : [];

      commonHelpers.getUserFromToken(token, app, function(tokenData){
        console.log("got getUserFromToken: ",tokenData);
        if(tokenData.success){
          var author = tokenData.data;
          modelHelpers.tagUserInQuestion(params.id, author, arrUserIds, res, app);
          // return res.json({success: true, data: author});
        }
        else{
          return res.json({success: false, data: tokenData.data});
        }
      });
  });

  app.post('/questions/remove_tag', function(req, res) {
    console.log("** tag questions **");
    var params = req.body;
      var token = req.body.token || req.query.token || req.headers['x-access-token'];
      if(!token){
        return res.status(403).send({ 
            success: false, 
            error: 'No token provided.' 
        }); 
      }

      var verifydRes = commonHelpers.verfiyRequiredFields(['id', 'user_ids'], params, res); //verify require fields
      if(!verifydRes.success){
        return res.json(verifydRes);
      }
      var arrUserIds = params.user_ids ? params.user_ids.split(",") : [];

      commonHelpers.getUserFromToken(token, app, function(tokenData){
        console.log("got getUserFromToken: ",tokenData);
        if(tokenData.success){
          var author = tokenData.data;
          modelHelpers.removeTagUserFromQuestion(params.id, author, arrUserIds, res, app);
          // return res.json({success: true, data: author});
        }
        else{
          return res.json({success: false, data: tokenData.data});
        }
      });
  });
}
