var Address = require('../models/address');
var User = require('../models/user');
var Geo = require('../models/geoDivPa');
var Advocate = require('../models/advocate');
var Topics = require('../models/topics');
var Category = require('../models/categories');

var saltRounds = 10;
var bcrypt = require('bcrypt');

var mailer = require('../middleware/mailer');
var jwt = require('jsonwebtoken');

var helpers = require('./controllers');



module.exports.storeTopic = function (data, res, app) {
  // Making new adress
  console.log("Store called");
  console.log(data);
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
  topic.restrictedTo = data.restrictedTo;
  topic.location = data.location;
  topic.likes = 0;
  topic.dislikes = 0;
  topic.spam = 0;

  if(data.parent) {
    topic.parent = data.parent;  
  }
  console.log(topic);
  // Saving adress
  topic.save( function ( err, ftopics ) {
    if (err) {
      //res.status(400);
      //console.log("err: ",err);
      return res.json( { success: false, error: "Unable to add Topic" } );
    }

    if(ftopics){
      console.log("Final Result ");
      console.log(ftopics);
      return res.json({success: true, data: ftopics});
    }
  });
  
}

module.exports.getOnlyTopic = function (params, res, app) {  
  console.log("Only topic");
  console.log(params);
    if(params.topicId){
      console.log("inside IF");
    Topics.findOne({"_id": params.topicId})
    .exec(function(err,restop) {
      console.log(err);
      console.log(restop);
      if (err) {
        //res.status(400);
        //console.log("err: ",err);
        return res.json( { success: false, error: "Unable to get Topic" } );
      }

      if(restop){
        //console.log("========getOnlyTopic=========");
        //console.log(restop);
        return res.json({success: true, data: restop});
      } else {
        return res.json( { success: false, error: "Unable to get Topic" } );
      }
    });
  } else {
    return res.json( { success: false, error: "There are no topics" } );
  }
}

