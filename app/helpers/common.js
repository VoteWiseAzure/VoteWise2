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
    if(err) cb({"success": false, "error": "SESSION_EXPIRED"});
    if(decoded){
      try{
        // console.log("in try: ", decoded);
        cb ({"success": true, "data": decoded["_doc"]});
      }
      catch(e){
        console.log("excetption: ", decoded);
        cb ({"success": false, "error": "SESSION_EXPIRED"});
      }
    }
  });
}

module.exports.sortByKeys = function (array, order, key) {
      //create a new array for storage
      var newArray = [];
      
      //loop through order to find a matching id
      for (var i = 0; i < order.length; i++) { 
          
          //label the inner loop so we can break to it when match found
          dance:
          for (var j = 0; j < array.length; j++) {
              
              //if we find a match, add it to the storage
              //remove the old item so we don't have to loop long nextime
              //and break since we don't need to find anything after a match
              if (array[j][key] === order[i]) {
                  newArray.push(array[j]);
                  array.splice(j,1);
                  break dance;
              }
          }
      }
      return newArray;
};