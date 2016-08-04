var Address = require('../models/address');
var User = require('../models/user');
var Advocate = require('../models/advocate');
var Essay = require('../models/essay');
var Category = require('../models/categories');
var Comments = require("../models/essayComments");

var saltRounds = 10;
var bcrypt = require('bcrypt');

var mailer = require('../middleware/mailer');
var jwt = require('jsonwebtoken');
var async = require('async');
var helpers = require('./controllers');
var mongoose = require('mongoose');
var ObjectID = mongoose.Types.ObjectId;

module.exports.storeEssay = function (data, res, app) {
  // Making new adress
  ////console.log("Store called");
  ////console.log(data);
    
    var essay = new Essay();

    essay.title = data.title;
    essay.description = data.description;
    essay.parentcat = data.parentcat;
    ////console.log("Type OF ");
    ////console.log(typeof data.subcategories);
    if(data.subcategories) {
        if (typeof data.subcategories === 'string') {
          var subcat = data.subcategories;
          var sub = subcat.split(",");
          essay.subcategories = sub;
        } else {
          essay.subcategories = data.subcategories;  
        }  
    }
    
    
    essay.createdBy = {
      id: data.createdById,
      name: data.createdByName,
      utype: data.createdByType,
    };

    essay.createdOn = new Date();
    if(data.restrictedTo) {
      essay.restrictedTo = data.restrictedTo;  
    }
    
    essay.location = data.location;

    essay.mediaType = data.mediaType;

  if(data.mediaType=="Stills") {
    console.log("Media type is not Text");
    
    essay.mediaFile = data.filename;
  } else {
    essay.mediaFile = data.mediaFile;
  }
    
    console.log(data);
  ////console.log(topic);
  // Saving adress
  essay.save( function ( err, fessay ) {
    console.log(err);
    console.log(fessay);
    if (err) {
      //res.status(400);
      ////console.log("err: ",err);
      return res.json( { success: false, error: "Unable to add Essay" } );
    }

    if(fessay){
      ////console.log("Final Result ");
      ////console.log(ftopics);
      return res.json({success: true, data: fessay});
    }
  });
  
  
  
}


module.exports.latestEssay = function (params, res, app) {  
  var query = ''
   if(params.subcatId) {
    if(params.maincatId){
      query = "parentcat : "+ params.maincatId +", subcategories : "+ params.subcatId;
    } else {
      query = "subcategories : "+ params.subcatId;
    }
    
    console.log("=========$$$$Latest Topic$$$========================");
    console.log(params.subcatId);
    var returnObj = {};
    
    Essay.findOne({ subcategories: params.subcatId })
    .sort({"createdOn": -1})
    .exec(function(err,restop) {
      
      //console.log("first Result : ", err);      
      
      //console.log(" Result : ", restop);
      
      if (err) {
        //res.status(400);
        ////console.log("err: ",err);
        return res.json( { success: false, error: "There are no topics" } );
      }

      if(restop){
        ////console.log("latestTopic: ", restop);
        if(restop != '') {
          returnObj.id = restop._id;
          returnObj.title = restop.title;
          returnObj.createdby = restop.createdBy;
          returnObj.createdOn = restop.createdOn;
          returnObj.parentcat = restop.parentcat;
          returnObj.subcategories = restop.subcategories;
          returnObj.mediaType = restop.mediaType;
           
              Essay.count({"subcategories": params.subcatId}, function(e,totalpost) {
                ////console.log("totalpost: "+totalpost);
                returnObj.totalPost = totalpost;
                
                      Category.findOne({"parentIds.pid": params.subcatId }, function(ed,subcat) {
                          returnObj.nextSubcat = subcat;
                          //console.log("subcat: "+subcat);
                          //console.log("Final Obj---");
                          //console.log(returnObj);
                          return res.json({success: true, data: returnObj});
                      });
                    
                    
                  });

                

           // return res.json({success: true, data: restop});
        } else {
          //console.log("There are no topics outer");
          Category.findOne({"parentIds.pid": params.subcatId }, function(ed,subcat) {
                       returnObj.totalPost = 0;
                       
                          returnObj.nextSubcat = subcat;
                          //console.log("subcat: "+subcat);
                          //console.log("Final Obj---");
                          //console.log(returnObj);
                          return res.json({success: true, data: returnObj});
                      });
        }
        

        
      } else {
          //console.log("There are no topics outer");
          Category.findOne({"parentIds.pid": params.subcatId }, function(ed,subcat) {
                        returnObj.totalPost = 0;
                        
                          returnObj.nextSubcat = subcat;
                          //console.log("subcat: "+subcat);
                          //console.log("Final Obj---");
                          //console.log(returnObj);
                          return res.json({success: true, data: returnObj});
                      });
         
        }
    });

  } else {
    
    return res.json( { success: false, error: "There are no topics" } );

  }
    
  
}

