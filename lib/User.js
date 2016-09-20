'use strict';

var util = require('./util');

// TODO document
var User = function(isAnon, user, dm) {
  this.value = user;
  this._isAnon = isAnon;
  this._dm = dm;
};

// TODO document
User.prototype.logout = function() {
  var user = this;
  return Promise.resolve()
  .then(function() {
    /* istanbul ignore else */
    if (user._isAnon) {
      user._dm.accessToken = undefined;
      user._dm._user = undefined;
      user._dm._rootTraversal = undefined;
      return Promise.resolve();
    }
    /* istanbul ignore next */
    return Promise.reject(new Error('ec_sdk_user_not_logged_out'));
  }).catch(util.errorHandler);
};

User.prototype.isAnonymous = function() {
  return this._isAnon;
};
User.prototype.isAnon = User.prototype.isAnonymous;

module.exports = User;
