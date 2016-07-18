var express = require('express');

// Models
var User = require('../../models/user');
var jwt = require('jsonwebtoken');

//helpers
var helpers = require('../../helpers/controllers');
var modelHelpers = require('../../helpers/user');
var emailHelpers = require('../../helpers/email');
var md5 = require('md5');
var mailgun = require('mailgun-js');
var encryptionhelper = require('../../helpers/encryptionhelper')

module.exports = function (app) {

    app.get('/check/username/:username', function (req, res) {
        var username = req.params.username;
        var taken = modelHelpers.isUsernameTaken(username, res)
    });

    app.get('/check/email/:email', function (req, res) {
        var email = req.params.email;
        taken = modelHelpers.isEmailTaken(email, res)
    });

    app.post('/user/signup', function (req, res) {

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

        modelHelpers.createuser(req, res);

    });


    app.post('/user/logout', function (req, res) {
        jwt.sign(user, app.get('superSecret'), {
            expiresIn: '1440m' // expires in 24 hours
        });
    });


    app.post('/user/authenticate', function (req, result) {

        User.findOne({
            username: req.body.username,
            password: md5(req.body.password)
        }, function (err, user) {

            if (err) { return result.json(helpers.response(false, err)); };

            if (!user) {
                return result.json(helpers.response(false, 'User not found! '));
            }

            if (user) {
                var token = jwt.sign(user, app.get('superSecret'), {
                    expiresIn: '1440m' // expires in 24 hours
                });

                // If user is found and password is right
                // create a token
                // return the information including token as JSON
                result.json({
                    success: true,
                    message: 'Logged In...',
                    name: user.username,
                    token: token
                });
            }
            else {
                return result.json(helpers.response(false, 'Authentication Failed'));
            }
        });
    });

    app.post('/user/verify', function (req, result) {
        var id = req.body.salt;
        id = encryptionhelper.decrypt(id);
        console.log(id);
        User.findOneAndUpdate({ _id: id }, { isemailverified: true }, null, function (err) {
            if (err) { return result.json(helpers.response(false, err)); };
            result.json({
                success: true
            });
        })
        //User.findOne({
        //    _id: id
        //}, function (err, user) {

        //    if (err) { return result.json(helpers.response(false, err)); };

        //    if (!user) {
        //        return result.json(helpers.response(false, 'User not found! '));
        //    }

        //    if (user) {

        //        user.isemailverified = true;

        //        //user.update({ _id: id }, { isemailverified: true }, { upsert: true }, function (err) {
        //        //    if (err) {
        //        //        result.status(400);
        //        //        return result.json({ success: false, error: err });
        //        //    }
        //        //    else {
        //        //        result.json({
        //        //            success: true
        //        //        });
        //        //    }
        //        //});
        //        //user.update(function (err, user) {
        //        //    if (err) {
        //        //        result.status(400);
        //        //        return result.json({ success: false, error: err });
        //        //    }
        //        //    else {
        //        //        result.json({
        //        //            success: true
        //        //        });
        //        //    }
        //        //});


        //    }
        //    else {
        //        return result.json(helpers.response(false, 'Authentication Failed'));
        //    }
        //});
    });

    app.post('/user/authenticateEmail', function (req, result) {

        User.findOne({
            email: req.body.email,
            isfacebooksigin: true
        }, function (err, user) {

            if (err) { return result.json(helpers.response(false, err)); };

            if (!user) {
                return result.json(helpers.response(false, 'User not found! '));
            }

            if (user) {
                var token = jwt.sign(user, app.get('superSecret'), {
                    expiresIn: '1440m' // expires in 24 hours
                });

                // If user is found and password is right
                // create a token
                // return the information including token as JSON
                result.json({
                    success: true,
                    message: 'Logged In...',
                    name: user.username,
                    token: token
                });
            }
            else {
                return result.json(helpers.response(false, 'Authentication Failed'));
            }
        });
    });
}
