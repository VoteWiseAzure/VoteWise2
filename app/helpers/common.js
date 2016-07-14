var jwt = require('jsonwebtoken');

module.exports.verfiyRequiredFields = function ( params, reqParams) {
  var len = params.length;
  var notDefined = [];
  for (var i = 0; i < len; i++) {
    if(!reqParams[params[i]]){
      notDefined.push(params[i]);
    }
  }

  if(notDefined.length > 0){
    return( { success: false, error: "required fields: "+notDefined.join(", ")} );
  }
  else{
    return ( { success: true, error: null } );
  }
}

module.exports.getUserFromToken = function ( token, app, cb) {
  jwt.verify(token, app.get('superSecret'), function(err, decoded){
    if(err) cb({success: false, data: err});
    if(decoded){
      try{
        console.log("in try: ", decoded);
        cb ({success: true, data: decoded["_doc"]});
      }
      catch(e){
        console.log("excetption: ", decoded);
        cb ({success: false, data: e});
      }
    }
  });
}

