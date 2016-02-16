'use strict';

var halfred = require('halfred');
var util = require('./util');

var Entry = function(entry, dm, model, traversal) {
  this.value = entry;
  this._dm = dm;
  this._model = model;
  this._traversal = traversal;
};

Entry.prototype.save = function() {
  var entry = this;
  return new Promise(function(resolve, reject) {
    entry._model._getTraversal().then(function(traversal) {
      delete entry.value._curies;
      delete entry.value._curiesMap;
      delete entry.value._resolvedCuriesMap;
      delete entry.value._validation;
      delete entry.value._original;
      delete entry.value._embedded;
      traversal.continue().newRequest()
      .follow(entry._dm.id + ':' + entry._model.title)
      .withTemplateParameters({
        _id: entry.value._id
      })
      .withRequestOptions(entry._dm._requestOptions({
        'Content-Type': 'application/json'
      }))
      .put(entry.value, function(err, res, traversal) {
        util.checkResponse(err, res).then(function(res) {
          if (res.statusCode === 204) {
            return resolve(true);
          }
          entry.value = halfred.parse(JSON.parse(res.body));
          entry._traversal = traversal;
          return resolve(entry);
        }).catch(reject);
      });
    }).catch(reject);
  });
};

Entry.prototype.delete = function() {
  var entry = this;
  return new Promise(function(resolve, reject) {
    entry._model._getTraversal().then(function(traversal) {
      traversal.continue().newRequest()
      .follow(entry._dm.id + ':' + entry._model.title)
      .withTemplateParameters({
        _id: entry.value._id
      })
      .withRequestOptions(entry._dm._requestOptions())
      .delete(function(err, res) {
        util.checkResponse(err, res).then(function() {
          return resolve(true);
        }).catch(reject);
      });
    }).catch(reject);
  });
};

/**
 * Returns the title of a given property of this entry. Only works for linked types.
 * @param {String} property The name of the property of interest.
 * @returns {String|Array}
 */
Entry.prototype.getTitle = function(property) {
  var links = this.value.linkArray(this._dm.id + ':' + this._model.title + '/' + property);
  /* istanbul ignore if */
  if (!links) {
    return undefined;
  }
  if (links.length === 1) {
    return links[0].title;
  }
  var out = [];
  for (var i in links) {
    /* istanbul ignore else */
    if (links.hasOwnProperty(i)) {
      out.push(links[i].title);
    }
  }
  return out;
};

module.exports = Entry;
