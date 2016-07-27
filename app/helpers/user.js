var Address = require('../models/address');
var User = require('../models/user');
var Topics = require('../models/topics');
var Questions = require('../models/questions');
var Answers = require('../models/answers');
var Geo = require('../models/geoDivPa');
var Advocate = require('../models/advocate');

var saltRounds = 10;
var bcrypt = require('bcrypt');
var md5 = require('md5');

var mailer = require('../middleware/mailer');
var jwt = require('jsonwebtoken');
var emailHelpers = require('../helpers/email');
var encryptionhelper = require('../helpers/encryptionhelper')
var helpers = require('./controllers');

module.exports.isUsernameTaken = function (username, res) {
    var valid;
    User.findOne({
        username: username
    }, function (err, user) {
        if (err) { return res.json({ taken: true }); }
        if (user) { return res.json({ taken: true }); }

        return res.json({ taken: false });
    });
}

module.exports.isEmailTaken = function (email, res) {
    var valid;
    User.findOne({
        email: email
    }, function (err, user) {
        if (err) { return res.json({ taken: true }); }
        if (user) { return res.json({ taken: true }); }

        return res.json({ taken: false });
    });
}

module.exports.getpublicProfile = function (id, res) {
    var valid;
    var returnData = {};
    
    console.log("id");
    console.log(id);

    User.findOne({
        _id: id
    }, {password: 0}, function (err, user) {
        returnData.userData = user;
        //get total posts by user
        Topics.count({"createdBy.id": id}, function(e,totalpost) {
          returnData.totalpost = totalpost;
          //console.log("totalpost");
           //console.log(returnData);
           //get total threads created by user
            Topics.count({"createdBy.id": id, "parent": null}, function(e,totalthread) {
                //console.log("totalthread");
              returnData.totalthread = totalthread;
                //console.log(returnData);
                //get total questions asked by user
                Questions.count({"author.type": id}, function(e,totalQuestions) {
                    //console.log("totalQuestions");
                  returnData.totalquestions = totalQuestions;
                   //console.log(returnData);
                   //get total answered questions for user
                    Answers.count({"author.type": id}, function(e,totalAnswers) {

                      returnData.totalanswers = totalAnswers;
                       //console.log("totalAnswers");
                            //console.log(returnData);
                            return res.json({success: true, data: returnData});
                        
                        
                      });
                    //get total answered questions for user end
                    
                    
                  });
                //get total questions asked by user end
                
                
              });
            //get total threads created by user end
            
            
          });
        //get total posts by user end

    });
}

module.exports.storeAddress = function (city, street, zip, res) {
    // Making new adress
    var address = new Address({
        city: city,
        street: street,
        zip: zip
    });

    // Saving adress
    address.save(function (err, address) {
        if (err) {
            res.status(400);
        }
    });

    return address;

}

module.exports.createuser = function (req, res) {

    var usertype = req.body.type;

    if(usertype) usertype = usertype.toLowerCase();

    var user = new User({
        password: req.body.password != '' ? md5(req.body.password) : '',
        admin: false,
        politician: usertype == 'politician' ? true : false,
        press: usertype == 'press' ? true : false,
        advocate: usertype == 'advocate' ? true : false,
        voter: usertype == 'voter' ? true : false,
        email: req.body.email,
        zipcode: req.body.zipcode,
        username: req.body.username,
        isfacebooksigin: (req.body.isfacebooksigin !== undefined && req.body.isfacebooksigin != null) ? req.body.isfacebooksigin : false
    });
    // save the user
    user.save(function (err, user) {
        if (err) {
            res.status(400);
            return res.json({ success: false, error: err });
        }

        else {
            console.log("User : " + user);
            var userId = encryptionhelper.encrypt(user._id.toString());
            var verifyUrl = req.body.verificationurl + "/" + userId;
            emailHelpers.sendWelcomeEmail(req.body.username, req.body.email, verifyUrl);
            return res.json({ success: true, user: user });
        }

    });

};

module.exports.storeUser = function (params, address, res, app) {

    Geo.findOne({
        ZIPCensusTabulationArea: address.zip
    }, function (err, zip) {

        if (!zip) {
            res.status(400);
            return res.json({ success: false, error: 'Not a valid zip' });
        }

        bcrypt.hash(params.password, saltRounds, function (err, hash) {

            // create a user, use adress id
            var user = new User({
                name: params.name,
                password: hash,
                admin: false,
                politician: false,
                press: false,
                advocate: false,
                address: address.id,
                email: params.email,
                geoDiv: zip.id,
                username: params.username
            });
            // save the user
            user.save(function (err, user) {
                if (err) {
                    res.status(400);
                    return res.json({ success: false, error: err });
                }

                else {
                    mailer.mailTo(app, user.email, 'Thank you for signing up!');
                    return res.json({ success: true, user: user });

                }

            });
        });
    });

}
