var Admin = require('./admin');
var Advocate = require('./advocate');
var Politician = require('./politician');
var Press = require('./press');
var User = require('./user');
var Fips = require('./fips');
var Zip = require('./zipToState');
var Geo = require('./geoDivPa');
var Thread = require('./thread');
var Post = require('./post');
var auth = require('../../middleware/userAuth');
// var votewiseSearch = require('./search');

var Categories = require('./categories');
var Questions = require('./questions');
var Answers = require('./answers');


module.exports = ( app ) => {
    Admin( app );
    Advocate( app );
    Politician( app );
    Press( app );
    User( app );
    Fips( app );
    Zip( app );
    Geo( app );
    Thread( app );
    Post( app );
	// votewiseSearch(app);
    Categories (app);
    Questions (app);
    Answers(app);
};
