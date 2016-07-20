
module.exports.validEmail = function ( email ) {
  var isValidEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      .test( email );

  return isValidEmail;
}

module.exports.validZip = function ( zip ) {
  var isValidZip = /(^\d{5}$)|(^\d{5}-\d{4}$)/.test( zip );

  return isValidZip;
}

module.exports.validUsername = function ( username ) {
  var isValidUsername = /^[0-9a-zA-Z_.-]+$/.test( username );

  return isValidUsername;
}

module.exports.response = function ( success, err ) {
  if ( !err  ) {
    err = false;
  }
  return { success: success, error: err };
}

module.exports.validPassword = function ( password ) {
  var isValidPassword = password.length >= 8;

  return isValidPassword;
}

module.exports.allVallidate = function ( zip, email, password, username  ) {
  // var validate = {};

  if ( zip && email && password && username ) {
    return {
      validate: true
  };
}

  else if ( zip && email && username ) {
    return {
      validate: false,
      err: 'Password must be 8 charectors long'
    };
  }

  else if ( zip && password && username ) {
    return {
      validate: false,
      err: 'Email is not valid'
    };
  }

  else if ( email && password && username) {
    return {
      validate: false,
      err: 'Zip is not valid'
    }
  }

  else if ( !email && !zip && !password && !username ) {
    return {
      validate: false,
      err: 'Zip is not valid, Email is not valid, Password must be 8 charectors long'
    };
  }

  else {
    return {
      validate: false
    };
  }

  }

module.exports.keySort = function(key, opt) {
  //sort on key
  //opt = 1 : asc, -1 : desc
  return function(a,b){
    if (a[key] < b[key]) return -(opt);
    if (a[key] > b[key]) return opt;
    return 0;
  }
}

module.exports.keySortByDate = function(key, opt) {
  //sort on key
  //opt = 1 : asc, -1 : desc
  return function(a,b){
    // Turn your strings into dates, and then subtract them
    // to get a value that is either negative, positive, or zero.
    if(opt == -1)
      return new Date(b[key]) - new Date(a[key]);
    else
      return new Date(a[key]) - new Date(b[key]);
      
  }
}
