var express = require('express');
var util = require('util');
var helpers = require('./controllers');
var mailcomposer = require('mailcomposer');

var api_key = "key-040b9ac24309be5a760f091795a4dae5";
var domain = "votewise.email";
var mailgun = require('mailgun-js')({ apiKey: api_key, domain: domain });

module.exports.sendWelcomeEmail = function (username, email, verificationUrl) {

    function getTemplate(username, email, verifyUrl) {
        
        var url = util.format("Please confirm your email address by clicking the link <a href=\"%s\">here</a>:  <br/><br/>", verifyUrl);
        console.log(url);
        var template = util.format("Dear %s, <br/><br/>" +
                "Thank you for joining the movement to help repair democracy.<br/><br/> %s Right now, VoteWise is a bit rough around the edges. We will keep in touch to let you know when each of the features become available (about one email per month until November). But even now, there is plenty to explore. Go to the User Forum and discuss the issues with your neighbors and learn about the world around you.<br/><br/>" +
                "Have fun.<br/>" +
                "-The Staff at VoteWise.net<br/><br/>" +
                "Unsubscribe by clicking <a href=\"http://www.votewise.net\">here</a>", username, url);

        return template;
    }
    var toemail = email;
    var username = username;
    console.log("*Sending mail to : ",email);
    var data = {
      from: "spencersnygg@silentmonkeys.com",
      to: email,
      subject: 'Welcome to VoteWise',
      html: getTemplate(username, email, verificationUrl)
    };

    //Invokes the method to send emails given the above data with the helper library
    mailgun.messages().send(data, function (err, body) {
        if (err) {
            console.log("got an error: ", err);
            return;
        }
        else {
            console.log("* Email sent: ",body);
            return;
        }
    });
    
    /*var mail = mailcomposer({
        from: 'spencersnygg@silentmonkeys.com',
        to: email,
        subject: 'Welcome to VoteWise',
        body: getTemplate(username, email, verificationUrl),
        html: getTemplate(username, email, verificationUrl)
    });*/
    /*
    mail.build(function (mailBuildError, message) {

        var dataToSend = {
            to: email,
            message: message.toString('ascii')
        };

        mailgun.messages().sendMime(dataToSend, function (sendError, body) {
            if (sendError) {
                console.log(sendError);
                return;
            }
        });
    });
    */
}