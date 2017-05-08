'use strict';

var halfred = require('halfred');
var util = require('./util');
var locale = require('locale');
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
  if (!Array.isArray(this.value[property])) {
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
    var l = /^[a-f0-9]{8}:.+\/(?!creator)(.+)$/.exec(link);
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

function uniq(arr) {
  var u = {}, a = [];
  for (var i = 0, l = arr.length; i < l; ++i) {
    if (Object.prototype.hasOwnProperty.call(u, arr[i])) {
      continue;
    }
    a.push(arr[i]);
    u[arr[i]] = 1;
  }
  return a;
}

function compact(arr) {
  var a = [];
  for (var i = 0; i < arr.length; i++) {
    if (arr[i]) {
      a.push(arr[i]);
    }
  }
  return a;
}

function remove(arr, func) {
  var a = [];
  for (var i = 0; i < arr.length; i++) {
    if (!func.call(this, arr[i])) {
      a.push(arr[i]);
    }
  }
  return a;
}

Entry.prototype.getFileUrl = function (field, locale) {
  return this._negotiate(field, false, false, null, locale);
};
Entry.prototype.getImageUrl = function (field, size, locale) {
  return this._negotiate(field, true, false, size, locale);
};
Entry.prototype.getImageThumbUrl = function (field, size, locale) {
  return this._negotiate(field, true, true, size, locale);
};

Entry.prototype._negotiate = function (field, image, thumb, size, requestedLocale) {
  var original = this.value.embeddedArray(this._dm.id + ':' + this._model.title + '/' + field + '/asset');
  if (!original) {
    if (Array.isArray(this.value[field])) {
      return [];
    }
    return undefined;
  }

  var assets = JSON.parse(JSON.stringify(original));

  var results = assets.map(function (asset) {
    if (requestedLocale) {
      var supportedLocales = new locale.Locales(compact(uniq(asset.files.map(function (elem) {
        return elem.locale;
      }))));
      var bestLocale = (new locale.Locales(requestedLocale)).best(supportedLocales).toString();
      bestLocale = /^([^\.]+)/.exec(bestLocale)[1]; //remove charset
      var filesWithLocale = asset.files.filter(function (file) {
        return file.locale === bestLocale;
      });
      if (filesWithLocale && filesWithLocale.length > 0) {
        asset.files = filesWithLocale;
      }
    }
    if (!image && !thumb && asset.type !== 'image') { // for getFileUrl pic fist file and return - not for images
      return asset.files[0].url;
    }
    var first = asset.files[0];
    asset.files = remove(asset.files, function (file) { // remove image files we have no resolution for (image/svg+xml; fix for CMS-1091)
      return file.resolution === null;
    });
    if (asset.files.length === 0) { // if no file is left pick first of original data
      return first.url;
    }
    asset.files.sort(function (left, right) { // sort by size descending
      var leftMax = Math.max(left.resolution.height, left.resolution.width);
      var rightMax = Math.max(right.resolution.height, right.resolution.width);
      if (leftMax < rightMax) {
        return 1;
      } else if (leftMax > rightMax) {
        return -1;
      } else {
        return 0;
      }
    });
    var imageFiles = asset.files.filter(function (file) {
      if (thumb) {
        return file.url.indexOf('_thumb') !== -1; // is thumbnail
      } else {
        return file.url.indexOf('_thumb') === -1; // is not a thumbnail
      }
    });
    if (!imageFiles || imageFiles.length === 0) {
      imageFiles = asset.files;
    }
    var largest = imageFiles[0];
    if (size) {
      imageFiles = imageFiles.filter(function (file) { // remove all image resolutions that are too small
        return file.resolution.height >= size || file.resolution.width >= size;
      });
      imageFiles = imageFiles.slice(-1); // choose smallest image of all that are greater than size
                                         // parameter
    }

    if (imageFiles.length > 0) { // if all is good, we have an image now
      return imageFiles[0].url;
    } else {
      // if the requested size is larger than the original image, we take the largest possible one
      return largest.url;
    }
  });

  if (!Array.isArray(this.value[field])) {
    return results[0];
  }
  return results;
};

Entry.prototype.getOriginal = function (field) {
  var original = this.value.embeddedArray(this._dm.id + ':' + this._model.title + '/' + field + '/asset');
  if (!original) {
    throw new Error('ec.datamanager.js cannot find embedded asset for field ' + field);
  }

  var assets = JSON.parse(JSON.stringify(original));

  var results = assets.map(function (asset) {
    if (asset.type !== 'image') {
      return asset.files[0];
    }

    var first = asset.files[0];
    asset.files = remove(asset.files, function (file) { // remove image files we have no resolution for (image/svg+xml; fix for CMS-1091)
      return file.resolution === null;
    });
    if (asset.files.length === 0) {
      return first;
    }
    asset.files.sort(function (left, right) { // sort by size descending
      var leftMax = Math.max(left.resolution.height, left.resolution.width);
      var rightMax = Math.max(right.resolution.height, right.resolution.width);
      if (leftMax < rightMax) {
        return 1;
      } else if (leftMax > rightMax) {
        return -1;
      } else {
        return 0;
      }
    });

    return asset.files[0];
  });

  if (!Array.isArray(this.value[field])) {
    return results[0];
  }
  return results;
};

module.exports = Entry;
