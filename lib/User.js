'use strict';

// TODO document
var User = function(isAnon, user, dm, traversal) {
  this.value = user;
  this._isAnon = isAnon;
  this._dm = dm;
  this._traversal = traversal;
};

// TODO document
User.prototype.logout = function() {
  var user = this;
  return new Promise(function(resolve, reject) {
    /* istanbul ignore else */
    if (user._isAnon) {
      user._dm.accessToken = undefined;
      user._dm._user = undefined;
      return resolve();
    }
    /* istanbul ignore next */
    return reject(new Error('ec_sdk_user_not_logged_out'));
  });
};

module.exports = User;
