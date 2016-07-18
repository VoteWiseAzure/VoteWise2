var express = require ('express');

// Models
var User = require('../../models/user');
var jwt = require('jsonwebtoken');

//helpers
var helpers = require('../../helpers/controllers');
var modelHelpers = require('../../helpers/user');
var Answers = require('../../models/answers');
var async = require('async');

var md5 = require('md5');

module.exports = function( app ) {

    app.get('/check/username/:username', function(req, res) {
        var username = req.params.username;
      const taken = modelHelpers.isUsernameTaken(username, res)
    });

    app.get('/check/email/:email', function(req, res) {
        var email = req.params.email;
        taken = modelHelpers.isEmailTaken(email, res)
    });

    app.post('/user/signup', function(req, res) {

        // Validations
        //var params = req.body;
        // var isValidZip = helpers.validZip( params.zip );
        // var isValidEmail = helpers.validEmail( params.email );
        // var isValidPassword = helpers.validPassword( params.password );
        // var isValidUsername = helpers.validUsername( params.username );
        // Uncomment this line for production, validations before database
        // var allValid = helpers.allVallidate( isValidZip, isValidEmail, isValidPassword, isValidUsername );
        // var allValid = true;

        // Returns address model
        //var address = modelHelpers.storeAddress( params.city, params.street, params.zip, res );

        // Stores user in db
        // modelHelpers.storeUser( params, address, res, app );

        modelHelpers.createuser(req,res);

    });

    app.post('/user/logout',function(req,res)
    {
        jwt.sign(user, app.get('superSecret'), {
            expiresIn: '1440m' // expires in 24 hours
        });
    });

    app.post('/user/authenticate', function( req, result ) {

        User.findOne({
            username: req.body.username,
            password : md5(req.body.password)
        }, function( err, user ) {

            if ( err ) { return result.json( helpers.response( false, err ) ); };

            if ( !user ) {
                return result.json( helpers.response( false, 'User not found! ' ) );
            }

            if ( user ) {
                var token = jwt.sign(user, app.get('superSecret'), {
                    expiresIn: '1440m' // expires in 24 hours
                });

                // If user is found and password is right
                // create a token
                // return the information including token as JSON
                result.json({
                    success: true,
                    message: 'Logged In...',
                    name : user.username,
                    token: token
                });
            }
            else {
                return result.json( helpers.response( false, 'Authentication Failed' ) );
            }
        });
    });

    
    app.get('/user/list', function(req, res) {
        var params = req.query;
        
        var validUserTypes = ['politician', 'voter', 'advocate', 'press'];
        var userQuery = {};

        /*
        var user_type = req.query.usertype ? req.query.usertype.split(",") : [];
        if(user_type.length > 0){
            var len = user_type.length;
            for (var i = 0; i < len; i++) {
                if(validUserTypes.indexOf(user_type[i]) <= -1){
                    return res.json({success: false, error: "Invalid user type. Valid user types are: "+validUserTypes.join(", ")});
                }
                else{
                    userQuery[ user_type[i] ] = true;
                }
            };
        }
        */

        if(req.query.usertype){
            if(validUserTypes.indexOf(req.query.usertype) <= -1)
                return res.json({success: false, error: "Invalid user type. Valid user types are: "+validUserTypes.join(", ")});
            else
                userQuery[req.query.usertype] = true;
        }

        console.log("userQuery: ",userQuery);

        User.find(userQuery, {password: 0})
        .exec(function( err, user ) {
            if ( err ) return res.json({"success":false, "error": err});

            if ( !user ) {
                return res.json({"success":false, "error": 'User not found! '});
            }

            if ( user ) {
                var tempUArr = [];
                async.forEachOf(user, function (udata, key, callback) {
                Answers.count({"author": udata._id}).exec(function(err, countData){
                    if(err) countData = 0;

                    tempUArr.push({
                        "_id": udata._id,
                        "name": udata.name,
                        "advocate": udata.advocate,
                        "press": udata.press,
                        "politician": udata.politician,
                        "admin": udata.admin,
                        "address": udata.address,
                        "email": udata.email,
                        "geoDiv": udata.geoDiv,
                        "username": udata.username,
                        "created": udata.created,
                        "total_answers": countData
                    });
                  callback();
                });
                //return callback("exceptino"); //intrupt the loop
                }, function (err) {
                  if (err) console.error(err.message);
                  //all traversed
                  return res.json({success: true, data: tempUArr});
                });
            }//if user
        });
    });        
}
