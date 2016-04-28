'use strict';

var halfred = require('halfred');
var util = require('./util');
var traverson = require('traverson');
var TraversonJsonHalAdapter = require('traverson-hal');

var Asset = require('./Asset');
traverson.registerMediaType(TraversonJsonHalAdapter.mediaType, TraversonJsonHalAdapter);

var Entry = function(entry, dm, model, traversal) {
  this.value = entry;
  this._dm = dm;
  this._model = model;
  this._traversal = traversal;
};

Entry.prototype.save = function() {
  var entry = this;
  return new Promise(function(resolve, reject) {
    cleanEntry(entry);
    traverson.from(entry.value.link('self').href).jsonHal()
    .withRequestOptions(entry._dm._requestOptions({
      'Content-Type': 'application/json'
    }))
    .put(entry.value, function(err, res, traversal) {
      util.checkResponse(err, res).then(function(res) {
        if (res.statusCode === 204) {
          return resolve(true);
        }
        entry.value = halfred.parse(JSON.parse(res.body));
        if (entry._isNested) {
          Entry._makeNestedToResource(entry, entry._dm, entry._model);
        }
        entry._traversal = traversal;
        return resolve(entry);
      }).catch(reject);
    });
  });
};

Entry.prototype.delete = function() {
  var entry = this;
  return new Promise(function(resolve, reject) {
    traverson.from(entry.value.link('self').href).jsonHal()
    .withRequestOptions(entry._dm._requestOptions())
    .delete(function(err, res) {
      util.checkResponse(err, res).then(function() {
        return resolve(true);
      }).catch(reject);
    });
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
          } else {
            return e;
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

Entry._makeNestedToResource = function(entry, dm) {
  entry._isNested = true;
  for (var link in entry.value._links) {
    var l = /^[a-f0-9]{8}:.+\/(.+)$/.exec(link);
    if (l) {
      if (Array.isArray(entry.value[l[1]])) {
        entry.value[l[1]] = entry.value[l[1]].map(function(e) {
          if (e.hasOwnProperty('assetID')) {
            return new Asset(halfred.parse(e), dm);
          }
          var out = new Entry(halfred.parse(e), dm);
          out._model = dm.model(entry.value.link(link).name);
          Entry._makeNestedToResource(out, dm);
          return out;
        });
      } else {
        if (entry.value[l[1]].hasOwnProperty('assetID')) {
          entry.value[l[1]] = new Asset(halfred.parse(entry.value[l[1]]), dm);
        } else {
          entry.value[l[1]] = new Entry(halfred.parse(entry.value[l[1]]), dm, dm.model(entry.value.link(link).name));
          Entry._makeNestedToResource(entry.value[l[1]], dm);
        }
      }
    }
  }
};

module.exports = Entry;
