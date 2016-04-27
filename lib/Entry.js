'use strict';

var halfred = require('halfred');
var util = require('./util');

var Asset = require('./Asset');

var Entry = function(entry, dm, model) {
  this.value = entry;
  this._dm = dm;
  this._model = model;
};

Entry.prototype.save = function() {
  var entry = this;
  var traversal;
  return Promise.resolve()
  .then(function() {
    return entry._dm._getTraversal();
  })
  .then(function(traversal) {
    cleanEntry(entry);
    return util.putP(
      traversal.continue().newRequest()
      .follow(entry._dm.id + ':' + entry._model.title)
      .withTemplateParameters({
        _id: entry.value._id
      })
      .withRequestOptions(entry._dm._requestOptions({
        'Content-Type': 'application/json'
      })),
      entry.value
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
    entry.value = halfred.parse(JSON.parse(res.body));
              if (entry._isNested) {
            makeNestedToResource(entry, entry._dm, entry._model);
          }

    entry._traversal = traversal;
    return Promise.resolve(entry);
  })
  .catch(util.errorHandler);
};

Entry.prototype.delete = function() {
  var entry = this;
  return Promise.resolve()
  .then(function() {
    return entry._dm._getTraversal();
  })
  .then(function(traversal) {
    return util.deleteP(
      traversal.continue().newRequest()
      .follow(entry._dm.id + ':' + entry._model.title)
      .withTemplateParameters({
        _id: entry.value._id
      })
      .withRequestOptions(entry._dm._requestOptions())
    )
  })
  .then(function(res) {
    return util.checkResponse(res[0]);
  })
  .then(function(res) {
    return Promise.resolve(true);
  })
  .catch(util.errorHandler);
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

/**
 * Returns the model title of a given property of this entry. Only works for linked types.
 * @param {String} property The name of the property of interest.
 * @returns {String}
 */
Entry.prototype.getModelTitle = function(property) {
  var links = this.value.linkArray(this._dm.id + ':' + this._model.title + '/' + property);
  /* istanbul ignore if */
  if (!links) {
    return undefined;
  }
  var regex = new RegExp('^.*\/api\/' + this._dm.id + '\/([a-zA-Z0-9_\\-]{1,256})\?.*$');
  return regex.exec(links[0].href)[1];
};

function cleanEntry(entry) {
  removeNestedResources(entry);
  delete entry.value._curies;
  delete entry.value._curiesMap;
  delete entry.value._resolvedCuriesMap;
  delete entry.value._validation;
  delete entry.value._original;
  delete entry.value._embedded;
}

function removeNestedResources(entry) {
  for (var link in entry.value._links) {
    var l = /^[a-f0-9]{8}:.+\/(.+)$/.exec(link);
    if (l) {
      if (Array.isArray(entry.value[l[1]])) {
        entry.value[l[1]] = entry.value[l[1]].map(function(e) {
          /* istanbul ignore else */
          if (e.hasOwnProperty('value')) {
            if (e.value.hasOwnProperty('assetID')) {
              return e.value.assetID;
            }
            return e.value._id;
          }
        });
      } else {
        /* istanbul ignore else */
        if (entry.value[l[1]].hasOwnProperty('value')) {
          if (entry.value[l[1]].value.hasOwnProperty('assetID')) {
            entry.value[l[1]] = entry.value[l[1]].value.assetID;
          } else {
            entry.value[l[1]] = entry.value[l[1]].value._id;
          }
        }
      }
    }
  }
}

function makeNestedToResource(entry, dm, model) {
  entry._isNested = true;
  for (var link in entry.value._links) {
    var l = /^[a-f0-9]{8}:.+\/(.+)$/.exec(link);
    if (l) {
      if (Array.isArray(entry.value[l[1]])) {
        entry.value[l[1]] = entry.value[l[1]].map(function(e) {
          if (e.hasOwnProperty('assetID')) {
            return new Asset(halfred.parse(e), dm);
          }
          var entry = new Entry(halfred.parse(e), dm, model);
          makeNestedToResource(entry, dm, model);
          return entry;
        });
      } else {
        if (entry.value[l[1]].hasOwnProperty('assetID')) {
          entry.value[l[1]] = new Asset(halfred.parse(entry.value[l[1]]), dm);
        } else {
          entry.value[l[1]] = new Entry(halfred.parse(entry.value[l[1]]), dm, model);
          makeNestedToResource(entry.value[l[1]], dm, model);
        }
      }
    }
  }
}

module.exports = Entry;