module.exports.essayList = function (params, res, app) {  
  var query = '';
   if(params.subcatId) {
    if(params.maincatId){
      query = "parentcat : "+ params.maincatId +", subcategories : "+ params.subcatId;
    } else {
      query = "subcategories : "+ params.subcatId;
    }

    
    
    var returnObj = {};
    Essay.find({ subcategories: params.subcatId })
    .sort({"createdOn": -1})
    .exec(function(err,restop) {
     
      if (err) {
        //res.status(400);
        ////console.log("err: ",err);
        return res.json( { success: false, error: "There are no essay" } );
      }

      if(restop){
        ////console.log("Final topic List: ", restop);
        if(restop != '') {
          return res.json({success: true, data: restop}); 
           // return res.json({success: true, data: restop});
        } else {
          ////console.log("There are no topics");
          return res.json( { success: false, error: "There are no essay" } );
        }
        

        
      } else {
          ////console.log("There are no topics");
          return res.json( { success: false, error: "There are no essay" } );
        }
    });

  } else {
    
    return res.json( { success: false, error: "There are no essay" } );

  }
    
  
}



module.exports.getEssay = function (params, res, app) {  
  console.log("GetEssay Called");
  console.log(params);
  if(params.essayId){
    Essay.findOne({"_id": params.essayId})
    .exec(function(err,restop) {
      if (err) {
        res.status(400);
        ////console.log("err: ",err);
        return res.json( { success: false, error: "Unable to get Essay" } );
      }
      console.log("======================");
      console.log(restop);
      if(restop){
       return res.json({success: true, data: restop});
       
        
      }
    });
  } else {
    return res.json( { success: false, error: "There are no Essay" } );
  }
}

