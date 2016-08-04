var express = require ('express');

// Models
var User = require('../../models/categories');
var jwt = require('jsonwebtoken');
var multer  = require('multer');
//helpers
var helpers = require('../../helpers/controllers');
var modelHelpers = require('../../helpers/essay');
var commonHelpers = require('../../helpers/common');
var fs = require('fs');
module.exports = function( app ) {

  app.post('/essay/create', function(req, res) {

      // Validations
      if(req.query.mediaType=='Stills') {
          var file_name;
        var username;
        var newDestination;
        var folderName;
        var upload = multer({ //multer settings
          storage: multer.diskStorage({ //multers disk storage settings
            destination: function (req, file, cb) {
                
                
                    folderName = req.query.folderName;
                
                newDestination =  './app/uploads/'+folderName+'/';
                console.log(req.query);
               console.log(newDestination);
                    var stat;
                    try {
                        stat = fs.statSync(newDestination);
                    } catch (err) {
                        fs.mkdirSync(newDestination);
                    }
                    if (stat && !stat.isDirectory()) {
                        throw new Error('Directory cannot be created because an inode of a different type exists at "' + dest + '"');
                    }
                    
                    cb(null, newDestination);      
                
              
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
          console.log(req.body);
        
          
          if(err) return res.json({"success": false, "error": err});
          else{
            // return res.json({"success": true, "data": file_name});
            
            var data = req.body;
            // console.log("=+++++++++++=");
            // var isValidZip = helpers.validZip( params.zip );
            // var isValidEmail = helpers.validEmail( params.email );
            // var isValidPassword = helpers.validPassword( params.password );
            // var isValidUsername = helpers.validUsername( params.username );
            // Uncomment this line for production, validations before database
            // var allValid = helpers.allVallidate( isValidZip, isValidEmail, isValidPassword, isValidUsername );
            // var allValid = true;
            // Returns address model
            //var address = modelHelpers.storeCategory(params.title, params.parentIds, res, app);
            data.filename = file_name;
            modelHelpers.storeEssay(data, res, app);
            
          }//else of file upload

      });
      } else {
        var data = req.body;
        // console.log("=+++++++++++=");
        // var isValidZip = helpers.validZip( params.zip );
        // var isValidEmail = helpers.validEmail( params.email );
        // var isValidPassword = helpers.validPassword( params.password );
        // var isValidUsername = helpers.validUsername( params.username );
        // Uncomment this line for production, validations before database
        // var allValid = helpers.allVallidate( isValidZip, isValidEmail, isValidPassword, isValidUsername );
        // var allValid = true;
        // Returns address model
        //var address = modelHelpers.storeCategory(params.title, params.parentIds, res, app);
        
        var verifydRes = commonHelpers.verfiyRequiredFields(['title', 'description'], data, res); //verify require fields
        if(!verifydRes.success){
          return res.json(verifydRes);
        }
        modelHelpers.storeEssay(data, res, app);
      }
      
  });

  app.get('/essay/latest', function(req, res) {
    var params = req.query;
    console.log("latest params : ",params);
    modelHelpers.latestEssay(params, res, app);
  });

  app.get('/essay/getList', function(req, res) {
    var params = req.query;
    //console.log("Get List params : ",params);
    modelHelpers.essayList(params, res, app);
  });

  app.get('/essay/search', function(req, res) {
    var params = req.query;
    console.log("Topics Search : ",params);
    modelHelpers.topicSearch(params, res, app);
  });

  app.get('/essay/getone', function(req, res) {
    var params = req.query;
    modelHelpers.getEssay(params, res, app);
  });

  app.get('/essay/getTopic', function(req, res) {
    var params = req.query;
    modelHelpers.getOnlyTopic(params, res, app);
  });

  app.post('/essay/AdvanceSearch', function(req, res) {
    var params = req.body;
    console.log("AdvanceSearch");
    console.log(params);
    console.log(JSON.stringify(params));
    modelHelpers.topicAdvanceSearch(params, res, app);
  });

  app.post('/essay/update', function(req, res) {
    var params = req.body;
    //console.log("update data called");
    //console.log(req.body);
    //console.log(params);
      var verifydRes = commonHelpers.verfiyRequiredFields(['topicId'], params, res); //verify require fields
      if(!verifydRes.success){
        return res.json(verifydRes);
      }

      modelHelpers.updateTopic(params, res, app);

  });

  app.post('/essay/remove', function(req, res) {
    var params = req.body;
    //console.log(params);
/*
      var verifydRes = commonHelpers.verfiyRequiredFields(['id'], params, res); //verify require fields
      if(!verifydRes.success){
        return res.json(verifydRes);
      }
*/
      modelHelpers.removeTopic(params.id, res, app);

  });
  
  app.get('/essay/removeAll', function(req, res) {
    
    modelHelpers.removeAllEssay(res, app);
  });
  
  
}
