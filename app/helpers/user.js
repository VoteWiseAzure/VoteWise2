var Address = require('../models/address');
var User = require('../models/user');
var Geo = require('../models/geoDivPa');
var Advocate = require('../models/advocate');

var saltRounds = 10;
var bcrypt = require('bcrypt');
var md5 = require('md5');

var mailer = require('../middleware/mailer');
var jwt = require('jsonwebtoken');

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

    var user = new User({
        password: md5(req.body.password),
        admin: false,
        politician: usertype == 'politician' ? true : false,
        press: usertype == 'press' ? true : false,
        advocate: usertype == 'advocate' ? true : false,
        voter: usertype == 'voter' ? true : false,
        email: req.body.email,
        zipcode: req.body.zipcode,
        username: req.body.username
    });
    // save the user
    user.save(function (err, user) {
        if (err) {
            res.status(400);
            return res.json({ success: false, error: err });
        }

        else {
            //mailer.mailTo(app, user.email, 'Thank you for signing up!');
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
