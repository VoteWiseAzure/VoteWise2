var Address = require('../models/address');
var User = require('../models/user');
var Geo = require('../models/geoDivPa');
var Advocate = require('../models/advocate');
var Topics = require('../models/topics');

var saltRounds = 10;
var bcrypt = require('bcrypt');

var mailer = require('../middleware/mailer');
var jwt = require('jsonwebtoken');

var helpers = require('./controllers');



module.exports.storeTopic = function (data, res, app) {
  // Making new adress
  console.log("Store called");
  var topic = new Topics();

  topic.title = data.title;
  topic.description = data.description;
  topic.parentcat = data.parentcat;
  topic.subcategories = data.subcategories;
  topic.createdBy = {
    id: data.createdById,
    name: data.createdByName
  };
  topic.createdOn = new Date();
  topic.restictedTo = data.restrictedTo;
  topic.location = data.location;
  if(data.parentId) {
    topic.parent = data.parentId;  
  }
  console.log(data);
  console.log("===============");
  console.log(topic);
  // Saving adress
  topic.save( function ( err, topics ) {
    if (err) {
      //res.status(400);
      console.log("err: ",err);
      return res.json( { success: false, error: "Unable to add Topic" } );
    }

    if(topics){
      return res.json({success: true, data: topics});
    }
  });
}

module.exports.getTopic = function (params, res, app) {  
  
  if(params.parentId){
    Topics.find({$or: [{"_id": params.parentId, "parent": params.parentId}]})
    .exec(function(err,restop) {
      if (err) {
        //res.status(400);
        console.log("err: ",err);
        return res.json( { success: false, error: "Unable to get Topic" } );
      }

      if(restop){
        return res.json({success: true, data: restop});
      }
    });
  } else {
    return res.json( { success: false, error: "There are no topics" } );
  }
}


module.exports.latestTopic = function (params, res, app) {  
  var query = ''
   if(params.subcatId) {
    if(params.maincatId){
      query = "parentcat : "+ params.maincatId +", subcategories : "+ params.subcatId;
    } else {
      query = "subcategories : "+ params.subcatId;
    }
    console.log(params.subcatId);
    var returnObj = {};
    Topics.findOne({ subcategories: params.subcatId })
    .sort({"createdOn": -1})
    .exec(function(err,restop) {
      console.log("first Result : ", err);
      console.log(" Result : ", restop);
      if (err) {
        //res.status(400);
        console.log("err: ",err);
        return res.json( { success: false, error: "There are no topics" } );
      }

      if(restop){
        console.log("latestTopic: ", restop);
        if(restop != '') {
          returnObj.title = restop.title;
          returnObj.createdby = restop.createdBy;
          returnObj.createdOn = restop.createdOn;
            Topics.count({"subcategories": params.subcatId, "parent": null}, function(e,totalthread) {
              console.log("totalthread: "+totalthread);
              returnObj.totalThread = totalthread;
              Topics.count({"subcategories": params.subcatId}, function(e,totalpost) {
                console.log("totalpost: "+totalpost);
                returnObj.totalPost = totalpost;
                Topics.count({"subcategories": params.subcatId, type: 'B'}, function(e,brainstorming) {
                  console.log("brainstorming: "+brainstorming);
                  returnObj.brainstorming = brainstorming;

                  Topics.count({"subcategories": params.subcatId, type: 'S'}, function(e,solution) {
                    console.log("solution: "+solution);
                    returnObj.solution = solution;
                    console.log("Final Obj---");
                    console.log(returnObj);
                    return res.json({success: true, data: returnObj});
                  });

                });

              });

          });
           // return res.json({success: true, data: restop});
        } else {
          console.log("There are no topics");
          return res.json( { success: false, error: "There are no topics" } );
        }
        

        
      } else {
          console.log("There are no topics");
          return res.json( { success: false, error: "There are no topics" } );
        }
    });

  } else {
    
    return res.json( { success: false, error: "There are no topics" } );

  }
    
  
}

module.exports.updateTopic = function (data, res, app) {  
  var updateString = '';
  if(data.likes) {
    updateString = {$inc : {'likes' : 1}};
  }
  if(data.dislikes) {
    updateString = {$inc : {'dislikes' : -1}};
  }

  if(data.sticky) {
    updateString = {'sticky': 'Y'};
  }

  if(data.removeSticky) {
    updateString = {'sticky': 'N'};
  }

  if(data.resolved) {
    var cur_date = new Date();
    updateString = {'resolved': 'Y', 'resolvedBy': data.resolvedBy, 'resolvedOn': cur_date};
  }

  if(data.unresolved) {
    updateString = {'resolved': 'N', 'resolvedBy': '', 'resolvedOn': ''};
  }

  if(data.topicId) {
    Topics.update({_id: data.topicId}, updateString, {multi: false}, function (err, resData) {
      if(err) return res.json({success: false, error: err});
      if(resData) return res.json({success: true, data: resData});
    });  
  } else {
    res.json({success: false, error: "No topics found"});
  }

  
}

module.exports.removeTopic = function ( id, res, app ) {

  console.log("removeTopic 1:", id);

  Topics.find({"_id": id})
  .exec(function ( err, resData ) {
    if (err) return res.json({success: false, error: err});
    if (resData) {
  
      Topics.remove({_id: id}, function ( err, delData ) {
        if (err) return res.json({success: false, error: err});
        if (delData) res.json({success: true, data: delData});
      });
    };//resData
  });//find
}
