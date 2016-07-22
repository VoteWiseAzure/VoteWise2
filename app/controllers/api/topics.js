var express = require ('express');

// Models
var User = require('../../models/categories');
var jwt = require('jsonwebtoken');

//helpers
var helpers = require('../../helpers/controllers');
var modelHelpers = require('../../helpers/topics');
var commonHelpers = require('../../helpers/common');

module.exports = function( app ) {

  app.post('/topics/create', function(req, res) {

    // Validations
    var data = req.body;
    console.log("=+++++++++++=");
    
    // var isValidZip = helpers.validZip( params.zip );
    // var isValidEmail = helpers.validEmail( params.email );
    // var isValidPassword = helpers.validPassword( params.password );
    // var isValidUsername = helpers.validUsername( params.username );
    // Uncomment this line for production, validations before database
    // var allValid = helpers.allVallidate( isValidZip, isValidEmail, isValidPassword, isValidUsername );
      // var allValid = true;

      // Returns address model
      //var address = modelHelpers.storeCategory(params.title, params.parentIds, res, app);
      
      var verifydRes = commonHelpers.verfiyRequiredFields(['title', 'description', 'restrictedTo'], data, res); //verify require fields
      if(!verifydRes.success){
        return res.json(verifydRes);
      }

    
      modelHelpers.storeTopic(data, res, app);
    

  });

  app.get('/topics/latest', function(req, res) {
    var params = req.query;
    console.log("latest params : ",params);
    modelHelpers.latestTopic(params, res, app);
  });

  app.get('/topics/getList', function(req, res) {
    var params = req.query;
    
    console.log("Get List params : ",params);
    modelHelpers.topicList(params, res, app);
  });

  app.get('/topics/getone', function(req, res) {
    var params = req.query;
    modelHelpers.getTopic(params, res, app);
  });

  app.get('/topics/getTopic', function(req, res) {
    var params = req.query;
    modelHelpers.getOnlyTopic(params, res, app);
  });

  app.post('/topics/update', function(req, res) {
    var params = req.body;
    console.log("update data called");
    console.log(req.body);
    console.log(params);
      var verifydRes = commonHelpers.verfiyRequiredFields(['topicId'], params, res); //verify require fields
      if(!verifydRes.success){
        return res.json(verifydRes);
      }

      modelHelpers.updateTopic(params, res, app);

  });

  app.post('/topics/remove', function(req, res) {
    var params = req.body;
    console.log(params);
/*
      var verifydRes = commonHelpers.verfiyRequiredFields(['id'], params, res); //verify require fields
      if(!verifydRes.success){
        return res.json(verifydRes);
      }
*/
      modelHelpers.removeTopic(params.id, res, app);

  });
}
