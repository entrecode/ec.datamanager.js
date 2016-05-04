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
  var traversal;
  return Promise.resolve()
  .then(function() {
    return tag._getTraversal();
  })
  .then(function(traversal) {
    delete tag.value._curies;
    delete tag.value._curiesMap;
    delete tag.value._resolvedCuriesMap;
    delete tag.value._validation;
    delete tag.value._original;
    delete tag.value._embedded;
    return util.putP(
      traversal.continue().newRequest()
      .follow('self')
      .withRequestOptions(tag._dm._requestOptions({
        'Content-Type': 'application/json'
      })),
      tag.value
    );
  })
  .then(function(res) {
    traversal = res[1];
    return util.checkResponse(res[0]);
  })
  .then(function(res) {
    if (res.statusCode === 204) {
      return Promise.resolve(true);
    }
    tag.value = halfred.parse(JSON.parse(res.body));
    tag._traversal = traversal;
    return Promise.resolve(tag);
  })
  .catch(util.errorHandler);
};

Tag.prototype.delete = function() {
  var tag = this;
  return Promise.resolve()
  .then(function() {
    return tag._getTraversal();
  })
  .then(function(traversal) {
    return util.deleteP(
      traversal.continue().newRequest()
      .follow('self')
      .withRequestOptions(tag._dm._requestOptions())
    );
  })
  .then(function(res) {
    return util.checkResponse(res[0]);
  })
  .then(function() {
    return Promise.resolve(true);
  })
  .catch(util.errorHandler);
};

Tag.prototype._getTraversal = function() {
  var tag = this;
  if (tag._traversal) {
    return Promise.resolve(tag._traversal)
  }
  var traversal;
  return Promise.resolve()
  .then(function() {
    return util.getP(
      traverson.from(tag.value.link('self').href).jsonHal()
      .withRequestOptions(tag._dm._requestOptions())
    );
  })
  .then(function(res) {
    traversal = res[1];
    return util.checkResponse(res[0]);
  })
  .then(function() {
    tag._traversal = traversal;
    return Promise.resolve(tag._traversal);
  });
};

module.exports = Tag;
