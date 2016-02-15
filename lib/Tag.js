'use strict';

var halfred = require('halfred');
var traverson = require('traverson');

var util = require('./util');

var Tag = function(tag, dm, traversal) {
  this.value = tag;
  this._dm = dm;
  this._traversal = traversal;
};

Tag.prototype.save = function() {
  var tag = this;
  return new Promise(function(resolve, reject) {
    tag._getTraversal().then(function(traversal) {
      delete tag.value._curies;
      delete tag.value._curiesMap;
      delete tag.value._resolvedCuriesMap;
      delete tag.value._validation;
      delete tag.value._original;
      delete tag.value._embedded;
      traversal.continue().newRequest()
      .follow('self')
      .withRequestOptions(util.requestOptions({
        'Content-Type': 'application/json'
      }))
      .put(tag.value, function(err, res, traversal) {
        util.checkResponse(err, res).then(function(res) {
          if (res.statusCode === 204) {
            return resolve(true);
          }
          tag.value = halfred.parse(JSON.parse(res.body));
          tag._traversal = traversal;
          return resolve(tag);
        }).catch(reject);
      });
    }).catch(reject);
  });
};

Tag.prototype.delete = function() {
  var tag = this;
  return new Promise(function(resolve, reject) {
    tag._getTraversal().then(function(traversal) {
      traversal.continue().newRequest()
      .follow('self')
      .withRequestOptions(util.requestOptions())
      .delete(function(err, res) {
        util.checkResponse(err, res).then(function() {
          return resolve(true);
        }).catch(reject);
      });
    });
  });
};

Tag.prototype._getTraversal = function() {
  var tag = this;
  return new Promise(function(resolve, reject) {
    if (tag._traversal) {
      return resolve(tag._traversal);
    }
    traverson.from(tag.value.link('self').href).jsonHal()
    .withRequestOptions(util.requestOptions())
    .get(function(err, res, traversal) {
      util.checkResponse(err, res).then(function() {
        tag._traversal = traversal;
        return resolve(traversal);
      }).catch(reject);
    });
  });
};

module.exports = Tag;
