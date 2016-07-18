
var express = require ('express');

// Models
var lookup = require('../../models/lookup');

module.exports = function( app ) {

  //var votewise = express.Router();
  //auth( votewise, app );

  app.get('/votewise/search/:zip', function(req, res) {
    
	var zipcode = req.params.zip;
	
    lookup.find({"zcta5":zipcode}, function(err, votewise) 
	{
	  console.log(votewise)
      if ( err )
	  {
		res.json( { sucess: flase, err: err } ) 
	  };
      res.json( votewise );
    });	
  });
};