module.exports.getTopic = function (params, res, app) {  
  console.log("GetTopic Called");
  console.log(params);
  if(params.topicId){
    Topics.find({$or:[{"_id": params.topicId, "parent": null}, {"parent": params.topicId}]})
    .sort({'createdOn': 1})
    .exec(function(err,restop) {
      if (err) {
        res.status(400);
        console.log("err: ",err);
        return res.json( { success: false, error: "Unable to get Topic" } );
      }
      console.log("======================");
      console.log(restop);
      if(restop){
        var finalData = Array();
        var len = restop.length;
        var j = 0;
        //console.log("GetTopic Result");
        //console.log(restop);
        restop.forEach(function(val, key){
          val = val.toObject();
          if(val.createdBy.id){
            User.findOne({
                _id: val.createdBy.id
            }, function (err, user) {
                
                if (user) { 
                    val.userData = user;
                }

                Topics.count({"createdBy.id": user._id}, function(e,totalpost) {
                  val.totalpost = totalpost;
                   finalData.push(val);
               
                     j++;

                     if(j==len) {
                        //console.log(finalData);
                        return res.json({success: true, data: finalData});
                     }
                    
                  });

              


            });

          }
        });
       
        
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
    //console.log(params.subcatId);
    var returnObj = {};
    Topics.findOne({ subcategories: params.subcatId })
    .sort({"createdOn": -1})
    .exec(function(err,restop) {

      /*console.log("first Result : ", err);
      console.log(restop.title);
      console.log(" Result : ", restop);*/
      if (err) {
        //res.status(400);
        //console.log("err: ",err);
        return res.json( { success: false, error: "There are no topics" } );
      }

      if(restop){
        //console.log("latestTopic: ", restop);
        if(restop != '') {
          returnObj.id = restop._id;
          returnObj.title = restop.title;
          returnObj.createdby = restop.createdBy;
          returnObj.createdOn = restop.createdOn;
          returnObj.parent = restop.parent;
          returnObj.type = restop.type;
            Topics.count({"subcategories": params.subcatId, "parent": null}, function(e,totalthread) {
              //console.log("totalthread: "+totalthread);
              returnObj.totalThread = totalthread;
              Topics.count({"subcategories": params.subcatId}, function(e,totalpost) {
                //console.log("totalpost: "+totalpost);
                returnObj.totalPost = totalpost;
                Topics.count({"subcategories": params.subcatId, type: 'B'}, function(e,brainstorming) {
                  //console.log("brainstorming: "+brainstorming);
                  returnObj.brainstorming = brainstorming;

                  Topics.count({"subcategories": params.subcatId, type: 'S'}, function(e,solution) {
                    //console.log("solution: "+solution);
                    returnObj.solution = solution;
                      Category.findOne({"parentIds.pid": params.subcatId }, function(ed,subcat) {
                          returnObj.nextSubcat = subcat;
                          return res.json({success: true, data: returnObj});
                      });
                    //console.log("Final Obj---");
                    //console.log(returnObj);
                    
                  });

                });

              });

          });
           // return res.json({success: true, data: restop});
        } else {
          //console.log("There are no topics");
          return res.json( { success: false, error: "There are no topics" } );
        }
        

        
      } else {
          //console.log("There are no topics");
          return res.json( { success: false, error: "There are no topics" } );
        }
    });

  } else {
    
    return res.json( { success: false, error: "There are no topics" } );

  }
    
  
}


module.exports.topicList = function (params, res, app) {  
  var query = ''
   if(params.subcatId) {
    if(params.maincatId){
      query = "parentcat : "+ params.maincatId +", subcategories : "+ params.subcatId;
    } else {
      query = "subcategories : "+ params.subcatId;
    }
    
    var returnObj = {};
    Topics.find({ subcategories: params.subcatId, parent: null })
    .exec(function(err,restop) {
      
      if (err) {
        //res.status(400);
        //console.log("err: ",err);
        return res.json( { success: false, error: "There are no topics" } );
      }

      if(restop){
        //console.log("Final topic List: ", restop);
        if(restop != '') {
          var len = restop.length;
          var j=0;
          var finalData = Array();
          restop.forEach(function(val, key){
              val = val.toObject();
              Topics.count({"parent": val._id}, function(e,totalReply) {
                val.totalReply = totalReply;
                if(totalReply > 0) {
                  Topics.findOne({ parent: val._id })
                  .sort({"createdOn": -1})
                  .exec(function(err,lastTopic) {
                    val.lastTopic = lastTopic;
                    finalData.push(val);
                    j++;
                    if(len == j) {
                      return res.json({success: true, data: finalData});    
                    }
                    
                  });

                } else {
                  //console.log("Second FInal ");
                  //console.log(val);

                   finalData.push(val);
                  j++;
                    if(len == j) {
                      return res.json({success: true, data: finalData});  
                    }
                }
                
              });
            });
           // return res.json({success: true, data: restop});
        } else {
          //console.log("There are no topics");
          return res.json( { success: false, error: "There are no topics" } );
        }
        

        
      } else {
          //console.log("There are no topics");
          return res.json( { success: false, error: "There are no topics" } );
        }
    });

  } else {
    
    return res.json( { success: false, error: "There are no topics" } );

  }
    
  
}

module.exports.extraData = function(data, res, app) {
  var params = JSON.parse(data.userData);
  var fromDate = new Date(params.lastLogin);
  console.log("Extra Data date");

  console.log(fromDate);
  //My Discussions
  Topics.find({ "createdBy.id":  params.id, "createdOn": {"$gte": params.lastLogin} })
    .exec(function(err,userExtraTopic) {
        var returnData = {};
        console.log("===MyDiscussion===");
        returnData.MyDiscussion = userExtraTopic;
        console.log(userExtraTopic);
        //Hot Topics
        Topics.find({parent: {$ne: null}}, {})
        .distinct("parent", function(err,hotTopics) {
              
              console.log("hotTopics");
              console.log(hotTopics);
              
              if(hotTopics.length <= 5) {
                var alen = hotTopics.length;  
              } else {
                var alen = 0;
              }
          
              var x=0;
              var activehotTopics = [];
              if(alen > 0) {
                 hotTopics.forEach(function(vala, akey){
                    var aid = vala;
                    console.log("First Final ID: "+aid);
                    Topics.findOne({"_id": aid})
                    .exec(function(erra,resacttop) {
                      console.log(resacttop);
                      activehotTopics.push(resacttop);
                      x++;
                      if(x==alen) {
                        console.log("------------activehotTopics--------------");
                        console.log(activehotTopics);
                        returnData.HotTopics = activehotTopics;
              
                      }

                    });
                  });
              } else {
                returnData.HotTopics = activehotTopics;
              }
             
          
        //Active thread
        Topics.aggregate([
        {
            "$match": {
              "parent" : {$ne: null}
            }
        },
        {
            "$group": {
                "_id": '$parent',
                "parent": {"$sum": 1}
            }
            
        },
        { "$sort": {"parent": -1}},
        { "$limit": 5 }],
        function(e,totalActive) {
            console.log("Active Data");
            console.log(totalActive);
            
            if(totalActive) {
              

            if(totalActive.length > 0) {
              console.log("inside greate 0");
              var len = totalActive.length;
              var j=0;
              var activeData = [];
              totalActive.forEach(function(val, key){
                var id = val._id;
                console.log("Final ID: "+id);
                Topics.findOne({"_id": id})
                .exec(function(err,restop) {
                  activeData.push(restop);


                  j++;
                  if(j==len) {
                    returnData.ActiveData = activeData;
          
                    res.json({success: true, data: returnData});
                  }

                });



                
              });
              } else {
                console.log("Inside first else");
              returnData.ActiveData = totalActive;
          
              res.json({success: true, data: returnData});
            }

            } else {
              console.log("Inside second else");
              returnData.ActiveData = totalActive;
              console.log(returnData);
              res.json({success: true, data: returnData});
            }
            

        });//Active thread End


      });//Hot Topics End

    });//My Discussions End
}

module.exports.updateTopic = function (data, res, app) {  
  var updateString = '';
  var query = '';
  if(data.likes) {
    updateString = {$inc : {'likes' : 1}, $push : {'likesUsers': data.userId}};
    query = {_id: data.topicId, likesUsers: { $ne : data.userId}};
  }
  if(data.dislikes) {
    updateString = {$inc : {'dislikes' : 1}, $push : {'dislikesUsers': data.userId}};
    query = {_id: data.topicId, dislikesUsers: { $ne : data.userId}, likesUsers: { $ne : data.userId}};
  }

  if(data.spam) {
    updateString = {$inc : {'spam' : 1}, $push : {'spamUsers': data.userId}};
    query = {_id: data.topicId, likesUsers: { $ne : data.userId}, spamUsers: { $ne : data.userId}};
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
  if(query=='') {
    query = {_id: data.topicId};
  }

  if(data.topicId) {
    Topics.update(query, updateString, {multi: false}, function (err, resData) {
      if(err) return res.json({success: false, error: err});
      if(resData) return res.json({success: true, data: resData});
    });  
  } else {
    res.json({success: false, error: "No topics found"});
  }

  
}

module.exports.removeTopic = function ( id, res, app ) {

  //console.log("removeTopic 1:", id);

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
