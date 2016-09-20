'use strict';

var halfred = require('halfred');
var util = require('./util');
var traverson = require('traverson');
var TraversonJsonHalAdapter = require('traverson-hal');

var Asset = require('./Asset');
traverson.registerMediaType(TraversonJsonHalAdapter.mediaType, TraversonJsonHalAdapter);

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
    var property;
    cleanEntry(entry);
    var t;
    if (entry.value._links && entry.value._links.hasOwnProperty('self')) {
      t = traverson.from(entry.value._links.self[0].href).jsonHal();
    } else {
      t = traverson.from(entry._dm.url).jsonHal()
      .follow(entry._dm.id + ':' + entry._model.title)
      .withTemplateParameters({
        _id: entry.value._id,
      });
    }
    t.withRequestOptions(entry._dm._requestOptions({
      'Content-Type': 'application/json'
    }));
    var valueToSave = {};
    if (!entry.value.hasOwnProperty('$loki') || !entry.value.hasOwnProperty('meta')) {
      return util.putP(t, entry.value);
    }
    for (property in entry.value) { // loki.js poisons entry.value with properties "$loki" and "meta". We need to remove them in order to save the entry
      if (entry.value.hasOwnProperty(property) && property !== '$loki' && property !== 'meta') {
        valueToSave[property] = entry.value[property];
      }
    }
    return util.putP(t, valueToSave);
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
      makeNestedToResource(entry, entry._dm);
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
    var t;
    if (entry.value._links && entry.value._links.hasOwnProperty('self')) {
      t = traverson.from(entry.value._links.self[0].href).jsonHal();
    } else {
      t = traverson.from(entry._dm.url).jsonHal()
      .follow(entry._dm.id + ':' + entry._model.title)
      .withTemplateParameters({
        _id: entry.value._id,
      });
    }
    t.withRequestOptions(entry._dm._requestOptions({
      'Content-Type': 'application/json'
    }));
    return util.deleteP(t);
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
  delete entry.value._curies;
  delete entry.value._curiesMap;
  delete entry.value._resolvedCuriesMap;
  delete entry.value._validation;
  delete entry.value._original;
  delete entry.value._embedded;
  removeNestedResources(entry);
}

function removeNestedResources(entry) {
  for (var field in entry.value) {
    if (entry.value.hasOwnProperty(field)) {
      if (Array.isArray(entry.value[field])) {
        entry.value[field] = entry.value[field].map(function(e) {
          if (e instanceof Asset) {
            return e.value.assetID;
          } else if (e instanceof Entry) {
            return e.value._id;
          } else {
            return e;
          }
        });
      } else {
        /* istanbul ignore else */
        if (entry.value[field] instanceof Asset) {
          entry.value[field] = entry.value[field].value.assetID;
        } else if (entry.value[field] instanceof Entry) {
          entry.value[field] = entry.value[field].value._id;
        }
      }
    }
  }
}

function makeNestedToResource(entry, dm) {
  entry._isNested = true;
  for (var link in entry.value._links) {
    var l = /^[a-f0-9]{8}:.+\/(.+)$/.exec(link);
    if (l) {
      if (Array.isArray(entry.value[l[1]])) {
        entry.value[l[1]] = entry.value[l[1]].map(function(e) {
          if (e.hasOwnProperty('assetID')) {
            return new Asset(halfred.parse(e), dm);
          }

          if (e.hasOwnProperty('_id')) {
            var out = new Entry(halfred.parse(e), dm);
            out._model = dm.model(entry.value.link(link).name);
            makeNestedToResource(out, dm);
            return out;
          }

          return e;
        });
      } else {
        if (entry.value[l[1]].hasOwnProperty('assetID')) {
          entry.value[l[1]] = new Asset(halfred.parse(entry.value[l[1]]), dm);
        } else if (entry.value[l[1]].hasOwnProperty('_id')) {
          entry.value[l[1]] = new Entry(halfred.parse(entry.value[l[1]]), dm, dm.model(entry.value.link(link).name));
          makeNestedToResource(entry.value[l[1]], dm);
        }
      }
    }
  }
}

Entry.prototype.clone = function() {
  cleanEntry(this);
  var e = new Entry(halfred.parse(JSON.parse(JSON.stringify(this.value))), this._dm);
  if (this._isNested) {
    makeNestedToResource(e, this._dm);
  }
  return e;
};

Entry._makeNestedToResource = makeNestedToResource;

module.exports = Entry;
