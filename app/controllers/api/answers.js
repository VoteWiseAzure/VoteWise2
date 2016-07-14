var express = require ('express');

// Models
var Questions = require('../../models/questions');
var Answers = require('../../models/answers');
var jwt = require('jsonwebtoken');

//helpers
var helpers = require('../../helpers/controllers');
var modelHelpers = require('../../helpers/answers');
var commonHelpers = require('../../helpers/common');

module.exports = function( app ) {
  /*
  app.post('/answers/test', function(req, res) {
    var params = req.body;
    
    if(params.token){
      jwt.verify(params.token, app.get('superSecret'), function(err, decoded){
        console.log("decoded: ",decoded);
        if(err) return res.json({success: "t1", error: err});
        if(decoded) res.json({success: "t2", error: decoded});
      });
    }
    else{
      return res.json({success: false, error: "Pass token"});
    }
  });
  */

  app.post('/answers/create', function(req, res) {
    var params = req.body;
    
      var verifydRes = commonHelpers.verfiyRequiredFields(['questionId', 'answer', "token"], params, res); //verify require fields
      if(!verifydRes.success){
        return res.json(verifydRes);
      }

      commonHelpers.getUserFromToken(params.token, app, function(tokenData){
        if(tokenData.success){
          var authorId = tokenData.data._id;

          modelHelpers.isValidUser(authorId, function (isValidAuthor) {
            if(isValidAuthor){
              modelHelpers.isQuestionExist(params.questionId, function(isValidQues){
                if(isValidQues){
                  modelHelpers.isAlreadyAnswered(authorId, params.questionId, function(isAnswered){
                    console.log("isAnswered: ",isAnswered);
                    if(!isAnswered){

                      if(params.importance && (params.importance <1 || params.importance >3)){
                        return res.json({success: false, error: "'importance' should be between 1 to 3."});  
                      }

                      if(params.answer && (params.answer <0 || params.answer >6)){
                        return res.json({success: false, error: "'answer' should be between 0 to 6."});  
                      }

                      modelHelpers.storeAnswer(authorId, params.questionId, params.importance, params.answer, params.comment, res, app);
                    }//isAnswered
                    else{
                      return res.json({success: false, error: "User has already answered this question."});
                    }
                  });
                }//isValidQues
                else{
                  return res.json({success: false, error: "Question doesn't exist."});
                }
              });//isQuestionExist
            }//isValidAuthor
            else{
              return res.json({success: false, error: "Author ID is invalid."});
            }
          });

          //return res.json({success: true, authorId: authorId});
        }//tokenData.success
        else{
          return res.json({success: false, data: tokenData.data});
        }
      });
  });

  app.get('/answers/list', function(req, res) {
    var params = req.query;
    modelHelpers.getAnswers(params, res, app);
  });

  app.post('/answers/remove', function(req, res) {
    console.log("** categories remove **");
    var params = req.body;

      var verifydRes = commonHelpers.verfiyRequiredFields(['id'], params, res); //verify require fields
      if(!verifydRes.success){
        return res.json(verifydRes);
      }

      modelHelpers.removeAnswer(params.id, res, app);

  });
}
