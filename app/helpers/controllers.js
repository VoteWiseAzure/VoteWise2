
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