/*
module.exports.getOnlyTopic = function (params, res, app) {  
  ////console.log("Only topic");
  ////console.log(params);
    if(params.topicId){
      ////console.log("inside IF");
    Topics.findOne({"_id": params.topicId})
    .exec(function(err,restop) {
      ////console.log(err);
      ////console.log(restop);
      if (err) {
        //res.status(400);
        ////console.log("err: ",err);
        return res.json( { success: false, error: "Unable to get Topic" } );
      }

      if(restop){
        ////console.log("========getOnlyTopic=========");
        ////console.log(restop);
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
  ////console.log("GetTopic Called");
  ////console.log(params);
  if(params.topicId){
    Topics.find({$or:[{"_id": params.topicId}, {"parent": params.topicId}]})
    .sort({'_id': 1})
    .exec(function(err,restop) {
      if (err) {
        res.status(400);
        ////console.log("err: ",err);
        return res.json( { success: false, error: "Unable to get Topic" } );
      }
      ////console.log("======================");
      ////console.log(restop);
      if(restop){
        var finalData = Array();
        var len = restop.length;
        var j = 0;
        ////console.log("GetTopic Result");
        ////console.log(restop);
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

                    if(val.sticky=="Y") {
                      //console.log(val.stickyOrder);
                      //console.log(val);
                      val.orderPost = val.stickyOrder;
                      //console.log("IF : ", key);
                      finalData.splice(val.stickyOrder, 0, val);
                    } else {
                      val.orderPost = key;
                      //console.log("Else : ", key);
                      finalData.push(val);
                    }


                   
               
                     j++;

                     if(j==len) {
                        ////console.log(finalData);
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


module.exports.latestEssay = function (params, res, app) {  
  var query = ''
   if(params.subcatId) {
    if(params.maincatId){
      query = "parentcat : "+ params.maincatId +", subcategories : "+ params.subcatId;
    } else {
      query = "subcategories : "+ params.subcatId;
    }
    ////console.log("=========$$$$Latest Topic$$$========================");
    ////console.log(params.subcatId);
    var returnObj = {};
    Topics.findOne({ subcategories: params.subcatId })
    .sort({"createdOn": -1})
    .exec(function(err,restop) {

      ////console.log("first Result : ", err);
      
      ////console.log(" Result : ", restop);
      if (err) {
        //res.status(400);
        ////console.log("err: ",err);
        return res.json( { success: false, error: "There are no topics" } );
      }

      if(restop){
        ////console.log("latestTopic: ", restop);
        if(restop != '') {
          returnObj.id = restop._id;
          returnObj.title = restop.title;
          returnObj.createdby = restop.createdBy;
          returnObj.createdOn = restop.createdOn;
          returnObj.parent = restop.parent;
          returnObj.type = restop.type;
            Topics.count({"subcategories": params.subcatId, "parent": null}, function(e,totalthread) {
              ////console.log("totalthread: "+totalthread);
              returnObj.totalThread = totalthread;
              Topics.count({"subcategories": params.subcatId}, function(e,totalpost) {
                ////console.log("totalpost: "+totalpost);
                returnObj.totalPost = totalpost;
                Topics.count({"subcategories": params.subcatId, type: 'B'}, function(e,brainstorming) {
                  ////console.log("brainstorming: "+brainstorming);
                  returnObj.brainstorming = brainstorming;

                  Topics.count({"subcategories": params.subcatId, type: 'S'}, function(e,solution) {
                    ////console.log("solution: "+solution);
                    returnObj.solution = solution;
                      Category.findOne({"parentIds.pid": params.subcatId }, function(ed,subcat) {
                          returnObj.nextSubcat = subcat;
                          //console.log("subcat: "+subcat);
                          //console.log("Final Obj---");
                          //console.log(returnObj);
                          return res.json({success: true, data: returnObj});
                      });
                    
                    
                  });

                });

              });

          });
           // return res.json({success: true, data: restop});
        } else {
          //console.log("There are no topics outer");
          Category.findOne({"parentIds.pid": params.subcatId }, function(ed,subcat) {
                        returnObj.totalThread = 0;
                        returnObj.totalPost = 0;
                        returnObj.brainstorming = 0;
                        returnObj.solution = 0;

                          returnObj.nextSubcat = subcat;
                          //console.log("subcat: "+subcat);
                          //console.log("Final Obj---");
                          //console.log(returnObj);
                          return res.json({success: true, data: returnObj});
                      });
        }
        

        
      } else {
          //console.log("There are no topics outer");
          Category.findOne({"parentIds.pid": params.subcatId }, function(ed,subcat) {
                        returnObj.totalThread = 0;
                        returnObj.totalPost = 0;
                        returnObj.brainstorming = 0;
                        returnObj.solution = 0;

                          returnObj.nextSubcat = subcat;
                          //console.log("subcat: "+subcat);
                          //console.log("Final Obj---");
                          //console.log(returnObj);
                          return res.json({success: true, data: returnObj});
                      });
         
        }
    });

  } else {
    
    return res.json( { success: false, error: "There are no topics" } );

  }
    
  
}


module.exports.topicList = function (params, res, app) {  
  var query = ''
  console.log("TOOOOOOOOOOpic List called");
   if(params.subcatId) {
    if(params.maincatId){
      query = "parentcat : "+ params.maincatId +", subcategories : "+ params.subcatId;
    } else {
      query = "subcategories : "+ params.subcatId;
    }

    function checkKey(key, arr) {

      if(arr[key]!="") {
        var k = key + 1;
        checkKey(k, arr);
      } else {
        return key;
      }
    }
    
    var returnObj = {};
    Topics.find({ subcategories: params.subcatId, parent: null })
    .sort({"createdOn": -1})
    .exec(function(err,restop) {
     
      if (err) {
        //res.status(400);
        ////console.log("err: ",err);
        return res.json( { success: false, error: "There are no topics" } );
      }

      if(restop){
        ////console.log("Final topic List: ", restop);
        if(restop != '') {
          var len = restop.length;
          var j=0;
          var finalData = Array();
          var skipKey = [];
          var AddKey = [];
          async.forEachOf(restop, function(val, key, callback){
              val = val.toObject();
              Topics.count({"parent": val._id}, function(e,totalReply) {
                val.totalReply = totalReply;
                //if(totalReply > 0) {
                  Topics.findOne({ parent: val._id })
                  .sort({"createdOn": -1})
                  .exec(function(err,lastTopic) {
                    val.lastTopic = lastTopic;
                    
                    if(val.postSticky=="Y") {
                      //console.log(val.stickyOrder);
                      //console.log(val);
                      if(val.postOrder > 0) {
                        val.orderPost = val.postOrder - 1;  
                      } else {
                        val.orderPost = 0;
                      }
                      console.log(val.orderPost);
                      skipKey[val.orderPost] = val;
                      
                    } else {
                      val.orderPost = key;  
                      AddKey.push(val);
                    }
                    //console.log("Vallllllll");
                    //console.log(val);
                    
                    callback();
                  });

               
                
                
              });
            }, function(err) {
                console.log("This is called");
                if(err) { return res.json( { success: false, error: "There are no topics" } ); }
                console.log(skipKey);
                skipKey.filter(function(e){ console.log("Filter :",e); return e});
                console.log(skipKey);
                finalData = skipKey.concat(AddKey);
                return res.json({success: true, data: finalData}); 
              });
           // return res.json({success: true, data: restop});
        } else {
          ////console.log("There are no topics");
          return res.json( { success: false, error: "There are no topics" } );
        }
        

        
      } else {
          ////console.log("There are no topics");
          return res.json( { success: false, error: "There are no topics" } );
        }
    });

  } else {
    
    return res.json( { success: false, error: "There are no topics" } );

  }
    
  
}


module.exports.topicSearch = function (params, res, app) {  
  
   if(params.query) {
    var query = params.query;
    
    //onsole.log(finalQuery);
    var returnObj = {};
    //{$text: {$search: searchString}}
    Topics.find({$text: {$search: query}})
    .exec(function(err,restop) {
     //console.log(restop);
      if (err) {
        //res.status(400);
        ////console.log("err: ",err);
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
              Category.findOne({"_id": val.parentcat }, function(ed,category) {
                         val.category = category;
                          //console.log("subcat: "+subcat);
                          //console.log("Final Obj---");
                          //console.log(returnObj);
                          //console.log(val);
                          finalData.push(val);
                          j++;
                          if(len == j) {
                            return res.json({success: true, data: finalData});    
                          }
                      });
              
            });
           // return res.json({success: true, data: restop});
        } else {
          ////console.log("There are no topics");
          return res.json( { success: false, error: "There are no topics" } );
        }
        

        
      } else {
          ////console.log("There are no topics");
          return res.json( { success: false, error: "There are no topics" } );
        }
    });

  } else {
    
    return res.json( { success: false, error: "There are no topics" } );

  }
    
  
}


module.exports.topicAdvanceSearch = function (data, res, app) {  
  var params = data;
  console.log(params);
   //if(params.text) {
    var query = {};
    if(params.text) {
      query.$text = {$search: params.text};
    }

    if(params.time) {
      switch(params.time) {
        case 'Past hour' : 
                      var timestamp = new Date(Date.now() - 1 * 60 * 60 * 1000);
                      break;
        case 'Last 24hrs' : 
                      var timestamp = new Date(Date.now() - 24 * 60 * 60 * 1000);
                      break;
        case 'Last week' : 
                      var timestamp = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                      break;
        case 'Last month' : 
                      var timestamp = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                      break;
        case 'Last year' : 
                      var timestamp = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
                      break;
        default : 
                  var timestamp = '';
                  break;
      }
      if(timestamp!='') {
        console.log("Time start");
        console.log(timestamp);
        var hexSeconds = Math.floor(timestamp/1000).toString(16);
        console.log(hexSeconds);
        var constructedObjectId = ObjectID(hexSeconds + "0000000000000000");
        console.log(constructedObjectId);
        query._id = {"$gt" : constructedObjectId};  
        console.log("Time End");
      }
      
    }

    
    if(params.location) {
      query.location = params.location;
    }

    if(params.user) {
      var user = '';
      switch(params.user) {
        case 'All Press' : 
                      user = 'press';
                      break;
        case 'All Advocates' : 
                      user = 'advocate';
                      break;
        case 'All Politicians' : 
                      user = 'politician';
                      break;
        default : 
                  user = '';
                  break;
      }
      

      if(user!="") {
        var usertype = "createdBy.utype";
        console.log(usertype);
        query["createdBy.utype"] = user;  
      }
      
    }

 
    var returnObj = {};
    //{$text: {$search: searchString}}
    console.log(query);
    Topics.find(query)
    .exec(function(err,restop) {
    
      if (err) {
        //res.status(400);
        ////console.log("err: ",err);
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
              Category.findOne({"_id": val.parentcat }, function(ed,category) {
                         val.category = category;
                          //console.log("subcat: "+subcat);
                          //console.log("Final Obj---");
                          //console.log(returnObj);
                          //console.log(val);
                          finalData.push(val);
                          j++;
                          if(len == j) {
                            return res.json({success: true, data: finalData});    
                          }
                      });
              
            });
           // return res.json({success: true, data: restop});
        } else {
          ////console.log("There are no topics");
          return res.json( { success: false, error: "There are no topics" } );
        }
        

        
      } else {
          ////console.log("There are no topics");
          return res.json( { success: false, error: "There are no topics" } );
        }
    });

  
    
  
}

module.exports.extraData = function(data, res, app) {
  var params = JSON.parse(data.userData);
  var fromDate = new Date(params.lastLogin);
   //My Discussions
  //Topics.find({ "createdBy.id":  params.id, "createdOn": {"$gte": params.lastLogin} }, {"parent":1})
  Topics.find({ "createdBy.id":  params.id }, {"parent":1})
    .exec(function(err,docs) {
      // Map the docs into an array of just the _ids
        
        var parentids = docs.map(function(doc) { return doc.parent; });
        Topics.find({ "parent":  {"$in": parentids}, "createdOn": {"$gte": params.lastLogin} } )
        .exec(function(err,userExtraTopic) {
          var returnData = {};
          returnData.MyDiscussion = userExtraTopic;
          //Hot Topics
          Topics.find({parent: {$ne: null}}, {})
          .distinct("parent", function(err,hotTopics) {
                 
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
                      Topics.findOne({"_id": aid})
                      .exec(function(erra,resacttop) {
                        activehotTopics.push(resacttop);
                        x++;
                        if(x==alen) {
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
              
              if(totalActive) {
                

              if(totalActive.length > 0) {
                var len = totalActive.length;
                var j=0;
                var activeData = [];
                totalActive.forEach(function(val, key){
                  var id = val._id;
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
                returnData.ActiveData = totalActive;
            
                res.json({success: true, data: returnData});
              }

              } else {
                returnData.ActiveData = totalActive;
                res.json({success: true, data: returnData});
              }
              

          });//Active thread End


        });//Hot Topics End

      });

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
    if(data.stickyOrder && data.stickyOrder > 0) {
      updateString = {$inc : {'stickyOrder' : data.stickyOrder}, 'sticky': 'Y'};  
    } else {
      updateString = {$inc : {'stickyOrder' : 1}, 'sticky': 'Y'};  
    }
    
  }

  if(data.removeSticky) {
    updateString = {'sticky': 'N', 'stickyOrder': 0};
  }


  if(data.poststicky) {
    if(data.poststickyOrder && data.poststickyOrder > 0) {
      updateString = {$inc : {'postOrder' : data.poststickyOrder}, 'postSticky': 'Y'};  
    } else {
      updateString = {$inc : {'postOrder' : 1}, 'postSticky': 'Y'};  
    }
    
  }

  if(data.removepostSticky) {
    updateString = {'postSticky': 'N', 'postOrder': 0};
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
  console.log("update string");
  console.log(updateString);
  if(data.topicId) {
    Topics.update(query, updateString, {multi: false}, function (err, resData) {
      if(err) return res.json({success: false, error: err});
      Topics.findOne({_id: data.topicId}, function(e,totalpost) {
        if(totalpost.likes >= 10) {
            Topics.update({_id: data.topicId}, {type: 'S'}, {multi: false}, function (uerr, uresData) {
            });
        }
        if(resData) return res.json({success: true, data: resData});            
      });
    });  
  } else {
    res.json({success: false, error: "No topics found"});
  }

  
}

module.exports.removeAllTopic = function (res, app ) {

  ////console.log("removeTopic 1:", id);
  Topics.remove({}, function ( err, delData ) {
            if (err) return res.json({success: false, error: err});
            if (delData) res.json({success: true, data: delData});
          });
}

module.exports.removeTopic = function ( id, res, app ) {

  ////console.log("removeTopic 1:", id);

  Topics.find({"_id": id})
  .exec(function ( err, resData ) {
    if (err) return res.json({success: false, error: err});
    if (resData) {
      Topics.remove({"parent": id}, function ( err, Data ) {
           Topics.remove({_id: id}, function ( err, delData ) {
            if (err) return res.json({success: false, error: err});
            if (delData) res.json({success: true, data: delData});
          });
      });
     

    };//resData
  });//find
}
*/


module.exports.removeAllEssay = function (res, app ) {

  ////console.log("removeTopic 1:", id);
  Essay.remove({}, function ( err, delData ) {
            if (err) return res.json({success: false, error: err});
            if (delData) res.json({success: true, data: delData});
          });
}