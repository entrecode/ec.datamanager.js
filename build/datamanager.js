(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.DataManager = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var halfred = require('halfred');
var locale = require('locale');
var util = require('./util');

var Asset = function(asset, dm) {
  this.value = asset;
  this._dm = dm;
};

Asset.prototype.save = function() {
  var asset = this;
  return new Promise(function(resolve, reject) {
    asset._dm._getTraversal().then(function(traversal) {
      delete asset.value._curies;
      delete asset.value._curiesMap;
      delete asset.value._resolvedCuriesMap;
      delete asset.value._validation;
      delete asset.value._original;
      delete asset.value._embedded;
      traversal.continue().newRequest()
      .follow('ec:api/assets')
      .withTemplateParameters({
        assetID: asset.value.assetID
      }).withRequestOptions(asset._dm._requestOptions({
        'Content-Type': 'application/json'
      }))
      .put(asset.value, function(err, res, traversal) {
        util.checkResponse(err, res).then(function(res) {
          if (res.statusCode === 204) {
            return resolve(true);
          }
          asset.value = halfred.parse(JSON.parse(res.body));
          return resolve(asset);
        }).catch(reject);
      });
    }).catch(reject);
  });
};

Asset.prototype.delete = function() {
  var asset = this;
  return new Promise(function(resolve, reject) {
    asset._dm._getTraversal().then(function(traversal) {
      traversal.continue().newRequest()
      .follow('ec:api/assets')
      .withTemplateParameters({
        assetID: asset.value.assetID
      })
      .withRequestOptions(asset._dm._requestOptions())
      .delete(function(err, res) {
        util.checkResponse(err, res).then(function() {
          return resolve(true);
        }).catch(reject);
      });
    });
  });
};

Asset.prototype.getFileUrl = function(locale) {
  return this._negotiate(false, false, null, locale);
};
Asset.prototype.getImageUrl = function(size, locale) {
  if (this.value.type !== 'image') {
    throw new Error('ec.datamanager.js getImageUrl only works on image assets');
  }
  return this._negotiate(true, false, size, locale);
};
Asset.prototype.getImageThumbUrl = function(size, locale) {
  if (this.value.type !== 'image') {
    throw new Error('ec.datamanager.js getImageThumbUrl only works on image assets');
  }
  return this._negotiate(true, true, size, locale);
};

Asset.prototype._negotiate = function(image, thumb, size, requestedLocale) {
  var asset = JSON.parse(JSON.stringify(this.value));

  if (requestedLocale) {
    var supportedLocales = new locale.Locales(compact(uniq(asset.files.map(function(elem) {
      return elem.locale;
    }))));
    var bestLocale = (new locale.Locales(requestedLocale)).best(supportedLocales).toString();
    bestLocale = /^([^\.]+)/.exec(bestLocale)[1]; //remove charset
    var filesWithLocale = asset.files.filter(function(file) {
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
  asset.files = remove(asset.files, function(file) { // remove image files we have no resolution for (image/svg+xml; fix for CMS-1091)
    return file.resolution === null;
  });
  if (asset.files.length === 0) { // if no file is left pick first of original data
    return first.url;
  }
  asset.files.sort(function(left, right) { // sort by size descending
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
  var imageFiles = asset.files.filter(function(file) {
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
    imageFiles = imageFiles.filter(function(file) { // remove all image resolutions that are too small
      return file.resolution.height >= size || file.resolution.width >= size;
    });
    imageFiles = imageFiles.slice(-1); // choose smallest image of all that are greater than size parameter
  }

  if (imageFiles.length > 0) { // if all is good, we have an image now
    return imageFiles[0].url;
  } else {
    // if the requested size is larger than the original image, we take the largest possible one
    return largest.url;
  }
};

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
};

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

module.exports = Asset;

},{"./util":7,"halfred":10,"locale":19}],2:[function(require,module,exports){
'use strict';

var halfred = require('halfred');
var loki = require('lokijs');
var request = require('superagent');
var shiroTrie = require('shiro-trie');
var traverson = require('traverson');
var TraversonJsonHalAdapter = require('traverson-hal');

var Asset = require('./Asset');
var Entry = require('./Entry');
var Model = require('./Model');
var User = require('./User');
var Tag = require('./Tag');
var util = require('./util');

require('es6-promise').polyfill();
traverson.registerMediaType(TraversonJsonHalAdapter.mediaType, TraversonJsonHalAdapter);
util.promisify(traverson);

/**
 * Constructs a instance of DataManager SDK for a specific Data Manager. Accepts an options object containing 'url' or
 * 'id' and an optional parameter 'accessToken'.
 *
 * Example:
 * <pre><code>
 *  var dataManager = new DataManager({
 *    id: 'beefbeef',
 *    accessToken: 'aReallyLongJWTToken'
 *  });
 * </code></pre>
 * @param {Object} options Object containing either 'url' or 'id' and optionally 'accessToken'.
 * @constructor
 */
var DataManager = function(options) {
  if (!options || (!options.hasOwnProperty('url') && !options.hasOwnProperty('id'))) {
    throw new Error('ec_sdk_no_url_or_id_set');
  }
  if (options.hasOwnProperty('url') && options.url !== null) {
    this.url = options.url;
  } else {
    this.id = options.id;
    this.url = 'https://datamanager.entrecode.de/api/' + this.id;
  }
  if (this.url.slice(-1) === '/') {
    this.url = this.url.substr(0, this.url.length - 1);
  }
  if (!this.id) {
    this.id = this.url.split('/').reverse()[0];
  }
  if (!/^[a-f0-9]+$/i.test(this.id)) {
    throw new Error('ec_sdk_invalid_url');
  }
  
  this._fileUrl = this.url.replace('api/' + this.id, 'files'); // TODO relation for bestFile api
  this._modelCache = {};
  this._rootTraversal = null;
  
  if (options.hasOwnProperty('accessToken')) {
    this.accessToken = options.accessToken;
  }
  if (options.hasOwnProperty('clientID')) {
    this.clientID = options.clientID;
  }
  if (options.hasOwnProperty('errorHandler')) {
    this.errorHandler = options.errorHandler;
  }
  
  util._dm = this;
};

/**
 * Default fileUrl for bestFile functions {@link DataManager.getFileUrl}, {@link DataManager.getImageUrl}, and {@link
  * DataManager.getImageThumbUrl}.
 *
 * @private
 * @constant {string} _fileUrl
 */
DataManager._fileUrl = 'https://datamanager.entrecode.de/files';

/**
 * Best file method for generic files.
 *
 * @function _getFileUrl
 * @static
 * @param {String} assetID The assetID of the file to look up.
 * @param {String} locale The locale to request.
 * @param {String} url The url of the Data Manager in which the asset should be looked up.
 * @returns {Promise}
 */
DataManager._getFileUrl = function(assetID, locale, url) {
  return Promise.resolve()
  .then(function() {
    if (!assetID) {
      return Promise.reject(new Error('ec_sdk_no_assetid_provided'));
    }
    var req = request.get(url + '/' + assetID + '/url');
    if (locale) {
      req.set('Accept-Language', locale);
    }
    
    return new Promise(function(resolve, reject) {
      req.end(function(err, res) {
        if (err) {
          return reject(err);
        }
        if (!res.body.hasOwnProperty('url')) {
          return reject(new Error('ec_sdk_could_not_get_url_for_file'));
        }
        return resolve(res.body.url);
      });
    });
  });
};

/**
 * Best file method for image files.
 *
 * @function _getImageUrl
 * @static
 * @param {String} assetID The assetID of the image to look up.
 * @param {Integer} size The image size to request.
 * @param {String} locale The locale to request.
 * @param {String} url The url of the Data Manager in which the asset should be looked up.
 * @returns {Promise}
 */
DataManager._getImageUrl = function(assetID, size, locale, url) {
  return Promise.resolve()
  .then(function() {
    if (!assetID) {
      return Promise.reject(new Error('ec_sdk_no_assetid_provided'));
    }
    var req = request.get(url + '/' + assetID + '/url');
    if (locale) {
      req.set('Accept-Language', locale);
    }
    if (size) {
      req.query({ size: size });
    }
    
    return new Promise(function(resolve, reject) {
      req.end(function(err, res) {
        if (err) {
          return reject(err);
        }
        if (!res.body.hasOwnProperty('url')) {
          return reject(new Error('ec_sdk_could_not_get_url_for_file'));
        }
        return resolve(res.body.url);
      });
    });
  });
};

/**
 * Best file method for image thumb files.
 *
 * @function _getImageThumbUrl
 * @static
 * @param {String} assetID The assetID of the thumb to look up.
 * @param {Integer} size The thumb size to request.
 * @param {String} locale The locale to request.
 * @param {String} url The url of the Data Manager in which the asset should be looked up.
 * @returns {Promise}
 */
DataManager._getImageThumbUrl = function(assetID, size, locale, url) {
  return Promise.resolve().then(function() {
    if (!assetID) {
      return Promise.reject(new Error('ec_sdk_no_assetid_provided'));
    }
    
    if (size && size <= 50) {
      size = 50;
    } else if (size && size <= 100) {
      size = 100;
    } else if (size && size <= 200) {
      size = 200;
    } else {
      size = 400;
    }
    
    var req = request.get(url + '/' + assetID + '/url');
    if (locale) {
      req.set('Accept-Language', locale);
    }
    req.query({ size: size, thumb: true });
    
    return new Promise(function(resolve, reject) {
      req.end(function(err, res) {
        if (err) {
          return reject(err);
        }
        if (!res.body.hasOwnProperty('url')) {
          return reject(new Error('ec_sdk_could_not_get_url_for_file'));
        }
        return resolve(res.body.url);
      });
    });
  });
};

/**
 * Best file method for generic files.
 *
 * @function _getFileUrl
 * @static
 * @param {String} assetID The assetID of the file to look up.
 * @param {String} locale The locale to request.
 * @returns {Promise}
 */
DataManager.getFileUrl = function(assetID, locale) {
  return DataManager._getFileUrl(assetID, locale, DataManager._fileUrl);
};

/**
 * Best file method for image files.
 *
 * @function _getImageUrl
 * @static
 * @param {String} assetID The assetID of the image to look up.
 * @param {Integer} size The image size to request.
 * @param {String} locale The locale to request.
 * @returns {Promise}
 */
DataManager.getImageUrl = function(assetID, size, locale) {
  return DataManager._getImageUrl(assetID, size, locale, DataManager._fileUrl);
};

/**
 * Best file method for image thumb files.
 *
 * @function _getImageThumbUrl
 * @static
 * @param {String} assetID The assetID of the thumb to look up.
 * @param {Integer} size The thumb size to request.
 * @param {String} locale The locale to request.
 * @returns {Promise}
 */
DataManager.getImageThumbUrl = function(assetID, size, locale) {
  return DataManager._getImageThumbUrl(assetID, size, locale, DataManager._fileUrl);
};

/**
 * Best file method for generic files on a specific Data Manager.
 *
 * @function _getFileUrl
 * @param {String} assetID The assetID of the file to look up.
 * @param {String} locale The locale to request.
 * @returns {Promise}
 */
DataManager.prototype.getFileUrl = function(assetID, locale) {
  return DataManager._getFileUrl(assetID, locale, this._fileUrl);
};

/**
 * Best file method for image files on a specific Data Manager.
 *
 * @function _getImageUrl
 * @param {String} assetID The assetID of the image to look up.
 * @param {Integer} size The image size to request.
 * @param {String} locale The locale to request.
 * @returns {Promise}
 */
DataManager.prototype.getImageUrl = function(assetID, size, locale) {
  return DataManager._getImageUrl(assetID, size, locale, this._fileUrl);
};

/**
 * Best file method for image thumb files on a specific Data Manager.
 *
 * @function _getImageThumbUrl
 * @param {String} assetID The assetID of the thumb to look up.
 * @param {Integer} size The thumb size to request.
 * @param {String} locale The locale to request.
 * @returns {Promise}
 */
DataManager.prototype.getImageThumbUrl = function(assetID, size, locale) {
  return DataManager._getImageThumbUrl(assetID, size, locale, this._fileUrl);
};

DataManager.prototype.resolve = function() {
  var dm = this;
  return Promise.resolve()
  .then(function() {
    return traverson.from(dm.url).jsonHal()
    .withRequestOptions(dm._requestOptions())
    .getAsync();
  })
  .then(function(r) {
    dm._rootTraversal = r[1];
    util.promisify(dm._rootTraversal);
    return util.checkResponse2(r[0])
  })
  .then(function(res) {
    var body = halfred.parse(JSON.parse(res.body));
    dm.metadata = body;
    return Promise.resolve(dm);
  })
  .catch(util.errorHandler);
};

DataManager.prototype.modelList = function() {
  var dm = this;
  return Promise.resolve()
  .then(function() {
    return traverson.from(dm.url).jsonHal()
    .withRequestOptions(dm._requestOptions())
    .getAsync();
  })
  .then(function(r) {
    dm._rootTraversal = r[1];
    util.promisify(dm._rootTraversal);
    return util.checkResponse2(r[0])
  })
  .then(function(res) {
    var body = JSON.parse(res.body);
    var out = {};
    for (var i = 0; i < body.models.length; i++) {
      out[body.models[i].title] = new Model(body.models[i].title, body.models[i], dm);
    }
    dm._modelCache = out;
    return Promise.resolve(out);
  })
  .catch(util.errorHandler);
};

DataManager.prototype.enableCache = function(models, env, maxCacheAge) {
  return this._makeDB(env).then(function() {
    var promises = [];
    if (typeof models === 'string') {
      models = [models];
    }
    if (Array.isArray(models)) {
      models.map(function(model) {
        promises.push(this.model(model).enableCache(env, maxCacheAge));
      }.bind(this));
    } else {
      for (var key in models) {
        /* istanbul ignore else */
        if (models.hasOwnProperty(key)) {
          promises.push(this.model(key).enableCache(env, models[models[key]]));
        }
      }
    }

    return Promise.all(promises);
  }.bind(this));
};

DataManager.prototype.model = function(title, metadata) {
  var dm = this;
  if (dm._modelCache[title]) {
    return dm._modelCache[title];
  }
  return dm._modelCache[title] = new Model(title, metadata, dm);
};

DataManager.prototype.assetList = function(options) {
  var dm = this;
  return Promise.resolve()
  .then(function() {
    return dm._getTraversal();
  })
  .then(function(traversal) {
    var t = traversal.continue().newRequest()
    .follow('ec:api/assets');
    if (options) {
      t.withTemplateParameters(util.optionsToQueryParameter(options));
    }
    return t.withRequestOptions(dm._requestOptions())
    .getAsync();
  })
  .then(function(res) {
    return util.checkResponse2(res[0]);
  })
  .then(function(res) {
    var body = halfred.parse(JSON.parse(res.body));
    if (body.hasOwnProperty('count') && body.count === 0 && body.hasOwnProperty('total')) {
      return Promise.resolve({ assets: [], count: body.count, total: body.total });
    }
    var assets = body.embeddedArray('ec:api/asset');
    var out = [];
    if (!assets) { // single result due to filter
      out.push(new Asset(body, dm));
    } else {
      for (var i = 0; i < assets.length; i++) {
        out.push(new Asset(assets[i], dm));
      }
    }
    return Promise.resolve({ assets: out, count: body.count, total: body.total });
  })
  .catch(util.errorHandler);
};

DataManager.prototype.assets = function(options) {
  return this.assetList(options)
  .then(function(list) {
    return Promise.resolve(list.assets);
  });
};

DataManager.prototype.asset = function(assetID) {
  var dm = this;
  return Promise.resolve()
  .then(function() {
    if (!assetID) {
      return Promise.reject(new Error('ec_sdk_no_assetid_provided'));
    }
    var options = {};
    if (typeof assetID === 'string') {
      options.filter = {
        assetID: {
          exact: assetID
        }
      };
    } else {
      options = assetID;
    }
    return dm.assets(options);
  })
  .then(function(assets) {
    if (!assets.length) {
      return Promise.reject(new Error('ec_sdk_no_match_due_to_filter'));
    }
    return Promise.resolve(assets[0]);
  })
  .catch(util.errorHandler);
};

DataManager.prototype.createAsset = function(input) {
  // https://blog.gaya.ninja/articles/uploading-files-superagent-in-browser/
  var dm = this;
  return Promise.resolve()
  .then(function() {
    return dm._getTraversal();
  })
  .then(function(traversal) {
    return traversal.continue().newRequest()
    .follow('ec:api/assets')
    .getUrlAsync()
  })
  .then(function(url) {
    var req = request
    .post(url[0]);
    /* istanbul ignore else */
    if (dm.accessToken) {
      req.set('Authorization', 'Bearer ' + dm.accessToken);
    }
    if (typeof input === 'string') {        // File path
      req.attach('file', input);
      /* istanbul ignore else */
    } else if (Array.isArray(input)) {      // Array of file paths
      for (var i = 0; i < input.length; i++) {
        req.attach('file', input[i]);
      }
    } else {                                // FormData
      req.send(input);
    }
    
    return new Promise(function(resolve, reject) {
      req.end(function(err, res) {
        /* istanbul ignore if */
        if (err) {
          return reject(err);
        }
        return resolve(res);
      });
    });
  })
  .then(function(res) {
    return util.checkResponse2(res);
  })
  .then(function(res) {
    var regex = /^.*\?assetID=([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12})$/;
    var body = halfred.parse(res.body);
    var assets = body.linkArray('ec:asset');
    var out = [];
    for (var i = 0; i < assets.length; i++) {
      out.push(dm.asset(regex.exec(assets[i].href)[1]));
    }
    return Promise.resolve(out);
  })
  .catch(util.errorHandler);
};

DataManager.prototype.tagList = function(options) {
  var dm = this;
  return Promise.resolve()
  .then(function() {
    return dm._getTraversal();
  })
  .then(function(traversal) {
    return traversal.continue().newRequest()
    .follow('ec:api/assets', 'ec:api/tags')
    .withTemplateParameters([null, null, util.optionsToQueryParameter(options)])
    .withRequestOptions(dm._requestOptions())
    .getAsync();
  })
  .then(function(res) {
    return util.checkResponse2(res[0]);
  })
  .then(function(res) {
    var body = halfred.parse(JSON.parse(res.body));
    if (body.hasOwnProperty('count') && body.count === 0 && body.hasOwnProperty('total')) {
      return Promise.resolve({ tags: [], count: body.count, total: body.total });
    }
    var tags = body.embeddedArray('ec:api/tag');
    var out = [];
    if (!tags) { // single result due to filter
      out.push(new Tag(body, dm));
    } else {
      for (var i = 0; i < tags.length; i++) {
        out.push(new Tag(tags[i], dm));
      }
    }
    return Promise.resolve({ tags: out, count: body.count, total: body.total });
  })
  .catch(util.errorHandler);
};

DataManager.prototype.tags = function(options) {
  return this.tagList(options).then(function(list) {
    return Promise.resolve(list.tags)
  });
};

DataManager.prototype.tag = function(tag) {
  var dm = this;
  return Promise.resolve()
  .then(function() {
    if (!tag) {
      return Promise.reject(new Error('ec_sdk_no_tag_name_provided'));
    }
    var options = {};
    if (typeof tag === 'string') {
      options.filter = {
        tag: {
          exact: tag
        }
      };
    } else {
      options = tag;
    }
    return dm.tags(options);
  })
  .then(function(tags) {
    if (!tags.length) {
      return Promise.reject(new Error('ec_sdk_no_match_due_to_filter'));
    }
    return Promise.resolve(tags[0]);
  })
  .catch(util.errorHandler);
};

DataManager.prototype.registerAnonymous = function(validUntil) {
  var dm = this;
  var userTraversal;
  return Promise.resolve()
  .then(function() {
    return dm._getTraversal();
  })
  .then(function(traversal) {
    var t = traversal.continue().newRequest()
    .follow(dm.id + ':_auth/anonymous');
    if (validUntil) {
      t.withTemplateParameters({ validUntil: validUntil })
    }
    return t.postAsync({});
  })
  .then(function(res) {
    userTraversal = res[1];
    util.promisify(userTraversal);
    return util.checkResponse2(res[0]);
  })
  .then(function(res) {
    var body = JSON.parse(res.body);
    dm.accessToken = body.jwt;
    dm._user = new User(true, body, dm, userTraversal);
    return Promise.resolve(dm._user);
  })
  .catch(util.errorHandler);
};

DataManager.prototype.account = function() {
  var dm = this;
  var rootTraversal;
  return Promise.resolve()
  .then(function() {
    if (!dm.accessToken) {
      return Promise.reject(new Error('ec_sdk_not_logged_in'));
    }
    return traverson.from(dm.url).jsonHal()
    .withRequestOptions(dm._requestOptions())
    .getAsync();
  })
  .then(function(res) {
    rootTraversal = res[1];
    util.promisify(rootTraversal);
    return util.checkResponse2(res[0]);
  })
  .then(function(res) {
    var body = halfred.parse(JSON.parse(res.body));
    dm._rootTraversal = rootTraversal;
    dm.metadata = body;
    return Promise.resolve(dm.metadata.account);
  })
  .catch(util.errorHandler);
};

DataManager.prototype.getAuthLink = function(relation, templateParameter) {
  var dm = this;
  return Promise.resolve()
  .then(function() {
    if (dm.clientID) {
      if (!templateParameter) {
        templateParameter = {};
      }
      if (!templateParameter.hasOwnProperty('clientID')) {
        templateParameter.clientID = dm.clientID;
      }
    }
    return dm._getTraversal();
  })
  .then(function(traversal) {
    var t = traversal.continue().newRequest()
    .follow(dm.id + ':_auth/' + relation);
    if (templateParameter) {
      t.withTemplateParameters(templateParameter);
    }
    return t.getUrlAsync();
  })
  .then(function(url) {
    return Promise.resolve(url[0]);
  })
  .catch(util.errorHandler);
};

DataManager.prototype.emailAvailable = function(email) {
  var dm = this;
  return Promise.resolve()
  .then(function() {
    return dm._getTraversal();
  })
  .then(function(traversal) {
    return traversal.continue().newRequest()
    .follow(dm.id + ':_auth/email-available')
    .withTemplateParameters({ email: email })
    .getAsync();
  })
  .then(function(res) {
    return util.checkResponse2(res[0]);
  })
  .then(function(res) {
    return Promise.resolve(JSON.parse(res.body).available);
  })
  .catch(util.errorHandler);
};

DataManager.prototype.can = function(permission) {
  var dm = this;
  return Promise.resolve()
  .then(function() {
    return dm._getTraversal();
  })
  .then(function(traversal) {
    var modelTitle = permission.split(':')[0];
    return traversal.continue().newRequest()
    .follow(dm.id + ':' + modelTitle + '/_permissions')
    .withRequestOptions(dm._requestOptions())
    .getAsync();
  })
  .then(function(res) {
    return util.checkResponse2(res[0]);
  })
  .then(function(res) {
    var body = halfred.parse(JSON.parse(res.body));
    var permissions = shiroTrie.new();
    permissions.add(body.permissions);
    if (permissions.check(permission)) {
      return Promise.resolve(true);
    }
    return Promise.reject(new Error('permission_denied'));
  })
  .catch(util.errorHandler);
};

DataManager.prototype.logout = function() {
  this.accessToken = null;
  this._rootTraversal = null;
};

DataManager.cloneEntry = function(entry) {
  return new Entry(halfred.parse(JSON.parse(JSON.stringify(entry.value.original()))), entry._dm, entry._model);
};

DataManager.cloneEntries = function(entries) {
  return entries.map(function(entry) {
    return DataManager.cloneEntry(entry);
  });
};

DataManager.cloneAsset = function(asset) {
  return new Asset(halfred.parse(JSON.parse(JSON.stringify(asset.value.original()))), asset._dm);
};

DataManager.cloneAssets = function(assets) {
  return assets.map(function(asset) {
    return DataManager.cloneAsset(asset);
  });
};

DataManager.cloneTag = function(tag) {
  return new Tag(halfred.parse(JSON.parse(JSON.stringify(tag.value.original()))), tag._dm);
};

DataManager.cloneTags = function(tags) {
  return tags.map(function(tag) {
    return DataManager.cloneTag(tag);
  })
};

DataManager.prototype._getTraversal = function() {
  var dm = this;
  var rootTraversal;
  if (dm._rootTraversal) {
    return Promise.resolve(dm._rootTraversal);
  }
  return Promise.resolve()
  .then(function() {
    return traverson.from(dm.url).jsonHal()
    .withRequestOptions(dm._requestOptions())
    .getAsync();
  })
  .then(function(res) {
    rootTraversal = util.promisify(res[1]);
    return util.checkResponse2(res[0])
  }).then(function() {
    dm._rootTraversal = rootTraversal;
    return Promise.resolve(dm._rootTraversal);
  });
};

DataManager.prototype._requestOptions = function(additionalHeaders) {
  var out = {};
  out.headers = {};
  if (this.accessToken) {
    out.headers['Authorization'] = 'Bearer ' + this.accessToken;
  }
  if (additionalHeaders) {
    for (var header in additionalHeaders) {
      /* istanbul ignore else */
      if (additionalHeaders.hasOwnProperty(header)) {
        out.headers[header] = additionalHeaders[header];
      }
    }
  }
  return out;
};

DataManager.prototype._makeDB = function(env) {
  /* istanbul ignore next */
  if (!env) {
    env = DataManager.DB_NODEJS;
  }
  if (this._db && this._cacheMetaData) {
    return Promise.resolve(this._db);
  }
  return new Promise(function(resolve, reject) {
    this._db = new loki(this.id + '.db.json', {
      env: env,
      autosaveInterval: 5000,
      autoload: true,
      autoloadCallback: function(err) {
        return resolve(this._db);
      }.bind(this)
    });
  }.bind(this))
  .then(function(db) {
    this._cacheMetaData = db.getCollection('_metadata');
    if (!this._cacheMetaData) {
      this._cacheMetaData = db.addCollection('_metadata', {
        indices: [
          'etag',
          'created',
          'title'
        ]
      });
    }
    return Promise.resolve(db);
  }.bind(this));
};

DataManager.DB_NODEJS = 'NODEJS';
DataManager.DB_CORDOVA = 'CORDOVA';
DataManager.DB_BROWSER = 'BROWSER';

module.exports = DataManager;

},{"./Asset":1,"./Entry":3,"./Model":4,"./Tag":5,"./User":6,"./util":7,"es6-promise":9,"halfred":10,"lokijs":21,"shiro-trie":22,"superagent":23,"traverson":73,"traverson-hal":29}],3:[function(require,module,exports){
'use strict';

var halfred = require('halfred');
var util = require('./util');

var Entry = function(entry, dm, model) {
  this.value = entry;
  this._dm = dm;
  this._model = model;
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

Entry.prototype.getModelTitle = function(property) {
  var links = this.value.linkArray(this._dm.id + ':' + this._model.title + '/' + property);
  /* istanbul ignore if */
  if (!links) {
    return undefined;
  }
  var regex = new RegExp('^.*\/api\/' + this._dm.id + '\/([a-zA-Z0-9_\\-]{1,256})\?.*$');
  return regex.exec(links[0].href)[1];
};

module.exports = Entry;

},{"./util":7,"halfred":10}],4:[function(require,module,exports){
'use strict';

var halfred = require('halfred');
var request = require('superagent');
var traverson = require('traverson');
var isReachableLib = require('is-reachable');

var Asset = require('./Asset');
var Entry = require('./Entry');
var util = require('./util');

var Model = function(title, metadata, dm) {
  this.id = title;
  this.title = title;
  this.metadata = metadata;
  this._traversal = null;
  this._dm = dm;
};

Model.prototype.enableCache = function(env, maxCacheAge) {
  return this._dm._makeDB(env)
  .then(function(db) {
    this._maxAge = maxCacheAge || 600000;
    this._items = db.getCollection(this.title) || db.addCollection(this.title, {
        indices: [
          '_id',
          '_entryTitle'
        ]
      });
    this._dm._modelCache[this.title] = this;
    return this._loadData();
  }.bind(this));
};

Model.prototype.resolve = function() {
  var model = this;
  return new Promise(function(resolve, reject) {
    traverson.from(model._dm.url).jsonHal()
    .withRequestOptions(model._dm._requestOptions())
    .get(function(err, res, traversal) {
      util.checkResponse(err, res).then(function(res) {
        var body = JSON.parse(res.body);
        for (var i = 0; i < body.models.length; i++) {
          if (body.models[i].title === model.title) {
            model.metadata = body.models[i];
            model._dm._rootTraversal = traversal;
            return resolve(model);
          }
        }
        return reject(new Error('ec_sdk_model_not_found'));
      }).catch(reject);
    });
  });
};

Model.prototype.getSchema = function(method) {
  var model = this;
  return new Promise(function(resolve, reject) {
    if (!method) {
      method = 'get';
    }
    method.toLowerCase();
    if (['get', 'put', 'post'].indexOf(method) === -1) {
      return reject(new Error('ec_sdk_invalid_method_for_schema'));
    }
    request
    .get(model._dm.url.replace('/api/', '/api/schema/') + '/' + model.title)
    .query({ template: method })
    .end(function(err, res) {
      util.checkResponse(err, res).then(function(res) {
        return resolve(res.body);
      }).catch(reject);
    });
  });
};

Model.prototype.entryList = function(options) {
  var model = this;
  if (this._maxAge) {
    return Promise.resolve()
    .then(function() {
      switch (options && options.cacheType ? options.cacheType : 'default') {
      case 'stale':
        return Promise.resolve(this._items);
      case 'refresh':
        return this._loadData(true);
      case 'default':
      default:
        return this._ensureNotStale();
      }
    }.bind(this))
    .then(function(items) {
      return util.filterCached(items, options);
    }.bind(this))
    .then(function(filtered) {
      filtered.entries = filtered.elements.map(function(entry) {
        return new Entry(halfred.parse(entry), this._dm, this)
      }.bind(this));
      delete filtered.elements;
      if (options && options.cacheType === 'stale') {
        options.cacheType = 'refresh';
        filtered.refreshedData = this.entryList(options);
      }
      return Promise.resolve(filtered);
    }.bind(this));
  }

  return this._getTraversal().then(function(traversal) {
    return new Promise(function(resolve, reject) {
      var t = traversal.continue().newRequest()
      .follow(model._dm.id + ':' + model.title);
      if (options) {
        t.withTemplateParameters(util.optionsToQueryParameter(options));
      }
      t.withRequestOptions(model._dm._requestOptions())
      .get(function(err, res, traversal) {
        util.checkResponse(err, res).then(function(res) {
          var body = halfred.parse(JSON.parse(res.body));
          // empty list due to filter
          if (body.hasOwnProperty('count') && body.count === 0 && body.hasOwnProperty('total')) {
            return resolve({ entries: [], count: body.count, total: body.total });
          }
          var entries = body.embeddedArray(model._dm.id + ':' + model.title);
          // single result due to filter
          var out = [];
          if (!entries) {
            out.push(new Entry(body, model._dm, model));
          } else {
            for (var i = 0; i < entries.length; i++) {
              out.push(new Entry(entries[i], model._dm, model));
            }
          }
          return resolve({ entries: out, count: body.count, total: body.total });
        }).catch(reject);
      });
    });
  });
};

Model.prototype.entries = function(options) {
  var model = this;
  // cache type stale not allowed on entries, only on entryList
  if (options && options.hasOwnProperty('cacheType') && options.cacheType === 'stale') {
    options.cacheType = 'default';
  }

  return model.entryList(options)
  .then(function(list) {
    return Promise.resolve(list.entries);
  });
};

Model.prototype.entry = function(id, levels) {
  var options = {};
  if (typeof id === 'string') {
    options.filter = {
      _id: {
        exact: id
      }
    };
  } else {
    options = id;
    if (id.hasOwnProperty('id')) {
      options.filter = {
        _id: {
          exact: id.id
        }
      };
      delete options.id;
    }
    if (id.hasOwnProperty('_id')) {
      options.filter = {
        _id: {
          exact: id._id
        }
      };
      delete options._id;
    }
  }
  if (levels) {
    options.levels = levels;
  }

  return this.entries(options)
  .then(function(res) {
    if (!res.length) {
      return Promise.reject(new Error('ec_sdk_no_match_due_to_filter'));
    }
    return Promise.resolve(res[0]);
  });
};

Model.prototype.nestedEntry = function(id, levels) {
  return this.entry(id, levels)
  .then(function(entry) {
    makeNestedToResource(entry, this._dm, this);
    return Promise.resolve(entry);
  }.bind(this));
};

Model.prototype.createEntry = function(entry) {
  var model = this;
  return this._getTraversal().then(function(traversal) {
    return new Promise(function(resolve, reject) {
      traversal.continue().newRequest()
      .follow(model._dm.id + ':' + model.title)
      .withRequestOptions(model._dm._requestOptions({
        'Content-Type': 'application/json'
      }))
      .post(entry, function(err, res, traversal) {
        util.checkResponse(err, res).then(function(res) {
          if (res.statusCode === 204) {
            return resolve(true);
          }
          return resolve(new Entry(halfred.parse(JSON.parse(res.body)), model._dm, model));
        }, reject);
      });
    });
  });
};

Model.prototype.deleteEntry = function(entryId) {
  var model = this;
  return this._getTraversal().then(function(traversal) {
    return new Promise(function(resolve, reject) {
      traversal.continue().newRequest()
      .follow(model._dm.id + ':' + model.title)
      .withTemplateParameters({ _id: entryId })
      .withRequestOptions(model._dm._requestOptions())
      .delete(function(err, res) {
        util.checkResponse(err, res).then(function() {
          return resolve(true);
        }).catch(reject);
      });
    });
  });
};

Model.prototype._getTraversal = function() {
  var model = this;
  return new Promise(function(resolve, reject) {
    if (model._traversal) {
      return resolve(model._traversal);
    }
    if (model._dm._rootTraversal) {
      model._dm._rootTraversal.continue().newRequest()
      .withRequestOptions(model._dm._requestOptions())
      .get(function(err, res, traversal) {
        util.checkResponse(err, res).then(function() {
          model._traversal = traversal;
          return resolve(traversal);
        }).catch(reject);
      });
    }

    traverson.from(model._dm.url).jsonHal()
    .withRequestOptions(model._dm._requestOptions())
    .get(function(err, res, traversal) {
      util.checkResponse(err, res).then(function(res) {
        model._traversal = traversal;
        return resolve(traversal);
      }).catch(reject);
    });
  });
};

Model.prototype._ensureNotStale = function() {
  var maxAge = new Date().getTime() - this._maxAge;
  var metadata = this._dm._cacheMetaData.find({ title: this.title })[0];
  var created = new Date(metadata.created).getTime();
  if (created < maxAge) {
    return Promise.resolve(this._items);
  }
  return this._loadData(true);
};

Model.prototype._loadData = function(force) {
  return Promise.resolve()
  .then(function() {
    return this._isReachable('google.de');
  }.bind(this))
  .then(function() {
    if (this._items.data.length > 0 && !force) {
      return Promise.resolve(this._items);
    }
    return this._load();
  }.bind(this))
  .catch(function(error) {
    /* istanbul ignore else */
    if (error.message === 'offline') {
      if (this._items.data.length > 0) {
        console.warn('Network unreachable. Loading cached data for model ' + this.title + '.');
        return Promise.resolve(this._items);
      }
      return Promise.reject(new Error('Network unreachable. No cached data available for model ' + this.title + '.'));
    }
    /* istanbul ignore next */
    return Promise.reject(error);
  }.bind(this));
};

Model.prototype._load = function() {
  return Promise.resolve()
  .then(function() {
    return this._getTraversal()
  }.bind(this))
  .then(function(traversal) {
    util.promisify(traversal);
    return traversal.continue().newRequest()
    .follow(this._dm.id + ':' + this.title)
    .withRequestOptions(this._dm._requestOptions())
    .withTemplateParameters({ size: 0 })
    .getAsync();
  }.bind(this))
  .then(function(res) {
    return util.checkResponse2(res[0]);
  }.bind(this))
  .then(function(res) {
    var body = halfred.parse(JSON.parse(res.body));
    var entries = body.embeddedResourceArray(this._dm.id + ':' + this.title);
    this._items.removeDataOnly();
    for (var i = 0; i < entries.length; i++) {
      this._items.insert(entries[i].original());
    }
    this._dm._cacheMetaData.removeWhere({ title: this.title });
    this._dm._cacheMetaData.insert({
      title: this.title,
      etag: res.headers.etag,
      created: new Date().toISOString()
    });
    return new Promise(function(resolve, reject) {
      this._dm._db.save(function(err) {
        /* istanbul ignore if */
        if (err) {
          return reject(err);
        }
        return resolve(this._items);
      }.bind(this));
    }.bind(this));
  }.bind(this))
};

Model.prototype._isReachable = function(dests) {
  return new Promise(function(resolve, reject) {
    isReachableLib(dests, function(onBrowserOKOnNodeNull, reachable) {
      /* istanbul ignore else */
      if (onBrowserOKOnNodeNull || reachable) {
        return resolve();
      }
      /* istanbul ignore next */ // is stubbed in tests
      return reject(new Error('offline'));
    });
  });
};

function makeNestedToResource(entry, dm, model) {
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
        }
        entry.value[l[1]] = new Entry(halfred.parse(entry.value[l[1]]), dm, model);
        makeNestedToResource(entry.value[l[1]], dm, model);
      }
    }
  }
}

module.exports = Model;

},{"./Asset":1,"./Entry":3,"./util":7,"halfred":10,"is-reachable":14,"superagent":23,"traverson":73}],5:[function(require,module,exports){
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
      .withRequestOptions(tag._dm._requestOptions({
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
      .withRequestOptions(tag._dm._requestOptions())
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
    .withRequestOptions(tag._dm._requestOptions())
    .get(function(err, res, traversal) {
      util.checkResponse(err, res).then(function() {
        tag._traversal = traversal;
        return resolve(traversal);
      }).catch(reject);
    });
  });
};

module.exports = Tag;

},{"./util":7,"halfred":10,"traverson":73}],6:[function(require,module,exports){
'use strict';

// TODO document
var User = function(isAnon, user, dm) {
  this.value = user;
  this._isAnon = isAnon;
  this._dm = dm;
};

// TODO document
User.prototype.logout = function() {
  var user = this;
  return new Promise(function(resolve, reject) {
    /* istanbul ignore else */
    if (user._isAnon) {
      user._dm.accessToken = undefined;
      user._dm._user = undefined;
      user._dm._rootTraversal = undefined;
      return resolve();
    }
    /* istanbul ignore next */
    return reject(new Error('ec_sdk_user_not_logged_out'));
  });
};

module.exports = User;

},{}],7:[function(require,module,exports){
'use strict';

var Bluebird = require('bluebird');

var util = {};
util._dm = null;

util.optionsToQueryParameter = function(options) {
  var query = {};
  if (options && options.hasOwnProperty('size')) {
    query.size = options.size;
  }
  if (options && options.hasOwnProperty('page')) {
    query.page = options.page;
  }
  if (options && options.hasOwnProperty('sort') && Array.isArray(options.sort)) {
    query.sort = options.sort.join(',');
  }
  if (options && options.hasOwnProperty('levels')) {
    query._levels = options.levels;
  }
  if (options && options.hasOwnProperty('filter')) {
    for (var key in options.filter) {
      /* istanbul ignore else */
      if (options.filter.hasOwnProperty(key)) {
        var value = options.filter[key];
        if (value.hasOwnProperty('exact')) {
          query[key] = value.exact;
        }
        if (value.hasOwnProperty('search')) {
          query[key + '~'] = value.search;
        }
        if (value.hasOwnProperty('from')) {
          query[key + 'From'] = value.from;
        }
        if (value.hasOwnProperty('to')) {
          query[key + 'To'] = value.to;
        }
        /* istanbul ignore next */
        if (value.hasOwnProperty('any') && Array.isArray(value.any)) {
          query[key] = value.any.join(',');
        }
        /* istanbul ignore next */
        if (value.hasOwnProperty('all') && Array.isArray(value.all)) {
          query[key] = value.all.join('+');
        }
      }
    }
  }
  return query;
};

util.filterCached = function(items, options) {
  var chain = items.chain();
  if (options && options.hasOwnProperty('filter')) {
    for (var key in options.filter) {
      /* istanbul ignore else */
      if (options.filter.hasOwnProperty(key)) {
        var value = options.filter[key];
        var filter = {};
        if (value.hasOwnProperty('exact')) {
          filter[key] = value.exact;
        }
        if (value.hasOwnProperty('search')) {
          filter[key] = { '$contains': value.search };
        }
        if (value.hasOwnProperty('from')) {
          filter[key] = { '$gte': value.from };
        }
        if (value.hasOwnProperty('to')) {
          filter[key] = { '$lte': value.to };
        }
        /* istanbul ignore next */
        /*
         if (value.hasOwnProperty('any') && Array.isArray(value.any)) {
         query[key] = value.any.join(',');
         }
         */
        /* istanbul ignore next */
        /*
         if (value.hasOwnProperty('all') && Array.isArray(value.all)) {
         query[key] = value.all.join('+');
         }
         */
        chain = chain.find(filter);
      }
    }
  }
  if (options && options.hasOwnProperty('sort') && Array.isArray(options.sort)) {
    var sort = [];
    for (var i = 0; i < options.sort.length; i++) {
      if (options.sort[i].indexOf('-') === 0) {
        sort.push([options.sort[i].slice(1), true]);
      } else if (options.sort[i].indexOf('+') === 0) {
        sort.push(options.sort[i].slice(1));
      } else {
        sort.push(options.sort[i]);
      }
    }
    chain = chain.compoundsort(sort);
  }

  var out = {};
  out.total = chain.copy().data().length;
  chain = chain.copy();
  if (options && options.hasOwnProperty('size') && options.size === 0) {
    options.size = Number.MAX_VALUE;
  }
  if (options && options.hasOwnProperty('page')) {
    chain = chain.offset(options.page * (options.size || 10) - (options.size || 10));
  }
  if (options && options.hasOwnProperty('size')) {
    chain = chain.limit(options.size);
  }
  out.elements = chain.data();
  out.count = out.elements.length;
  return Promise.resolve(out);
};

util.checkResponse2 = function(res) {
  return util.checkResponse(null, res);
};

util.checkResponse = function(err, res) {
  return new Promise(function(resolve, reject) {
    if (err) {
      if (util._dm.hasOwnProperty('errorHandler') && util._dm.errorHandler) {
        util._dm.errorHandler(err);
      }
      return reject(err);
    }
    if (res.statusCode >= 200 && res.statusCode <= 299) {
      return resolve(res);
    }
    return reject(JSON.parse(res.body));
  });
};

util.promisify = function(obj) {
  return Bluebird.promisifyAll(obj, {
    multiArgs: true,
    filter: function(name) {
      return name === 'get'
        || name === 'post'
        || name === 'put'
        || name === 'getUrl';
    }
  });
};

util.errorHandler = function(err) {
  if (util._dm.hasOwnProperty('errorHandler') && util._dm.errorHandler) {
    util._dm.errorHandler(err);
  }
  return Promise.reject(err);
};

module.exports = util;

},{"bluebird":8}],8:[function(require,module,exports){
(function (process,global){
/* @preserve
 * The MIT License (MIT)
 * 
 * Copyright (c) 2013-2015 Petka Antonov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */
/**
 * bluebird build version 3.3.5
 * Features enabled: core, race, call_get, generators, map, nodeify, promisify, props, reduce, settle, some, using, timers, filter, any, each
*/
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Promise=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _dereq_=="function"&&_dereq_;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof _dereq_=="function"&&_dereq_;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var SomePromiseArray = Promise._SomePromiseArray;
function any(promises) {
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(1);
    ret.setUnwrap();
    ret.init();
    return promise;
}

Promise.any = function (promises) {
    return any(promises);
};

Promise.prototype.any = function () {
    return any(this);
};

};

},{}],2:[function(_dereq_,module,exports){
"use strict";
var firstLineError;
try {throw new Error(); } catch (e) {firstLineError = e;}
var schedule = _dereq_("./schedule");
var Queue = _dereq_("./queue");
var util = _dereq_("./util");

function Async() {
    this._customScheduler = false;
    this._isTickUsed = false;
    this._lateQueue = new Queue(16);
    this._normalQueue = new Queue(16);
    this._haveDrainedQueues = false;
    this._trampolineEnabled = true;
    var self = this;
    this.drainQueues = function () {
        self._drainQueues();
    };
    this._schedule = schedule;
}

Async.prototype.setScheduler = function(fn) {
    var prev = this._schedule;
    this._schedule = fn;
    this._customScheduler = true;
    return prev;
};

Async.prototype.hasCustomScheduler = function() {
    return this._customScheduler;
};

Async.prototype.enableTrampoline = function() {
    this._trampolineEnabled = true;
};

Async.prototype.disableTrampolineIfNecessary = function() {
    if (util.hasDevTools) {
        this._trampolineEnabled = false;
    }
};

Async.prototype.haveItemsQueued = function () {
    return this._isTickUsed || this._haveDrainedQueues;
};


Async.prototype.fatalError = function(e, isNode) {
    if (isNode) {
        process.stderr.write("Fatal " + (e instanceof Error ? e.stack : e) +
            "\n");
        process.exit(2);
    } else {
        this.throwLater(e);
    }
};

Async.prototype.throwLater = function(fn, arg) {
    if (arguments.length === 1) {
        arg = fn;
        fn = function () { throw arg; };
    }
    if (typeof setTimeout !== "undefined") {
        setTimeout(function() {
            fn(arg);
        }, 0);
    } else try {
        this._schedule(function() {
            fn(arg);
        });
    } catch (e) {
        throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
};

function AsyncInvokeLater(fn, receiver, arg) {
    this._lateQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncInvoke(fn, receiver, arg) {
    this._normalQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncSettlePromises(promise) {
    this._normalQueue._pushOne(promise);
    this._queueTick();
}

if (!util.hasDevTools) {
    Async.prototype.invokeLater = AsyncInvokeLater;
    Async.prototype.invoke = AsyncInvoke;
    Async.prototype.settlePromises = AsyncSettlePromises;
} else {
    Async.prototype.invokeLater = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvokeLater.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                setTimeout(function() {
                    fn.call(receiver, arg);
                }, 100);
            });
        }
    };

    Async.prototype.invoke = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvoke.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                fn.call(receiver, arg);
            });
        }
    };

    Async.prototype.settlePromises = function(promise) {
        if (this._trampolineEnabled) {
            AsyncSettlePromises.call(this, promise);
        } else {
            this._schedule(function() {
                promise._settlePromises();
            });
        }
    };
}

Async.prototype.invokeFirst = function (fn, receiver, arg) {
    this._normalQueue.unshift(fn, receiver, arg);
    this._queueTick();
};

Async.prototype._drainQueue = function(queue) {
    while (queue.length() > 0) {
        var fn = queue.shift();
        if (typeof fn !== "function") {
            fn._settlePromises();
            continue;
        }
        var receiver = queue.shift();
        var arg = queue.shift();
        fn.call(receiver, arg);
    }
};

Async.prototype._drainQueues = function () {
    this._drainQueue(this._normalQueue);
    this._reset();
    this._haveDrainedQueues = true;
    this._drainQueue(this._lateQueue);
};

Async.prototype._queueTick = function () {
    if (!this._isTickUsed) {
        this._isTickUsed = true;
        this._schedule(this.drainQueues);
    }
};

Async.prototype._reset = function () {
    this._isTickUsed = false;
};

module.exports = Async;
module.exports.firstLineError = firstLineError;

},{"./queue":26,"./schedule":29,"./util":36}],3:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise, debug) {
var calledBind = false;
var rejectThis = function(_, e) {
    this._reject(e);
};

var targetRejected = function(e, context) {
    context.promiseRejectionQueued = true;
    context.bindingPromise._then(rejectThis, rejectThis, null, this, e);
};

var bindingResolved = function(thisArg, context) {
    if (((this._bitField & 50397184) === 0)) {
        this._resolveCallback(context.target);
    }
};

var bindingRejected = function(e, context) {
    if (!context.promiseRejectionQueued) this._reject(e);
};

Promise.prototype.bind = function (thisArg) {
    if (!calledBind) {
        calledBind = true;
        Promise.prototype._propagateFrom = debug.propagateFromFunction();
        Promise.prototype._boundValue = debug.boundValueFunction();
    }
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);
    ret._propagateFrom(this, 1);
    var target = this._target();
    ret._setBoundTo(maybePromise);
    if (maybePromise instanceof Promise) {
        var context = {
            promiseRejectionQueued: false,
            promise: ret,
            target: target,
            bindingPromise: maybePromise
        };
        target._then(INTERNAL, targetRejected, undefined, ret, context);
        maybePromise._then(
            bindingResolved, bindingRejected, undefined, ret, context);
        ret._setOnCancel(maybePromise);
    } else {
        ret._resolveCallback(target);
    }
    return ret;
};

Promise.prototype._setBoundTo = function (obj) {
    if (obj !== undefined) {
        this._bitField = this._bitField | 2097152;
        this._boundTo = obj;
    } else {
        this._bitField = this._bitField & (~2097152);
    }
};

Promise.prototype._isBound = function () {
    return (this._bitField & 2097152) === 2097152;
};

Promise.bind = function (thisArg, value) {
    return Promise.resolve(value).bind(thisArg);
};
};

},{}],4:[function(_dereq_,module,exports){
"use strict";
var old;
if (typeof Promise !== "undefined") old = Promise;
function noConflict() {
    try { if (Promise === bluebird) Promise = old; }
    catch (e) {}
    return bluebird;
}
var bluebird = _dereq_("./promise")();
bluebird.noConflict = noConflict;
module.exports = bluebird;

},{"./promise":22}],5:[function(_dereq_,module,exports){
"use strict";
var cr = Object.create;
if (cr) {
    var callerCache = cr(null);
    var getterCache = cr(null);
    callerCache[" size"] = getterCache[" size"] = 0;
}

module.exports = function(Promise) {
var util = _dereq_("./util");
var canEvaluate = util.canEvaluate;
var isIdentifier = util.isIdentifier;

var getMethodCaller;
var getGetter;
if (!true) {
var makeMethodCaller = function (methodName) {
    return new Function("ensureMethod", "                                    \n\
        return function(obj) {                                               \n\
            'use strict'                                                     \n\
            var len = this.length;                                           \n\
            ensureMethod(obj, 'methodName');                                 \n\
            switch(len) {                                                    \n\
                case 1: return obj.methodName(this[0]);                      \n\
                case 2: return obj.methodName(this[0], this[1]);             \n\
                case 3: return obj.methodName(this[0], this[1], this[2]);    \n\
                case 0: return obj.methodName();                             \n\
                default:                                                     \n\
                    return obj.methodName.apply(obj, this);                  \n\
            }                                                                \n\
        };                                                                   \n\
        ".replace(/methodName/g, methodName))(ensureMethod);
};

var makeGetter = function (propertyName) {
    return new Function("obj", "                                             \n\
        'use strict';                                                        \n\
        return obj.propertyName;                                             \n\
        ".replace("propertyName", propertyName));
};

var getCompiled = function(name, compiler, cache) {
    var ret = cache[name];
    if (typeof ret !== "function") {
        if (!isIdentifier(name)) {
            return null;
        }
        ret = compiler(name);
        cache[name] = ret;
        cache[" size"]++;
        if (cache[" size"] > 512) {
            var keys = Object.keys(cache);
            for (var i = 0; i < 256; ++i) delete cache[keys[i]];
            cache[" size"] = keys.length - 256;
        }
    }
    return ret;
};

getMethodCaller = function(name) {
    return getCompiled(name, makeMethodCaller, callerCache);
};

getGetter = function(name) {
    return getCompiled(name, makeGetter, getterCache);
};
}

function ensureMethod(obj, methodName) {
    var fn;
    if (obj != null) fn = obj[methodName];
    if (typeof fn !== "function") {
        var message = "Object " + util.classString(obj) + " has no method '" +
            util.toString(methodName) + "'";
        throw new Promise.TypeError(message);
    }
    return fn;
}

function caller(obj) {
    var methodName = this.pop();
    var fn = ensureMethod(obj, methodName);
    return fn.apply(obj, this);
}
Promise.prototype.call = function (methodName) {
    var args = [].slice.call(arguments, 1);;
    if (!true) {
        if (canEvaluate) {
            var maybeCaller = getMethodCaller(methodName);
            if (maybeCaller !== null) {
                return this._then(
                    maybeCaller, undefined, undefined, args, undefined);
            }
        }
    }
    args.push(methodName);
    return this._then(caller, undefined, undefined, args, undefined);
};

function namedGetter(obj) {
    return obj[this];
}
function indexedGetter(obj) {
    var index = +this;
    if (index < 0) index = Math.max(0, index + obj.length);
    return obj[index];
}
Promise.prototype.get = function (propertyName) {
    var isIndex = (typeof propertyName === "number");
    var getter;
    if (!isIndex) {
        if (canEvaluate) {
            var maybeGetter = getGetter(propertyName);
            getter = maybeGetter !== null ? maybeGetter : namedGetter;
        } else {
            getter = namedGetter;
        }
    } else {
        getter = indexedGetter;
    }
    return this._then(getter, undefined, undefined, propertyName, undefined);
};
};

},{"./util":36}],6:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, PromiseArray, apiRejection, debug) {
var util = _dereq_("./util");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var async = Promise._async;

Promise.prototype["break"] = Promise.prototype.cancel = function() {
    if (!debug.cancellation()) return this._warn("cancellation is disabled");

    var promise = this;
    var child = promise;
    while (promise.isCancellable()) {
        if (!promise._cancelBy(child)) {
            if (child._isFollowing()) {
                child._followee().cancel();
            } else {
                child._cancelBranched();
            }
            break;
        }

        var parent = promise._cancellationParent;
        if (parent == null || !parent.isCancellable()) {
            if (promise._isFollowing()) {
                promise._followee().cancel();
            } else {
                promise._cancelBranched();
            }
            break;
        } else {
            if (promise._isFollowing()) promise._followee().cancel();
            child = promise;
            promise = parent;
        }
    }
};

Promise.prototype._branchHasCancelled = function() {
    this._branchesRemainingToCancel--;
};

Promise.prototype._enoughBranchesHaveCancelled = function() {
    return this._branchesRemainingToCancel === undefined ||
           this._branchesRemainingToCancel <= 0;
};

Promise.prototype._cancelBy = function(canceller) {
    if (canceller === this) {
        this._branchesRemainingToCancel = 0;
        this._invokeOnCancel();
        return true;
    } else {
        this._branchHasCancelled();
        if (this._enoughBranchesHaveCancelled()) {
            this._invokeOnCancel();
            return true;
        }
    }
    return false;
};

Promise.prototype._cancelBranched = function() {
    if (this._enoughBranchesHaveCancelled()) {
        this._cancel();
    }
};

Promise.prototype._cancel = function() {
    if (!this.isCancellable()) return;

    this._setCancelled();
    async.invoke(this._cancelPromises, this, undefined);
};

Promise.prototype._cancelPromises = function() {
    if (this._length() > 0) this._settlePromises();
};

Promise.prototype._unsetOnCancel = function() {
    this._onCancelField = undefined;
};

Promise.prototype.isCancellable = function() {
    return this.isPending() && !this.isCancelled();
};

Promise.prototype._doInvokeOnCancel = function(onCancelCallback, internalOnly) {
    if (util.isArray(onCancelCallback)) {
        for (var i = 0; i < onCancelCallback.length; ++i) {
            this._doInvokeOnCancel(onCancelCallback[i], internalOnly);
        }
    } else if (onCancelCallback !== undefined) {
        if (typeof onCancelCallback === "function") {
            if (!internalOnly) {
                var e = tryCatch(onCancelCallback).call(this._boundValue());
                if (e === errorObj) {
                    this._attachExtraTrace(e.e);
                    async.throwLater(e.e);
                }
            }
        } else {
            onCancelCallback._resultCancelled(this);
        }
    }
};

Promise.prototype._invokeOnCancel = function() {
    var onCancelCallback = this._onCancel();
    this._unsetOnCancel();
    async.invoke(this._doInvokeOnCancel, this, onCancelCallback);
};

Promise.prototype._invokeInternalOnCancel = function() {
    if (this.isCancellable()) {
        this._doInvokeOnCancel(this._onCancel(), true);
        this._unsetOnCancel();
    }
};

Promise.prototype._resultCancelled = function() {
    this.cancel();
};

};

},{"./util":36}],7:[function(_dereq_,module,exports){
"use strict";
module.exports = function(NEXT_FILTER) {
var util = _dereq_("./util");
var getKeys = _dereq_("./es5").keys;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function catchFilter(instances, cb, promise) {
    return function(e) {
        var boundTo = promise._boundValue();
        predicateLoop: for (var i = 0; i < instances.length; ++i) {
            var item = instances[i];

            if (item === Error ||
                (item != null && item.prototype instanceof Error)) {
                if (e instanceof item) {
                    return tryCatch(cb).call(boundTo, e);
                }
            } else if (typeof item === "function") {
                var matchesPredicate = tryCatch(item).call(boundTo, e);
                if (matchesPredicate === errorObj) {
                    return matchesPredicate;
                } else if (matchesPredicate) {
                    return tryCatch(cb).call(boundTo, e);
                }
            } else if (util.isObject(e)) {
                var keys = getKeys(item);
                for (var j = 0; j < keys.length; ++j) {
                    var key = keys[j];
                    if (item[key] != e[key]) {
                        continue predicateLoop;
                    }
                }
                return tryCatch(cb).call(boundTo, e);
            }
        }
        return NEXT_FILTER;
    };
}

return catchFilter;
};

},{"./es5":13,"./util":36}],8:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var longStackTraces = false;
var contextStack = [];

Promise.prototype._promiseCreated = function() {};
Promise.prototype._pushContext = function() {};
Promise.prototype._popContext = function() {return null;};
Promise._peekContext = Promise.prototype._peekContext = function() {};

function Context() {
    this._trace = new Context.CapturedTrace(peekContext());
}
Context.prototype._pushContext = function () {
    if (this._trace !== undefined) {
        this._trace._promiseCreated = null;
        contextStack.push(this._trace);
    }
};

Context.prototype._popContext = function () {
    if (this._trace !== undefined) {
        var trace = contextStack.pop();
        var ret = trace._promiseCreated;
        trace._promiseCreated = null;
        return ret;
    }
    return null;
};

function createContext() {
    if (longStackTraces) return new Context();
}

function peekContext() {
    var lastIndex = contextStack.length - 1;
    if (lastIndex >= 0) {
        return contextStack[lastIndex];
    }
    return undefined;
}
Context.CapturedTrace = null;
Context.create = createContext;
Context.deactivateLongStackTraces = function() {};
Context.activateLongStackTraces = function() {
    var Promise_pushContext = Promise.prototype._pushContext;
    var Promise_popContext = Promise.prototype._popContext;
    var Promise_PeekContext = Promise._peekContext;
    var Promise_peekContext = Promise.prototype._peekContext;
    var Promise_promiseCreated = Promise.prototype._promiseCreated;
    Context.deactivateLongStackTraces = function() {
        Promise.prototype._pushContext = Promise_pushContext;
        Promise.prototype._popContext = Promise_popContext;
        Promise._peekContext = Promise_PeekContext;
        Promise.prototype._peekContext = Promise_peekContext;
        Promise.prototype._promiseCreated = Promise_promiseCreated;
        longStackTraces = false;
    };
    longStackTraces = true;
    Promise.prototype._pushContext = Context.prototype._pushContext;
    Promise.prototype._popContext = Context.prototype._popContext;
    Promise._peekContext = Promise.prototype._peekContext = peekContext;
    Promise.prototype._promiseCreated = function() {
        var ctx = this._peekContext();
        if (ctx && ctx._promiseCreated == null) ctx._promiseCreated = this;
    };
};
return Context;
};

},{}],9:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, Context) {
var getDomain = Promise._getDomain;
var async = Promise._async;
var Warning = _dereq_("./errors").Warning;
var util = _dereq_("./util");
var canAttachTrace = util.canAttachTrace;
var unhandledRejectionHandled;
var possiblyUnhandledRejection;
var bluebirdFramePattern =
    /[\\\/]bluebird[\\\/]js[\\\/](release|debug|instrumented)/;
var stackFramePattern = null;
var formatStack = null;
var indentStackFrames = false;
var printWarning;
var debugging = !!(util.env("BLUEBIRD_DEBUG") != 0 &&
                        (true ||
                         util.env("BLUEBIRD_DEBUG") ||
                         util.env("NODE_ENV") === "development"));

var warnings = !!(util.env("BLUEBIRD_WARNINGS") != 0 &&
    (debugging || util.env("BLUEBIRD_WARNINGS")));

var longStackTraces = !!(util.env("BLUEBIRD_LONG_STACK_TRACES") != 0 &&
    (debugging || util.env("BLUEBIRD_LONG_STACK_TRACES")));

var wForgottenReturn = util.env("BLUEBIRD_W_FORGOTTEN_RETURN") != 0 &&
    (warnings || !!util.env("BLUEBIRD_W_FORGOTTEN_RETURN"));

Promise.prototype.suppressUnhandledRejections = function() {
    var target = this._target();
    target._bitField = ((target._bitField & (~1048576)) |
                      524288);
};

Promise.prototype._ensurePossibleRejectionHandled = function () {
    if ((this._bitField & 524288) !== 0) return;
    this._setRejectionIsUnhandled();
    async.invokeLater(this._notifyUnhandledRejection, this, undefined);
};

Promise.prototype._notifyUnhandledRejectionIsHandled = function () {
    fireRejectionEvent("rejectionHandled",
                                  unhandledRejectionHandled, undefined, this);
};

Promise.prototype._setReturnedNonUndefined = function() {
    this._bitField = this._bitField | 268435456;
};

Promise.prototype._returnedNonUndefined = function() {
    return (this._bitField & 268435456) !== 0;
};

Promise.prototype._notifyUnhandledRejection = function () {
    if (this._isRejectionUnhandled()) {
        var reason = this._settledValue();
        this._setUnhandledRejectionIsNotified();
        fireRejectionEvent("unhandledRejection",
                                      possiblyUnhandledRejection, reason, this);
    }
};

Promise.prototype._setUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField | 262144;
};

Promise.prototype._unsetUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField & (~262144);
};

Promise.prototype._isUnhandledRejectionNotified = function () {
    return (this._bitField & 262144) > 0;
};

Promise.prototype._setRejectionIsUnhandled = function () {
    this._bitField = this._bitField | 1048576;
};

Promise.prototype._unsetRejectionIsUnhandled = function () {
    this._bitField = this._bitField & (~1048576);
    if (this._isUnhandledRejectionNotified()) {
        this._unsetUnhandledRejectionIsNotified();
        this._notifyUnhandledRejectionIsHandled();
    }
};

Promise.prototype._isRejectionUnhandled = function () {
    return (this._bitField & 1048576) > 0;
};

Promise.prototype._warn = function(message, shouldUseOwnTrace, promise) {
    return warn(message, shouldUseOwnTrace, promise || this);
};

Promise.onPossiblyUnhandledRejection = function (fn) {
    var domain = getDomain();
    possiblyUnhandledRejection =
        typeof fn === "function" ? (domain === null ? fn : domain.bind(fn))
                                 : undefined;
};

Promise.onUnhandledRejectionHandled = function (fn) {
    var domain = getDomain();
    unhandledRejectionHandled =
        typeof fn === "function" ? (domain === null ? fn : domain.bind(fn))
                                 : undefined;
};

var disableLongStackTraces = function() {};
Promise.longStackTraces = function () {
    if (async.haveItemsQueued() && !config.longStackTraces) {
        throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    if (!config.longStackTraces && longStackTracesIsSupported()) {
        var Promise_captureStackTrace = Promise.prototype._captureStackTrace;
        var Promise_attachExtraTrace = Promise.prototype._attachExtraTrace;
        config.longStackTraces = true;
        disableLongStackTraces = function() {
            if (async.haveItemsQueued() && !config.longStackTraces) {
                throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
            }
            Promise.prototype._captureStackTrace = Promise_captureStackTrace;
            Promise.prototype._attachExtraTrace = Promise_attachExtraTrace;
            Context.deactivateLongStackTraces();
            async.enableTrampoline();
            config.longStackTraces = false;
        };
        Promise.prototype._captureStackTrace = longStackTracesCaptureStackTrace;
        Promise.prototype._attachExtraTrace = longStackTracesAttachExtraTrace;
        Context.activateLongStackTraces();
        async.disableTrampolineIfNecessary();
    }
};

Promise.hasLongStackTraces = function () {
    return config.longStackTraces && longStackTracesIsSupported();
};

var fireDomEvent = (function() {
    try {
        var event = document.createEvent("CustomEvent");
        event.initCustomEvent("testingtheevent", false, true, {});
        util.global.dispatchEvent(event);
        return function(name, event) {
            var domEvent = document.createEvent("CustomEvent");
            domEvent.initCustomEvent(name.toLowerCase(), false, true, event);
            return !util.global.dispatchEvent(domEvent);
        };
    } catch (e) {}
    return function() {
        return false;
    };
})();

var fireGlobalEvent = (function() {
    if (util.isNode) {
        return function() {
            return process.emit.apply(process, arguments);
        };
    } else {
        if (!util.global) {
            return function() {
                return false;
            };
        }
        return function(name) {
            var methodName = "on" + name.toLowerCase();
            var method = util.global[methodName];
            if (!method) return false;
            method.apply(util.global, [].slice.call(arguments, 1));
            return true;
        };
    }
})();

function generatePromiseLifecycleEventObject(name, promise) {
    return {promise: promise};
}

var eventToObjectGenerator = {
    promiseCreated: generatePromiseLifecycleEventObject,
    promiseFulfilled: generatePromiseLifecycleEventObject,
    promiseRejected: generatePromiseLifecycleEventObject,
    promiseResolved: generatePromiseLifecycleEventObject,
    promiseCancelled: generatePromiseLifecycleEventObject,
    promiseChained: function(name, promise, child) {
        return {promise: promise, child: child};
    },
    warning: function(name, warning) {
        return {warning: warning};
    },
    unhandledRejection: function (name, reason, promise) {
        return {reason: reason, promise: promise};
    },
    rejectionHandled: generatePromiseLifecycleEventObject
};

var activeFireEvent = function (name) {
    var globalEventFired = false;
    try {
        globalEventFired = fireGlobalEvent.apply(null, arguments);
    } catch (e) {
        async.throwLater(e);
        globalEventFired = true;
    }

    var domEventFired = false;
    try {
        domEventFired = fireDomEvent(name,
                    eventToObjectGenerator[name].apply(null, arguments));
    } catch (e) {
        async.throwLater(e);
        domEventFired = true;
    }

    return domEventFired || globalEventFired;
};

Promise.config = function(opts) {
    opts = Object(opts);
    if ("longStackTraces" in opts) {
        if (opts.longStackTraces) {
            Promise.longStackTraces();
        } else if (!opts.longStackTraces && Promise.hasLongStackTraces()) {
            disableLongStackTraces();
        }
    }
    if ("warnings" in opts) {
        var warningsOption = opts.warnings;
        config.warnings = !!warningsOption;
        wForgottenReturn = config.warnings;

        if (util.isObject(warningsOption)) {
            if ("wForgottenReturn" in warningsOption) {
                wForgottenReturn = !!warningsOption.wForgottenReturn;
            }
        }
    }
    if ("cancellation" in opts && opts.cancellation && !config.cancellation) {
        if (async.haveItemsQueued()) {
            throw new Error(
                "cannot enable cancellation after promises are in use");
        }
        Promise.prototype._clearCancellationData =
            cancellationClearCancellationData;
        Promise.prototype._propagateFrom = cancellationPropagateFrom;
        Promise.prototype._onCancel = cancellationOnCancel;
        Promise.prototype._setOnCancel = cancellationSetOnCancel;
        Promise.prototype._attachCancellationCallback =
            cancellationAttachCancellationCallback;
        Promise.prototype._execute = cancellationExecute;
        propagateFromFunction = cancellationPropagateFrom;
        config.cancellation = true;
    }
    if ("monitoring" in opts) {
        if (opts.monitoring && !config.monitoring) {
            config.monitoring = true;
            Promise.prototype._fireEvent = activeFireEvent;
        } else if (!opts.monitoring && config.monitoring) {
            config.monitoring = false;
            Promise.prototype._fireEvent = defaultFireEvent;
        }
    }
};

function defaultFireEvent() { return false; }

Promise.prototype._fireEvent = defaultFireEvent;
Promise.prototype._execute = function(executor, resolve, reject) {
    try {
        executor(resolve, reject);
    } catch (e) {
        return e;
    }
};
Promise.prototype._onCancel = function () {};
Promise.prototype._setOnCancel = function (handler) { ; };
Promise.prototype._attachCancellationCallback = function(onCancel) {
    ;
};
Promise.prototype._captureStackTrace = function () {};
Promise.prototype._attachExtraTrace = function () {};
Promise.prototype._clearCancellationData = function() {};
Promise.prototype._propagateFrom = function (parent, flags) {
    ;
    ;
};

function cancellationExecute(executor, resolve, reject) {
    var promise = this;
    try {
        executor(resolve, reject, function(onCancel) {
            if (typeof onCancel !== "function") {
                throw new TypeError("onCancel must be a function, got: " +
                                    util.toString(onCancel));
            }
            promise._attachCancellationCallback(onCancel);
        });
    } catch (e) {
        return e;
    }
}

function cancellationAttachCancellationCallback(onCancel) {
    if (!this.isCancellable()) return this;

    var previousOnCancel = this._onCancel();
    if (previousOnCancel !== undefined) {
        if (util.isArray(previousOnCancel)) {
            previousOnCancel.push(onCancel);
        } else {
            this._setOnCancel([previousOnCancel, onCancel]);
        }
    } else {
        this._setOnCancel(onCancel);
    }
}

function cancellationOnCancel() {
    return this._onCancelField;
}

function cancellationSetOnCancel(onCancel) {
    this._onCancelField = onCancel;
}

function cancellationClearCancellationData() {
    this._cancellationParent = undefined;
    this._onCancelField = undefined;
}

function cancellationPropagateFrom(parent, flags) {
    if ((flags & 1) !== 0) {
        this._cancellationParent = parent;
        var branchesRemainingToCancel = parent._branchesRemainingToCancel;
        if (branchesRemainingToCancel === undefined) {
            branchesRemainingToCancel = 0;
        }
        parent._branchesRemainingToCancel = branchesRemainingToCancel + 1;
    }
    if ((flags & 2) !== 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
}

function bindingPropagateFrom(parent, flags) {
    if ((flags & 2) !== 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
}
var propagateFromFunction = bindingPropagateFrom;

function boundValueFunction() {
    var ret = this._boundTo;
    if (ret !== undefined) {
        if (ret instanceof Promise) {
            if (ret.isFulfilled()) {
                return ret.value();
            } else {
                return undefined;
            }
        }
    }
    return ret;
}

function longStackTracesCaptureStackTrace() {
    this._trace = new CapturedTrace(this._peekContext());
}

function longStackTracesAttachExtraTrace(error, ignoreSelf) {
    if (canAttachTrace(error)) {
        var trace = this._trace;
        if (trace !== undefined) {
            if (ignoreSelf) trace = trace._parent;
        }
        if (trace !== undefined) {
            trace.attachExtraTrace(error);
        } else if (!error.__stackCleaned__) {
            var parsed = parseStackAndMessage(error);
            util.notEnumerableProp(error, "stack",
                parsed.message + "\n" + parsed.stack.join("\n"));
            util.notEnumerableProp(error, "__stackCleaned__", true);
        }
    }
}

function checkForgottenReturns(returnValue, promiseCreated, name, promise,
                               parent) {
    if (returnValue === undefined && promiseCreated !== null &&
        wForgottenReturn) {
        if (parent !== undefined && parent._returnedNonUndefined()) return;
        if ((promise._bitField & 65535) === 0) return;

        if (name) name = name + " ";
        var msg = "a promise was created in a " + name +
            "handler but was not returned from it";
        promise._warn(msg, true, promiseCreated);
    }
}

function deprecated(name, replacement) {
    var message = name +
        " is deprecated and will be removed in a future version.";
    if (replacement) message += " Use " + replacement + " instead.";
    return warn(message);
}

function warn(message, shouldUseOwnTrace, promise) {
    if (!config.warnings) return;
    var warning = new Warning(message);
    var ctx;
    if (shouldUseOwnTrace) {
        promise._attachExtraTrace(warning);
    } else if (config.longStackTraces && (ctx = Promise._peekContext())) {
        ctx.attachExtraTrace(warning);
    } else {
        var parsed = parseStackAndMessage(warning);
        warning.stack = parsed.message + "\n" + parsed.stack.join("\n");
    }

    if (!activeFireEvent("warning", warning)) {
        formatAndLogError(warning, "", true);
    }
}

function reconstructStack(message, stacks) {
    for (var i = 0; i < stacks.length - 1; ++i) {
        stacks[i].push("From previous event:");
        stacks[i] = stacks[i].join("\n");
    }
    if (i < stacks.length) {
        stacks[i] = stacks[i].join("\n");
    }
    return message + "\n" + stacks.join("\n");
}

function removeDuplicateOrEmptyJumps(stacks) {
    for (var i = 0; i < stacks.length; ++i) {
        if (stacks[i].length === 0 ||
            ((i + 1 < stacks.length) && stacks[i][0] === stacks[i+1][0])) {
            stacks.splice(i, 1);
            i--;
        }
    }
}

function removeCommonRoots(stacks) {
    var current = stacks[0];
    for (var i = 1; i < stacks.length; ++i) {
        var prev = stacks[i];
        var currentLastIndex = current.length - 1;
        var currentLastLine = current[currentLastIndex];
        var commonRootMeetPoint = -1;

        for (var j = prev.length - 1; j >= 0; --j) {
            if (prev[j] === currentLastLine) {
                commonRootMeetPoint = j;
                break;
            }
        }

        for (var j = commonRootMeetPoint; j >= 0; --j) {
            var line = prev[j];
            if (current[currentLastIndex] === line) {
                current.pop();
                currentLastIndex--;
            } else {
                break;
            }
        }
        current = prev;
    }
}

function cleanStack(stack) {
    var ret = [];
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        var isTraceLine = "    (No stack trace)" === line ||
            stackFramePattern.test(line);
        var isInternalFrame = isTraceLine && shouldIgnore(line);
        if (isTraceLine && !isInternalFrame) {
            if (indentStackFrames && line.charAt(0) !== " ") {
                line = "    " + line;
            }
            ret.push(line);
        }
    }
    return ret;
}

function stackFramesAsArray(error) {
    var stack = error.stack.replace(/\s+$/g, "").split("\n");
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        if ("    (No stack trace)" === line || stackFramePattern.test(line)) {
            break;
        }
    }
    if (i > 0) {
        stack = stack.slice(i);
    }
    return stack;
}

function parseStackAndMessage(error) {
    var stack = error.stack;
    var message = error.toString();
    stack = typeof stack === "string" && stack.length > 0
                ? stackFramesAsArray(error) : ["    (No stack trace)"];
    return {
        message: message,
        stack: cleanStack(stack)
    };
}

function formatAndLogError(error, title, isSoft) {
    if (typeof console !== "undefined") {
        var message;
        if (util.isObject(error)) {
            var stack = error.stack;
            message = title + formatStack(stack, error);
        } else {
            message = title + String(error);
        }
        if (typeof printWarning === "function") {
            printWarning(message, isSoft);
        } else if (typeof console.log === "function" ||
            typeof console.log === "object") {
            console.log(message);
        }
    }
}

function fireRejectionEvent(name, localHandler, reason, promise) {
    var localEventFired = false;
    try {
        if (typeof localHandler === "function") {
            localEventFired = true;
            if (name === "rejectionHandled") {
                localHandler(promise);
            } else {
                localHandler(reason, promise);
            }
        }
    } catch (e) {
        async.throwLater(e);
    }

    if (name === "unhandledRejection") {
        if (!activeFireEvent(name, reason, promise) && !localEventFired) {
            formatAndLogError(reason, "Unhandled rejection ");
        }
    } else {
        activeFireEvent(name, promise);
    }
}

function formatNonError(obj) {
    var str;
    if (typeof obj === "function") {
        str = "[function " +
            (obj.name || "anonymous") +
            "]";
    } else {
        str = obj && typeof obj.toString === "function"
            ? obj.toString() : util.toString(obj);
        var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
        if (ruselessToString.test(str)) {
            try {
                var newStr = JSON.stringify(obj);
                str = newStr;
            }
            catch(e) {

            }
        }
        if (str.length === 0) {
            str = "(empty array)";
        }
    }
    return ("(<" + snip(str) + ">, no stack trace)");
}

function snip(str) {
    var maxChars = 41;
    if (str.length < maxChars) {
        return str;
    }
    return str.substr(0, maxChars - 3) + "...";
}

function longStackTracesIsSupported() {
    return typeof captureStackTrace === "function";
}

var shouldIgnore = function() { return false; };
var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
function parseLineInfo(line) {
    var matches = line.match(parseLineInfoRegex);
    if (matches) {
        return {
            fileName: matches[1],
            line: parseInt(matches[2], 10)
        };
    }
}

function setBounds(firstLineError, lastLineError) {
    if (!longStackTracesIsSupported()) return;
    var firstStackLines = firstLineError.stack.split("\n");
    var lastStackLines = lastLineError.stack.split("\n");
    var firstIndex = -1;
    var lastIndex = -1;
    var firstFileName;
    var lastFileName;
    for (var i = 0; i < firstStackLines.length; ++i) {
        var result = parseLineInfo(firstStackLines[i]);
        if (result) {
            firstFileName = result.fileName;
            firstIndex = result.line;
            break;
        }
    }
    for (var i = 0; i < lastStackLines.length; ++i) {
        var result = parseLineInfo(lastStackLines[i]);
        if (result) {
            lastFileName = result.fileName;
            lastIndex = result.line;
            break;
        }
    }
    if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName ||
        firstFileName !== lastFileName || firstIndex >= lastIndex) {
        return;
    }

    shouldIgnore = function(line) {
        if (bluebirdFramePattern.test(line)) return true;
        var info = parseLineInfo(line);
        if (info) {
            if (info.fileName === firstFileName &&
                (firstIndex <= info.line && info.line <= lastIndex)) {
                return true;
            }
        }
        return false;
    };
}

function CapturedTrace(parent) {
    this._parent = parent;
    this._promisesCreated = 0;
    var length = this._length = 1 + (parent === undefined ? 0 : parent._length);
    captureStackTrace(this, CapturedTrace);
    if (length > 32) this.uncycle();
}
util.inherits(CapturedTrace, Error);
Context.CapturedTrace = CapturedTrace;

CapturedTrace.prototype.uncycle = function() {
    var length = this._length;
    if (length < 2) return;
    var nodes = [];
    var stackToIndex = {};

    for (var i = 0, node = this; node !== undefined; ++i) {
        nodes.push(node);
        node = node._parent;
    }
    length = this._length = i;
    for (var i = length - 1; i >= 0; --i) {
        var stack = nodes[i].stack;
        if (stackToIndex[stack] === undefined) {
            stackToIndex[stack] = i;
        }
    }
    for (var i = 0; i < length; ++i) {
        var currentStack = nodes[i].stack;
        var index = stackToIndex[currentStack];
        if (index !== undefined && index !== i) {
            if (index > 0) {
                nodes[index - 1]._parent = undefined;
                nodes[index - 1]._length = 1;
            }
            nodes[i]._parent = undefined;
            nodes[i]._length = 1;
            var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;

            if (index < length - 1) {
                cycleEdgeNode._parent = nodes[index + 1];
                cycleEdgeNode._parent.uncycle();
                cycleEdgeNode._length =
                    cycleEdgeNode._parent._length + 1;
            } else {
                cycleEdgeNode._parent = undefined;
                cycleEdgeNode._length = 1;
            }
            var currentChildLength = cycleEdgeNode._length + 1;
            for (var j = i - 2; j >= 0; --j) {
                nodes[j]._length = currentChildLength;
                currentChildLength++;
            }
            return;
        }
    }
};

CapturedTrace.prototype.attachExtraTrace = function(error) {
    if (error.__stackCleaned__) return;
    this.uncycle();
    var parsed = parseStackAndMessage(error);
    var message = parsed.message;
    var stacks = [parsed.stack];

    var trace = this;
    while (trace !== undefined) {
        stacks.push(cleanStack(trace.stack.split("\n")));
        trace = trace._parent;
    }
    removeCommonRoots(stacks);
    removeDuplicateOrEmptyJumps(stacks);
    util.notEnumerableProp(error, "stack", reconstructStack(message, stacks));
    util.notEnumerableProp(error, "__stackCleaned__", true);
};

var captureStackTrace = (function stackDetection() {
    var v8stackFramePattern = /^\s*at\s*/;
    var v8stackFormatter = function(stack, error) {
        if (typeof stack === "string") return stack;

        if (error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    if (typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function") {
        Error.stackTraceLimit += 6;
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        var captureStackTrace = Error.captureStackTrace;

        shouldIgnore = function(line) {
            return bluebirdFramePattern.test(line);
        };
        return function(receiver, ignoreUntil) {
            Error.stackTraceLimit += 6;
            captureStackTrace(receiver, ignoreUntil);
            Error.stackTraceLimit -= 6;
        };
    }
    var err = new Error();

    if (typeof err.stack === "string" &&
        err.stack.split("\n")[0].indexOf("stackDetection@") >= 0) {
        stackFramePattern = /@/;
        formatStack = v8stackFormatter;
        indentStackFrames = true;
        return function captureStackTrace(o) {
            o.stack = new Error().stack;
        };
    }

    var hasStackAfterThrow;
    try { throw new Error(); }
    catch(e) {
        hasStackAfterThrow = ("stack" in e);
    }
    if (!("stack" in err) && hasStackAfterThrow &&
        typeof Error.stackTraceLimit === "number") {
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        return function captureStackTrace(o) {
            Error.stackTraceLimit += 6;
            try { throw new Error(); }
            catch(e) { o.stack = e.stack; }
            Error.stackTraceLimit -= 6;
        };
    }

    formatStack = function(stack, error) {
        if (typeof stack === "string") return stack;

        if ((typeof error === "object" ||
            typeof error === "function") &&
            error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    return null;

})([]);

if (typeof console !== "undefined" && typeof console.warn !== "undefined") {
    printWarning = function (message) {
        console.warn(message);
    };
    if (util.isNode && process.stderr.isTTY) {
        printWarning = function(message, isSoft) {
            var color = isSoft ? "\u001b[33m" : "\u001b[31m";
            console.warn(color + message + "\u001b[0m\n");
        };
    } else if (!util.isNode && typeof (new Error().stack) === "string") {
        printWarning = function(message, isSoft) {
            console.warn("%c" + message,
                        isSoft ? "color: darkorange" : "color: red");
        };
    }
}

var config = {
    warnings: warnings,
    longStackTraces: false,
    cancellation: false,
    monitoring: false
};

if (longStackTraces) Promise.longStackTraces();

return {
    longStackTraces: function() {
        return config.longStackTraces;
    },
    warnings: function() {
        return config.warnings;
    },
    cancellation: function() {
        return config.cancellation;
    },
    monitoring: function() {
        return config.monitoring;
    },
    propagateFromFunction: function() {
        return propagateFromFunction;
    },
    boundValueFunction: function() {
        return boundValueFunction;
    },
    checkForgottenReturns: checkForgottenReturns,
    setBounds: setBounds,
    warn: warn,
    deprecated: deprecated,
    CapturedTrace: CapturedTrace,
    fireDomEvent: fireDomEvent,
    fireGlobalEvent: fireGlobalEvent
};
};

},{"./errors":12,"./util":36}],10:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
function returner() {
    return this.value;
}
function thrower() {
    throw this.reason;
}

Promise.prototype["return"] =
Promise.prototype.thenReturn = function (value) {
    if (value instanceof Promise) value.suppressUnhandledRejections();
    return this._then(
        returner, undefined, undefined, {value: value}, undefined);
};

Promise.prototype["throw"] =
Promise.prototype.thenThrow = function (reason) {
    return this._then(
        thrower, undefined, undefined, {reason: reason}, undefined);
};

Promise.prototype.catchThrow = function (reason) {
    if (arguments.length <= 1) {
        return this._then(
            undefined, thrower, undefined, {reason: reason}, undefined);
    } else {
        var _reason = arguments[1];
        var handler = function() {throw _reason;};
        return this.caught(reason, handler);
    }
};

Promise.prototype.catchReturn = function (value) {
    if (arguments.length <= 1) {
        if (value instanceof Promise) value.suppressUnhandledRejections();
        return this._then(
            undefined, returner, undefined, {value: value}, undefined);
    } else {
        var _value = arguments[1];
        if (_value instanceof Promise) _value.suppressUnhandledRejections();
        var handler = function() {return _value;};
        return this.caught(value, handler);
    }
};
};

},{}],11:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseReduce = Promise.reduce;
var PromiseAll = Promise.all;

function promiseAllThis() {
    return PromiseAll(this);
}

function PromiseMapSeries(promises, fn) {
    return PromiseReduce(promises, fn, INTERNAL, INTERNAL);
}

Promise.prototype.each = function (fn) {
    return this.mapSeries(fn)
            ._then(promiseAllThis, undefined, undefined, this, undefined);
};

Promise.prototype.mapSeries = function (fn) {
    return PromiseReduce(this, fn, INTERNAL, INTERNAL);
};

Promise.each = function (promises, fn) {
    return PromiseMapSeries(promises, fn)
            ._then(promiseAllThis, undefined, undefined, promises, undefined);
};

Promise.mapSeries = PromiseMapSeries;
};

},{}],12:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5");
var Objectfreeze = es5.freeze;
var util = _dereq_("./util");
var inherits = util.inherits;
var notEnumerableProp = util.notEnumerableProp;

function subError(nameProperty, defaultMessage) {
    function SubError(message) {
        if (!(this instanceof SubError)) return new SubError(message);
        notEnumerableProp(this, "message",
            typeof message === "string" ? message : defaultMessage);
        notEnumerableProp(this, "name", nameProperty);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    inherits(SubError, Error);
    return SubError;
}

var _TypeError, _RangeError;
var Warning = subError("Warning", "warning");
var CancellationError = subError("CancellationError", "cancellation error");
var TimeoutError = subError("TimeoutError", "timeout error");
var AggregateError = subError("AggregateError", "aggregate error");
try {
    _TypeError = TypeError;
    _RangeError = RangeError;
} catch(e) {
    _TypeError = subError("TypeError", "type error");
    _RangeError = subError("RangeError", "range error");
}

var methods = ("join pop push shift unshift slice filter forEach some " +
    "every map indexOf lastIndexOf reduce reduceRight sort reverse").split(" ");

for (var i = 0; i < methods.length; ++i) {
    if (typeof Array.prototype[methods[i]] === "function") {
        AggregateError.prototype[methods[i]] = Array.prototype[methods[i]];
    }
}

es5.defineProperty(AggregateError.prototype, "length", {
    value: 0,
    configurable: false,
    writable: true,
    enumerable: true
});
AggregateError.prototype["isOperational"] = true;
var level = 0;
AggregateError.prototype.toString = function() {
    var indent = Array(level * 4 + 1).join(" ");
    var ret = "\n" + indent + "AggregateError of:" + "\n";
    level++;
    indent = Array(level * 4 + 1).join(" ");
    for (var i = 0; i < this.length; ++i) {
        var str = this[i] === this ? "[Circular AggregateError]" : this[i] + "";
        var lines = str.split("\n");
        for (var j = 0; j < lines.length; ++j) {
            lines[j] = indent + lines[j];
        }
        str = lines.join("\n");
        ret += str + "\n";
    }
    level--;
    return ret;
};

function OperationalError(message) {
    if (!(this instanceof OperationalError))
        return new OperationalError(message);
    notEnumerableProp(this, "name", "OperationalError");
    notEnumerableProp(this, "message", message);
    this.cause = message;
    this["isOperational"] = true;

    if (message instanceof Error) {
        notEnumerableProp(this, "message", message.message);
        notEnumerableProp(this, "stack", message.stack);
    } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
    }

}
inherits(OperationalError, Error);

var errorTypes = Error["__BluebirdErrorTypes__"];
if (!errorTypes) {
    errorTypes = Objectfreeze({
        CancellationError: CancellationError,
        TimeoutError: TimeoutError,
        OperationalError: OperationalError,
        RejectionError: OperationalError,
        AggregateError: AggregateError
    });
    es5.defineProperty(Error, "__BluebirdErrorTypes__", {
        value: errorTypes,
        writable: false,
        enumerable: false,
        configurable: false
    });
}

module.exports = {
    Error: Error,
    TypeError: _TypeError,
    RangeError: _RangeError,
    CancellationError: errorTypes.CancellationError,
    OperationalError: errorTypes.OperationalError,
    TimeoutError: errorTypes.TimeoutError,
    AggregateError: errorTypes.AggregateError,
    Warning: Warning
};

},{"./es5":13,"./util":36}],13:[function(_dereq_,module,exports){
var isES5 = (function(){
    "use strict";
    return this === undefined;
})();

if (isES5) {
    module.exports = {
        freeze: Object.freeze,
        defineProperty: Object.defineProperty,
        getDescriptor: Object.getOwnPropertyDescriptor,
        keys: Object.keys,
        names: Object.getOwnPropertyNames,
        getPrototypeOf: Object.getPrototypeOf,
        isArray: Array.isArray,
        isES5: isES5,
        propertyIsWritable: function(obj, prop) {
            var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
            return !!(!descriptor || descriptor.writable || descriptor.set);
        }
    };
} else {
    var has = {}.hasOwnProperty;
    var str = {}.toString;
    var proto = {}.constructor.prototype;

    var ObjectKeys = function (o) {
        var ret = [];
        for (var key in o) {
            if (has.call(o, key)) {
                ret.push(key);
            }
        }
        return ret;
    };

    var ObjectGetDescriptor = function(o, key) {
        return {value: o[key]};
    };

    var ObjectDefineProperty = function (o, key, desc) {
        o[key] = desc.value;
        return o;
    };

    var ObjectFreeze = function (obj) {
        return obj;
    };

    var ObjectGetPrototypeOf = function (obj) {
        try {
            return Object(obj).constructor.prototype;
        }
        catch (e) {
            return proto;
        }
    };

    var ArrayIsArray = function (obj) {
        try {
            return str.call(obj) === "[object Array]";
        }
        catch(e) {
            return false;
        }
    };

    module.exports = {
        isArray: ArrayIsArray,
        keys: ObjectKeys,
        names: ObjectKeys,
        defineProperty: ObjectDefineProperty,
        getDescriptor: ObjectGetDescriptor,
        freeze: ObjectFreeze,
        getPrototypeOf: ObjectGetPrototypeOf,
        isES5: isES5,
        propertyIsWritable: function() {
            return true;
        }
    };
}

},{}],14:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseMap = Promise.map;

Promise.prototype.filter = function (fn, options) {
    return PromiseMap(this, fn, options, INTERNAL);
};

Promise.filter = function (promises, fn, options) {
    return PromiseMap(promises, fn, options, INTERNAL);
};
};

},{}],15:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, tryConvertToPromise) {
var util = _dereq_("./util");
var CancellationError = Promise.CancellationError;
var errorObj = util.errorObj;

function PassThroughHandlerContext(promise, type, handler) {
    this.promise = promise;
    this.type = type;
    this.handler = handler;
    this.called = false;
    this.cancelPromise = null;
}

PassThroughHandlerContext.prototype.isFinallyHandler = function() {
    return this.type === 0;
};

function FinallyHandlerCancelReaction(finallyHandler) {
    this.finallyHandler = finallyHandler;
}

FinallyHandlerCancelReaction.prototype._resultCancelled = function() {
    checkCancel(this.finallyHandler);
};

function checkCancel(ctx, reason) {
    if (ctx.cancelPromise != null) {
        if (arguments.length > 1) {
            ctx.cancelPromise._reject(reason);
        } else {
            ctx.cancelPromise._cancel();
        }
        ctx.cancelPromise = null;
        return true;
    }
    return false;
}

function succeed() {
    return finallyHandler.call(this, this.promise._target()._settledValue());
}
function fail(reason) {
    if (checkCancel(this, reason)) return;
    errorObj.e = reason;
    return errorObj;
}
function finallyHandler(reasonOrValue) {
    var promise = this.promise;
    var handler = this.handler;

    if (!this.called) {
        this.called = true;
        var ret = this.isFinallyHandler()
            ? handler.call(promise._boundValue())
            : handler.call(promise._boundValue(), reasonOrValue);
        if (ret !== undefined) {
            promise._setReturnedNonUndefined();
            var maybePromise = tryConvertToPromise(ret, promise);
            if (maybePromise instanceof Promise) {
                if (this.cancelPromise != null) {
                    if (maybePromise.isCancelled()) {
                        var reason =
                            new CancellationError("late cancellation observer");
                        promise._attachExtraTrace(reason);
                        errorObj.e = reason;
                        return errorObj;
                    } else if (maybePromise.isPending()) {
                        maybePromise._attachCancellationCallback(
                            new FinallyHandlerCancelReaction(this));
                    }
                }
                return maybePromise._then(
                    succeed, fail, undefined, this, undefined);
            }
        }
    }

    if (promise.isRejected()) {
        checkCancel(this);
        errorObj.e = reasonOrValue;
        return errorObj;
    } else {
        checkCancel(this);
        return reasonOrValue;
    }
}

Promise.prototype._passThrough = function(handler, type, success, fail) {
    if (typeof handler !== "function") return this.then();
    return this._then(success,
                      fail,
                      undefined,
                      new PassThroughHandlerContext(this, type, handler),
                      undefined);
};

Promise.prototype.lastly =
Promise.prototype["finally"] = function (handler) {
    return this._passThrough(handler,
                             0,
                             finallyHandler,
                             finallyHandler);
};

Promise.prototype.tap = function (handler) {
    return this._passThrough(handler, 1, finallyHandler);
};

return PassThroughHandlerContext;
};

},{"./util":36}],16:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          apiRejection,
                          INTERNAL,
                          tryConvertToPromise,
                          Proxyable,
                          debug) {
var errors = _dereq_("./errors");
var TypeError = errors.TypeError;
var util = _dereq_("./util");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
var yieldHandlers = [];

function promiseFromYieldHandler(value, yieldHandlers, traceParent) {
    for (var i = 0; i < yieldHandlers.length; ++i) {
        traceParent._pushContext();
        var result = tryCatch(yieldHandlers[i])(value);
        traceParent._popContext();
        if (result === errorObj) {
            traceParent._pushContext();
            var ret = Promise.reject(errorObj.e);
            traceParent._popContext();
            return ret;
        }
        var maybePromise = tryConvertToPromise(result, traceParent);
        if (maybePromise instanceof Promise) return maybePromise;
    }
    return null;
}

function PromiseSpawn(generatorFunction, receiver, yieldHandler, stack) {
    if (debug.cancellation()) {
        var internal = new Promise(INTERNAL);
        var _finallyPromise = this._finallyPromise = new Promise(INTERNAL);
        this._promise = internal.lastly(function() {
            return _finallyPromise;
        });
        internal._captureStackTrace();
        internal._setOnCancel(this);
    } else {
        var promise = this._promise = new Promise(INTERNAL);
        promise._captureStackTrace();
    }
    this._stack = stack;
    this._generatorFunction = generatorFunction;
    this._receiver = receiver;
    this._generator = undefined;
    this._yieldHandlers = typeof yieldHandler === "function"
        ? [yieldHandler].concat(yieldHandlers)
        : yieldHandlers;
    this._yieldedPromise = null;
    this._cancellationPhase = false;
}
util.inherits(PromiseSpawn, Proxyable);

PromiseSpawn.prototype._isResolved = function() {
    return this._promise === null;
};

PromiseSpawn.prototype._cleanup = function() {
    this._promise = this._generator = null;
    if (debug.cancellation() && this._finallyPromise !== null) {
        this._finallyPromise._fulfill();
        this._finallyPromise = null;
    }
};

PromiseSpawn.prototype._promiseCancelled = function() {
    if (this._isResolved()) return;
    var implementsReturn = typeof this._generator["return"] !== "undefined";

    var result;
    if (!implementsReturn) {
        var reason = new Promise.CancellationError(
            "generator .return() sentinel");
        Promise.coroutine.returnSentinel = reason;
        this._promise._attachExtraTrace(reason);
        this._promise._pushContext();
        result = tryCatch(this._generator["throw"]).call(this._generator,
                                                         reason);
        this._promise._popContext();
    } else {
        this._promise._pushContext();
        result = tryCatch(this._generator["return"]).call(this._generator,
                                                          undefined);
        this._promise._popContext();
    }
    this._cancellationPhase = true;
    this._yieldedPromise = null;
    this._continue(result);
};

PromiseSpawn.prototype._promiseFulfilled = function(value) {
    this._yieldedPromise = null;
    this._promise._pushContext();
    var result = tryCatch(this._generator.next).call(this._generator, value);
    this._promise._popContext();
    this._continue(result);
};

PromiseSpawn.prototype._promiseRejected = function(reason) {
    this._yieldedPromise = null;
    this._promise._attachExtraTrace(reason);
    this._promise._pushContext();
    var result = tryCatch(this._generator["throw"])
        .call(this._generator, reason);
    this._promise._popContext();
    this._continue(result);
};

PromiseSpawn.prototype._resultCancelled = function() {
    if (this._yieldedPromise instanceof Promise) {
        var promise = this._yieldedPromise;
        this._yieldedPromise = null;
        promise.cancel();
    }
};

PromiseSpawn.prototype.promise = function () {
    return this._promise;
};

PromiseSpawn.prototype._run = function () {
    this._generator = this._generatorFunction.call(this._receiver);
    this._receiver =
        this._generatorFunction = undefined;
    this._promiseFulfilled(undefined);
};

PromiseSpawn.prototype._continue = function (result) {
    var promise = this._promise;
    if (result === errorObj) {
        this._cleanup();
        if (this._cancellationPhase) {
            return promise.cancel();
        } else {
            return promise._rejectCallback(result.e, false);
        }
    }

    var value = result.value;
    if (result.done === true) {
        this._cleanup();
        if (this._cancellationPhase) {
            return promise.cancel();
        } else {
            return promise._resolveCallback(value);
        }
    } else {
        var maybePromise = tryConvertToPromise(value, this._promise);
        if (!(maybePromise instanceof Promise)) {
            maybePromise =
                promiseFromYieldHandler(maybePromise,
                                        this._yieldHandlers,
                                        this._promise);
            if (maybePromise === null) {
                this._promiseRejected(
                    new TypeError(
                        "A value %s was yielded that could not be treated as a promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a\u000a".replace("%s", value) +
                        "From coroutine:\u000a" +
                        this._stack.split("\n").slice(1, -7).join("\n")
                    )
                );
                return;
            }
        }
        maybePromise = maybePromise._target();
        var bitField = maybePromise._bitField;
        ;
        if (((bitField & 50397184) === 0)) {
            this._yieldedPromise = maybePromise;
            maybePromise._proxy(this, null);
        } else if (((bitField & 33554432) !== 0)) {
            this._promiseFulfilled(maybePromise._value());
        } else if (((bitField & 16777216) !== 0)) {
            this._promiseRejected(maybePromise._reason());
        } else {
            this._promiseCancelled();
        }
    }
};

Promise.coroutine = function (generatorFunction, options) {
    if (typeof generatorFunction !== "function") {
        throw new TypeError("generatorFunction must be a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    var yieldHandler = Object(options).yieldHandler;
    var PromiseSpawn$ = PromiseSpawn;
    var stack = new Error().stack;
    return function () {
        var generator = generatorFunction.apply(this, arguments);
        var spawn = new PromiseSpawn$(undefined, undefined, yieldHandler,
                                      stack);
        var ret = spawn.promise();
        spawn._generator = generator;
        spawn._promiseFulfilled(undefined);
        return ret;
    };
};

Promise.coroutine.addYieldHandler = function(fn) {
    if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
    }
    yieldHandlers.push(fn);
};

Promise.spawn = function (generatorFunction) {
    debug.deprecated("Promise.spawn()", "Promise.coroutine()");
    if (typeof generatorFunction !== "function") {
        return apiRejection("generatorFunction must be a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    var spawn = new PromiseSpawn(generatorFunction, this);
    var ret = spawn.promise();
    spawn._run(Promise.spawn);
    return ret;
};
};

},{"./errors":12,"./util":36}],17:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, tryConvertToPromise, INTERNAL) {
var util = _dereq_("./util");
var canEvaluate = util.canEvaluate;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var reject;

if (!true) {
if (canEvaluate) {
    var thenCallback = function(i) {
        return new Function("value", "holder", "                             \n\
            'use strict';                                                    \n\
            holder.pIndex = value;                                           \n\
            holder.checkFulfillment(this);                                   \n\
            ".replace(/Index/g, i));
    };

    var promiseSetter = function(i) {
        return new Function("promise", "holder", "                           \n\
            'use strict';                                                    \n\
            holder.pIndex = promise;                                         \n\
            ".replace(/Index/g, i));
    };

    var generateHolderClass = function(total) {
        var props = new Array(total);
        for (var i = 0; i < props.length; ++i) {
            props[i] = "this.p" + (i+1);
        }
        var assignment = props.join(" = ") + " = null;";
        var cancellationCode= "var promise;\n" + props.map(function(prop) {
            return "                                                         \n\
                promise = " + prop + ";                                      \n\
                if (promise instanceof Promise) {                            \n\
                    promise.cancel();                                        \n\
                }                                                            \n\
            ";
        }).join("\n");
        var passedArguments = props.join(", ");
        var name = "Holder$" + total;


        var code = "return function(tryCatch, errorObj, Promise) {           \n\
            'use strict';                                                    \n\
            function [TheName](fn) {                                         \n\
                [TheProperties]                                              \n\
                this.fn = fn;                                                \n\
                this.now = 0;                                                \n\
            }                                                                \n\
            [TheName].prototype.checkFulfillment = function(promise) {       \n\
                var now = ++this.now;                                        \n\
                if (now === [TheTotal]) {                                    \n\
                    promise._pushContext();                                  \n\
                    var callback = this.fn;                                  \n\
                    var ret = tryCatch(callback)([ThePassedArguments]);      \n\
                    promise._popContext();                                   \n\
                    if (ret === errorObj) {                                  \n\
                        promise._rejectCallback(ret.e, false);               \n\
                    } else {                                                 \n\
                        promise._resolveCallback(ret);                       \n\
                    }                                                        \n\
                }                                                            \n\
            };                                                               \n\
                                                                             \n\
            [TheName].prototype._resultCancelled = function() {              \n\
                [CancellationCode]                                           \n\
            };                                                               \n\
                                                                             \n\
            return [TheName];                                                \n\
        }(tryCatch, errorObj, Promise);                                      \n\
        ";

        code = code.replace(/\[TheName\]/g, name)
            .replace(/\[TheTotal\]/g, total)
            .replace(/\[ThePassedArguments\]/g, passedArguments)
            .replace(/\[TheProperties\]/g, assignment)
            .replace(/\[CancellationCode\]/g, cancellationCode);

        return new Function("tryCatch", "errorObj", "Promise", code)
                           (tryCatch, errorObj, Promise);
    };

    var holderClasses = [];
    var thenCallbacks = [];
    var promiseSetters = [];

    for (var i = 0; i < 8; ++i) {
        holderClasses.push(generateHolderClass(i + 1));
        thenCallbacks.push(thenCallback(i + 1));
        promiseSetters.push(promiseSetter(i + 1));
    }

    reject = function (reason) {
        this._reject(reason);
    };
}}

Promise.join = function () {
    var last = arguments.length - 1;
    var fn;
    if (last > 0 && typeof arguments[last] === "function") {
        fn = arguments[last];
        if (!true) {
            if (last <= 8 && canEvaluate) {
                var ret = new Promise(INTERNAL);
                ret._captureStackTrace();
                var HolderClass = holderClasses[last - 1];
                var holder = new HolderClass(fn);
                var callbacks = thenCallbacks;

                for (var i = 0; i < last; ++i) {
                    var maybePromise = tryConvertToPromise(arguments[i], ret);
                    if (maybePromise instanceof Promise) {
                        maybePromise = maybePromise._target();
                        var bitField = maybePromise._bitField;
                        ;
                        if (((bitField & 50397184) === 0)) {
                            maybePromise._then(callbacks[i], reject,
                                               undefined, ret, holder);
                            promiseSetters[i](maybePromise, holder);
                        } else if (((bitField & 33554432) !== 0)) {
                            callbacks[i].call(ret,
                                              maybePromise._value(), holder);
                        } else if (((bitField & 16777216) !== 0)) {
                            ret._reject(maybePromise._reason());
                        } else {
                            ret._cancel();
                        }
                    } else {
                        callbacks[i].call(ret, maybePromise, holder);
                    }
                }
                if (!ret._isFateSealed()) {
                    ret._setAsyncGuaranteed();
                    ret._setOnCancel(holder);
                }
                return ret;
            }
        }
    }
    var args = [].slice.call(arguments);;
    if (fn) args.pop();
    var ret = new PromiseArray(args).promise();
    return fn !== undefined ? ret.spread(fn) : ret;
};

};

},{"./util":36}],18:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL,
                          debug) {
var getDomain = Promise._getDomain;
var util = _dereq_("./util");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var EMPTY_ARRAY = [];

function MappingPromiseArray(promises, fn, limit, _filter) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    var domain = getDomain();
    this._callback = domain === null ? fn : domain.bind(fn);
    this._preservedValues = _filter === INTERNAL
        ? new Array(this.length())
        : null;
    this._limit = limit;
    this._inFlight = 0;
    this._queue = limit >= 1 ? [] : EMPTY_ARRAY;
    this._init$(undefined, -2);
}
util.inherits(MappingPromiseArray, PromiseArray);

MappingPromiseArray.prototype._init = function () {};

MappingPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var limit = this._limit;

    if (index < 0) {
        index = (index * -1) - 1;
        values[index] = value;
        if (limit >= 1) {
            this._inFlight--;
            this._drainQueue();
            if (this._isResolved()) return true;
        }
    } else {
        if (limit >= 1 && this._inFlight >= limit) {
            values[index] = value;
            this._queue.push(index);
            return false;
        }
        if (preservedValues !== null) preservedValues[index] = value;

        var promise = this._promise;
        var callback = this._callback;
        var receiver = promise._boundValue();
        promise._pushContext();
        var ret = tryCatch(callback).call(receiver, value, index, length);
        var promiseCreated = promise._popContext();
        debug.checkForgottenReturns(
            ret,
            promiseCreated,
            preservedValues !== null ? "Promise.filter" : "Promise.map",
            promise
        );
        if (ret === errorObj) {
            this._reject(ret.e);
            return true;
        }

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            var bitField = maybePromise._bitField;
            ;
            if (((bitField & 50397184) === 0)) {
                if (limit >= 1) this._inFlight++;
                values[index] = maybePromise;
                maybePromise._proxy(this, (index + 1) * -1);
                return false;
            } else if (((bitField & 33554432) !== 0)) {
                ret = maybePromise._value();
            } else if (((bitField & 16777216) !== 0)) {
                this._reject(maybePromise._reason());
                return true;
            } else {
                this._cancel();
                return true;
            }
        }
        values[index] = ret;
    }
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= length) {
        if (preservedValues !== null) {
            this._filter(values, preservedValues);
        } else {
            this._resolve(values);
        }
        return true;
    }
    return false;
};

MappingPromiseArray.prototype._drainQueue = function () {
    var queue = this._queue;
    var limit = this._limit;
    var values = this._values;
    while (queue.length > 0 && this._inFlight < limit) {
        if (this._isResolved()) return;
        var index = queue.pop();
        this._promiseFulfilled(values[index], index);
    }
};

MappingPromiseArray.prototype._filter = function (booleans, values) {
    var len = values.length;
    var ret = new Array(len);
    var j = 0;
    for (var i = 0; i < len; ++i) {
        if (booleans[i]) ret[j++] = values[i];
    }
    ret.length = j;
    this._resolve(ret);
};

MappingPromiseArray.prototype.preservedValues = function () {
    return this._preservedValues;
};

function map(promises, fn, options, _filter) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    var limit = typeof options === "object" && options !== null
        ? options.concurrency
        : 0;
    limit = typeof limit === "number" &&
        isFinite(limit) && limit >= 1 ? limit : 0;
    return new MappingPromiseArray(promises, fn, limit, _filter).promise();
}

Promise.prototype.map = function (fn, options) {
    return map(this, fn, options, null);
};

Promise.map = function (promises, fn, options, _filter) {
    return map(promises, fn, options, _filter);
};


};

},{"./util":36}],19:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, INTERNAL, tryConvertToPromise, apiRejection, debug) {
var util = _dereq_("./util");
var tryCatch = util.tryCatch;

Promise.method = function (fn) {
    if (typeof fn !== "function") {
        throw new Promise.TypeError("expecting a function but got " + util.classString(fn));
    }
    return function () {
        var ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._pushContext();
        var value = tryCatch(fn).apply(this, arguments);
        var promiseCreated = ret._popContext();
        debug.checkForgottenReturns(
            value, promiseCreated, "Promise.method", ret);
        ret._resolveFromSyncValue(value);
        return ret;
    };
};

Promise.attempt = Promise["try"] = function (fn) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._pushContext();
    var value;
    if (arguments.length > 1) {
        debug.deprecated("calling Promise.try with more than 1 argument");
        var arg = arguments[1];
        var ctx = arguments[2];
        value = util.isArray(arg) ? tryCatch(fn).apply(ctx, arg)
                                  : tryCatch(fn).call(ctx, arg);
    } else {
        value = tryCatch(fn)();
    }
    var promiseCreated = ret._popContext();
    debug.checkForgottenReturns(
        value, promiseCreated, "Promise.try", ret);
    ret._resolveFromSyncValue(value);
    return ret;
};

Promise.prototype._resolveFromSyncValue = function (value) {
    if (value === util.errorObj) {
        this._rejectCallback(value.e, false);
    } else {
        this._resolveCallback(value, true);
    }
};
};

},{"./util":36}],20:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util");
var maybeWrapAsError = util.maybeWrapAsError;
var errors = _dereq_("./errors");
var OperationalError = errors.OperationalError;
var es5 = _dereq_("./es5");

function isUntypedError(obj) {
    return obj instanceof Error &&
        es5.getPrototypeOf(obj) === Error.prototype;
}

var rErrorKey = /^(?:name|message|stack|cause)$/;
function wrapAsOperationalError(obj) {
    var ret;
    if (isUntypedError(obj)) {
        ret = new OperationalError(obj);
        ret.name = obj.name;
        ret.message = obj.message;
        ret.stack = obj.stack;
        var keys = es5.keys(obj);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            if (!rErrorKey.test(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }
    util.markAsOriginatingFromRejection(obj);
    return obj;
}

function nodebackForPromise(promise, multiArgs) {
    return function(err, value) {
        if (promise === null) return;
        if (err) {
            var wrapped = wrapAsOperationalError(maybeWrapAsError(err));
            promise._attachExtraTrace(wrapped);
            promise._reject(wrapped);
        } else if (!multiArgs) {
            promise._fulfill(value);
        } else {
            var args = [].slice.call(arguments, 1);;
            promise._fulfill(args);
        }
        promise = null;
    };
}

module.exports = nodebackForPromise;

},{"./errors":12,"./es5":13,"./util":36}],21:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var util = _dereq_("./util");
var async = Promise._async;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function spreadAdapter(val, nodeback) {
    var promise = this;
    if (!util.isArray(val)) return successAdapter.call(promise, val, nodeback);
    var ret =
        tryCatch(nodeback).apply(promise._boundValue(), [null].concat(val));
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

function successAdapter(val, nodeback) {
    var promise = this;
    var receiver = promise._boundValue();
    var ret = val === undefined
        ? tryCatch(nodeback).call(receiver, null)
        : tryCatch(nodeback).call(receiver, null, val);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}
function errorAdapter(reason, nodeback) {
    var promise = this;
    if (!reason) {
        var newReason = new Error(reason + "");
        newReason.cause = reason;
        reason = newReason;
    }
    var ret = tryCatch(nodeback).call(promise._boundValue(), reason);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

Promise.prototype.asCallback = Promise.prototype.nodeify = function (nodeback,
                                                                     options) {
    if (typeof nodeback == "function") {
        var adapter = successAdapter;
        if (options !== undefined && Object(options).spread) {
            adapter = spreadAdapter;
        }
        this._then(
            adapter,
            errorAdapter,
            undefined,
            this,
            nodeback
        );
    }
    return this;
};
};

},{"./util":36}],22:[function(_dereq_,module,exports){
"use strict";
module.exports = function() {
var makeSelfResolutionError = function () {
    return new TypeError("circular promise resolution chain\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
};
var reflectHandler = function() {
    return new Promise.PromiseInspection(this._target());
};
var apiRejection = function(msg) {
    return Promise.reject(new TypeError(msg));
};
function Proxyable() {}
var UNDEFINED_BINDING = {};
var util = _dereq_("./util");

var getDomain;
if (util.isNode) {
    getDomain = function() {
        var ret = process.domain;
        if (ret === undefined) ret = null;
        return ret;
    };
} else {
    getDomain = function() {
        return null;
    };
}
util.notEnumerableProp(Promise, "_getDomain", getDomain);

var es5 = _dereq_("./es5");
var Async = _dereq_("./async");
var async = new Async();
es5.defineProperty(Promise, "_async", {value: async});
var errors = _dereq_("./errors");
var TypeError = Promise.TypeError = errors.TypeError;
Promise.RangeError = errors.RangeError;
var CancellationError = Promise.CancellationError = errors.CancellationError;
Promise.TimeoutError = errors.TimeoutError;
Promise.OperationalError = errors.OperationalError;
Promise.RejectionError = errors.OperationalError;
Promise.AggregateError = errors.AggregateError;
var INTERNAL = function(){};
var APPLY = {};
var NEXT_FILTER = {};
var tryConvertToPromise = _dereq_("./thenables")(Promise, INTERNAL);
var PromiseArray =
    _dereq_("./promise_array")(Promise, INTERNAL,
                               tryConvertToPromise, apiRejection, Proxyable);
var Context = _dereq_("./context")(Promise);
 /*jshint unused:false*/
var createContext = Context.create;
var debug = _dereq_("./debuggability")(Promise, Context);
var CapturedTrace = debug.CapturedTrace;
var PassThroughHandlerContext =
    _dereq_("./finally")(Promise, tryConvertToPromise);
var catchFilter = _dereq_("./catch_filter")(NEXT_FILTER);
var nodebackForPromise = _dereq_("./nodeback");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
function check(self, executor) {
    if (typeof executor !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(executor));
    }
    if (self.constructor !== Promise) {
        throw new TypeError("the promise constructor cannot be invoked directly\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
}

function Promise(executor) {
    this._bitField = 0;
    this._fulfillmentHandler0 = undefined;
    this._rejectionHandler0 = undefined;
    this._promise0 = undefined;
    this._receiver0 = undefined;
    if (executor !== INTERNAL) {
        check(this, executor);
        this._resolveFromExecutor(executor);
    }
    this._promiseCreated();
    this._fireEvent("promiseCreated", this);
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.caught = Promise.prototype["catch"] = function (fn) {
    var len = arguments.length;
    if (len > 1) {
        var catchInstances = new Array(len - 1),
            j = 0, i;
        for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (util.isObject(item)) {
                catchInstances[j++] = item;
            } else {
                return apiRejection("expecting an object but got " + util.classString(item));
            }
        }
        catchInstances.length = j;
        fn = arguments[i];
        return this.then(undefined, catchFilter(catchInstances, fn, this));
    }
    return this.then(undefined, fn);
};

Promise.prototype.reflect = function () {
    return this._then(reflectHandler,
        reflectHandler, undefined, this, undefined);
};

Promise.prototype.then = function (didFulfill, didReject) {
    if (debug.warnings() && arguments.length > 0 &&
        typeof didFulfill !== "function" &&
        typeof didReject !== "function") {
        var msg = ".then() only accepts functions but was passed: " +
                util.classString(didFulfill);
        if (arguments.length > 1) {
            msg += ", " + util.classString(didReject);
        }
        this._warn(msg);
    }
    return this._then(didFulfill, didReject, undefined, undefined, undefined);
};

Promise.prototype.done = function (didFulfill, didReject) {
    var promise =
        this._then(didFulfill, didReject, undefined, undefined, undefined);
    promise._setIsFinal();
};

Promise.prototype.spread = function (fn) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    return this.all()._then(fn, undefined, undefined, APPLY, undefined);
};

Promise.prototype.toJSON = function () {
    var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: undefined,
        rejectionReason: undefined
    };
    if (this.isFulfilled()) {
        ret.fulfillmentValue = this.value();
        ret.isFulfilled = true;
    } else if (this.isRejected()) {
        ret.rejectionReason = this.reason();
        ret.isRejected = true;
    }
    return ret;
};

Promise.prototype.all = function () {
    if (arguments.length > 0) {
        this._warn(".all() was passed arguments but it does not take any");
    }
    return new PromiseArray(this).promise();
};

Promise.prototype.error = function (fn) {
    return this.caught(util.originatesFromRejection, fn);
};

Promise.is = function (val) {
    return val instanceof Promise;
};

Promise.fromNode = Promise.fromCallback = function(fn) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    var multiArgs = arguments.length > 1 ? !!Object(arguments[1]).multiArgs
                                         : false;
    var result = tryCatch(fn)(nodebackForPromise(ret, multiArgs));
    if (result === errorObj) {
        ret._rejectCallback(result.e, true);
    }
    if (!ret._isFateSealed()) ret._setAsyncGuaranteed();
    return ret;
};

Promise.all = function (promises) {
    return new PromiseArray(promises).promise();
};

Promise.cast = function (obj) {
    var ret = tryConvertToPromise(obj);
    if (!(ret instanceof Promise)) {
        ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._setFulfilled();
        ret._rejectionHandler0 = obj;
    }
    return ret;
};

Promise.resolve = Promise.fulfilled = Promise.cast;

Promise.reject = Promise.rejected = function (reason) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._rejectCallback(reason, true);
    return ret;
};

Promise.setScheduler = function(fn) {
    if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
    }
    return async.setScheduler(fn);
};

Promise.prototype._then = function (
    didFulfill,
    didReject,
    _,    receiver,
    internalData
) {
    var haveInternalData = internalData !== undefined;
    var promise = haveInternalData ? internalData : new Promise(INTERNAL);
    var target = this._target();
    var bitField = target._bitField;

    if (!haveInternalData) {
        promise._propagateFrom(this, 3);
        promise._captureStackTrace();
        if (receiver === undefined &&
            ((this._bitField & 2097152) !== 0)) {
            if (!((bitField & 50397184) === 0)) {
                receiver = this._boundValue();
            } else {
                receiver = target === this ? undefined : this._boundTo;
            }
        }
        this._fireEvent("promiseChained", this, promise);
    }

    var domain = getDomain();
    if (!((bitField & 50397184) === 0)) {
        var handler, value, settler = target._settlePromiseCtx;
        if (((bitField & 33554432) !== 0)) {
            value = target._rejectionHandler0;
            handler = didFulfill;
        } else if (((bitField & 16777216) !== 0)) {
            value = target._fulfillmentHandler0;
            handler = didReject;
            target._unsetRejectionIsUnhandled();
        } else {
            settler = target._settlePromiseLateCancellationObserver;
            value = new CancellationError("late cancellation observer");
            target._attachExtraTrace(value);
            handler = didReject;
        }

        async.invoke(settler, target, {
            handler: domain === null ? handler
                : (typeof handler === "function" && domain.bind(handler)),
            promise: promise,
            receiver: receiver,
            value: value
        });
    } else {
        target._addCallbacks(didFulfill, didReject, promise, receiver, domain);
    }

    return promise;
};

Promise.prototype._length = function () {
    return this._bitField & 65535;
};

Promise.prototype._isFateSealed = function () {
    return (this._bitField & 117506048) !== 0;
};

Promise.prototype._isFollowing = function () {
    return (this._bitField & 67108864) === 67108864;
};

Promise.prototype._setLength = function (len) {
    this._bitField = (this._bitField & -65536) |
        (len & 65535);
};

Promise.prototype._setFulfilled = function () {
    this._bitField = this._bitField | 33554432;
    this._fireEvent("promiseFulfilled", this);
};

Promise.prototype._setRejected = function () {
    this._bitField = this._bitField | 16777216;
    this._fireEvent("promiseRejected", this);
};

Promise.prototype._setFollowing = function () {
    this._bitField = this._bitField | 67108864;
    this._fireEvent("promiseResolved", this);
};

Promise.prototype._setIsFinal = function () {
    this._bitField = this._bitField | 4194304;
};

Promise.prototype._isFinal = function () {
    return (this._bitField & 4194304) > 0;
};

Promise.prototype._unsetCancelled = function() {
    this._bitField = this._bitField & (~65536);
};

Promise.prototype._setCancelled = function() {
    this._bitField = this._bitField | 65536;
    this._fireEvent("promiseCancelled", this);
};

Promise.prototype._setAsyncGuaranteed = function() {
    if (async.hasCustomScheduler()) return;
    this._bitField = this._bitField | 134217728;
};

Promise.prototype._receiverAt = function (index) {
    var ret = index === 0 ? this._receiver0 : this[
            index * 4 - 4 + 3];
    if (ret === UNDEFINED_BINDING) {
        return undefined;
    } else if (ret === undefined && this._isBound()) {
        return this._boundValue();
    }
    return ret;
};

Promise.prototype._promiseAt = function (index) {
    return this[
            index * 4 - 4 + 2];
};

Promise.prototype._fulfillmentHandlerAt = function (index) {
    return this[
            index * 4 - 4 + 0];
};

Promise.prototype._rejectionHandlerAt = function (index) {
    return this[
            index * 4 - 4 + 1];
};

Promise.prototype._boundValue = function() {};

Promise.prototype._migrateCallback0 = function (follower) {
    var bitField = follower._bitField;
    var fulfill = follower._fulfillmentHandler0;
    var reject = follower._rejectionHandler0;
    var promise = follower._promise0;
    var receiver = follower._receiverAt(0);
    if (receiver === undefined) receiver = UNDEFINED_BINDING;
    this._addCallbacks(fulfill, reject, promise, receiver, null);
};

Promise.prototype._migrateCallbackAt = function (follower, index) {
    var fulfill = follower._fulfillmentHandlerAt(index);
    var reject = follower._rejectionHandlerAt(index);
    var promise = follower._promiseAt(index);
    var receiver = follower._receiverAt(index);
    if (receiver === undefined) receiver = UNDEFINED_BINDING;
    this._addCallbacks(fulfill, reject, promise, receiver, null);
};

Promise.prototype._addCallbacks = function (
    fulfill,
    reject,
    promise,
    receiver,
    domain
) {
    var index = this._length();

    if (index >= 65535 - 4) {
        index = 0;
        this._setLength(0);
    }

    if (index === 0) {
        this._promise0 = promise;
        this._receiver0 = receiver;
        if (typeof fulfill === "function") {
            this._fulfillmentHandler0 =
                domain === null ? fulfill : domain.bind(fulfill);
        }
        if (typeof reject === "function") {
            this._rejectionHandler0 =
                domain === null ? reject : domain.bind(reject);
        }
    } else {
        var base = index * 4 - 4;
        this[base + 2] = promise;
        this[base + 3] = receiver;
        if (typeof fulfill === "function") {
            this[base + 0] =
                domain === null ? fulfill : domain.bind(fulfill);
        }
        if (typeof reject === "function") {
            this[base + 1] =
                domain === null ? reject : domain.bind(reject);
        }
    }
    this._setLength(index + 1);
    return index;
};

Promise.prototype._proxy = function (proxyable, arg) {
    this._addCallbacks(undefined, undefined, arg, proxyable, null);
};

Promise.prototype._resolveCallback = function(value, shouldBind) {
    if (((this._bitField & 117506048) !== 0)) return;
    if (value === this)
        return this._rejectCallback(makeSelfResolutionError(), false);
    var maybePromise = tryConvertToPromise(value, this);
    if (!(maybePromise instanceof Promise)) return this._fulfill(value);

    if (shouldBind) this._propagateFrom(maybePromise, 2);

    var promise = maybePromise._target();

    if (promise === this) {
        this._reject(makeSelfResolutionError());
        return;
    }

    var bitField = promise._bitField;
    if (((bitField & 50397184) === 0)) {
        var len = this._length();
        if (len > 0) promise._migrateCallback0(this);
        for (var i = 1; i < len; ++i) {
            promise._migrateCallbackAt(this, i);
        }
        this._setFollowing();
        this._setLength(0);
        this._setFollowee(promise);
    } else if (((bitField & 33554432) !== 0)) {
        this._fulfill(promise._value());
    } else if (((bitField & 16777216) !== 0)) {
        this._reject(promise._reason());
    } else {
        var reason = new CancellationError("late cancellation observer");
        promise._attachExtraTrace(reason);
        this._reject(reason);
    }
};

Promise.prototype._rejectCallback =
function(reason, synchronous, ignoreNonErrorWarnings) {
    var trace = util.ensureErrorObject(reason);
    var hasStack = trace === reason;
    if (!hasStack && !ignoreNonErrorWarnings && debug.warnings()) {
        var message = "a promise was rejected with a non-error: " +
            util.classString(reason);
        this._warn(message, true);
    }
    this._attachExtraTrace(trace, synchronous ? hasStack : false);
    this._reject(reason);
};

Promise.prototype._resolveFromExecutor = function (executor) {
    var promise = this;
    this._captureStackTrace();
    this._pushContext();
    var synchronous = true;
    var r = this._execute(executor, function(value) {
        promise._resolveCallback(value);
    }, function (reason) {
        promise._rejectCallback(reason, synchronous);
    });
    synchronous = false;
    this._popContext();

    if (r !== undefined) {
        promise._rejectCallback(r, true);
    }
};

Promise.prototype._settlePromiseFromHandler = function (
    handler, receiver, value, promise
) {
    var bitField = promise._bitField;
    if (((bitField & 65536) !== 0)) return;
    promise._pushContext();
    var x;
    if (receiver === APPLY) {
        if (!value || typeof value.length !== "number") {
            x = errorObj;
            x.e = new TypeError("cannot .spread() a non-array: " +
                                    util.classString(value));
        } else {
            x = tryCatch(handler).apply(this._boundValue(), value);
        }
    } else {
        x = tryCatch(handler).call(receiver, value);
    }
    var promiseCreated = promise._popContext();
    bitField = promise._bitField;
    if (((bitField & 65536) !== 0)) return;

    if (x === NEXT_FILTER) {
        promise._reject(value);
    } else if (x === errorObj) {
        promise._rejectCallback(x.e, false);
    } else {
        debug.checkForgottenReturns(x, promiseCreated, "",  promise, this);
        promise._resolveCallback(x);
    }
};

Promise.prototype._target = function() {
    var ret = this;
    while (ret._isFollowing()) ret = ret._followee();
    return ret;
};

Promise.prototype._followee = function() {
    return this._rejectionHandler0;
};

Promise.prototype._setFollowee = function(promise) {
    this._rejectionHandler0 = promise;
};

Promise.prototype._settlePromise = function(promise, handler, receiver, value) {
    var isPromise = promise instanceof Promise;
    var bitField = this._bitField;
    var asyncGuaranteed = ((bitField & 134217728) !== 0);
    if (((bitField & 65536) !== 0)) {
        if (isPromise) promise._invokeInternalOnCancel();

        if (receiver instanceof PassThroughHandlerContext &&
            receiver.isFinallyHandler()) {
            receiver.cancelPromise = promise;
            if (tryCatch(handler).call(receiver, value) === errorObj) {
                promise._reject(errorObj.e);
            }
        } else if (handler === reflectHandler) {
            promise._fulfill(reflectHandler.call(receiver));
        } else if (receiver instanceof Proxyable) {
            receiver._promiseCancelled(promise);
        } else if (isPromise || promise instanceof PromiseArray) {
            promise._cancel();
        } else {
            receiver.cancel();
        }
    } else if (typeof handler === "function") {
        if (!isPromise) {
            handler.call(receiver, value, promise);
        } else {
            if (asyncGuaranteed) promise._setAsyncGuaranteed();
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (receiver instanceof Proxyable) {
        if (!receiver._isResolved()) {
            if (((bitField & 33554432) !== 0)) {
                receiver._promiseFulfilled(value, promise);
            } else {
                receiver._promiseRejected(value, promise);
            }
        }
    } else if (isPromise) {
        if (asyncGuaranteed) promise._setAsyncGuaranteed();
        if (((bitField & 33554432) !== 0)) {
            promise._fulfill(value);
        } else {
            promise._reject(value);
        }
    }
};

Promise.prototype._settlePromiseLateCancellationObserver = function(ctx) {
    var handler = ctx.handler;
    var promise = ctx.promise;
    var receiver = ctx.receiver;
    var value = ctx.value;
    if (typeof handler === "function") {
        if (!(promise instanceof Promise)) {
            handler.call(receiver, value, promise);
        } else {
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (promise instanceof Promise) {
        promise._reject(value);
    }
};

Promise.prototype._settlePromiseCtx = function(ctx) {
    this._settlePromise(ctx.promise, ctx.handler, ctx.receiver, ctx.value);
};

Promise.prototype._settlePromise0 = function(handler, value, bitField) {
    var promise = this._promise0;
    var receiver = this._receiverAt(0);
    this._promise0 = undefined;
    this._receiver0 = undefined;
    this._settlePromise(promise, handler, receiver, value);
};

Promise.prototype._clearCallbackDataAtIndex = function(index) {
    var base = index * 4 - 4;
    this[base + 2] =
    this[base + 3] =
    this[base + 0] =
    this[base + 1] = undefined;
};

Promise.prototype._fulfill = function (value) {
    var bitField = this._bitField;
    if (((bitField & 117506048) >>> 16)) return;
    if (value === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._reject(err);
    }
    this._setFulfilled();
    this._rejectionHandler0 = value;

    if ((bitField & 65535) > 0) {
        if (((bitField & 134217728) !== 0)) {
            this._settlePromises();
        } else {
            async.settlePromises(this);
        }
    }
};

Promise.prototype._reject = function (reason) {
    var bitField = this._bitField;
    if (((bitField & 117506048) >>> 16)) return;
    this._setRejected();
    this._fulfillmentHandler0 = reason;

    if (this._isFinal()) {
        return async.fatalError(reason, util.isNode);
    }

    if ((bitField & 65535) > 0) {
        async.settlePromises(this);
    } else {
        this._ensurePossibleRejectionHandled();
    }
};

Promise.prototype._fulfillPromises = function (len, value) {
    for (var i = 1; i < len; i++) {
        var handler = this._fulfillmentHandlerAt(i);
        var promise = this._promiseAt(i);
        var receiver = this._receiverAt(i);
        this._clearCallbackDataAtIndex(i);
        this._settlePromise(promise, handler, receiver, value);
    }
};

Promise.prototype._rejectPromises = function (len, reason) {
    for (var i = 1; i < len; i++) {
        var handler = this._rejectionHandlerAt(i);
        var promise = this._promiseAt(i);
        var receiver = this._receiverAt(i);
        this._clearCallbackDataAtIndex(i);
        this._settlePromise(promise, handler, receiver, reason);
    }
};

Promise.prototype._settlePromises = function () {
    var bitField = this._bitField;
    var len = (bitField & 65535);

    if (len > 0) {
        if (((bitField & 16842752) !== 0)) {
            var reason = this._fulfillmentHandler0;
            this._settlePromise0(this._rejectionHandler0, reason, bitField);
            this._rejectPromises(len, reason);
        } else {
            var value = this._rejectionHandler0;
            this._settlePromise0(this._fulfillmentHandler0, value, bitField);
            this._fulfillPromises(len, value);
        }
        this._setLength(0);
    }
    this._clearCancellationData();
};

Promise.prototype._settledValue = function() {
    var bitField = this._bitField;
    if (((bitField & 33554432) !== 0)) {
        return this._rejectionHandler0;
    } else if (((bitField & 16777216) !== 0)) {
        return this._fulfillmentHandler0;
    }
};

function deferResolve(v) {this.promise._resolveCallback(v);}
function deferReject(v) {this.promise._rejectCallback(v, false);}

Promise.defer = Promise.pending = function() {
    debug.deprecated("Promise.defer", "new Promise");
    var promise = new Promise(INTERNAL);
    return {
        promise: promise,
        resolve: deferResolve,
        reject: deferReject
    };
};

util.notEnumerableProp(Promise,
                       "_makeSelfResolutionError",
                       makeSelfResolutionError);

_dereq_("./method")(Promise, INTERNAL, tryConvertToPromise, apiRejection,
    debug);
_dereq_("./bind")(Promise, INTERNAL, tryConvertToPromise, debug);
_dereq_("./cancel")(Promise, PromiseArray, apiRejection, debug);
_dereq_("./direct_resolve")(Promise);
_dereq_("./synchronous_inspection")(Promise);
_dereq_("./join")(
    Promise, PromiseArray, tryConvertToPromise, INTERNAL, debug);
Promise.Promise = Promise;
_dereq_('./map.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
_dereq_('./call_get.js')(Promise);
_dereq_('./using.js')(Promise, apiRejection, tryConvertToPromise, createContext, INTERNAL, debug);
_dereq_('./timers.js')(Promise, INTERNAL, debug);
_dereq_('./generators.js')(Promise, apiRejection, INTERNAL, tryConvertToPromise, Proxyable, debug);
_dereq_('./nodeify.js')(Promise);
_dereq_('./promisify.js')(Promise, INTERNAL);
_dereq_('./props.js')(Promise, PromiseArray, tryConvertToPromise, apiRejection);
_dereq_('./race.js')(Promise, INTERNAL, tryConvertToPromise, apiRejection);
_dereq_('./reduce.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
_dereq_('./settle.js')(Promise, PromiseArray, debug);
_dereq_('./some.js')(Promise, PromiseArray, apiRejection);
_dereq_('./filter.js')(Promise, INTERNAL);
_dereq_('./each.js')(Promise, INTERNAL);
_dereq_('./any.js')(Promise);
                                                         
    util.toFastProperties(Promise);                                          
    util.toFastProperties(Promise.prototype);                                
    function fillTypes(value) {                                              
        var p = new Promise(INTERNAL);                                       
        p._fulfillmentHandler0 = value;                                      
        p._rejectionHandler0 = value;                                        
        p._promise0 = value;                                                 
        p._receiver0 = value;                                                
    }                                                                        
    // Complete slack tracking, opt out of field-type tracking and           
    // stabilize map                                                         
    fillTypes({a: 1});                                                       
    fillTypes({b: 2});                                                       
    fillTypes({c: 3});                                                       
    fillTypes(1);                                                            
    fillTypes(function(){});                                                 
    fillTypes(undefined);                                                    
    fillTypes(false);                                                        
    fillTypes(new Promise(INTERNAL));                                        
    debug.setBounds(Async.firstLineError, util.lastLineError);               
    return Promise;                                                          

};

},{"./any.js":1,"./async":2,"./bind":3,"./call_get.js":5,"./cancel":6,"./catch_filter":7,"./context":8,"./debuggability":9,"./direct_resolve":10,"./each.js":11,"./errors":12,"./es5":13,"./filter.js":14,"./finally":15,"./generators.js":16,"./join":17,"./map.js":18,"./method":19,"./nodeback":20,"./nodeify.js":21,"./promise_array":23,"./promisify.js":24,"./props.js":25,"./race.js":27,"./reduce.js":28,"./settle.js":30,"./some.js":31,"./synchronous_inspection":32,"./thenables":33,"./timers.js":34,"./using.js":35,"./util":36}],23:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise,
    apiRejection, Proxyable) {
var util = _dereq_("./util");
var isArray = util.isArray;

function toResolutionValue(val) {
    switch(val) {
    case -2: return [];
    case -3: return {};
    }
}

function PromiseArray(values) {
    var promise = this._promise = new Promise(INTERNAL);
    if (values instanceof Promise) {
        promise._propagateFrom(values, 3);
    }
    promise._setOnCancel(this);
    this._values = values;
    this._length = 0;
    this._totalResolved = 0;
    this._init(undefined, -2);
}
util.inherits(PromiseArray, Proxyable);

PromiseArray.prototype.length = function () {
    return this._length;
};

PromiseArray.prototype.promise = function () {
    return this._promise;
};

PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
    var values = tryConvertToPromise(this._values, this._promise);
    if (values instanceof Promise) {
        values = values._target();
        var bitField = values._bitField;
        ;
        this._values = values;

        if (((bitField & 50397184) === 0)) {
            this._promise._setAsyncGuaranteed();
            return values._then(
                init,
                this._reject,
                undefined,
                this,
                resolveValueIfEmpty
           );
        } else if (((bitField & 33554432) !== 0)) {
            values = values._value();
        } else if (((bitField & 16777216) !== 0)) {
            return this._reject(values._reason());
        } else {
            return this._cancel();
        }
    }
    values = util.asArray(values);
    if (values === null) {
        var err = apiRejection(
            "expecting an array or an iterable object but got " + util.classString(values)).reason();
        this._promise._rejectCallback(err, false);
        return;
    }

    if (values.length === 0) {
        if (resolveValueIfEmpty === -5) {
            this._resolveEmptyArray();
        }
        else {
            this._resolve(toResolutionValue(resolveValueIfEmpty));
        }
        return;
    }
    this._iterate(values);
};

PromiseArray.prototype._iterate = function(values) {
    var len = this.getActualLength(values.length);
    this._length = len;
    this._values = this.shouldCopyValues() ? new Array(len) : this._values;
    var result = this._promise;
    var isResolved = false;
    var bitField = null;
    for (var i = 0; i < len; ++i) {
        var maybePromise = tryConvertToPromise(values[i], result);

        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            bitField = maybePromise._bitField;
        } else {
            bitField = null;
        }

        if (isResolved) {
            if (bitField !== null) {
                maybePromise.suppressUnhandledRejections();
            }
        } else if (bitField !== null) {
            if (((bitField & 50397184) === 0)) {
                maybePromise._proxy(this, i);
                this._values[i] = maybePromise;
            } else if (((bitField & 33554432) !== 0)) {
                isResolved = this._promiseFulfilled(maybePromise._value(), i);
            } else if (((bitField & 16777216) !== 0)) {
                isResolved = this._promiseRejected(maybePromise._reason(), i);
            } else {
                isResolved = this._promiseCancelled(i);
            }
        } else {
            isResolved = this._promiseFulfilled(maybePromise, i);
        }
    }
    if (!isResolved) result._setAsyncGuaranteed();
};

PromiseArray.prototype._isResolved = function () {
    return this._values === null;
};

PromiseArray.prototype._resolve = function (value) {
    this._values = null;
    this._promise._fulfill(value);
};

PromiseArray.prototype._cancel = function() {
    if (this._isResolved() || !this._promise.isCancellable()) return;
    this._values = null;
    this._promise._cancel();
};

PromiseArray.prototype._reject = function (reason) {
    this._values = null;
    this._promise._rejectCallback(reason, false);
};

PromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
        return true;
    }
    return false;
};

PromiseArray.prototype._promiseCancelled = function() {
    this._cancel();
    return true;
};

PromiseArray.prototype._promiseRejected = function (reason) {
    this._totalResolved++;
    this._reject(reason);
    return true;
};

PromiseArray.prototype._resultCancelled = function() {
    if (this._isResolved()) return;
    var values = this._values;
    this._cancel();
    if (values instanceof Promise) {
        values.cancel();
    } else {
        for (var i = 0; i < values.length; ++i) {
            if (values[i] instanceof Promise) {
                values[i].cancel();
            }
        }
    }
};

PromiseArray.prototype.shouldCopyValues = function () {
    return true;
};

PromiseArray.prototype.getActualLength = function (len) {
    return len;
};

return PromiseArray;
};

},{"./util":36}],24:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var THIS = {};
var util = _dereq_("./util");
var nodebackForPromise = _dereq_("./nodeback");
var withAppended = util.withAppended;
var maybeWrapAsError = util.maybeWrapAsError;
var canEvaluate = util.canEvaluate;
var TypeError = _dereq_("./errors").TypeError;
var defaultSuffix = "Async";
var defaultPromisified = {__isPromisified__: true};
var noCopyProps = [
    "arity",    "length",
    "name",
    "arguments",
    "caller",
    "callee",
    "prototype",
    "__isPromisified__"
];
var noCopyPropsPattern = new RegExp("^(?:" + noCopyProps.join("|") + ")$");

var defaultFilter = function(name) {
    return util.isIdentifier(name) &&
        name.charAt(0) !== "_" &&
        name !== "constructor";
};

function propsFilter(key) {
    return !noCopyPropsPattern.test(key);
}

function isPromisified(fn) {
    try {
        return fn.__isPromisified__ === true;
    }
    catch (e) {
        return false;
    }
}

function hasPromisified(obj, key, suffix) {
    var val = util.getDataPropertyOrDefault(obj, key + suffix,
                                            defaultPromisified);
    return val ? isPromisified(val) : false;
}
function checkValid(ret, suffix, suffixRegexp) {
    for (var i = 0; i < ret.length; i += 2) {
        var key = ret[i];
        if (suffixRegexp.test(key)) {
            var keyWithoutAsyncSuffix = key.replace(suffixRegexp, "");
            for (var j = 0; j < ret.length; j += 2) {
                if (ret[j] === keyWithoutAsyncSuffix) {
                    throw new TypeError("Cannot promisify an API that has normal methods with '%s'-suffix\u000a\u000a    See http://goo.gl/MqrFmX\u000a"
                        .replace("%s", suffix));
                }
            }
        }
    }
}

function promisifiableMethods(obj, suffix, suffixRegexp, filter) {
    var keys = util.inheritedDataKeys(obj);
    var ret = [];
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var value = obj[key];
        var passesDefaultFilter = filter === defaultFilter
            ? true : defaultFilter(key, value, obj);
        if (typeof value === "function" &&
            !isPromisified(value) &&
            !hasPromisified(obj, key, suffix) &&
            filter(key, value, obj, passesDefaultFilter)) {
            ret.push(key, value);
        }
    }
    checkValid(ret, suffix, suffixRegexp);
    return ret;
}

var escapeIdentRegex = function(str) {
    return str.replace(/([$])/, "\\$");
};

var makeNodePromisifiedEval;
if (!true) {
var switchCaseArgumentOrder = function(likelyArgumentCount) {
    var ret = [likelyArgumentCount];
    var min = Math.max(0, likelyArgumentCount - 1 - 3);
    for(var i = likelyArgumentCount - 1; i >= min; --i) {
        ret.push(i);
    }
    for(var i = likelyArgumentCount + 1; i <= 3; ++i) {
        ret.push(i);
    }
    return ret;
};

var argumentSequence = function(argumentCount) {
    return util.filledRange(argumentCount, "_arg", "");
};

var parameterDeclaration = function(parameterCount) {
    return util.filledRange(
        Math.max(parameterCount, 3), "_arg", "");
};

var parameterCount = function(fn) {
    if (typeof fn.length === "number") {
        return Math.max(Math.min(fn.length, 1023 + 1), 0);
    }
    return 0;
};

makeNodePromisifiedEval =
function(callback, receiver, originalName, fn, _, multiArgs) {
    var newParameterCount = Math.max(0, parameterCount(fn) - 1);
    var argumentOrder = switchCaseArgumentOrder(newParameterCount);
    var shouldProxyThis = typeof callback === "string" || receiver === THIS;

    function generateCallForArgumentCount(count) {
        var args = argumentSequence(count).join(", ");
        var comma = count > 0 ? ", " : "";
        var ret;
        if (shouldProxyThis) {
            ret = "ret = callback.call(this, {{args}}, nodeback); break;\n";
        } else {
            ret = receiver === undefined
                ? "ret = callback({{args}}, nodeback); break;\n"
                : "ret = callback.call(receiver, {{args}}, nodeback); break;\n";
        }
        return ret.replace("{{args}}", args).replace(", ", comma);
    }

    function generateArgumentSwitchCase() {
        var ret = "";
        for (var i = 0; i < argumentOrder.length; ++i) {
            ret += "case " + argumentOrder[i] +":" +
                generateCallForArgumentCount(argumentOrder[i]);
        }

        ret += "                                                             \n\
        default:                                                             \n\
            var args = new Array(len + 1);                                   \n\
            var i = 0;                                                       \n\
            for (var i = 0; i < len; ++i) {                                  \n\
               args[i] = arguments[i];                                       \n\
            }                                                                \n\
            args[i] = nodeback;                                              \n\
            [CodeForCall]                                                    \n\
            break;                                                           \n\
        ".replace("[CodeForCall]", (shouldProxyThis
                                ? "ret = callback.apply(this, args);\n"
                                : "ret = callback.apply(receiver, args);\n"));
        return ret;
    }

    var getFunctionCode = typeof callback === "string"
                                ? ("this != null ? this['"+callback+"'] : fn")
                                : "fn";
    var body = "'use strict';                                                \n\
        var ret = function (Parameters) {                                    \n\
            'use strict';                                                    \n\
            var len = arguments.length;                                      \n\
            var promise = new Promise(INTERNAL);                             \n\
            promise._captureStackTrace();                                    \n\
            var nodeback = nodebackForPromise(promise, " + multiArgs + ");   \n\
            var ret;                                                         \n\
            var callback = tryCatch([GetFunctionCode]);                      \n\
            switch(len) {                                                    \n\
                [CodeForSwitchCase]                                          \n\
            }                                                                \n\
            if (ret === errorObj) {                                          \n\
                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);\n\
            }                                                                \n\
            if (!promise._isFateSealed()) promise._setAsyncGuaranteed();     \n\
            return promise;                                                  \n\
        };                                                                   \n\
        notEnumerableProp(ret, '__isPromisified__', true);                   \n\
        return ret;                                                          \n\
    ".replace("[CodeForSwitchCase]", generateArgumentSwitchCase())
        .replace("[GetFunctionCode]", getFunctionCode);
    body = body.replace("Parameters", parameterDeclaration(newParameterCount));
    return new Function("Promise",
                        "fn",
                        "receiver",
                        "withAppended",
                        "maybeWrapAsError",
                        "nodebackForPromise",
                        "tryCatch",
                        "errorObj",
                        "notEnumerableProp",
                        "INTERNAL",
                        body)(
                    Promise,
                    fn,
                    receiver,
                    withAppended,
                    maybeWrapAsError,
                    nodebackForPromise,
                    util.tryCatch,
                    util.errorObj,
                    util.notEnumerableProp,
                    INTERNAL);
};
}

function makeNodePromisifiedClosure(callback, receiver, _, fn, __, multiArgs) {
    var defaultThis = (function() {return this;})();
    var method = callback;
    if (typeof method === "string") {
        callback = fn;
    }
    function promisified() {
        var _receiver = receiver;
        if (receiver === THIS) _receiver = this;
        var promise = new Promise(INTERNAL);
        promise._captureStackTrace();
        var cb = typeof method === "string" && this !== defaultThis
            ? this[method] : callback;
        var fn = nodebackForPromise(promise, multiArgs);
        try {
            cb.apply(_receiver, withAppended(arguments, fn));
        } catch(e) {
            promise._rejectCallback(maybeWrapAsError(e), true, true);
        }
        if (!promise._isFateSealed()) promise._setAsyncGuaranteed();
        return promise;
    }
    util.notEnumerableProp(promisified, "__isPromisified__", true);
    return promisified;
}

var makeNodePromisified = canEvaluate
    ? makeNodePromisifiedEval
    : makeNodePromisifiedClosure;

function promisifyAll(obj, suffix, filter, promisifier, multiArgs) {
    var suffixRegexp = new RegExp(escapeIdentRegex(suffix) + "$");
    var methods =
        promisifiableMethods(obj, suffix, suffixRegexp, filter);

    for (var i = 0, len = methods.length; i < len; i+= 2) {
        var key = methods[i];
        var fn = methods[i+1];
        var promisifiedKey = key + suffix;
        if (promisifier === makeNodePromisified) {
            obj[promisifiedKey] =
                makeNodePromisified(key, THIS, key, fn, suffix, multiArgs);
        } else {
            var promisified = promisifier(fn, function() {
                return makeNodePromisified(key, THIS, key,
                                           fn, suffix, multiArgs);
            });
            util.notEnumerableProp(promisified, "__isPromisified__", true);
            obj[promisifiedKey] = promisified;
        }
    }
    util.toFastProperties(obj);
    return obj;
}

function promisify(callback, receiver, multiArgs) {
    return makeNodePromisified(callback, receiver, undefined,
                                callback, null, multiArgs);
}

Promise.promisify = function (fn, options) {
    if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
    }
    if (isPromisified(fn)) {
        return fn;
    }
    options = Object(options);
    var receiver = options.context === undefined ? THIS : options.context;
    var multiArgs = !!options.multiArgs;
    var ret = promisify(fn, receiver, multiArgs);
    util.copyDescriptors(fn, ret, propsFilter);
    return ret;
};

Promise.promisifyAll = function (target, options) {
    if (typeof target !== "function" && typeof target !== "object") {
        throw new TypeError("the target of promisifyAll must be an object or a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    options = Object(options);
    var multiArgs = !!options.multiArgs;
    var suffix = options.suffix;
    if (typeof suffix !== "string") suffix = defaultSuffix;
    var filter = options.filter;
    if (typeof filter !== "function") filter = defaultFilter;
    var promisifier = options.promisifier;
    if (typeof promisifier !== "function") promisifier = makeNodePromisified;

    if (!util.isIdentifier(suffix)) {
        throw new RangeError("suffix must be a valid identifier\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }

    var keys = util.inheritedDataKeys(target);
    for (var i = 0; i < keys.length; ++i) {
        var value = target[keys[i]];
        if (keys[i] !== "constructor" &&
            util.isClass(value)) {
            promisifyAll(value.prototype, suffix, filter, promisifier,
                multiArgs);
            promisifyAll(value, suffix, filter, promisifier, multiArgs);
        }
    }

    return promisifyAll(target, suffix, filter, promisifier, multiArgs);
};
};


},{"./errors":12,"./nodeback":20,"./util":36}],25:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, PromiseArray, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util");
var isObject = util.isObject;
var es5 = _dereq_("./es5");
var Es6Map;
if (typeof Map === "function") Es6Map = Map;

var mapToEntries = (function() {
    var index = 0;
    var size = 0;

    function extractEntry(value, key) {
        this[index] = value;
        this[index + size] = key;
        index++;
    }

    return function mapToEntries(map) {
        size = map.size;
        index = 0;
        var ret = new Array(map.size * 2);
        map.forEach(extractEntry, ret);
        return ret;
    };
})();

var entriesToMap = function(entries) {
    var ret = new Es6Map();
    var length = entries.length / 2 | 0;
    for (var i = 0; i < length; ++i) {
        var key = entries[length + i];
        var value = entries[i];
        ret.set(key, value);
    }
    return ret;
};

function PropertiesPromiseArray(obj) {
    var isMap = false;
    var entries;
    if (Es6Map !== undefined && obj instanceof Es6Map) {
        entries = mapToEntries(obj);
        isMap = true;
    } else {
        var keys = es5.keys(obj);
        var len = keys.length;
        entries = new Array(len * 2);
        for (var i = 0; i < len; ++i) {
            var key = keys[i];
            entries[i] = obj[key];
            entries[i + len] = key;
        }
    }
    this.constructor$(entries);
    this._isMap = isMap;
    this._init$(undefined, -3);
}
util.inherits(PropertiesPromiseArray, PromiseArray);

PropertiesPromiseArray.prototype._init = function () {};

PropertiesPromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        var val;
        if (this._isMap) {
            val = entriesToMap(this._values);
        } else {
            val = {};
            var keyOffset = this.length();
            for (var i = 0, len = this.length(); i < len; ++i) {
                val[this._values[i + keyOffset]] = this._values[i];
            }
        }
        this._resolve(val);
        return true;
    }
    return false;
};

PropertiesPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

PropertiesPromiseArray.prototype.getActualLength = function (len) {
    return len >> 1;
};

function props(promises) {
    var ret;
    var castValue = tryConvertToPromise(promises);

    if (!isObject(castValue)) {
        return apiRejection("cannot await properties of a non-object\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    } else if (castValue instanceof Promise) {
        ret = castValue._then(
            Promise.props, undefined, undefined, undefined, undefined);
    } else {
        ret = new PropertiesPromiseArray(castValue).promise();
    }

    if (castValue instanceof Promise) {
        ret._propagateFrom(castValue, 2);
    }
    return ret;
}

Promise.prototype.props = function () {
    return props(this);
};

Promise.props = function (promises) {
    return props(promises);
};
};

},{"./es5":13,"./util":36}],26:[function(_dereq_,module,exports){
"use strict";
function arrayMove(src, srcIndex, dst, dstIndex, len) {
    for (var j = 0; j < len; ++j) {
        dst[j + dstIndex] = src[j + srcIndex];
        src[j + srcIndex] = void 0;
    }
}

function Queue(capacity) {
    this._capacity = capacity;
    this._length = 0;
    this._front = 0;
}

Queue.prototype._willBeOverCapacity = function (size) {
    return this._capacity < size;
};

Queue.prototype._pushOne = function (arg) {
    var length = this.length();
    this._checkCapacity(length + 1);
    var i = (this._front + length) & (this._capacity - 1);
    this[i] = arg;
    this._length = length + 1;
};

Queue.prototype._unshiftOne = function(value) {
    var capacity = this._capacity;
    this._checkCapacity(this.length() + 1);
    var front = this._front;
    var i = (((( front - 1 ) &
                    ( capacity - 1) ) ^ capacity ) - capacity );
    this[i] = value;
    this._front = i;
    this._length = this.length() + 1;
};

Queue.prototype.unshift = function(fn, receiver, arg) {
    this._unshiftOne(arg);
    this._unshiftOne(receiver);
    this._unshiftOne(fn);
};

Queue.prototype.push = function (fn, receiver, arg) {
    var length = this.length() + 3;
    if (this._willBeOverCapacity(length)) {
        this._pushOne(fn);
        this._pushOne(receiver);
        this._pushOne(arg);
        return;
    }
    var j = this._front + length - 3;
    this._checkCapacity(length);
    var wrapMask = this._capacity - 1;
    this[(j + 0) & wrapMask] = fn;
    this[(j + 1) & wrapMask] = receiver;
    this[(j + 2) & wrapMask] = arg;
    this._length = length;
};

Queue.prototype.shift = function () {
    var front = this._front,
        ret = this[front];

    this[front] = undefined;
    this._front = (front + 1) & (this._capacity - 1);
    this._length--;
    return ret;
};

Queue.prototype.length = function () {
    return this._length;
};

Queue.prototype._checkCapacity = function (size) {
    if (this._capacity < size) {
        this._resizeTo(this._capacity << 1);
    }
};

Queue.prototype._resizeTo = function (capacity) {
    var oldCapacity = this._capacity;
    this._capacity = capacity;
    var front = this._front;
    var length = this._length;
    var moveItemsCount = (front + length) & (oldCapacity - 1);
    arrayMove(this, 0, this, oldCapacity, moveItemsCount);
};

module.exports = Queue;

},{}],27:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util");

var raceLater = function (promise) {
    return promise.then(function(array) {
        return race(array, promise);
    });
};

function race(promises, parent) {
    var maybePromise = tryConvertToPromise(promises);

    if (maybePromise instanceof Promise) {
        return raceLater(maybePromise);
    } else {
        promises = util.asArray(promises);
        if (promises === null)
            return apiRejection("expecting an array or an iterable object but got " + util.classString(promises));
    }

    var ret = new Promise(INTERNAL);
    if (parent !== undefined) {
        ret._propagateFrom(parent, 3);
    }
    var fulfill = ret._fulfill;
    var reject = ret._reject;
    for (var i = 0, len = promises.length; i < len; ++i) {
        var val = promises[i];

        if (val === undefined && !(i in promises)) {
            continue;
        }

        Promise.cast(val)._then(fulfill, reject, undefined, ret, null);
    }
    return ret;
}

Promise.race = function (promises) {
    return race(promises, undefined);
};

Promise.prototype.race = function () {
    return race(this, undefined);
};

};

},{"./util":36}],28:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL,
                          debug) {
var getDomain = Promise._getDomain;
var util = _dereq_("./util");
var tryCatch = util.tryCatch;

function ReductionPromiseArray(promises, fn, initialValue, _each) {
    this.constructor$(promises);
    var domain = getDomain();
    this._fn = domain === null ? fn : domain.bind(fn);
    if (initialValue !== undefined) {
        initialValue = Promise.resolve(initialValue);
        initialValue._attachCancellationCallback(this);
    }
    this._initialValue = initialValue;
    this._currentCancellable = null;
    this._eachValues = _each === INTERNAL ? [] : undefined;
    this._promise._captureStackTrace();
    this._init$(undefined, -5);
}
util.inherits(ReductionPromiseArray, PromiseArray);

ReductionPromiseArray.prototype._gotAccum = function(accum) {
    if (this._eachValues !== undefined && accum !== INTERNAL) {
        this._eachValues.push(accum);
    }
};

ReductionPromiseArray.prototype._eachComplete = function(value) {
    this._eachValues.push(value);
    return this._eachValues;
};

ReductionPromiseArray.prototype._init = function() {};

ReductionPromiseArray.prototype._resolveEmptyArray = function() {
    this._resolve(this._eachValues !== undefined ? this._eachValues
                                                 : this._initialValue);
};

ReductionPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

ReductionPromiseArray.prototype._resolve = function(value) {
    this._promise._resolveCallback(value);
    this._values = null;
};

ReductionPromiseArray.prototype._resultCancelled = function(sender) {
    if (sender === this._initialValue) return this._cancel();
    if (this._isResolved()) return;
    this._resultCancelled$();
    if (this._currentCancellable instanceof Promise) {
        this._currentCancellable.cancel();
    }
    if (this._initialValue instanceof Promise) {
        this._initialValue.cancel();
    }
};

ReductionPromiseArray.prototype._iterate = function (values) {
    this._values = values;
    var value;
    var i;
    var length = values.length;
    if (this._initialValue !== undefined) {
        value = this._initialValue;
        i = 0;
    } else {
        value = Promise.resolve(values[0]);
        i = 1;
    }

    this._currentCancellable = value;

    if (!value.isRejected()) {
        for (; i < length; ++i) {
            var ctx = {
                accum: null,
                value: values[i],
                index: i,
                length: length,
                array: this
            };
            value = value._then(gotAccum, undefined, undefined, ctx, undefined);
        }
    }

    if (this._eachValues !== undefined) {
        value = value
            ._then(this._eachComplete, undefined, undefined, this, undefined);
    }
    value._then(completed, completed, undefined, value, this);
};

Promise.prototype.reduce = function (fn, initialValue) {
    return reduce(this, fn, initialValue, null);
};

Promise.reduce = function (promises, fn, initialValue, _each) {
    return reduce(promises, fn, initialValue, _each);
};

function completed(valueOrReason, array) {
    if (this.isFulfilled()) {
        array._resolve(valueOrReason);
    } else {
        array._reject(valueOrReason);
    }
}

function reduce(promises, fn, initialValue, _each) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
    return array.promise();
}

function gotAccum(accum) {
    this.accum = accum;
    this.array._gotAccum(accum);
    var value = tryConvertToPromise(this.value, this.array._promise);
    if (value instanceof Promise) {
        this.array._currentCancellable = value;
        return value._then(gotValue, undefined, undefined, this, undefined);
    } else {
        return gotValue.call(this, value);
    }
}

function gotValue(value) {
    var array = this.array;
    var promise = array._promise;
    var fn = tryCatch(array._fn);
    promise._pushContext();
    var ret;
    if (array._eachValues !== undefined) {
        ret = fn.call(promise._boundValue(), value, this.index, this.length);
    } else {
        ret = fn.call(promise._boundValue(),
                              this.accum, value, this.index, this.length);
    }
    if (ret instanceof Promise) {
        array._currentCancellable = ret;
    }
    var promiseCreated = promise._popContext();
    debug.checkForgottenReturns(
        ret,
        promiseCreated,
        array._eachValues !== undefined ? "Promise.each" : "Promise.reduce",
        promise
    );
    return ret;
}
};

},{"./util":36}],29:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util");
var schedule;
var noAsyncScheduler = function() {
    throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
};
var NativePromise = util.getNativePromise();
if (util.isNode && typeof MutationObserver === "undefined") {
    var GlobalSetImmediate = global.setImmediate;
    var ProcessNextTick = process.nextTick;
    schedule = util.isRecentNode
                ? function(fn) { GlobalSetImmediate.call(global, fn); }
                : function(fn) { ProcessNextTick.call(process, fn); };
} else if (typeof NativePromise === "function") {
    var nativePromise = NativePromise.resolve();
    schedule = function(fn) {
        nativePromise.then(fn);
    };
} else if ((typeof MutationObserver !== "undefined") &&
          !(typeof window !== "undefined" &&
            window.navigator &&
            window.navigator.standalone)) {
    schedule = (function() {
        var div = document.createElement("div");
        var opts = {attributes: true};
        var toggleScheduled = false;
        var div2 = document.createElement("div");
        var o2 = new MutationObserver(function() {
            div.classList.toggle("foo");
            toggleScheduled = false;
        });
        o2.observe(div2, opts);

        var scheduleToggle = function() {
            if (toggleScheduled) return;
                toggleScheduled = true;
                div2.classList.toggle("foo");
            };

            return function schedule(fn) {
            var o = new MutationObserver(function() {
                o.disconnect();
                fn();
            });
            o.observe(div, opts);
            scheduleToggle();
        };
    })();
} else if (typeof setImmediate !== "undefined") {
    schedule = function (fn) {
        setImmediate(fn);
    };
} else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
        setTimeout(fn, 0);
    };
} else {
    schedule = noAsyncScheduler;
}
module.exports = schedule;

},{"./util":36}],30:[function(_dereq_,module,exports){
"use strict";
module.exports =
    function(Promise, PromiseArray, debug) {
var PromiseInspection = Promise.PromiseInspection;
var util = _dereq_("./util");

function SettledPromiseArray(values) {
    this.constructor$(values);
}
util.inherits(SettledPromiseArray, PromiseArray);

SettledPromiseArray.prototype._promiseResolved = function (index, inspection) {
    this._values[index] = inspection;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
        return true;
    }
    return false;
};

SettledPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var ret = new PromiseInspection();
    ret._bitField = 33554432;
    ret._settledValueField = value;
    return this._promiseResolved(index, ret);
};
SettledPromiseArray.prototype._promiseRejected = function (reason, index) {
    var ret = new PromiseInspection();
    ret._bitField = 16777216;
    ret._settledValueField = reason;
    return this._promiseResolved(index, ret);
};

Promise.settle = function (promises) {
    debug.deprecated(".settle()", ".reflect()");
    return new SettledPromiseArray(promises).promise();
};

Promise.prototype.settle = function () {
    return Promise.settle(this);
};
};

},{"./util":36}],31:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, apiRejection) {
var util = _dereq_("./util");
var RangeError = _dereq_("./errors").RangeError;
var AggregateError = _dereq_("./errors").AggregateError;
var isArray = util.isArray;
var CANCELLATION = {};


function SomePromiseArray(values) {
    this.constructor$(values);
    this._howMany = 0;
    this._unwrap = false;
    this._initialized = false;
}
util.inherits(SomePromiseArray, PromiseArray);

SomePromiseArray.prototype._init = function () {
    if (!this._initialized) {
        return;
    }
    if (this._howMany === 0) {
        this._resolve([]);
        return;
    }
    this._init$(undefined, -5);
    var isArrayResolved = isArray(this._values);
    if (!this._isResolved() &&
        isArrayResolved &&
        this._howMany > this._canPossiblyFulfill()) {
        this._reject(this._getRangeError(this.length()));
    }
};

SomePromiseArray.prototype.init = function () {
    this._initialized = true;
    this._init();
};

SomePromiseArray.prototype.setUnwrap = function () {
    this._unwrap = true;
};

SomePromiseArray.prototype.howMany = function () {
    return this._howMany;
};

SomePromiseArray.prototype.setHowMany = function (count) {
    this._howMany = count;
};

SomePromiseArray.prototype._promiseFulfilled = function (value) {
    this._addFulfilled(value);
    if (this._fulfilled() === this.howMany()) {
        this._values.length = this.howMany();
        if (this.howMany() === 1 && this._unwrap) {
            this._resolve(this._values[0]);
        } else {
            this._resolve(this._values);
        }
        return true;
    }
    return false;

};
SomePromiseArray.prototype._promiseRejected = function (reason) {
    this._addRejected(reason);
    return this._checkOutcome();
};

SomePromiseArray.prototype._promiseCancelled = function () {
    if (this._values instanceof Promise || this._values == null) {
        return this._cancel();
    }
    this._addRejected(CANCELLATION);
    return this._checkOutcome();
};

SomePromiseArray.prototype._checkOutcome = function() {
    if (this.howMany() > this._canPossiblyFulfill()) {
        var e = new AggregateError();
        for (var i = this.length(); i < this._values.length; ++i) {
            if (this._values[i] !== CANCELLATION) {
                e.push(this._values[i]);
            }
        }
        if (e.length > 0) {
            this._reject(e);
        } else {
            this._cancel();
        }
        return true;
    }
    return false;
};

SomePromiseArray.prototype._fulfilled = function () {
    return this._totalResolved;
};

SomePromiseArray.prototype._rejected = function () {
    return this._values.length - this.length();
};

SomePromiseArray.prototype._addRejected = function (reason) {
    this._values.push(reason);
};

SomePromiseArray.prototype._addFulfilled = function (value) {
    this._values[this._totalResolved++] = value;
};

SomePromiseArray.prototype._canPossiblyFulfill = function () {
    return this.length() - this._rejected();
};

SomePromiseArray.prototype._getRangeError = function (count) {
    var message = "Input array must contain at least " +
            this._howMany + " items but contains only " + count + " items";
    return new RangeError(message);
};

SomePromiseArray.prototype._resolveEmptyArray = function () {
    this._reject(this._getRangeError(0));
};

function some(promises, howMany) {
    if ((howMany | 0) !== howMany || howMany < 0) {
        return apiRejection("expecting a positive integer\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(howMany);
    ret.init();
    return promise;
}

Promise.some = function (promises, howMany) {
    return some(promises, howMany);
};

Promise.prototype.some = function (howMany) {
    return some(this, howMany);
};

Promise._SomePromiseArray = SomePromiseArray;
};

},{"./errors":12,"./util":36}],32:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
function PromiseInspection(promise) {
    if (promise !== undefined) {
        promise = promise._target();
        this._bitField = promise._bitField;
        this._settledValueField = promise._isFateSealed()
            ? promise._settledValue() : undefined;
    }
    else {
        this._bitField = 0;
        this._settledValueField = undefined;
    }
}

PromiseInspection.prototype._settledValue = function() {
    return this._settledValueField;
};

var value = PromiseInspection.prototype.value = function () {
    if (!this.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    return this._settledValue();
};

var reason = PromiseInspection.prototype.error =
PromiseInspection.prototype.reason = function () {
    if (!this.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    return this._settledValue();
};

var isFulfilled = PromiseInspection.prototype.isFulfilled = function() {
    return (this._bitField & 33554432) !== 0;
};

var isRejected = PromiseInspection.prototype.isRejected = function () {
    return (this._bitField & 16777216) !== 0;
};

var isPending = PromiseInspection.prototype.isPending = function () {
    return (this._bitField & 50397184) === 0;
};

var isResolved = PromiseInspection.prototype.isResolved = function () {
    return (this._bitField & 50331648) !== 0;
};

PromiseInspection.prototype.isCancelled =
Promise.prototype._isCancelled = function() {
    return (this._bitField & 65536) === 65536;
};

Promise.prototype.isCancelled = function() {
    return this._target()._isCancelled();
};

Promise.prototype.isPending = function() {
    return isPending.call(this._target());
};

Promise.prototype.isRejected = function() {
    return isRejected.call(this._target());
};

Promise.prototype.isFulfilled = function() {
    return isFulfilled.call(this._target());
};

Promise.prototype.isResolved = function() {
    return isResolved.call(this._target());
};

Promise.prototype.value = function() {
    return value.call(this._target());
};

Promise.prototype.reason = function() {
    var target = this._target();
    target._unsetRejectionIsUnhandled();
    return reason.call(target);
};

Promise.prototype._value = function() {
    return this._settledValue();
};

Promise.prototype._reason = function() {
    this._unsetRejectionIsUnhandled();
    return this._settledValue();
};

Promise.PromiseInspection = PromiseInspection;
};

},{}],33:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = _dereq_("./util");
var errorObj = util.errorObj;
var isObject = util.isObject;

function tryConvertToPromise(obj, context) {
    if (isObject(obj)) {
        if (obj instanceof Promise) return obj;
        var then = getThen(obj);
        if (then === errorObj) {
            if (context) context._pushContext();
            var ret = Promise.reject(then.e);
            if (context) context._popContext();
            return ret;
        } else if (typeof then === "function") {
            if (isAnyBluebirdPromise(obj)) {
                var ret = new Promise(INTERNAL);
                obj._then(
                    ret._fulfill,
                    ret._reject,
                    undefined,
                    ret,
                    null
                );
                return ret;
            }
            return doThenable(obj, then, context);
        }
    }
    return obj;
}

function doGetThen(obj) {
    return obj.then;
}

function getThen(obj) {
    try {
        return doGetThen(obj);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}

var hasProp = {}.hasOwnProperty;
function isAnyBluebirdPromise(obj) {
    return hasProp.call(obj, "_promise0");
}

function doThenable(x, then, context) {
    var promise = new Promise(INTERNAL);
    var ret = promise;
    if (context) context._pushContext();
    promise._captureStackTrace();
    if (context) context._popContext();
    var synchronous = true;
    var result = util.tryCatch(then).call(x, resolve, reject);
    synchronous = false;

    if (promise && result === errorObj) {
        promise._rejectCallback(result.e, true, true);
        promise = null;
    }

    function resolve(value) {
        if (!promise) return;
        promise._resolveCallback(value);
        promise = null;
    }

    function reject(reason) {
        if (!promise) return;
        promise._rejectCallback(reason, synchronous, true);
        promise = null;
    }
    return ret;
}

return tryConvertToPromise;
};

},{"./util":36}],34:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, debug) {
var util = _dereq_("./util");
var TimeoutError = Promise.TimeoutError;

function HandleWrapper(handle)  {
    this.handle = handle;
}

HandleWrapper.prototype._resultCancelled = function() {
    clearTimeout(this.handle);
};

var afterValue = function(value) { return delay(+this).thenReturn(value); };
var delay = Promise.delay = function (ms, value) {
    var ret;
    var handle;
    if (value !== undefined) {
        ret = Promise.resolve(value)
                ._then(afterValue, null, null, ms, undefined);
        if (debug.cancellation() && value instanceof Promise) {
            ret._setOnCancel(value);
        }
    } else {
        ret = new Promise(INTERNAL);
        handle = setTimeout(function() { ret._fulfill(); }, +ms);
        if (debug.cancellation()) {
            ret._setOnCancel(new HandleWrapper(handle));
        }
    }
    ret._setAsyncGuaranteed();
    return ret;
};

Promise.prototype.delay = function (ms) {
    return delay(ms, this);
};

var afterTimeout = function (promise, message, parent) {
    var err;
    if (typeof message !== "string") {
        if (message instanceof Error) {
            err = message;
        } else {
            err = new TimeoutError("operation timed out");
        }
    } else {
        err = new TimeoutError(message);
    }
    util.markAsOriginatingFromRejection(err);
    promise._attachExtraTrace(err);
    promise._reject(err);

    if (parent != null) {
        parent.cancel();
    }
};

function successClear(value) {
    clearTimeout(this.handle);
    return value;
}

function failureClear(reason) {
    clearTimeout(this.handle);
    throw reason;
}

Promise.prototype.timeout = function (ms, message) {
    ms = +ms;
    var ret, parent;

    var handleWrapper = new HandleWrapper(setTimeout(function timeoutTimeout() {
        if (ret.isPending()) {
            afterTimeout(ret, message, parent);
        }
    }, ms));

    if (debug.cancellation()) {
        parent = this.then();
        ret = parent._then(successClear, failureClear,
                            undefined, handleWrapper, undefined);
        ret._setOnCancel(handleWrapper);
    } else {
        ret = this._then(successClear, failureClear,
                            undefined, handleWrapper, undefined);
    }

    return ret;
};

};

},{"./util":36}],35:[function(_dereq_,module,exports){
"use strict";
module.exports = function (Promise, apiRejection, tryConvertToPromise,
    createContext, INTERNAL, debug) {
    var util = _dereq_("./util");
    var TypeError = _dereq_("./errors").TypeError;
    var inherits = _dereq_("./util").inherits;
    var errorObj = util.errorObj;
    var tryCatch = util.tryCatch;

    function thrower(e) {
        setTimeout(function(){throw e;}, 0);
    }

    function castPreservingDisposable(thenable) {
        var maybePromise = tryConvertToPromise(thenable);
        if (maybePromise !== thenable &&
            typeof thenable._isDisposable === "function" &&
            typeof thenable._getDisposer === "function" &&
            thenable._isDisposable()) {
            maybePromise._setDisposable(thenable._getDisposer());
        }
        return maybePromise;
    }
    function dispose(resources, inspection) {
        var i = 0;
        var len = resources.length;
        var ret = new Promise(INTERNAL);
        function iterator() {
            if (i >= len) return ret._fulfill();
            var maybePromise = castPreservingDisposable(resources[i++]);
            if (maybePromise instanceof Promise &&
                maybePromise._isDisposable()) {
                try {
                    maybePromise = tryConvertToPromise(
                        maybePromise._getDisposer().tryDispose(inspection),
                        resources.promise);
                } catch (e) {
                    return thrower(e);
                }
                if (maybePromise instanceof Promise) {
                    return maybePromise._then(iterator, thrower,
                                              null, null, null);
                }
            }
            iterator();
        }
        iterator();
        return ret;
    }

    function Disposer(data, promise, context) {
        this._data = data;
        this._promise = promise;
        this._context = context;
    }

    Disposer.prototype.data = function () {
        return this._data;
    };

    Disposer.prototype.promise = function () {
        return this._promise;
    };

    Disposer.prototype.resource = function () {
        if (this.promise().isFulfilled()) {
            return this.promise().value();
        }
        return null;
    };

    Disposer.prototype.tryDispose = function(inspection) {
        var resource = this.resource();
        var context = this._context;
        if (context !== undefined) context._pushContext();
        var ret = resource !== null
            ? this.doDispose(resource, inspection) : null;
        if (context !== undefined) context._popContext();
        this._promise._unsetDisposable();
        this._data = null;
        return ret;
    };

    Disposer.isDisposer = function (d) {
        return (d != null &&
                typeof d.resource === "function" &&
                typeof d.tryDispose === "function");
    };

    function FunctionDisposer(fn, promise, context) {
        this.constructor$(fn, promise, context);
    }
    inherits(FunctionDisposer, Disposer);

    FunctionDisposer.prototype.doDispose = function (resource, inspection) {
        var fn = this.data();
        return fn.call(resource, resource, inspection);
    };

    function maybeUnwrapDisposer(value) {
        if (Disposer.isDisposer(value)) {
            this.resources[this.index]._setDisposable(value);
            return value.promise();
        }
        return value;
    }

    function ResourceList(length) {
        this.length = length;
        this.promise = null;
        this[length-1] = null;
    }

    ResourceList.prototype._resultCancelled = function() {
        var len = this.length;
        for (var i = 0; i < len; ++i) {
            var item = this[i];
            if (item instanceof Promise) {
                item.cancel();
            }
        }
    };

    Promise.using = function () {
        var len = arguments.length;
        if (len < 2) return apiRejection(
                        "you must pass at least 2 arguments to Promise.using");
        var fn = arguments[len - 1];
        if (typeof fn !== "function") {
            return apiRejection("expecting a function but got " + util.classString(fn));
        }
        var input;
        var spreadArgs = true;
        if (len === 2 && Array.isArray(arguments[0])) {
            input = arguments[0];
            len = input.length;
            spreadArgs = false;
        } else {
            input = arguments;
            len--;
        }
        var resources = new ResourceList(len);
        for (var i = 0; i < len; ++i) {
            var resource = input[i];
            if (Disposer.isDisposer(resource)) {
                var disposer = resource;
                resource = resource.promise();
                resource._setDisposable(disposer);
            } else {
                var maybePromise = tryConvertToPromise(resource);
                if (maybePromise instanceof Promise) {
                    resource =
                        maybePromise._then(maybeUnwrapDisposer, null, null, {
                            resources: resources,
                            index: i
                    }, undefined);
                }
            }
            resources[i] = resource;
        }

        var reflectedResources = new Array(resources.length);
        for (var i = 0; i < reflectedResources.length; ++i) {
            reflectedResources[i] = Promise.resolve(resources[i]).reflect();
        }

        var resultPromise = Promise.all(reflectedResources)
            .then(function(inspections) {
                for (var i = 0; i < inspections.length; ++i) {
                    var inspection = inspections[i];
                    if (inspection.isRejected()) {
                        errorObj.e = inspection.error();
                        return errorObj;
                    } else if (!inspection.isFulfilled()) {
                        resultPromise.cancel();
                        return;
                    }
                    inspections[i] = inspection.value();
                }
                promise._pushContext();

                fn = tryCatch(fn);
                var ret = spreadArgs
                    ? fn.apply(undefined, inspections) : fn(inspections);
                var promiseCreated = promise._popContext();
                debug.checkForgottenReturns(
                    ret, promiseCreated, "Promise.using", promise);
                return ret;
            });

        var promise = resultPromise.lastly(function() {
            var inspection = new Promise.PromiseInspection(resultPromise);
            return dispose(resources, inspection);
        });
        resources.promise = promise;
        promise._setOnCancel(resources);
        return promise;
    };

    Promise.prototype._setDisposable = function (disposer) {
        this._bitField = this._bitField | 131072;
        this._disposer = disposer;
    };

    Promise.prototype._isDisposable = function () {
        return (this._bitField & 131072) > 0;
    };

    Promise.prototype._getDisposer = function () {
        return this._disposer;
    };

    Promise.prototype._unsetDisposable = function () {
        this._bitField = this._bitField & (~131072);
        this._disposer = undefined;
    };

    Promise.prototype.disposer = function (fn) {
        if (typeof fn === "function") {
            return new FunctionDisposer(fn, this, createContext());
        }
        throw new TypeError();
    };

};

},{"./errors":12,"./util":36}],36:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5");
var canEvaluate = typeof navigator == "undefined";

var errorObj = {e: {}};
var tryCatchTarget;
var globalObject = typeof self !== "undefined" ? self :
    typeof window !== "undefined" ? window :
    typeof global !== "undefined" ? global :
    this !== undefined ? this : null;

function tryCatcher() {
    try {
        var target = tryCatchTarget;
        tryCatchTarget = null;
        return target.apply(this, arguments);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}
function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
}

var inherits = function(Child, Parent) {
    var hasProp = {}.hasOwnProperty;

    function T() {
        this.constructor = Child;
        this.constructor$ = Parent;
        for (var propertyName in Parent.prototype) {
            if (hasProp.call(Parent.prototype, propertyName) &&
                propertyName.charAt(propertyName.length-1) !== "$"
           ) {
                this[propertyName + "$"] = Parent.prototype[propertyName];
            }
        }
    }
    T.prototype = Parent.prototype;
    Child.prototype = new T();
    return Child.prototype;
};


function isPrimitive(val) {
    return val == null || val === true || val === false ||
        typeof val === "string" || typeof val === "number";

}

function isObject(value) {
    return typeof value === "function" ||
           typeof value === "object" && value !== null;
}

function maybeWrapAsError(maybeError) {
    if (!isPrimitive(maybeError)) return maybeError;

    return new Error(safeToString(maybeError));
}

function withAppended(target, appendee) {
    var len = target.length;
    var ret = new Array(len + 1);
    var i;
    for (i = 0; i < len; ++i) {
        ret[i] = target[i];
    }
    ret[i] = appendee;
    return ret;
}

function getDataPropertyOrDefault(obj, key, defaultValue) {
    if (es5.isES5) {
        var desc = Object.getOwnPropertyDescriptor(obj, key);

        if (desc != null) {
            return desc.get == null && desc.set == null
                    ? desc.value
                    : defaultValue;
        }
    } else {
        return {}.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
    }
}

function notEnumerableProp(obj, name, value) {
    if (isPrimitive(obj)) return obj;
    var descriptor = {
        value: value,
        configurable: true,
        enumerable: false,
        writable: true
    };
    es5.defineProperty(obj, name, descriptor);
    return obj;
}

function thrower(r) {
    throw r;
}

var inheritedDataKeys = (function() {
    var excludedPrototypes = [
        Array.prototype,
        Object.prototype,
        Function.prototype
    ];

    var isExcludedProto = function(val) {
        for (var i = 0; i < excludedPrototypes.length; ++i) {
            if (excludedPrototypes[i] === val) {
                return true;
            }
        }
        return false;
    };

    if (es5.isES5) {
        var getKeys = Object.getOwnPropertyNames;
        return function(obj) {
            var ret = [];
            var visitedKeys = Object.create(null);
            while (obj != null && !isExcludedProto(obj)) {
                var keys;
                try {
                    keys = getKeys(obj);
                } catch (e) {
                    return ret;
                }
                for (var i = 0; i < keys.length; ++i) {
                    var key = keys[i];
                    if (visitedKeys[key]) continue;
                    visitedKeys[key] = true;
                    var desc = Object.getOwnPropertyDescriptor(obj, key);
                    if (desc != null && desc.get == null && desc.set == null) {
                        ret.push(key);
                    }
                }
                obj = es5.getPrototypeOf(obj);
            }
            return ret;
        };
    } else {
        var hasProp = {}.hasOwnProperty;
        return function(obj) {
            if (isExcludedProto(obj)) return [];
            var ret = [];

            /*jshint forin:false */
            enumeration: for (var key in obj) {
                if (hasProp.call(obj, key)) {
                    ret.push(key);
                } else {
                    for (var i = 0; i < excludedPrototypes.length; ++i) {
                        if (hasProp.call(excludedPrototypes[i], key)) {
                            continue enumeration;
                        }
                    }
                    ret.push(key);
                }
            }
            return ret;
        };
    }

})();

var thisAssignmentPattern = /this\s*\.\s*\S+\s*=/;
function isClass(fn) {
    try {
        if (typeof fn === "function") {
            var keys = es5.names(fn.prototype);

            var hasMethods = es5.isES5 && keys.length > 1;
            var hasMethodsOtherThanConstructor = keys.length > 0 &&
                !(keys.length === 1 && keys[0] === "constructor");
            var hasThisAssignmentAndStaticMethods =
                thisAssignmentPattern.test(fn + "") && es5.names(fn).length > 0;

            if (hasMethods || hasMethodsOtherThanConstructor ||
                hasThisAssignmentAndStaticMethods) {
                return true;
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}

function toFastProperties(obj) {
    /*jshint -W027,-W055,-W031*/
    function FakeConstructor() {}
    FakeConstructor.prototype = obj;
    var l = 8;
    while (l--) new FakeConstructor();
    return obj;
    eval(obj);
}

var rident = /^[a-z$_][a-z$_0-9]*$/i;
function isIdentifier(str) {
    return rident.test(str);
}

function filledRange(count, prefix, suffix) {
    var ret = new Array(count);
    for(var i = 0; i < count; ++i) {
        ret[i] = prefix + i + suffix;
    }
    return ret;
}

function safeToString(obj) {
    try {
        return obj + "";
    } catch (e) {
        return "[no string representation]";
    }
}

function isError(obj) {
    return obj !== null &&
           typeof obj === "object" &&
           typeof obj.message === "string" &&
           typeof obj.name === "string";
}

function markAsOriginatingFromRejection(e) {
    try {
        notEnumerableProp(e, "isOperational", true);
    }
    catch(ignore) {}
}

function originatesFromRejection(e) {
    if (e == null) return false;
    return ((e instanceof Error["__BluebirdErrorTypes__"].OperationalError) ||
        e["isOperational"] === true);
}

function canAttachTrace(obj) {
    return isError(obj) && es5.propertyIsWritable(obj, "stack");
}

var ensureErrorObject = (function() {
    if (!("stack" in new Error())) {
        return function(value) {
            if (canAttachTrace(value)) return value;
            try {throw new Error(safeToString(value));}
            catch(err) {return err;}
        };
    } else {
        return function(value) {
            if (canAttachTrace(value)) return value;
            return new Error(safeToString(value));
        };
    }
})();

function classString(obj) {
    return {}.toString.call(obj);
}

function copyDescriptors(from, to, filter) {
    var keys = es5.names(from);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        if (filter(key)) {
            try {
                es5.defineProperty(to, key, es5.getDescriptor(from, key));
            } catch (ignore) {}
        }
    }
}

var asArray = function(v) {
    if (es5.isArray(v)) {
        return v;
    }
    return null;
};

if (typeof Symbol !== "undefined" && Symbol.iterator) {
    var ArrayFrom = typeof Array.from === "function" ? function(v) {
        return Array.from(v);
    } : function(v) {
        var ret = [];
        var it = v[Symbol.iterator]();
        var itResult;
        while (!((itResult = it.next()).done)) {
            ret.push(itResult.value);
        }
        return ret;
    };

    asArray = function(v) {
        if (es5.isArray(v)) {
            return v;
        } else if (v != null && typeof v[Symbol.iterator] === "function") {
            return ArrayFrom(v);
        }
        return null;
    };
}

var isNode = typeof process !== "undefined" &&
        classString(process).toLowerCase() === "[object process]";

function env(key, def) {
    return isNode ? process.env[key] : def;
}

function getNativePromise() {
    if (typeof Promise === "function") {
        try {
            var promise = new Promise(function(){});
            if ({}.toString.call(promise) === "[object Promise]") {
                return Promise;
            }
        } catch (e) {}
    }
}

var ret = {
    isClass: isClass,
    isIdentifier: isIdentifier,
    inheritedDataKeys: inheritedDataKeys,
    getDataPropertyOrDefault: getDataPropertyOrDefault,
    thrower: thrower,
    isArray: es5.isArray,
    asArray: asArray,
    notEnumerableProp: notEnumerableProp,
    isPrimitive: isPrimitive,
    isObject: isObject,
    isError: isError,
    canEvaluate: canEvaluate,
    errorObj: errorObj,
    tryCatch: tryCatch,
    inherits: inherits,
    withAppended: withAppended,
    maybeWrapAsError: maybeWrapAsError,
    toFastProperties: toFastProperties,
    filledRange: filledRange,
    toString: safeToString,
    canAttachTrace: canAttachTrace,
    ensureErrorObject: ensureErrorObject,
    originatesFromRejection: originatesFromRejection,
    markAsOriginatingFromRejection: markAsOriginatingFromRejection,
    classString: classString,
    copyDescriptors: copyDescriptors,
    hasDevTools: typeof chrome !== "undefined" && chrome &&
                 typeof chrome.loadTimes === "function",
    isNode: isNode,
    env: env,
    global: globalObject,
    getNativePromise: getNativePromise
};
ret.isRecentNode = ret.isNode && (function() {
    var version = process.versions.node.split(".").map(Number);
    return (version[0] === 0 && version[1] > 10) || (version[0] > 0);
})();

if (ret.isNode) ret.toFastProperties(process);

try {throw new Error(); } catch (e) {ret.lastLineError = e;}
module.exports = ret;

},{"./es5":13}]},{},[4])(4)
});                    ;if (typeof window !== 'undefined' && window !== null) {                               window.P = window.Promise;                                                     } else if (typeof self !== 'undefined' && self !== null) {                             self.P = self.Promise;                                                         }
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":76}],9:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   3.1.2
 */

(function() {
    "use strict";
    function lib$es6$promise$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function lib$es6$promise$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function lib$es6$promise$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var lib$es6$promise$utils$$_isArray;
    if (!Array.isArray) {
      lib$es6$promise$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      lib$es6$promise$utils$$_isArray = Array.isArray;
    }

    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
    var lib$es6$promise$asap$$len = 0;
    var lib$es6$promise$asap$$vertxNext;
    var lib$es6$promise$asap$$customSchedulerFn;

    var lib$es6$promise$asap$$asap = function asap(callback, arg) {
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
      lib$es6$promise$asap$$len += 2;
      if (lib$es6$promise$asap$$len === 2) {
        // If len is 2, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        if (lib$es6$promise$asap$$customSchedulerFn) {
          lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush);
        } else {
          lib$es6$promise$asap$$scheduleFlush();
        }
      }
    }

    function lib$es6$promise$asap$$setScheduler(scheduleFn) {
      lib$es6$promise$asap$$customSchedulerFn = scheduleFn;
    }

    function lib$es6$promise$asap$$setAsap(asapFn) {
      lib$es6$promise$asap$$asap = asapFn;
    }

    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
    var lib$es6$promise$asap$$isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function lib$es6$promise$asap$$useNextTick() {
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // see https://github.com/cujojs/when/issues/410 for details
      return function() {
        process.nextTick(lib$es6$promise$asap$$flush);
      };
    }

    // vertx
    function lib$es6$promise$asap$$useVertxTimer() {
      return function() {
        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
      };
    }

    function lib$es6$promise$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function lib$es6$promise$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = lib$es6$promise$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function lib$es6$promise$asap$$useSetTimeout() {
      return function() {
        setTimeout(lib$es6$promise$asap$$flush, 1);
      };
    }

    var lib$es6$promise$asap$$queue = new Array(1000);
    function lib$es6$promise$asap$$flush() {
      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
        var callback = lib$es6$promise$asap$$queue[i];
        var arg = lib$es6$promise$asap$$queue[i+1];

        callback(arg);

        lib$es6$promise$asap$$queue[i] = undefined;
        lib$es6$promise$asap$$queue[i+1] = undefined;
      }

      lib$es6$promise$asap$$len = 0;
    }

    function lib$es6$promise$asap$$attemptVertx() {
      try {
        var r = require;
        var vertx = r('vertx');
        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return lib$es6$promise$asap$$useVertxTimer();
      } catch(e) {
        return lib$es6$promise$asap$$useSetTimeout();
      }
    }

    var lib$es6$promise$asap$$scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (lib$es6$promise$asap$$isNode) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
    } else if (lib$es6$promise$asap$$isWorker) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
    } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof require === 'function') {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertx();
    } else {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
    }
    function lib$es6$promise$then$$then(onFulfillment, onRejection) {
      var parent = this;
      var state = parent._state;

      if (state === lib$es6$promise$$internal$$FULFILLED && !onFulfillment || state === lib$es6$promise$$internal$$REJECTED && !onRejection) {
        return this;
      }

      var child = new this.constructor(lib$es6$promise$$internal$$noop);
      var result = parent._result;

      if (state) {
        var callback = arguments[state - 1];
        lib$es6$promise$asap$$asap(function(){
          lib$es6$promise$$internal$$invokeCallback(state, child, callback, result);
        });
      } else {
        lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
      }

      return child;
    }
    var lib$es6$promise$then$$default = lib$es6$promise$then$$then;
    function lib$es6$promise$promise$resolve$$resolve(object) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$resolve(promise, object);
      return promise;
    }
    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;

    function lib$es6$promise$$internal$$noop() {}

    var lib$es6$promise$$internal$$PENDING   = void 0;
    var lib$es6$promise$$internal$$FULFILLED = 1;
    var lib$es6$promise$$internal$$REJECTED  = 2;

    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$selfFulfillment() {
      return new TypeError("You cannot resolve a promise with itself");
    }

    function lib$es6$promise$$internal$$cannotReturnOwn() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function lib$es6$promise$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
        return lib$es6$promise$$internal$$GET_THEN_ERROR;
      }
    }

    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
       lib$es6$promise$asap$$asap(function(promise) {
        var sealed = false;
        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            lib$es6$promise$$internal$$resolve(promise, value);
          } else {
            lib$es6$promise$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          lib$es6$promise$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          lib$es6$promise$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, thenable._result);
      } else {
        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      }
    }

    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable, then) {
      if (maybeThenable.constructor === promise.constructor &&
          then === lib$es6$promise$then$$default &&
          constructor.resolve === lib$es6$promise$promise$resolve$$default) {
        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        } else if (lib$es6$promise$utils$$isFunction(then)) {
          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function lib$es6$promise$$internal$$resolve(promise, value) {
      if (promise === value) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFulfillment());
      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
        lib$es6$promise$$internal$$handleMaybeThenable(promise, value, lib$es6$promise$$internal$$getThen(value));
      } else {
        lib$es6$promise$$internal$$fulfill(promise, value);
      }
    }

    function lib$es6$promise$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      lib$es6$promise$$internal$$publish(promise);
    }

    function lib$es6$promise$$internal$$fulfill(promise, value) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = lib$es6$promise$$internal$$FULFILLED;

      if (promise._subscribers.length !== 0) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, promise);
      }
    }

    function lib$es6$promise$$internal$$reject(promise, reason) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
      promise._state = lib$es6$promise$$internal$$REJECTED;
      promise._result = reason;

      lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection, promise);
    }

    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, parent);
      }
    }

    function lib$es6$promise$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function lib$es6$promise$$internal$$ErrorObject() {
      this.error = null;
    }

    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
      }
    }

    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = lib$es6$promise$$internal$$tryCatch(callback, detail);

        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        lib$es6$promise$$internal$$resolve(promise, value);
      } else if (failed) {
        lib$es6$promise$$internal$$reject(promise, error);
      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, value);
      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, value);
      }
    }

    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      } catch(e) {
        lib$es6$promise$$internal$$reject(promise, e);
      }
    }

    function lib$es6$promise$promise$all$$all(entries) {
      return new lib$es6$promise$enumerator$$default(this, entries).promise;
    }
    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
    function lib$es6$promise$promise$race$$race(entries) {
      /*jshint validthis:true */
      var Constructor = this;

      var promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (!lib$es6$promise$utils$$isArray(entries)) {
        lib$es6$promise$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
        return promise;
      }

      var length = entries.length;

      function onFulfillment(value) {
        lib$es6$promise$$internal$$resolve(promise, value);
      }

      function onRejection(reason) {
        lib$es6$promise$$internal$$reject(promise, reason);
      }

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        lib$es6$promise$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
      }

      return promise;
    }
    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
    function lib$es6$promise$promise$reject$$reject(reason) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$reject(promise, reason);
      return promise;
    }
    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;

    var lib$es6$promise$promise$$counter = 0;

    function lib$es6$promise$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function lib$es6$promise$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise's eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {function} resolver
      Useful for tooling.
      @constructor
    */
    function lib$es6$promise$promise$$Promise(resolver) {
      this._id = lib$es6$promise$promise$$counter++;
      this._state = undefined;
      this._result = undefined;
      this._subscribers = [];

      if (lib$es6$promise$$internal$$noop !== resolver) {
        typeof resolver !== 'function' && lib$es6$promise$promise$$needsResolver();
        this instanceof lib$es6$promise$promise$$Promise ? lib$es6$promise$$internal$$initializePromise(this, resolver) : lib$es6$promise$promise$$needsNew();
      }
    }

    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;
    lib$es6$promise$promise$$Promise._setScheduler = lib$es6$promise$asap$$setScheduler;
    lib$es6$promise$promise$$Promise._setAsap = lib$es6$promise$asap$$setAsap;
    lib$es6$promise$promise$$Promise._asap = lib$es6$promise$asap$$asap;

    lib$es6$promise$promise$$Promise.prototype = {
      constructor: lib$es6$promise$promise$$Promise,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
      then: lib$es6$promise$then$$default,

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };
    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;
    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
      this._instanceConstructor = Constructor;
      this.promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (Array.isArray(input)) {
        this._input     = input;
        this.length     = input.length;
        this._remaining = input.length;

        this._result = new Array(this.length);

        if (this.length === 0) {
          lib$es6$promise$$internal$$fulfill(this.promise, this._result);
        } else {
          this.length = this.length || 0;
          this._enumerate();
          if (this._remaining === 0) {
            lib$es6$promise$$internal$$fulfill(this.promise, this._result);
          }
        }
      } else {
        lib$es6$promise$$internal$$reject(this.promise, this._validationError());
      }
    }

    lib$es6$promise$enumerator$$Enumerator.prototype._validationError = function() {
      return new Error('Array Methods must be provided an Array');
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
      var length  = this.length;
      var input   = this._input;

      for (var i = 0; this._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        this._eachEntry(input[i], i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var c = this._instanceConstructor;
      var resolve = c.resolve;

      if (resolve === lib$es6$promise$promise$resolve$$default) {
        var then = lib$es6$promise$$internal$$getThen(entry);

        if (then === lib$es6$promise$then$$default &&
            entry._state !== lib$es6$promise$$internal$$PENDING) {
          this._settledAt(entry._state, i, entry._result);
        } else if (typeof then !== 'function') {
          this._remaining--;
          this._result[i] = entry;
        } else if (c === lib$es6$promise$promise$$default) {
          var promise = new c(lib$es6$promise$$internal$$noop);
          lib$es6$promise$$internal$$handleMaybeThenable(promise, entry, then);
          this._willSettleAt(promise, i);
        } else {
          this._willSettleAt(new c(function(resolve) { resolve(entry); }), i);
        }
      } else {
        this._willSettleAt(resolve(entry), i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var promise = this.promise;

      if (promise._state === lib$es6$promise$$internal$$PENDING) {
        this._remaining--;

        if (state === lib$es6$promise$$internal$$REJECTED) {
          lib$es6$promise$$internal$$reject(promise, value);
        } else {
          this._result[i] = value;
        }
      }

      if (this._remaining === 0) {
        lib$es6$promise$$internal$$fulfill(promise, this._result);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
      });
    };
    function lib$es6$promise$polyfill$$polyfill() {
      var local;

      if (typeof global !== 'undefined') {
          local = global;
      } else if (typeof self !== 'undefined') {
          local = self;
      } else {
          try {
              local = Function('return this')();
          } catch (e) {
              throw new Error('polyfill failed because global object is unavailable in this environment');
          }
      }

      var P = local.Promise;

      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
        return;
      }

      local.Promise = lib$es6$promise$promise$$default;
    }
    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

    var lib$es6$promise$umd$$ES6Promise = {
      'Promise': lib$es6$promise$promise$$default,
      'polyfill': lib$es6$promise$polyfill$$default
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return lib$es6$promise$umd$$ES6Promise; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = lib$es6$promise$umd$$ES6Promise;
    } else if (typeof this !== 'undefined') {
      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
    }

    lib$es6$promise$polyfill$$default();
}).call(this);


}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":76}],10:[function(require,module,exports){
var Parser = require('./lib/parser')
  , Resource = require('./lib/resource')
  , validationFlag = false;

module.exports = {

  parse: function(unparsed) {
    return new Parser().parse(unparsed, validationFlag);
  },

  enableValidation: function(flag) {
    validationFlag = (flag != null) ? flag : true;
  },

  disableValidation: function() {
    validationFlag = false;
  },

  Resource: Resource

};

},{"./lib/parser":12,"./lib/resource":13}],11:[function(require,module,exports){
'use strict';

/*
 * A very naive copy-on-write immutable stack. Since the size of the stack
 * is equal to the depth of the embedded resources for one HAL resource, the bad
 * performance for the copy-on-write approach is probably not a problem at all.
 * Might be replaced by a smarter solution later. Or not. Whatever.
 */
function ImmutableStack() {
  if (arguments.length >= 1) {
    this._array = arguments[0];
  } else {
    this._array = [];
  }
}

ImmutableStack.prototype.array = function() {
  return this._array;
};

ImmutableStack.prototype.isEmpty = function(array) {
  return this._array.length === 0;
};

ImmutableStack.prototype.push = function(element) {
  var array = this._array.slice(0);
  array.push(element);
  return new ImmutableStack(array);
};

ImmutableStack.prototype.pop = function() {
  var array = this._array.slice(0, this._array.length - 1);
  return new ImmutableStack(array);
};

ImmutableStack.prototype.peek = function() {
  if (this.isEmpty()) {
    throw new Error('can\'t peek on empty stack');
  }
  return this._array[this._array.length - 1];
};

module.exports = ImmutableStack;

},{}],12:[function(require,module,exports){
'use strict';

var Resource = require('./resource')
  , Stack = require('./immutable_stack');

var linkSpec = {
  href: { required: true, defaultValue: null },
  templated: { required: false, defaultValue: false },
  type: { required: false, defaultValue: null },
  deprecation: { required: false, defaultValue: null },
  name: { required: false, defaultValue: null },
  profile: { required: false, defaultValue: null },
  title: { required: false, defaultValue: null },
  hreflang: { required: false, defaultValue: null }
};

function Parser() {
}

Parser.prototype.parse = function parse(unparsed, validationFlag) {
  var validation = validationFlag ? [] : null;
  return _parse(unparsed, validation, new Stack());
};

function _parse(unparsed, validation, path) {
  if (unparsed == null) {
    return unparsed;
  }
  var allLinkArrays = parseLinks(unparsed._links, validation,
      path.push('_links'));
  var curies = parseCuries(allLinkArrays);
  var allEmbeddedArrays = parseEmbeddedResourcess(unparsed._embedded,
      validation, path.push('_embedded'));
  var resource = new Resource(allLinkArrays, curies, allEmbeddedArrays,
      validation);
  copyNonHalProperties(unparsed, resource);
  resource._original = unparsed;
  return resource;
}

function parseLinks(links, validation, path) {
  links = parseHalProperty(links, parseLink, validation, path);
  if (links == null || links.self == null) {
    // No links at all? Then it implictly misses the self link which it SHOULD
    // have according to spec
    reportValidationIssue('Resource does not have a self link', validation,
        path);
  }
  return links;
}

function parseCuries(linkArrays) {
  if (linkArrays) {
    return linkArrays.curies;
  } else {
    return [];
  }
}

function parseEmbeddedResourcess(original, parentValidation, path) {
  var embedded = parseHalProperty(original, identity, parentValidation, path);
  if (embedded == null) {
    return embedded;
  }
  Object.keys(embedded).forEach(function(key) {
    embedded[key] = embedded[key].map(function(embeddedElement) {
      var childValidation = parentValidation != null ? [] : null;
      var embeddedResource = _parse(embeddedElement, childValidation,
          path.push(key));
      embeddedResource._original = embeddedElement;
      return embeddedResource;
    });
  });
  return embedded;
}

/*
 * Copy over non-hal properties (everything that is not _links or _embedded)
 * to the parsed resource.
 */
function copyNonHalProperties(unparsed, resource) {
  Object.keys(unparsed).forEach(function(key) {
    if (key !== '_links' && key !== '_embedded') {
      resource[key] = unparsed[key];
    }
  });
}

/*
 * Processes one of the two main hal properties, that is _links or _embedded.
 * Each sub-property is turned into a single element array if it isn't already
 * an array. processingFunction is applied to each array element.
 */
function parseHalProperty(property, processingFunction, validation, path) {
  if (property == null) {
    return property;
  }

  // create a shallow copy of the _links/_embedded object
  var copy = {};

  // normalize each link/each embedded object and put it into our copy
  Object.keys(property).forEach(function(key) {
    copy[key] = arrayfy(key, property[key], processingFunction,
        validation, path);
  });
  return copy;
}

function arrayfy(key, object, fn, validation, path) {
  if (isArray(object)) {
    return object.map(function(element) {
      return fn(key, element, validation, path);
    });
  } else {
    return [fn(key, object, validation, path)];
  }
}


function parseLink(linkKey, link, validation, path) {
  if (!isObject(link)) {
    throw new Error('Link object is not an actual object: ' + link +
      ' [' + typeof link + ']');
  }

  // create a shallow copy of the link object
  var copy = shallowCopy(link);

  // add missing properties mandated by spec and do generic validation
  Object.keys(linkSpec).forEach(function(key) {
    if (copy[key] == null) {
      if (linkSpec[key].required) {
        reportValidationIssue('Link misses required property ' + key + '.',
            validation, path.push(linkKey));
      }
      if (linkSpec[key].defaultValue != null) {
        copy[key] = linkSpec[key].defaultValue;
      }
    }
  });

  // check more inter-property relations mandated by spec
  if (copy.deprecation) {
    log('Warning: Link ' + pathToString(path.push(linkKey)) +
        ' is deprecated, see ' + copy.deprecation);
  }
  if (copy.templated !== true && copy.templated !== false) {
    copy.templated = false;
  }

  if (!validation) {
    return copy;
  }
  if (copy.href && copy.href.indexOf('{') >= 0 && !copy.templated) {
    reportValidationIssue('Link seems to be an URI template ' +
        'but its "templated" property is not set to true.', validation,
        path.push(linkKey));
  }
  return copy;
}

function isArray(o) {
  return Object.prototype.toString.call(o) === '[object Array]';
}

function isObject(o) {
  return typeof o === 'object';
}

function identity(key, object) {
  return object;
}

function reportValidationIssue(message, validation, path) {
  if (validation) {
    validation.push({
      path: pathToString(path),
      message: message
    });
  }
}

// TODO fix this ad hoc mess - does ie support console.log as of ie9?
function log(message) {
  if (typeof console !== 'undefined' && typeof console.log === 'function') {
    console.log(message);
  }
}

function shallowCopy(source) {
  var copy = {};
  Object.keys(source).forEach(function(key) {
    copy[key] = source[key];
  });
  return copy;
}

function pathToString(path) {
  var s = '$.';
  for (var i = 0; i < path.array().length; i++) {
    s += path.array()[i] + '.';
  }
  s = s.substring(0, s.length - 1);
  return s;
}

module.exports = Parser;

},{"./immutable_stack":11,"./resource":13}],13:[function(require,module,exports){
'use strict';

function Resource(links, curies, embedded, validationIssues) {
  var self = this;
  this._links = links || {};
  this._initCuries(curies);
  this._embedded = embedded || {};
  this._validation = validationIssues || [];
}

Resource.prototype._initCuries = function(curies) {
  this._curiesMap = {};
  if (!curies) {
    this._curies = [];
  } else {
    this._curies = curies;
    for (var i = 0; i < this._curies.length; i++) {
      var curie = this._curies[i];
      this._curiesMap[curie.name] = curie;
    }
  }
  this._preResolveCuries();
};

Resource.prototype._preResolveCuries = function() {
  this._resolvedCuriesMap = {};
  for (var i = 0; i < this._curies.length; i++) {
    var curie = this._curies[i];
    if (!curie.name) {
      continue;
    }
    for (var rel in this._links) {
      if (rel !== 'curies') {
        this._preResolveCurie(curie, rel);
      }
    }
  }
};

Resource.prototype._preResolveCurie = function(curie, rel) {
  var link = this._links[rel];
  var prefixAndReference = rel.split(/:(.+)/);
  var candidate = prefixAndReference[0];
  if (curie.name === candidate) {
    if (curie.templated && prefixAndReference.length >= 1) {
      // TODO resolving templated CURIES should use a small uri template
      // lib, not coded here ad hoc
      var href = curie.href.replace(/(.*){(.*)}(.*)/, '$1' +
          prefixAndReference[1] + '$3');
      this._resolvedCuriesMap[href] = rel;
    } else {
      this._resolvedCuriesMap[curie.href] = rel;
    }
  }
};

Resource.prototype.allLinkArrays = function() {
  return this._links;
};

Resource.prototype.linkArray = function(key) {
  return propertyArray(this._links, key);
};

Resource.prototype.link = function(key, index) {
  return elementOfPropertyArray(this._links, key, index);
};

Resource.prototype.hasCuries = function(key) {
  return this._curies.length > 0;
};

Resource.prototype.curieArray = function(key) {
  return this._curies;
};

Resource.prototype.curie = function(name) {
  return this._curiesMap[name];
};

Resource.prototype.reverseResolveCurie = function(fullUrl) {
  return this._resolvedCuriesMap[fullUrl];
};

Resource.prototype.allEmbeddedResourceArrays = function () {
  return this._embedded;
};

Resource.prototype.embeddedResourceArray = function(key) {
  return propertyArray(this._embedded, key);
};

Resource.prototype.embeddedResource = function(key, index) {
  return elementOfPropertyArray(this._embedded, key, index);
};

Resource.prototype.original = function() {
  return this._original;
};

function propertyArray(object, key) {
  return object != null ? object[key] : null;
}

function elementOfPropertyArray(object, key, index) {
  index = index || 0;
  var array = propertyArray(object, key);
  if (array != null && array.length >= 1) {
    return array[index];
  }
  return null;
}

Resource.prototype.validationIssues = function() {
  return this._validation;
};

// alias definitions
Resource.prototype.allLinks = Resource.prototype.allLinkArrays;
Resource.prototype.allEmbeddedArrays =
    Resource.prototype.allEmbeddedResources =
    Resource.prototype.allEmbeddedResourceArrays;
Resource.prototype.embeddedArray = Resource.prototype.embeddedResourceArray;
Resource.prototype.embedded = Resource.prototype.embeddedResource;
Resource.prototype.validation = Resource.prototype.validationIssues;

module.exports = Resource;

},{}],14:[function(require,module,exports){
/* eslint-env browser */
'use strict';
var eachAsync = require('each-async');
var onetime = require('onetime');
var arrify = require('arrify');

module.exports = function (hosts, cb) {
	cb = onetime(cb);

	eachAsync(arrify(hosts), function (host, i, next) {
		var img = new Image();

		img.onload = function () {
			cb(true);

			// skip to end
			next(new Error());
		};

		img.onerror = function () {
			next();
		};

		img.src = '//' + host + '/favicon.ico?' + Date.now();
	}, function () {
		cb(false);
	});
};

},{"arrify":15,"each-async":16,"onetime":18}],15:[function(require,module,exports){
'use strict';
module.exports = function (val) {
	if (val === null || val === undefined) {
		return [];
	}

	return Array.isArray(val) ? val : [val];
};

},{}],16:[function(require,module,exports){
'use strict';
var onetime = require('onetime');
var setImmediateShim = require('set-immediate-shim');

module.exports = function (arr, next, cb) {
	var failed = false;
	var count = 0;

	cb = cb || function () {};

	if (!Array.isArray(arr)) {
		throw new TypeError('First argument must be an array');
	}

	if (typeof next !== 'function') {
		throw new TypeError('Second argument must be a function');
	}

	var len = arr.length;

	if (!len) {
		cb();
		return;
	}

	function callback(err) {
		if (failed) {
			return;
		}

		if (err !== undefined && err !== null) {
			failed = true;
			cb(err);
			return;
		}

		if (++count === len) {
			cb();
			return;
		}
	}

	for (var i = 0; i < len; i++) {
		setImmediateShim(next, arr[i], i, onetime(callback, true));
	}
};

},{"onetime":18,"set-immediate-shim":17}],17:[function(require,module,exports){
'use strict';
module.exports = typeof setImmediate === 'function' ? setImmediate :
	function setImmediate() {
		var args = [].slice.apply(arguments);
		args.splice(1, 0, 0);
		setTimeout.apply(null, args);
	};

},{}],18:[function(require,module,exports){
'use strict';
module.exports = function (fn, errMsg) {
	if (typeof fn !== 'function') {
		throw new TypeError('Expected a function');
	}

	var ret;
	var called = false;
	var fnName = fn.displayName || fn.name || (/function ([^\(]+)/.exec(fn.toString()) || [])[1];

	var onetime = function () {
		if (called) {
			if (errMsg === true) {
				fnName = fnName ? fnName + '()' : 'Function';
				throw new Error(fnName + ' can only be called once.');
			}

			return ret;
		}

		called = true;
		ret = fn.apply(this, arguments);
		fn = null;

		return ret;
	};

	onetime.displayName = fnName;

	return onetime;
};

},{}],19:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.6.3
(function() {
  var Locale, Locales, app, _ref,
    __slice = [].slice;

  app = function(supported) {
    if (!(supported instanceof Locales)) {
      supported = new Locales(supported);
      supported.index();
    }
    return function(req, res, next) {
      var bestLocale, locales;
      locales = new Locales(req.headers["accept-language"]);
      bestLocale = locales.best(supported);
      req.locale = String(bestLocale);
      req.rawLocale = bestLocale;
      return next();
    };
  };

  app.Locale = (function() {
    var serialize;

    Locale["default"] = new Locale(process.env.LANG || "en_US");

    function Locale(str) {
      var country, language, match, normalized;
      if (!(match = str != null ? str.match(/[a-z]+/gi) : void 0)) {
        return;
      }
      language = match[0], country = match[1];
      this.code = str;
      this.language = language.toLowerCase();
      if (country) {
        this.country = country.toUpperCase();
      }
      normalized = [this.language];
      if (this.country) {
        normalized.push(this.country);
      }
      this.normalized = normalized.join("_");
    }

    serialize = function() {
      if (this.language) {
        return this.code;
      } else {
        return null;
      }
    };

    Locale.prototype.toString = serialize;

    Locale.prototype.toJSON = serialize;

    return Locale;

  })();

  app.Locales = (function() {
    var serialize;

    Locales.prototype.length = 0;

    Locales.prototype._index = null;

    Locales.prototype.sort = Array.prototype.sort;

    Locales.prototype.push = Array.prototype.push;

    function Locales(str) {
      var item, locale, q, _i, _len, _ref, _ref1;
      if (!str) {
        return;
      }
      _ref = (String(str)).split(",");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        _ref1 = item.split(";"), locale = _ref1[0], q = _ref1[1];
        locale = new Locale(locale.trim());
        locale.score = q ? +q.slice(2) || 0 : 1;
        this.push(locale);
      }
      this.sort(function(a, b) {
        return b.score - a.score;
      });
    }

    Locales.prototype.index = function() {
      var idx, locale, _i, _len;
      if (!this._index) {
        this._index = {};
        for (idx = _i = 0, _len = this.length; _i < _len; idx = ++_i) {
          locale = this[idx];
          this._index[locale.normalized] = idx;
        }
      }
      return this._index;
    };

    Locales.prototype.best = function(locales) {
      var index, item, l, languageIndex, locale, normalizedIndex, setLocale, _i, _j, _len, _len1;
      setLocale = function(l) {
        var r;
        r = l;
        r.defaulted = false;
        return r;
      };
      locale = Locale["default"];
      locale.defaulted = true;
      if (!locales) {
        if (this[0]) {
          locale = this[0];
          locale.defaulted = true;
        }
        return locale;
      }
      index = locales.index();
      for (_i = 0, _len = this.length; _i < _len; _i++) {
        item = this[_i];
        normalizedIndex = index[item.normalized];
        languageIndex = index[item.language];
        if (normalizedIndex != null) {
          return setLocale(locales[normalizedIndex]);
        } else if (languageIndex != null) {
          return setLocale(locales[languageIndex]);
        } else {
          for (_j = 0, _len1 = locales.length; _j < _len1; _j++) {
            l = locales[_j];
            if (l.language === item.language) {
              return setLocale(l);
            }
          }
        }
      }
      return locale;
    };

    serialize = function() {
      return __slice.call(this);
    };

    Locales.prototype.toJSON = serialize;

    Locales.prototype.toString = function() {
      return String(this.toJSON());
    };

    return Locales;

  })();

  _ref = module.exports = app, Locale = _ref.Locale, Locales = _ref.Locales;

}).call(this);

}).call(this,require('_process'))
},{"_process":76}],20:[function(require,module,exports){
/*
  Loki IndexedDb Adapter (need to include this script to use it)

  Indexeddb is highly async, but this adapter has been made 'console-friendly' as well.
  Anywhere a callback is omitted, it should return results (if applicable) to console.

  IndexedDb storage is provided per-domain, so we implement app/key/value database to allow separate contexts
  for separate apps within a domain.

  Examples :

  // SAVE : will save App/Key/Val as 'finance'/'test'/{serializedDb}
  // if appContect ('finance' in this example) is omitted, 'loki' will be used
  var idbAdapter = new LokiIndexedAdapter('finance');
  var db = new loki('test', { adapter: idbAdapter });
  var coll = db.addCollection('testColl');
  coll.insert({test: 'val'});
  db.saveDatabase();  // could pass callback if needed for async complete

  // LOAD
  var db = new loki('test', { adapter: idbAdapter });
  db.loadDatabase(function(result) {
    console.log('done');
  });

  // GET DATABASE LIST
  idbAdapter.getDatabaseList(function(result) {
    // result is array of string names for that appcontext ('finance')
    result.forEach(function(str) {
      console.log(str);
    });
  });

  // DELETE DATABASE
  idbAdapter.deleteDatabase('test'); // delete 'finance'/'test' value from catalog

  // CONSOLE USAGE : if using from console for management/diagnostic, here are a few examples :
  adapter.getDatabaseList(); // with no callback passed, this method will log results to console
  adapter.saveDatabase('UserDatabase', JSON.stringify(myDb));
  adapter.loadDatabase('UserDatabase'); // will log the serialized db to console
  adapter.deleteDatabase('UserDatabase');
*/

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.LokiIndexedAdapter = factory();
    }
}(this, function () {
  return (function() {

    /**
     * IndexedAdapter - Loki persistence adapter class for indexedDb.
     *     This class fulfills abstract adapter interface which can be applied to other storage methods
     *     Utilizes the included LokiCatalog app/key/value database for actual database persistence.
     *
     * @param {string} appname - Application name context can be used to distinguish subdomains or just 'loki'
     */
    function IndexedAdapter(appname)
    {
      this.app = 'loki';

      if (typeof (appname) !== 'undefined')
      {
        this.app = appname;
      }

      // keep reference to catalog class for base AKV operations
      this.catalog = null;

      if (!this.checkAvailability()) {
        throw new Error('indexedDB does not seem to be supported for your environment');
      }
    }

    /**
     * checkAvailability - used to check if adapter is available
     *
     * @returns {boolean} true if indexeddb is available, false if not.
     */
    IndexedAdapter.prototype.checkAvailability = function()
    {
      if (typeof window !== 'undefined' && window.indexedDB) return true;

      return false;
    };

    /**
     * loadDatabase() - Retrieves a serialized db string from the catalog.
     *
     * @param {string} dbname - the name of the database to retrieve.
     * @param {function} callback - callback should accept string param containing serialized db string.
     */
    IndexedAdapter.prototype.loadDatabase = function(dbname, callback)
    {
      var appName = this.app;
      var adapter = this;

      // lazy open/create db reference so dont -need- callback in constructor
      if (this.catalog === null || this.catalog.db === null) {
        this.catalog = new LokiCatalog(function(cat) {
          adapter.catalog = cat;

          adapter.loadDatabase(dbname, callback);
        });

        return;
      }

      // lookup up db string in AKV db
      this.catalog.getAppKey(appName, dbname, function(result) {
        if (typeof (callback) === 'function') {
          if (result.id === 0) {
            callback(null);
            return;
          }
          callback(result.val);
        }
        else {
          // support console use of api
          console.log(result.val);
        }
      });
    };

    // alias
    IndexedAdapter.prototype.loadKey = IndexedAdapter.prototype.loadDatabase;

    /**
     * saveDatabase() - Saves a serialized db to the catalog.
     *
     * @param {string} dbname - the name to give the serialized database within the catalog.
     * @param {string} dbstring - the serialized db string to save.
     * @param {function} callback - (Optional) callback passed obj.success with true or false
     */
    IndexedAdapter.prototype.saveDatabase = function(dbname, dbstring, callback)
    {
      var appName = this.app;
      var adapter = this;

      function saveCallback(result) {
        if (result && result.success === true) {
          callback(null);
        }
        else {
          callback(new Error("Error saving database"));
        }
      }

      // lazy open/create db reference so dont -need- callback in constructor
      if (this.catalog === null || this.catalog.db === null) {
        this.catalog = new LokiCatalog(function(cat) {
          adapter.catalog = cat;

          // now that catalog has been initialized, set (add/update) the AKV entry
          cat.setAppKey(appName, dbname, dbstring, saveCallback);
        });

        return;
      }

      // set (add/update) entry to AKV database
      this.catalog.setAppKey(appName, dbname, dbstring, saveCallback);
    };

    // alias
    IndexedAdapter.prototype.saveKey = IndexedAdapter.prototype.saveDatabase;

    /**
     * deleteDatabase() - Deletes a serialized db from the catalog.
     *
     * @param {string} dbname - the name of the database to delete from the catalog.
     */
    IndexedAdapter.prototype.deleteDatabase = function(dbname)
    {
      var appName = this.app;
      var adapter = this;

      // lazy open/create db reference so dont -need- callback in constructor
      if (this.catalog === null || this.catalog.db === null) {
        this.catalog = new LokiCatalog(function(cat) {
          adapter.catalog = cat;

          adapter.deleteDatabase(dbname);
        });

        return;
      }

      // catalog was already initialized, so just lookup object and delete by id
      this.catalog.getAppKey(appName, dbname, function(result) {
        var id = result.id;

        if (id !== 0) {
          adapter.catalog.deleteAppKey(id);
        }
      });
    };

    // alias
    IndexedAdapter.prototype.deleteKey = IndexedAdapter.prototype.deleteDatabase;

    /**
     * getDatabaseList() - Retrieves object array of catalog entries for current app.
     *
     * @param {function} callback - should accept array of database names in the catalog for current app.
     */
    IndexedAdapter.prototype.getDatabaseList = function(callback)
    {
      var appName = this.app;
      var adapter = this;

      // lazy open/create db reference so dont -need- callback in constructor
      if (this.catalog === null || this.catalog.db === null) {
        this.catalog = new LokiCatalog(function(cat) {
          adapter.catalog = cat;

          adapter.getDatabaseList(callback);
        });

        return;
      }

      // catalog already initialized
      // get all keys for current appName, and transpose results so just string array
      this.catalog.getAppKeys(appName, function(results) {
        var names = [];

        for(var idx = 0; idx < results.length; idx++) {
          names.push(results[idx].key);
        }

        if (typeof (callback) === 'function') {
          callback(names);
        }
        else {
          names.forEach(function(obj) {
            console.log(obj);
          });
        }
      });
    };

    // alias
    IndexedAdapter.prototype.getKeyList = IndexedAdapter.prototype.getDatabaseList;

    /**
     * getCatalogSummary - allows retrieval of list of all keys in catalog along with size
     *
     * @param {function} callback - (Optional) callback to accept result array.
     */
    IndexedAdapter.prototype.getCatalogSummary = function(callback)
    {
      var appName = this.app;
      var adapter = this;

      // lazy open/create db reference
      if (this.catalog === null || this.catalog.db === null) {
        this.catalog = new LokiCatalog(function(cat) {
          adapter.catalog = cat;

          adapter.getCatalogSummary(callback);
        });

        return;
      }

      // catalog already initialized
      // get all keys for current appName, and transpose results so just string array
      this.catalog.getAllKeys(function(results) {
        var entries = [];
        var obj,
          size,
          oapp,
          okey,
          oval;

        for(var idx = 0; idx < results.length; idx++) {
          obj = results[idx];
          oapp = obj.app || '';
          okey = obj.key || '';
          oval = obj.val || '';

          // app and key are composited into an appkey column so we will mult by 2
          size = oapp.length * 2 + okey.length * 2 + oval.length + 1;

          entries.push({ "app": obj.app, "key": obj.key, "size": size });
        }

        if (typeof (callback) === 'function') {
          callback(entries);
        }
        else {
          entries.forEach(function(obj) {
            console.log(obj);
          });
        }
      });
    };

    /**
     * LokiCatalog - underlying App/Key/Value catalog persistence
     *    This non-interface class implements the actual persistence.
     *    Used by the IndexedAdapter class.
     */
    function LokiCatalog(callback)
    {
      this.db = null;
      this.initializeLokiCatalog(callback);
    }

    LokiCatalog.prototype.initializeLokiCatalog = function(callback) {
      var openRequest = indexedDB.open('LokiCatalog', 1);
      var cat = this;

      // If database doesn't exist yet or its version is lower than our version specified above (2nd param in line above)
      openRequest.onupgradeneeded = function(e) {
        var thisDB = e.target.result;
        if (thisDB.objectStoreNames.contains('LokiAKV')) {
          thisDB.deleteObjectStore('LokiAKV');
        }

        if(!thisDB.objectStoreNames.contains('LokiAKV')) {
          var objectStore = thisDB.createObjectStore('LokiAKV', { keyPath: 'id', autoIncrement:true });
          objectStore.createIndex('app', 'app', {unique:false});
          objectStore.createIndex('key', 'key', {unique:false});
          // hack to simulate composite key since overhead is low (main size should be in val field)
          // user (me) required to duplicate the app and key into comma delimited appkey field off object
          // This will allow retrieving single record with that composite key as well as
          // still supporting opening cursors on app or key alone
          objectStore.createIndex('appkey', 'appkey', {unique:true});
        }
      };

      openRequest.onsuccess = function(e) {
        cat.db = e.target.result;

        if (typeof (callback) === 'function') callback(cat);
      };

      openRequest.onerror = function(e) {
        throw e;
      };
    };

    LokiCatalog.prototype.getAppKey = function(app, key, callback) {
      var transaction = this.db.transaction(['LokiAKV'], 'readonly');
      var store = transaction.objectStore('LokiAKV');
      var index = store.index('appkey');
      var appkey = app + "," + key;
      var request = index.get(appkey);

      request.onsuccess = (function(usercallback) {
        return function(e) {
          var lres = e.target.result;

          if (lres === null || typeof(lres) === 'undefined') {
            lres = {
              id: 0,
              success: false
            };
          }

          if (typeof(usercallback) === 'function') {
            usercallback(lres);
          }
          else {
            console.log(lres);
          }
        };
      })(callback);

      request.onerror = (function(usercallback) {
        return function(e) {
          if (typeof(usercallback) === 'function') {
            usercallback({ id: 0, success: false });
          }
          else {
            throw e;
          }
        };
      })(callback);
    };

    LokiCatalog.prototype.getAppKeyById = function (id, callback, data) {
      var transaction = this.db.transaction(['LokiAKV'], 'readonly');
      var store = transaction.objectStore('LokiAKV');
      var request = store.get(id);

      request.onsuccess = (function(data, usercallback){
        return function(e) {
          if (typeof(usercallback) === 'function') {
            usercallback(e.target.result, data);
          }
          else {
            console.log(e.target.result);
          }
        };
      })(data, callback);
    };

    LokiCatalog.prototype.setAppKey = function (app, key, val, callback) {
      var transaction = this.db.transaction(['LokiAKV'], 'readwrite');
      var store = transaction.objectStore('LokiAKV');
      var index = store.index('appkey');
      var appkey = app + "," + key;
      var request = index.get(appkey);

      // first try to retrieve an existing object by that key
      // need to do this because to update an object you need to have id in object, otherwise it will append id with new autocounter and clash the unique index appkey
      request.onsuccess = function(e) {
        var res = e.target.result;

        if (res === null || res === undefined) {
          res = {
            app:app,
            key:key,
            appkey: app + ',' + key,
            val:val
          };
        }
        else {
          res.val = val;
        }

        var requestPut = store.put(res);

        requestPut.onerror = (function(usercallback) {
          return function(e) {
            if (typeof(usercallback) === 'function') {
              usercallback({ success: false });
            }
            else {
              console.error('LokiCatalog.setAppKey (set) onerror');
              console.error(request.error);
            }
          };

        })(callback);

        requestPut.onsuccess = (function(usercallback) {
          return function(e) {
            if (typeof(usercallback) === 'function') {
              usercallback({ success: true });
            }
          };
        })(callback);
      };

      request.onerror = (function(usercallback) {
        return function(e) {
          if (typeof(usercallback) === 'function') {
            usercallback({ success: false });
          }
          else {
            console.error('LokiCatalog.setAppKey (get) onerror');
            console.error(request.error);
          }
        };
      })(callback);
    };

    LokiCatalog.prototype.deleteAppKey = function (id, callback) {
      var transaction = this.db.transaction(['LokiAKV'], 'readwrite');
      var store = transaction.objectStore('LokiAKV');
      var request = store.delete(id);

      request.onsuccess = (function(usercallback) {
        return function(evt) {
          if (typeof(usercallback) === 'function') usercallback({ success: true });
        };
      })(callback);

      request.onerror = (function(usercallback) {
        return function(evt) {
          if (typeof(usercallback) === 'function') {
            usercallback(false);
          }
          else {
            console.error('LokiCatalog.deleteAppKey raised onerror');
            console.error(request.error);
          }
        };
      })(callback);
    };

    LokiCatalog.prototype.getAppKeys = function(app, callback) {
      var transaction = this.db.transaction(['LokiAKV'], 'readonly');
      var store = transaction.objectStore('LokiAKV');
      var index = store.index('app');

      // We want cursor to all values matching our (single) app param
      var singleKeyRange = IDBKeyRange.only(app);

      // To use one of the key ranges, pass it in as the first argument of openCursor()/openKeyCursor()
      var cursor = index.openCursor(singleKeyRange);

      // cursor internally, pushing results into this.data[] and return
      // this.data[] when done (similar to service)
      var localdata = [];

      cursor.onsuccess = (function(data, callback) {
        return function(e) {
          var cursor = e.target.result;
          if (cursor) {
            var currObject = cursor.value;

            data.push(currObject);

            cursor.continue();
          }
          else {
            if (typeof(callback) === 'function') {
              callback(data);
            }
            else {
              console.log(data);
            }
          }
        };
      })(localdata, callback);

      cursor.onerror = (function(usercallback) {
        return function(e) {
          if (typeof(usercallback) === 'function') {
            usercallback(null);
          }
          else {
            console.error('LokiCatalog.getAppKeys raised onerror');
            console.error(e);
          }
        };
      })(callback);

    };

    // Hide 'cursoring' and return array of { id: id, key: key }
    LokiCatalog.prototype.getAllKeys = function (callback) {
      var transaction = this.db.transaction(['LokiAKV'], 'readonly');
      var store = transaction.objectStore('LokiAKV');
      var cursor = store.openCursor();

      var localdata = [];

      cursor.onsuccess = (function(data, callback) {
        return function(e) {
          var cursor = e.target.result;
          if (cursor) {
            var currObject = cursor.value;

            data.push(currObject);

            cursor.continue();
          }
          else {
            if (typeof(callback) === 'function') {
              callback(data);
            }
            else {
              console.log(data);
            }
          }
        };
      })(localdata, callback);

      cursor.onerror = (function(usercallback) {
        return function(e) {
          if (typeof(usercallback) === 'function') usercallback(null);
        };
      })(callback);

    };

    return IndexedAdapter;

  }());
}));

},{}],21:[function(require,module,exports){
(function (global){
/**
 * LokiJS
 * @author Joe Minichino <joe.minichino@gmail.com>
 *
 * A lightweight document oriented javascript database
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = factory();
  } else {
    // Browser globals
    root.loki = factory();
  }
}(this, function () {

  return (function () {
    'use strict';

    var hasOwnProperty = Object.prototype.hasOwnProperty;

    var Utils = {
      copyProperties: function (src, dest) {
        var prop;
        for (prop in src) {
          dest[prop] = src[prop];
        }
      },
      // used to recursively scan hierarchical transform step object for param substitution
      resolveTransformObject: function (subObj, params, depth) {
        var prop,
          pname;

        if (typeof depth !== 'number') {
          depth = 0;
        }

        if (++depth >= 10) return subObj;

        for (prop in subObj) {
          if (typeof subObj[prop] === 'string' && subObj[prop].indexOf("[%lktxp]") === 0) {
            pname = subObj[prop].substring(8);
            if (params.hasOwnProperty(pname)) {
              subObj[prop] = params[pname];
            }
          } else if (typeof subObj[prop] === "object") {
            subObj[prop] = Utils.resolveTransformObject(subObj[prop], params, depth);
          }
        }

        return subObj;
      },
      // top level utility to resolve an entire (single) transform (array of steps) for parameter substitution
      resolveTransformParams: function (transform, params) {
        var idx,
          clonedStep,
          resolvedTransform = [];

        if (typeof params === 'undefined') return transform;

        // iterate all steps in the transform array
        for (idx = 0; idx < transform.length; idx++) {
          // clone transform so our scan and replace can operate directly on cloned transform
          clonedStep = JSON.parse(JSON.stringify(transform[idx]));
          resolvedTransform.push(Utils.resolveTransformObject(clonedStep, params));
        }

        return resolvedTransform;
      }
    };

    // Sort helper that support null and undefined
    function ltHelper(prop1, prop2, equal) {

      // 'falsy' and Boolean handling
      if (!prop1 || !prop2 || prop1 === true || prop2 === true) {
        if ((prop1 === true || prop1 === false) && (prop2 === true || prop2 === false)) {
          if (equal) {
            return prop1 === prop2;
          } else {
            if (prop1) {
              return false;
            } else {
              return prop2;
            }
          }
        }

        if (prop2 === undefined || prop2 === null || prop1 === true || prop2 === false) {
            return equal;
        }
        if (prop1 === undefined || prop1 === null || prop1 === false || prop2 === true) {
          return true;
        }

        if (prop1 < prop2) {
          return true;
        }

        if (prop1 > prop2) {
          return false;
        }

        // not lt and and not gt so equality assumed-- this ordering of tests is date compatible
        return equal;
      }

      if (prop1 < prop2) {
        return true;
      }

      if (prop1 > prop2) {
        return false;
      }

      // not lt and and not gt so equality assumed-- this ordering of tests is date compatible
      return equal;
    }

    function gtHelper(prop1, prop2, equal) {

      // 'falsy' and Boolean handling
      if (!prop1 || !prop2 || prop1 === true || prop2 === true) {
        if ((prop1 === true || prop1 === false) && (prop2 === true || prop2 === false)) {
          if (equal) {
            return prop1 === prop2;
          } else {
            if (prop1) {
              return !prop2;
            } else {
              return false;
            }
          }
        }

        if (prop1 === undefined || prop1 === null || prop1 === false || prop2 === true) {
          return equal;
        }
        if (prop2 === undefined || prop2 === null || prop1 === true || prop2 === false) {
          return true;
        }

        if (prop1 > prop2) {
          return true;
        }

        if (prop1 < prop2) {
          return false;
        }

        // not lt and and not gt so equality assumed-- this ordering of tests is date compatible
        return equal;
      }

      if (prop1 > prop2) {
        return true;
      }

      if (prop1 < prop2) {
        return false;
      }

      // not lt and and not gt so equality assumed-- this ordering of tests is date compatible
      return equal;
    }

    function sortHelper(prop1, prop2, desc) {
      if (prop1 === prop2) {
        return 0;
      }

      if (ltHelper(prop1, prop2, false)) {
        return (desc) ? (1) : (-1);
      }

      if (gtHelper(prop1, prop2, false)) {
        return (desc) ? (-1) : (1);
      }

      // not lt, not gt so implied equality-- date compatible
      return 0;
    }

    /**
     * compoundeval() - helper function for compoundsort(), performing individual object comparisons
     *
     * @param {array} properties - array of property names, in order, by which to evaluate sort order
     * @param {object} obj1 - first object to compare
     * @param {object} obj2 - second object to compare
     * @returns {integer} 0, -1, or 1 to designate if identical (sortwise) or which should be first
     */
    function compoundeval(properties, obj1, obj2) {
      var res = 0;
      var prop, field;
      for (var i = 0, len = properties.length; i < len; i++) {
        prop = properties[i];
        field = prop[0];
        res = sortHelper(obj1[field], obj2[field], prop[1]);
        if (res !== 0) {
          return res;
        }
      }
      return 0;
    }

    /**
     * dotSubScan - helper function used for dot notation queries.
     */
    function dotSubScan(root, propPath, fun, value) {
      var pathSegment = null;
      var subIndex = 0, subLen = 0, subPath = null;

      for (var segmIndex = 0, segmCount = propPath.length; segmIndex < segmCount; segmIndex++) {
        pathSegment = propPath[segmIndex];

        // if the dot notation is invalid for the current document, then ignore this document
        if (root === undefined || root === null || !hasOwnProperty.call(root, pathSegment)) {
          return false;
        }

        if (Array.isArray(root)) {
          subLen = root.length;
          // iterate all sub-array items to see if any yield hits
          if ((segmIndex + 1) < segmCount) {
            subPath = propPath.slice(segmIndex + 1);
            for (subIndex = 0; subIndex < subLen; subIndex++) {
              if (dotSubScan(root[subIndex], subPath, fun, value)) {
                return true;
              }
            }
          } else {
            for (subIndex = 0; subIndex < subLen; subIndex++) {
              if (fun(root[subIndex][pathSegment], value)) {
                return true;
              }
            }
          }
          return false;
        }

        root = root[pathSegment];
      }

      // made it this far so must be dot notation on non-array property
      return fun(root, value);
    }

    function containsCheckFn(a) {
      if (typeof a === 'string' || Array.isArray(a)) {
        return function (b) {
          return a.indexOf(b) !== -1;
        };
      } else if (typeof a === 'object') {
        return function (b) {
          return hasOwnProperty.call(a, b);
        };
      }
    }

    function doQueryOp(val, op) {
      for (var p in op) {
        if (hasOwnProperty.call(op, p)) {
          return LokiOps[p](val, op[p]);
        }
      }
      return false;
    }

    var LokiOps = {
      // comparison operators
      // a is the value in the collection
      // b is the query value
      $eq: function (a, b) {
        return a === b;
      },

      $ne: function (a, b) {
        return a !== b;
      },

      $dteq: function(a, b) {
        if (ltHelper(a, b, false)) {
          return false;
        }
        return !gtHelper(a, b, false);
      },

      $gt: function (a, b) {
        return gtHelper(a, b, false);
      },

      $gte: function (a, b) {
        return gtHelper(a, b, true);
      },

      $lt: function (a, b) {
        return ltHelper(a, b, false);
      },

      $lte: function (a, b) {
        return ltHelper(a, b, true);
      },

      $in: function (a, b) {
        return b.indexOf(a) !== -1;
      },

      $nin: function (a, b) {
        return b.indexOf(a) === -1;
      },

      $keyin: function (a, b) {
        return a in b;
      },

      $nkeyin: function (a, b) {
        return !(a in b);
      },

      $definedin: function (a, b) {
        return b[a] !== undefined;
      },

      $undefinedin: function (a, b) {
        return b[a] === undefined;
      },

      $regex: function (a, b) {
        return b.test(a);
      },

      $containsString: function (a, b) {
        return (typeof a === 'string') && (a.indexOf(b) !== -1);
      },

      $containsNone: function (a, b) {
        return !LokiOps.$containsAny(a, b);
      },

      $containsAny: function (a, b) {
        var checkFn;

        if (!Array.isArray(b)) {
          b = [b];
        }

        checkFn = containsCheckFn(a) || function () {
          return false;
        };

        return b.reduce(function (prev, curr) {
          if (prev) {
            return prev;
          }

          return checkFn(curr);
        }, false);
      },

      $contains: function (a, b) {
        var checkFn;

        if (!Array.isArray(b)) {
          b = [b];
        }

        // return false on check if no check fn is found
        checkFn = containsCheckFn(a) || function () {
          return false;
        };

        return b.reduce(function (prev, curr) {
          if (!prev) {
            return prev;
          }

          return checkFn(curr);
        }, true);
      },

      $type: function (a, b) {
        var type = typeof a;
        if (type === 'object') {
          if (Array.isArray(a)) {
            type = 'array';
          } else if (a instanceof Date) {
            type = 'date';
          }
        }
        return (typeof b !== 'object') ? (type === b) : doQueryOp(type, b);
      },

      $size: function (a, b) {
        if (Array.isArray(a)) {
          return (typeof b !== 'object') ? (a.length === b) : doQueryOp(a.length, b);
        }
        return false;
      },

      $len: function (a, b) {
        if (typeof a === 'string') {
          return (typeof b !== 'object') ? (a.length === b) : doQueryOp(a.length, b);
        }
        return false;
      },

      // field-level logical operators
      // a is the value in the collection
      // b is the nested query operation (for '$not')
      //   or an array of nested query operations (for '$and' and '$or')
      $not: function (a, b) {
        return !doQueryOp(a, b);
      },

      $and: function (a, b) {
        for (var idx = 0, len = b.length; idx < len; idx += 1) {
          if (!doQueryOp(a, b[idx])) {
            return false;
          }
        }
        return true;
      },

      $or: function (a, b) {
        for (var idx = 0, len = b.length; idx < len; idx += 1) {
          if (doQueryOp(a, b[idx])) {
            return true;
          }
        }
        return false;
      }
    };

    // making indexing opt-in... our range function knows how to deal with these ops :
    var indexedOpsList = ['$eq', '$dteq', '$gt', '$gte', '$lt', '$lte'];

    function clone(data, method) {
      var cloneMethod = method || 'parse-stringify',
        cloned;

      switch (cloneMethod) {
        case "parse-stringify":
          cloned = JSON.parse(JSON.stringify(data));
          break;
        case "jquery-extend-deep":
          cloned = jQuery.extend(true, {}, data);
          break;
        case "shallow":
          cloned = Object.create(data.prototype || null);
          Object.keys(data).map(function (i) {
            cloned[i] = data[i];
          });
          break;
        default:
          break;
      }

      //if (cloneMethod === 'parse-stringify') {
      //  cloned = JSON.parse(JSON.stringify(data));
      //}
      return cloned;
    }

    function cloneObjectArray(objarray, method) {
      var i,
        result = [];

      if (method == "parse-stringify") {
        return clone(objarray, method);
      }

      i = objarray.length-1;

      for(;i<=0;i--) {
        result.push(clone(objarray[i], method));
      }

      return result;
    }

    function localStorageAvailable() {
      try {
        return (window && window.localStorage !== undefined && window.localStorage !== null);
      } catch (e) {
        return false;
      }
    }


    /**
     * LokiEventEmitter is a minimalist version of EventEmitter. It enables any
     * constructor that inherits EventEmitter to emit events and trigger
     * listeners that have been added to the event through the on(event, callback) method
     *
     * @constructor
     */
    function LokiEventEmitter() {}

    /**
     * @prop Events property is a hashmap, with each property being an array of callbacks
     */
    LokiEventEmitter.prototype.events = {};

    /**
     * @prop asyncListeners - boolean determines whether or not the callbacks associated with each event
     * should happen in an async fashion or not
     * Default is false, which means events are synchronous
     */
    LokiEventEmitter.prototype.asyncListeners = false;

    /**
     * @prop on(eventName, listener) - adds a listener to the queue of callbacks associated to an event
     * @returns {int} the index of the callback in the array of listeners for a particular event
     */
    LokiEventEmitter.prototype.on = function (eventName, listener) {
      var event = this.events[eventName];
      if (!event) {
        event = this.events[eventName] = [];
      }
      event.push(listener);
      return listener;
    };

    /**
     * @propt emit(eventName, data) - emits a particular event
     * with the option of passing optional parameters which are going to be processed by the callback
     * provided signatures match (i.e. if passing emit(event, arg0, arg1) the listener should take two parameters)
     * @param {string} eventName - the name of the event
     * @param {object} data - optional object passed with the event
     */
    LokiEventEmitter.prototype.emit = function (eventName, data) {
      var self = this;
      if (eventName && this.events[eventName]) {
        this.events[eventName].forEach(function (listener) {
          if (self.asyncListeners) {
            setTimeout(function () {
              listener(data);
            }, 1);
          } else {
            listener(data);
          }

        });
      } else {
        throw new Error('No event ' + eventName + ' defined');
      }
    };

    /**
     * @prop remove() - removes the listener at position 'index' from the event 'eventName'
     */
    LokiEventEmitter.prototype.removeListener = function (eventName, listener) {
      if (this.events[eventName]) {
        var listeners = this.events[eventName];
        listeners.splice(listeners.indexOf(listener), 1);
      }
    };

    /**
     * Loki: The main database class
     * @constructor
     * @param {string} filename - name of the file to be saved to
     * @param {object} options - config object
     */
    function Loki(filename, options) {
      this.filename = filename || 'loki.db';
      this.collections = [];

      // persist version of code which created the database to the database.
      // could use for upgrade scenarios
      this.databaseVersion = 1.1;
      this.engineVersion = 1.1;

      // autosave support (disabled by default)
      // pass autosave: true, autosaveInterval: 6000 in options to set 6 second autosave
      this.autosave = false;
      this.autosaveInterval = 5000;
      this.autosaveHandle = null;

      this.options = {};

      // currently keeping persistenceMethod and persistenceAdapter as loki level properties that
      // will not or cannot be deserialized.  You are required to configure persistence every time
      // you instantiate a loki object (or use default environment detection) in order to load the database anyways.

      // persistenceMethod could be 'fs', 'localStorage', or 'adapter'
      // this is optional option param, otherwise environment detection will be used
      // if user passes their own adapter we will force this method to 'adapter' later, so no need to pass method option.
      this.persistenceMethod = null;

      // retain reference to optional (non-serializable) persistenceAdapter 'instance'
      this.persistenceAdapter = null;

      // enable console output if verbose flag is set (disabled by default)
      this.verbose = options && options.hasOwnProperty('verbose') ? options.verbose : false;

      this.events = {
        'init': [],
        'loaded': [],
        'flushChanges': [],
        'close': [],
        'changes': [],
        'warning': []
      };

      var getENV = function () {
        if (typeof window === 'undefined') {
          return 'NODEJS';
        }

        if (typeof global !== 'undefined' && global.window) {
          return 'NODEJS'; //node-webkit
        }

        if (typeof document !== 'undefined') {
          if (document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1) {
            return 'CORDOVA';
          }
          return 'BROWSER';
        }
        return 'CORDOVA';
      };

      // refactored environment detection due to invalid detection for browser environments.
      // if they do not specify an options.env we want to detect env rather than default to nodejs.
      // currently keeping two properties for similar thing (options.env and options.persistenceMethod)
      //   might want to review whether we can consolidate.
      if (options && options.hasOwnProperty('env')) {
        this.ENV = options.env;
      } else {
        this.ENV = getENV();
      }

      // not sure if this is necessary now that i have refactored the line above
      if (this.ENV === 'undefined') {
        this.ENV = 'NODEJS';
      }

      //if (typeof (options) !== 'undefined') {
      this.configureOptions(options, true);
      //}

      this.on('init', this.clearChanges);

    }

    // db class is an EventEmitter
    Loki.prototype = new LokiEventEmitter();

    // experimental support for browserify's abstract syntax scan to pick up dependency of indexed adapter.
    // Hopefully, once this hits npm a browserify require of lokijs should scan the main file and detect this indexed adapter reference.
    Loki.prototype.getIndexedAdapter = function () {
      var adapter;

      if (typeof require === 'function') {
        adapter = require("./loki-indexed-adapter.js");
      }

      return adapter;
    };


    /**
     * configureOptions - allows reconfiguring database options
     *
     * @param {object} options - configuration options to apply to loki db object
     * @param {boolean} initialConfig - (optional) if this is a reconfig, don't pass this
     */
    Loki.prototype.configureOptions = function (options, initialConfig) {
      var defaultPersistence = {
          'NODEJS': 'fs',
          'BROWSER': 'localStorage',
          'CORDOVA': 'localStorage'
        },
        persistenceMethods = {
          'fs': LokiFsAdapter,
          'localStorage': LokiLocalStorageAdapter
        };

      this.options = {};

      this.persistenceMethod = null;
      // retain reference to optional persistence adapter 'instance'
      // currently keeping outside options because it can't be serialized
      this.persistenceAdapter = null;

      // process the options
      if (typeof (options) !== 'undefined') {
        this.options = options;


        if (this.options.hasOwnProperty('persistenceMethod')) {
          // check if the specified persistence method is known
          if (typeof (persistenceMethods[options.persistenceMethod]) == 'function') {
            this.persistenceMethod = options.persistenceMethod;
            this.persistenceAdapter = new persistenceMethods[options.persistenceMethod]();
          }
          // should be throw an error here, or just fall back to defaults ??
        }

        // if user passes adapter, set persistence mode to adapter and retain persistence adapter instance
        if (this.options.hasOwnProperty('adapter')) {
          this.persistenceMethod = 'adapter';
          this.persistenceAdapter = options.adapter;
          this.options.adapter = null;
        }


        // if they want to load database on loki instantiation, now is a good time to load... after adapter set and before possible autosave initiation
        if (options.autoload && initialConfig) {
          // for autoload, let the constructor complete before firing callback
          var self = this;
          setTimeout(function () {
            self.loadDatabase(options, options.autoloadCallback);
          }, 1);
        }

        if (this.options.hasOwnProperty('autosaveInterval')) {
          this.autosaveDisable();
          this.autosaveInterval = parseInt(this.options.autosaveInterval, 10);
        }

        if (this.options.hasOwnProperty('autosave') && this.options.autosave) {
          this.autosaveDisable();
          this.autosave = true;

          if (this.options.hasOwnProperty('autosaveCallback')) {
            this.autosaveEnable(options, options.autosaveCallback);
          } else {
            this.autosaveEnable();
          }
        }
      } // end of options processing

      // if by now there is no adapter specified by user nor derived from persistenceMethod: use sensible defaults
      if (this.persistenceAdapter === null) {
        this.persistenceMethod = defaultPersistence[this.ENV];
        if (this.persistenceMethod) {
          this.persistenceAdapter = new persistenceMethods[this.persistenceMethod]();
        }
      }

    };

    /**
     * anonym() - shorthand method for quickly creating and populating an anonymous collection.
     *    This collection is not referenced internally so upon losing scope it will be garbage collected.
     *
     *    Example : var results = new loki().anonym(myDocArray).find({'age': {'$gt': 30} });
     *
     * @param {Array} docs - document array to initialize the anonymous collection with
     * @param {Array} indexesArray - (Optional) array of property names to index
     * @returns {Collection} New collection which you can query or chain
     */
    Loki.prototype.anonym = function (docs, indexesArray) {
      var collection = new Collection('anonym', indexesArray);
      collection.insert(docs);

      if(this.verbose)
        collection.console = console;

      return collection;
    };

    Loki.prototype.addCollection = function (name, options) {
      var collection = new Collection(name, options);
      this.collections.push(collection);

      if(this.verbose)
        collection.console = console;

      return collection;
    };

    Loki.prototype.loadCollection = function (collection) {
      if (!collection.name) {
        throw new Error('Collection must have a name property to be loaded');
      }
      this.collections.push(collection);
    };

    Loki.prototype.getCollection = function (collectionName) {
      var i,
        len = this.collections.length;

      for (i = 0; i < len; i += 1) {
        if (this.collections[i].name === collectionName) {
          return this.collections[i];
        }
      }

      // no such collection
      this.emit('warning', 'collection ' + collectionName + ' not found');
      return null;
    };

    Loki.prototype.listCollections = function () {

      var i = this.collections.length,
        colls = [];

      while (i--) {
        colls.push({
          name: this.collections[i].name,
          type: this.collections[i].objType,
          count: this.collections[i].data.length
        });
      }
      return colls;
    };

    Loki.prototype.removeCollection = function (collectionName) {
      var i,
        len = this.collections.length;

      for (i = 0; i < len; i += 1) {
        if (this.collections[i].name === collectionName) {
          var tmpcol = new Collection(collectionName, {});
          var curcol = this.collections[i];
          for (var prop in curcol) {
            if (curcol.hasOwnProperty(prop) && tmpcol.hasOwnProperty(prop)) {
                curcol[prop] = tmpcol[prop];
            }
          }
          this.collections.splice(i, 1);
          return;
        }
      }
    };

    Loki.prototype.getName = function () {
      return this.name;
    };

    /**
     * serializeReplacer - used to prevent certain properties from being serialized
     *
     */
    Loki.prototype.serializeReplacer = function (key, value) {
      switch (key) {
      case 'autosaveHandle':
      case 'persistenceAdapter':
      case 'constraints':
        return null;
      default:
        return value;
      }
    };

    // toJson
    Loki.prototype.serialize = function () {
      return JSON.stringify(this, this.serializeReplacer);
    };
    // alias of serialize
    Loki.prototype.toJson = Loki.prototype.serialize;

    /**
     * loadJSON - inflates a loki database from a serialized JSON string
     *
     * @param {string} serializedDb - a serialized loki database string
     * @param {object} options - apply or override collection level settings
     */
    Loki.prototype.loadJSON = function (serializedDb, options) {
      var dbObject;
      if (serializedDb.length === 0) {
        dbObject = {};
      } else {
        dbObject = JSON.parse(serializedDb);
      }

      this.loadJSONObject(dbObject, options);
    };

    /**
     * loadJSONObject - inflates a loki database from a JS object
     *
     * @param {object} dbObject - a serialized loki database string
     * @param {object} options - apply or override collection level settings
     */
    Loki.prototype.loadJSONObject = function (dbObject, options) {
      var i = 0,
        len = dbObject.collections ? dbObject.collections.length : 0,
        coll,
        copyColl,
        clen,
        j;

      this.name = dbObject.name;

      // restore database version
      this.databaseVersion = 1.0;
      if (dbObject.hasOwnProperty('databaseVersion')) {
        this.databaseVersion = dbObject.databaseVersion;
      }

      this.collections = [];

      for (i; i < len; i += 1) {
        coll = dbObject.collections[i];
        copyColl = this.addCollection(coll.name);

        copyColl.transactional = coll.transactional;
        copyColl.asyncListeners = coll.asyncListeners;
        copyColl.disableChangesApi = coll.disableChangesApi;
        copyColl.cloneObjects = coll.cloneObjects;
        copyColl.cloneMethod = coll.cloneMethod || "parse-stringify";
        copyColl.autoupdate = coll.autoupdate;

        // load each element individually
        clen = coll.data.length;
        j = 0;
        if (options && options.hasOwnProperty(coll.name)) {

          var loader = options[coll.name].inflate ? options[coll.name].inflate : Utils.copyProperties;

          for (j; j < clen; j++) {
            var collObj = new(options[coll.name].proto)();
            loader(coll.data[j], collObj);
            copyColl.data[j] = collObj;
            copyColl.addAutoUpdateObserver(collObj);
          }
        } else {

          for (j; j < clen; j++) {
            copyColl.data[j] = coll.data[j];
            copyColl.addAutoUpdateObserver(copyColl.data[j]);
          }
        }

        copyColl.maxId = (coll.data.length === 0) ? 0 : coll.maxId;
        copyColl.idIndex = coll.idIndex;
        if (typeof (coll.binaryIndices) !== 'undefined') {
          copyColl.binaryIndices = coll.binaryIndices;
        }
        if (typeof coll.transforms !== 'undefined') {
          copyColl.transforms = coll.transforms;
        }

        copyColl.ensureId();

        // regenerate unique indexes
        copyColl.uniqueNames = [];
        if (coll.hasOwnProperty("uniqueNames")) {
          copyColl.uniqueNames = coll.uniqueNames;
          for (j = 0; j < copyColl.uniqueNames.length; j++) {
            copyColl.ensureUniqueIndex(copyColl.uniqueNames[j]);
          }
        }

        // in case they are loading a database created before we added dynamic views, handle undefined
        if (typeof (coll.DynamicViews) === 'undefined') continue;

        // reinflate DynamicViews and attached Resultsets
        for (var idx = 0; idx < coll.DynamicViews.length; idx++) {
          var colldv = coll.DynamicViews[idx];

          var dv = copyColl.addDynamicView(colldv.name, colldv.options);
          dv.resultdata = colldv.resultdata;
          dv.resultsdirty = colldv.resultsdirty;
          dv.filterPipeline = colldv.filterPipeline;

          dv.sortCriteria = colldv.sortCriteria;
          dv.sortFunction = null;

          dv.sortDirty = colldv.sortDirty;
          dv.resultset.filteredrows = colldv.resultset.filteredrows;
          dv.resultset.searchIsChained = colldv.resultset.searchIsChained;
          dv.resultset.filterInitialized = colldv.resultset.filterInitialized;

          dv.rematerialize({
            removeWhereFilters: true
          });
        }
      }
    };

    /**
     * close(callback) - emits the close event with an optional callback. Does not actually destroy the db
     * but useful from an API perspective
     */
    Loki.prototype.close = function (callback) {
      // for autosave scenarios, we will let close perform final save (if dirty)
      // For web use, you might call from window.onbeforeunload to shutdown database, saving pending changes
      if (this.autosave) {
        this.autosaveDisable();
        if (this.autosaveDirty()) {
          this.saveDatabase(callback);
          callback = undefined;
        }
      }

      if (callback) {
        this.on('close', callback);
      }
      this.emit('close');
    };

    /**-------------------------+
    | Changes API               |
    +--------------------------*/

    /**
     * The Changes API enables the tracking the changes occurred in the collections since the beginning of the session,
     * so it's possible to create a differential dataset for synchronization purposes (possibly to a remote db)
     */

    /**
     * generateChangesNotification() - takes all the changes stored in each
     * collection and creates a single array for the entire database. If an array of names
     * of collections is passed then only the included collections will be tracked.
     *
     * @param {array} optional array of collection names. No arg means all collections are processed.
     * @returns {array} array of changes
     * @see private method createChange() in Collection
     */
    Loki.prototype.generateChangesNotification = function (arrayOfCollectionNames) {
      function getCollName(coll) {
        return coll.name;
      }
      var changes = [],
        selectedCollections = arrayOfCollectionNames || this.collections.map(getCollName);

      this.collections.forEach(function (coll) {
        if (selectedCollections.indexOf(getCollName(coll)) !== -1) {
          changes = changes.concat(coll.getChanges());
        }
      });
      return changes;
    };

    /**
     * serializeChanges() - stringify changes for network transmission
     * @returns {string} string representation of the changes
     */
    Loki.prototype.serializeChanges = function (collectionNamesArray) {
      return JSON.stringify(this.generateChangesNotification(collectionNamesArray));
    };

    /**
     * clearChanges() - clears all the changes in all collections.
     */
    Loki.prototype.clearChanges = function () {
      this.collections.forEach(function (coll) {
        if (coll.flushChanges) {
          coll.flushChanges();
        }
      });
    };

    /*------------------+
    | PERSISTENCE       |
    -------------------*/


    /** there are two build in persistence adapters for internal use
     * fs             for use in Nodejs type environments
     * localStorage   for use in browser environment
     * defined as helper classes here so its easy and clean to use
     */

    /**
     * constructor for fs
     */
    function LokiFsAdapter() {
      this.fs = require('fs');
    }

    /**
     * loadDatabase() - Load data from file, will throw an error if the file does not exist
     * @param {string} dbname - the filename of the database to load
     * @param {function} callback - the callback to handle the result
     */
    LokiFsAdapter.prototype.loadDatabase = function loadDatabase(dbname, callback) {
      this.fs.readFile(dbname, {
        encoding: 'utf8'
      }, function readFileCallback(err, data) {
        if (err) {
          callback(new Error(err));
        } else {
          callback(data);
        }
      });
    };

    /**
     * saveDatabase() - save data to file, will throw an error if the file can't be saved
     * might want to expand this to avoid dataloss on partial save
     * @param {string} dbname - the filename of the database to load
     * @param {function} callback - the callback to handle the result
     */
    LokiFsAdapter.prototype.saveDatabase = function saveDatabase(dbname, dbstring, callback) {
      this.fs.writeFile(dbname, dbstring, callback);
    };

    /**
     * deleteDatabase() - delete the database file, will throw an error if the
     * file can't be deleted
     * @param {string} dbname - the filename of the database to delete
     * @param {function} callback - the callback to handle the result
     */
    LokiFsAdapter.prototype.deleteDatabase = function deleteDatabase(dbname, callback) {
      this.fs.unlink(dbname, function deleteDatabaseCallback(err) {
        if (err) {
          callback(new Error(err));
        } else {
          callback();
        }
      });
    };


    /**
     * constructor for local storage
     */
    function LokiLocalStorageAdapter() {}

    /**
     * loadDatabase() - Load data from localstorage
     * @param {string} dbname - the name of the database to load
     * @param {function} callback - the callback to handle the result
     */
    LokiLocalStorageAdapter.prototype.loadDatabase = function loadDatabase(dbname, callback) {
      if (localStorageAvailable()) {
        callback(localStorage.getItem(dbname));
      } else {
        callback(new Error('localStorage is not available'));
      }
    };

    /**
     * saveDatabase() - save data to localstorage, will throw an error if the file can't be saved
     * might want to expand this to avoid dataloss on partial save
     * @param {string} dbname - the filename of the database to load
     * @param {function} callback - the callback to handle the result
     */
    LokiLocalStorageAdapter.prototype.saveDatabase = function saveDatabase(dbname, dbstring, callback) {
      if (localStorageAvailable()) {
        localStorage.setItem(dbname, dbstring);
        callback(null);
      } else {
        callback(new Error('localStorage is not available'));
      }
    };

    /**
     * deleteDatabase() - delete the database from localstorage, will throw an error if it
     * can't be deleted
     * @param {string} dbname - the filename of the database to delete
     * @param {function} callback - the callback to handle the result
     */
    LokiLocalStorageAdapter.prototype.deleteDatabase = function deleteDatabase(dbname, callback) {
      if (localStorageAvailable()) {
        localStorage.removeItem(dbname);
        callback(null);
      } else {
        callback(new Error('localStorage is not available'));
      }
    };

    /**
     * loadDatabase - Handles loading from file system, local storage, or adapter (indexeddb)
     *    This method utilizes loki configuration options (if provided) to determine which
     *    persistence method to use, or environment detection (if configuration was not provided).
     *
     * @param {object} options - not currently used (remove or allow overrides?)
     * @param {function} callback - (Optional) user supplied async callback / error handler
     */
    Loki.prototype.loadDatabase = function (options, callback) {
      var cFun = callback || function (err, data) {
          if (err) {
            throw err;
          }
        },
        self = this;

      // the persistenceAdapter should be present if all is ok, but check to be sure.
      if (this.persistenceAdapter !== null) {

        this.persistenceAdapter.loadDatabase(this.filename, function loadDatabaseCallback(dbString) {
          if (typeof (dbString) === 'string') {
            var parseSuccess = false;
            try {
              self.loadJSON(dbString, options || {});
              parseSuccess = true;
            } catch (err) {
              cFun(err);
            }
            if (parseSuccess) {
              cFun(null);
              self.emit('loaded', 'database ' + self.filename + ' loaded');
            }
          } else {
            // if adapter has returned an js object (other than null or error) attempt to load from JSON object
            if (typeof (dbString) === "object" && dbString !== null && !(dbString instanceof Error)) {
              self.loadJSONObject(dbString, options || {});
              cFun(null); // return null on success
              self.emit('loaded', 'database ' + self.filename + ' loaded');
            } else {
              // error from adapter (either null or instance of error), pass on to 'user' callback
              cFun(dbString);
            }
          }
        });

      } else {
        cFun(new Error('persistenceAdapter not configured'));
      }
    };

    /**
     * saveDatabase - Handles saving to file system, local storage, or adapter (indexeddb)
     *    This method utilizes loki configuration options (if provided) to determine which
     *    persistence method to use, or environment detection (if configuration was not provided).
     *
     * @param {object} options - not currently used (remove or allow overrides?)
     * @param {function} callback - (Optional) user supplied async callback / error handler
     */
    Loki.prototype.saveDatabase = function (callback) {
      var cFun = callback || function (err) {
          if (err) {
            throw err;
          }
          return;
        },
        self = this;

      // the persistenceAdapter should be present if all is ok, but check to be sure.
      if (this.persistenceAdapter !== null) {
        // check if the adapter is requesting (and supports) a 'reference' mode export
        if (this.persistenceAdapter.mode === "reference" && typeof this.persistenceAdapter.exportDatabase === "function") {
          // filename may seem redundant but loadDatabase will need to expect this same filename
          this.persistenceAdapter.exportDatabase(this.filename, this, function exportDatabaseCallback(err) {
            self.autosaveClearFlags();
            cFun(err);
          });
        }
        // otherwise just pass the serialized database to adapter
        else {
          this.persistenceAdapter.saveDatabase(this.filename, self.serialize(), function saveDatabasecallback(err) {
            self.autosaveClearFlags();
            cFun(err);
          });
        }
      } else {
        cFun(new Error('persistenceAdapter not configured'));
      }
    };

    // alias
    Loki.prototype.save = Loki.prototype.saveDatabase;

    /**
     * deleteDatabase - Handles deleting a database from file system, local
     *    storage, or adapter (indexeddb)
     *    This method utilizes loki configuration options (if provided) to determine which
     *    persistence method to use, or environment detection (if configuration was not provided).
     *
     * @param {object} options - not currently used (remove or allow overrides?)
     * @param {function} callback - (Optional) user supplied async callback / error handler
     */
    Loki.prototype.deleteDatabase = function (options, callback) {
      var cFun = callback || function (err, data) {
          if (err) {
            throw err;
          }
        };

      // the persistenceAdapter should be present if all is ok, but check to be sure.
      if (this.persistenceAdapter !== null) {
        this.persistenceAdapter.deleteDatabase(this.filename, function deleteDatabaseCallback(err) {
          cFun(err);
        });
      } else {
        cFun(new Error('persistenceAdapter not configured'));
      }
    };

    /**
     * autosaveDirty - check whether any collections are 'dirty' meaning we need to save (entire) database
     *
     * @returns {boolean} - true if database has changed since last autosave, false if not.
     */
    Loki.prototype.autosaveDirty = function () {
      for (var idx = 0; idx < this.collections.length; idx++) {
        if (this.collections[idx].dirty) {
          return true;
        }
      }

      return false;
    };

    /**
     * autosaveClearFlags - resets dirty flags on all collections.
     *    Called from saveDatabase() after db is saved.
     *
     */
    Loki.prototype.autosaveClearFlags = function () {
      for (var idx = 0; idx < this.collections.length; idx++) {
        this.collections[idx].dirty = false;
      }
    };

    /**
     * autosaveEnable - begin a javascript interval to periodically save the database.
     *
     * @param {object} options - not currently used (remove or allow overrides?)
     * @param {function} callback - (Optional) user supplied async callback
     */
    Loki.prototype.autosaveEnable = function (options, callback) {
      this.autosave = true;

      var delay = 5000,
        self = this;

      if (typeof (this.autosaveInterval) !== 'undefined' && this.autosaveInterval !== null) {
        delay = this.autosaveInterval;
      }

      this.autosaveHandle = setInterval(function autosaveHandleInterval() {
        // use of dirty flag will need to be hierarchical since mods are done at collection level with no visibility of 'db'
        // so next step will be to implement collection level dirty flags set on insert/update/remove
        // along with loki level isdirty() function which iterates all collections to see if any are dirty

        if (self.autosaveDirty()) {
          self.saveDatabase(callback);
        }
      }, delay);
    };

    /**
     * autosaveDisable - stop the autosave interval timer.
     *
     */
    Loki.prototype.autosaveDisable = function () {
      if (typeof (this.autosaveHandle) !== 'undefined' && this.autosaveHandle !== null) {
        clearInterval(this.autosaveHandle);
        this.autosaveHandle = null;
      }
    };


    /**
     * Resultset class allowing chainable queries.  Intended to be instanced internally.
     *    Collection.find(), Collection.where(), and Collection.chain() instantiate this.
     *
     *    Example:
     *    mycollection.chain()
     *      .find({ 'doors' : 4 })
     *      .where(function(obj) { return obj.name === 'Toyota' })
     *      .data();
     *
     * @constructor
     * @param {Collection} collection - The collection which this Resultset will query against.
     * @param {Object} options - Object containing one or more options.
     * @param {string} options.queryObj - Optional mongo-style query object to initialize resultset with.
     * @param {function} options.queryFunc - Optional javascript filter function to initialize resultset with.
     * @param {bool} options.firstOnly - Optional boolean used by collection.findOne().
     */
    function Resultset(collection, options) {
      options = options || {};

      options.queryObj = options.queryObj || null;
      options.queryFunc = options.queryFunc || null;
      options.firstOnly = options.firstOnly || false;

      // retain reference to collection we are querying against
      this.collection = collection;

      // if chain() instantiates with null queryObj and queryFunc, so we will keep flag for later
      this.searchIsChained = (!options.queryObj && !options.queryFunc);
      this.filteredrows = [];
      this.filterInitialized = false;

      // if user supplied initial queryObj or queryFunc, apply it
      if (typeof (options.queryObj) !== "undefined" && options.queryObj !== null) {
        return this.find(options.queryObj, options.firstOnly);
      }
      if (typeof (options.queryFunc) !== "undefined" && options.queryFunc !== null) {
        return this.where(options.queryFunc);
      }

      // otherwise return unfiltered Resultset for future filtering
      return this;
    }

    /**
     * reset() - Reset the resultset to its initial state.
     *
     * @returns {Resultset} Reference to this resultset, for future chain operations.
     */
    Resultset.prototype.reset = function () {
      if (this.filteredrows.length > 0) {
        this.filteredrows = [];
      }
      this.filterInitialized = false;
      return this;
    };

    /**
     * toJSON() - Override of toJSON to avoid circular references
     *
     */
    Resultset.prototype.toJSON = function () {
      var copy = this.copy();
      copy.collection = null;
      return copy;
    };

    /**
     * limit() - Allows you to limit the number of documents passed to next chain operation.
     *    A resultset copy() is made to avoid altering original resultset.
     *
     * @param {int} qty - The number of documents to return.
     * @returns {Resultset} Returns a copy of the resultset, limited by qty, for subsequent chain ops.
     */
    Resultset.prototype.limit = function (qty) {
      // if this is chained resultset with no filters applied, we need to populate filteredrows first
      if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
        this.filteredrows = this.collection.prepareFullDocIndex();
      }

      var rscopy = new Resultset(this.collection);
      rscopy.filteredrows = this.filteredrows.slice(0, qty);
      rscopy.filterInitialized = true;
      return rscopy;
    };

    /**
     * offset() - Used for skipping 'pos' number of documents in the resultset.
     *
     * @param {int} pos - Number of documents to skip; all preceding documents are filtered out.
     * @returns {Resultset} Returns a copy of the resultset, containing docs starting at 'pos' for subsequent chain ops.
     */
    Resultset.prototype.offset = function (pos) {
      // if this is chained resultset with no filters applied, we need to populate filteredrows first
      if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
        this.filteredrows = this.collection.prepareFullDocIndex();
      }

      var rscopy = new Resultset(this.collection);
      rscopy.filteredrows = this.filteredrows.slice(pos);
      rscopy.filterInitialized = true;
      return rscopy;
    };

    /**
     * copy() - To support reuse of resultset in branched query situations.
     *
     * @returns {Resultset} Returns a copy of the resultset (set) but the underlying document references will be the same.
     */
    Resultset.prototype.copy = function () {
      var result = new Resultset(this.collection);

      if (this.filteredrows.length > 0) {
        result.filteredrows = this.filteredrows.slice();
      }
      result.filterInitialized = this.filterInitialized;

      return result;
    };

    // add branch() as alias of copy()
    Resultset.prototype.branch = Resultset.prototype.copy;

    /**
     * transform() - executes a named collection transform or raw array of transform steps against the resultset.
     *
     * @param transform {string|array} : (Optional) name of collection transform or raw transform array
     * @param parameters {object} : (Optional) object property hash of parameters, if the transform requires them.
     * @returns {Resultset} : either (this) resultset or a clone of of this resultset (depending on steps)
     */
    Resultset.prototype.transform = function (transform, parameters) {
      var idx,
        step,
        rs = this;

      // if transform is name, then do lookup first
      if (typeof transform === 'string') {
        if (this.collection.transforms.hasOwnProperty(transform)) {
          transform = this.collection.transforms[transform];
        }
      }

      // either they passed in raw transform array or we looked it up, so process
      if (typeof transform !== 'object' || !Array.isArray(transform)) {
          throw new Error("Invalid transform");
      }

      if (typeof parameters !== 'undefined') {
        transform = Utils.resolveTransformParams(transform, parameters);
      }

      for (idx = 0; idx < transform.length; idx++) {
        step = transform[idx];

        switch (step.type) {
        case "find":
          rs.find(step.value);
          break;
        case "where":
          rs.where(step.value);
          break;
        case "simplesort":
          rs.simplesort(step.property, step.desc);
          break;
        case "compoundsort":
          rs.compoundsort(step.value);
          break;
        case "sort":
          rs.sort(step.value);
          break;
        case "limit":
          rs = rs.limit(step.value);
          break; // limit makes copy so update reference
        case "offset":
          rs = rs.offset(step.value);
          break; // offset makes copy so update reference
        case "map":
          rs = rs.map(step.value);
          break;
        case "eqJoin":
          rs = rs.eqJoin(step.joinData, step.leftJoinKey, step.rightJoinKey, step.mapFun);
          break;
          // following cases break chain by returning array data so make any of these last in transform steps
        case "mapReduce":
          rs = rs.mapReduce(step.mapFunction, step.reduceFunction);
          break;
          // following cases update documents in current filtered resultset (use carefully)
        case "update":
          rs.update(step.value);
          break;
        case "remove":
          rs.remove();
          break;
        default:
          break;
        }
      }

      return rs;
    };

    /**
     * sort() - User supplied compare function is provided two documents to compare. (chainable)
     *    Example:
     *    rslt.sort(function(obj1, obj2) {
     *      if (obj1.name === obj2.name) return 0;
     *      if (obj1.name > obj2.name) return 1;
     *      if (obj1.name < obj2.name) return -1;
     *    });
     *
     * @param {function} comparefun - A javascript compare function used for sorting.
     * @returns {Resultset} Reference to this resultset, sorted, for future chain operations.
     */
    Resultset.prototype.sort = function (comparefun) {
      // if this is chained resultset with no filters applied, just we need to populate filteredrows first
      if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
        this.filteredrows = this.collection.prepareFullDocIndex();
      }

      var wrappedComparer =
        (function (userComparer, data) {
          return function (a, b) {
            return userComparer(data[a], data[b]);
          };
        })(comparefun, this.collection.data);

      this.filteredrows.sort(wrappedComparer);

      return this;
    };

    /**
     * simplesort() - Simpler, loose evaluation for user to sort based on a property name. (chainable)
     *
     * @param {string} propname - name of property to sort by.
     * @param {bool} isdesc - (Optional) If true, the property will be sorted in descending order
     * @returns {Resultset} Reference to this resultset, sorted, for future chain operations.
     */
    Resultset.prototype.simplesort = function (propname, isdesc) {
      // if this is chained resultset with no filters applied, just we need to populate filteredrows first
      if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
        this.filteredrows = this.collection.prepareFullDocIndex();
      }

      if (typeof (isdesc) === 'undefined') {
        isdesc = false;
      }

      var wrappedComparer =
        (function (prop, desc, data) {
          return function (a, b) {
            return sortHelper(data[a][prop], data[b][prop], desc);
          };
        })(propname, isdesc, this.collection.data);

      this.filteredrows.sort(wrappedComparer);

      return this;
    };

    /**
     * compoundsort() - Allows sorting a resultset based on multiple columns.
     *    Example : rs.compoundsort(['age', 'name']); to sort by age and then name (both ascending)
     *    Example : rs.compoundsort(['age', ['name', true]); to sort by age (ascending) and then by name (descending)
     *
     * @param {array} properties - array of property names or subarray of [propertyname, isdesc] used evaluate sort order
     * @returns {Resultset} Reference to this resultset, sorted, for future chain operations.
     */
    Resultset.prototype.compoundsort = function (properties) {
      if (properties.length === 0) {
        throw new Error("Invalid call to compoundsort, need at least one property");
      }

      var prop;
      if (properties.length === 1) {
        prop = properties[0];
        if (Array.isArray(prop)) {
          return this.simplesort(prop[0], prop[1]);
        }
        return this.simplesort(prop, false);
      }

      // unify the structure of 'properties' to avoid checking it repeatedly while sorting
      for (var i = 0, len = properties.length; i < len; i += 1) {
        prop = properties[i];
        if (!Array.isArray(prop)) {
          properties[i] = [prop, false];
        }
      }

      // if this is chained resultset with no filters applied, just we need to populate filteredrows first
      if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
        this.filteredrows = this.collection.prepareFullDocIndex();
      }

      var wrappedComparer =
        (function (props, data) {
          return function (a, b) {
            return compoundeval(props, data[a], data[b]);
          };
        })(properties, this.collection.data);

      this.filteredrows.sort(wrappedComparer);

      return this;
    };

    /**
     * calculateRange() - Binary Search utility method to find range/segment of values matching criteria.
     *    this is used for collection.find() and first find filter of resultset/dynview
     *    slightly different than get() binary search in that get() hones in on 1 value,
     *    but we have to hone in on many (range)
     * @param {string} op - operation, such as $eq
     * @param {string} prop - name of property to calculate range for
     * @param {object} val - value to use for range calculation.
     * @returns {array} [start, end] index array positions
     */
    Resultset.prototype.calculateRange = function (op, prop, val) {
      var rcd = this.collection.data;
      var index = this.collection.binaryIndices[prop].values;
      var min = 0;
      var max = index.length - 1;
      var mid = 0;

      // when no documents are in collection, return empty range condition
      if (rcd.length === 0) {
        return [0, -1];
      }

      var minVal = rcd[index[min]][prop];
      var maxVal = rcd[index[max]][prop];

      // if value falls outside of our range return [0, -1] to designate no results
      switch (op) {
      case '$eq':
        if (ltHelper(val, minVal, false) || gtHelper(val, maxVal, false)) {
          return [0, -1];
        }
        break;
      case '$dteq':
        if (ltHelper(val, minVal, false) || gtHelper(val, maxVal, false)) {
          return [0, -1];
        }
        break;
      case '$gt':
        if (gtHelper(val, maxVal, true)) {
          return [0, -1];
        }
        break;
      case '$gte':
        if (gtHelper(val, maxVal, false)) {
          return [0, -1];
        }
        break;
      case '$lt':
        if (ltHelper(val, minVal, true)) {
          return [0, -1];
        }
        if (ltHelper(maxVal, val, false)) {
          return [0, rcd.length - 1];
        }
        break;
      case '$lte':
        if (ltHelper(val, minVal, false)) {
          return [0, -1];
        }
        if (ltHelper(maxVal, val, true)) {
          return [0, rcd.length - 1];
        }
        break;
      }

      // hone in on start position of value
      while (min < max) {
        mid = (min + max) >> 1;

        if (ltHelper(rcd[index[mid]][prop], val, false)) {
          min = mid + 1;
        } else {
          max = mid;
        }
      }

      var lbound = min;

      // do not reset min, as the upper bound cannot be prior to the found low bound
      max = index.length - 1;

      // hone in on end position of value
      while (min < max) {
        mid = (min + max) >> 1;

        if (ltHelper(val, rcd[index[mid]][prop], false)) {
          max = mid;
        } else {
          min = mid + 1;
        }
      }

      var ubound = max;

      var lval = rcd[index[lbound]][prop];
      var uval = rcd[index[ubound]][prop];

      switch (op) {
      case '$eq':
        if (lval !== val) {
          return [0, -1];
        }
        if (uval !== val) {
          ubound--;
        }

        return [lbound, ubound];
      case '$dteq':
        if (lval > val || lval < val) {
          return [0, -1];
        }
        if (uval > val || uval < val) {
          ubound--;
        }

        return [lbound, ubound];


      case '$gt':
        if (ltHelper(uval, val, true)) {
          return [0, -1];
        }

        return [ubound, rcd.length - 1];

      case '$gte':
        if (ltHelper(lval, val, false)) {
          return [0, -1];
        }

        return [lbound, rcd.length - 1];

      case '$lt':
        if (lbound === 0 && ltHelper(lval, val, false)) {
          return [0, 0];
        }
        return [0, lbound - 1];

      case '$lte':
        if (uval !== val) {
          ubound--;
        }

        if (ubound === 0 && ltHelper(uval, val, false)) {
          return [0, 0];
        }
        return [0, ubound];

      default:
        return [0, rcd.length - 1];
      }
    };

    /**
     * findOr() - oversee the operation of OR'ed query expressions.
     *    OR'ed expression evaluation runs each expression individually against the full collection,
     *    and finally does a set OR on each expression's results.
     *    Each evaluation can utilize a binary index to prevent multiple linear array scans.
     *
     * @param {array} expressionArray - array of expressions
     * @returns {Resultset} this resultset for further chain ops.
     */
    Resultset.prototype.findOr = function (expressionArray) {
      var fr = null,
          fri = 0, frlen = 0,
          docset = [], idxset = [], idx = 0,
          origCount = this.count();

      // If filter is already initialized, then we query against only those items already in filter.
      // This means no index utilization for fields, so hopefully its filtered to a smallish filteredrows.
      for (var ei = 0, elen = expressionArray.length; ei < elen; ei++) {
        // we need to branch existing query to run each filter separately and combine results
        fr = this.branch().find(expressionArray[ei]).filteredrows;
        frlen = fr.length;
        // if the find operation did not reduce the initial set, then the initial set is the actual result
        if (frlen === origCount) {
          return this;
        }

        // add any document 'hits'
        for (fri = 0; fri < frlen; fri++) {
          idx = fr[fri];
          if (idxset[idx] === undefined) {
            idxset[idx] = true;
            docset.push(idx);
          }
        }
      }

      this.filteredrows = docset;
      this.filterInitialized = true;

      return this;
    };
    Resultset.prototype.$or = Resultset.prototype.findOr;

    /**
     * findAnd() - oversee the operation of AND'ed query expressions.
     *    AND'ed expression evaluation runs each expression progressively against the full collection,
     *    internally utilizing existing chained resultset functionality.
     *    Only the first filter can utilize a binary index.
     *
     * @param {array} expressionArray - array of expressions
     * @returns {Resultset} this resultset for further chain ops.
     */
    Resultset.prototype.findAnd = function (expressionArray) {
      // we have already implementing method chaining in this (our Resultset class)
      // so lets just progressively apply user supplied and filters
      for (var i = 0, len = expressionArray.length; i < len; i++) {
        if (this.count() === 0) {
          return this;
        }
        this.find(expressionArray[i]);
      }
      return this;
    };
    Resultset.prototype.$and = Resultset.prototype.findAnd;

    /**
     * find() - Used for querying via a mongo-style query object.
     *
     * @param {object} query - A mongo-style query object used for filtering current results.
     * @param {boolean} firstOnly - (Optional) Used by collection.findOne()
     * @returns {Resultset} this resultset for further chain ops.
     */
    Resultset.prototype.find = function (query, firstOnly) {
      if (this.collection.data.length === 0) {
        if (this.searchIsChained) {
          this.filteredrows = [];
          this.filterInitialized = true;
          return this;
        }
        return [];
      }

      var queryObject = query || 'getAll',
          p,
          property,
          queryObjectOp,
          operator,
          value,
          key,
          searchByIndex = false,
          result = [],
          index = null;

      // if this was note invoked via findOne()
      firstOnly = firstOnly || false;

      if (typeof queryObject === 'object') {
        for (p in queryObject) {
          if (hasOwnProperty.call(queryObject, p)) {
            property = p;
            queryObjectOp = queryObject[p];
            break;
          }
        }
      }

      // apply no filters if they want all
      if (!property || queryObject === 'getAll') {
        // Chained queries can just do coll.chain().data() but let's
        // be versatile and allow this also coll.chain().find().data()

        // If a chained search, simply leave everything as-is.
        // Note: If no filter at this point, it will be properly
        // created by the follow-up queries or sorts that need it.
        // If not chained, then return the collection data array copy.
        return (this.searchIsChained) ? (this) : (this.collection.data.slice());
      }

      // injecting $and and $or expression tree evaluation here.
      if (property === '$and' || property === '$or') {
        if (this.searchIsChained) {
          this[property](queryObjectOp);

          // for chained find with firstonly,
          if (firstOnly && this.filteredrows.length > 1) {
            this.filteredrows = this.filteredrows.slice(0, 1);
          }

          return this;
        } else {
          // our $and operation internally chains filters
          result = this.collection.chain()[property](queryObjectOp).data();

          // if this was coll.findOne() return first object or empty array if null
          // since this is invoked from a constructor we can't return null, so we will
          // make null in coll.findOne();
          if (firstOnly) {
            return (result.length === 0) ? ([]) : (result[0]);
          }

          // not first only return all results
          return result;
        }
      }

      // see if query object is in shorthand mode (assuming eq operator)
      if (queryObjectOp === null || (typeof queryObjectOp !== 'object' || queryObjectOp instanceof Date)) {
        operator = '$eq';
        value = queryObjectOp;
      } else if (typeof queryObjectOp === 'object') {
        for (key in queryObjectOp) {
          if (hasOwnProperty.call(queryObjectOp, key)) {
            operator = key;
            value = queryObjectOp[key];
            break;
          }
        }
      } else {
        throw new Error('Do not know what you want to do.');
      }

      // for regex ops, precompile
      if (operator === '$regex') {
        if (Array.isArray(value)) {
          value = new RegExp(value[0], value[1]);
        }
        else if (!(value instanceof RegExp)) {
          value = new RegExp(value);
        }
      }

      // if user is deep querying the object such as find('name.first': 'odin')
      var usingDotNotation = (property.indexOf('.') !== -1);

      // if an index exists for the property being queried against, use it
      // for now only enabling for non-chained query (who's set of docs matches index)
      // or chained queries where it is the first filter applied and prop is indexed
      var doIndexCheck = !usingDotNotation &&
          (!this.searchIsChained || !this.filterInitialized);

      if (doIndexCheck && this.collection.binaryIndices[property] &&
          indexedOpsList.indexOf(operator) !== -1) {
        // this is where our lazy index rebuilding will take place
        // basically we will leave all indexes dirty until we need them
        // so here we will rebuild only the index tied to this property
        // ensureIndex() will only rebuild if flagged as dirty since we are not passing force=true param
        this.collection.ensureIndex(property);

        searchByIndex = true;
        index = this.collection.binaryIndices[property];
      }

      // the comparison function
      var fun = LokiOps[operator];

      // "shortcut" for collection data
      var t = this.collection.data;
      // filter data length
      var i = 0;

      // Query executed differently depending on :
      //    - whether it is chained or not
      //    - whether the property being queried has an index defined
      //    - if chained, we handle first pass differently for initial filteredrows[] population
      //
      // For performance reasons, each case has its own if block to minimize in-loop calculations

      // If not a chained query, bypass filteredrows and work directly against data
      if (!this.searchIsChained) {
        if (!searchByIndex) {
          i = t.length;

          if (firstOnly) {
            if (usingDotNotation) {
              property = property.split('.');
              while (i--) {
                if (dotSubScan(t[i], property, fun, value)) {
                  return (t[i]);
                }
              }
            } else {
              while (i--) {
                if (fun(t[i][property], value)) {
                  return (t[i]);
                }
              }
            }

            return [];
          }

          // if using dot notation then treat property as keypath such as 'name.first'.
          // currently supporting dot notation for non-indexed conditions only
          if (usingDotNotation) {
            property = property.split('.');
            while (i--) {
              if (dotSubScan(t[i], property, fun, value)) {
                result.push(t[i]);
              }
            }
          } else {
            while (i--) {
              if (fun(t[i][property], value)) {
                result.push(t[i]);
              }
            }
          }
        } else {
          // searching by binary index via calculateRange() utility method
          var seg = this.calculateRange(operator, property, value);

          // not chained so this 'find' was designated in Resultset constructor
          // so return object itself
          if (firstOnly) {
            if (seg[1] !== -1) {
              return t[index.values[seg[0]]];
            }
            return [];
          }

          for (i = seg[0]; i <= seg[1]; i++) {
            result.push(t[index.values[i]]);
          }
        }

        // not a chained query so return result as data[]
        return result;
      }


      // Otherwise this is a chained query

      var filter, rowIdx = 0;

      // If the filteredrows[] is already initialized, use it
      if (this.filterInitialized) {
        filter = this.filteredrows;
        i = filter.length;

        // currently supporting dot notation for non-indexed conditions only
        if (usingDotNotation) {
          property = property.split('.');
          while (i--) {
            rowIdx = filter[i];
            if (dotSubScan(t[rowIdx], property, fun, value)) {
              result.push(rowIdx);
            }
          }
        } else {
          while (i--) {
            rowIdx = filter[i];
            if (fun(t[rowIdx][property], value)) {
              result.push(rowIdx);
            }
          }
        }
      }
      // first chained query so work against data[] but put results in filteredrows
      else {
        // if not searching by index
        if (!searchByIndex) {
          i = t.length;

          if (usingDotNotation) {
            property = property.split('.');
            while (i--) {
              if (dotSubScan(t[i], property, fun, value)) {
                result.push(i);
              }
            }
          } else {
            while (i--) {
              if (fun(t[i][property], value)) {
                result.push(i);
              }
            }
          }
        } else {
          // search by index
          var segm = this.calculateRange(operator, property, value);

          for (i = segm[0]; i <= segm[1]; i++) {
            result.push(index.values[i]);
          }
        }

        this.filterInitialized = true; // next time work against filteredrows[]
      }

      this.filteredrows = result;
      return this;
    };


    /**
     * where() - Used for filtering via a javascript filter function.
     *
     * @param {function} fun - A javascript function used for filtering current results by.
     * @returns {Resultset} this resultset for further chain ops.
     */
    Resultset.prototype.where = function (fun) {
      var viewFunction,
        result = [];

      if ('function' === typeof fun) {
        viewFunction = fun;
      } else {
        throw new TypeError('Argument is not a stored view or a function');
      }
      try {
        // if not a chained query then run directly against data[] and return object []
        if (!this.searchIsChained) {
          var i = this.collection.data.length;

          while (i--) {
            if (viewFunction(this.collection.data[i]) === true) {
              result.push(this.collection.data[i]);
            }
          }

          // not a chained query so returning result as data[]
          return result;
        }
        // else chained query, so run against filteredrows
        else {
          // If the filteredrows[] is already initialized, use it
          if (this.filterInitialized) {
            var j = this.filteredrows.length;

            while (j--) {
              if (viewFunction(this.collection.data[this.filteredrows[j]]) === true) {
                result.push(this.filteredrows[j]);
              }
            }

            this.filteredrows = result;

            return this;
          }
          // otherwise this is initial chained op, work against data, push into filteredrows[]
          else {
            var k = this.collection.data.length;

            while (k--) {
              if (viewFunction(this.collection.data[k]) === true) {
                result.push(k);
              }
            }

            this.filteredrows = result;
            this.filterInitialized = true;

            return this;
          }
        }
      } catch (err) {
        throw err;
      }
    };

    /**
     * count() - returns the number of documents in the resultset.
     *
     * @returns {number} The number of documents in the resultset.
     */
    Resultset.prototype.count = function () {
      if (this.searchIsChained && this.filterInitialized) {
        return this.filteredrows.length;
      }
      return this.collection.count();
    };

    /**
     * data() - Terminates the chain and returns array of filtered documents
     *
     * @param options {object} : allows specifying 'forceClones' and 'forceCloneMethod' options.
     *    options :
     *      forceClones {boolean} : Allows forcing the return of cloned objects even when
     *        the collection is not configured for clone object.
     *      forceCloneMethod {string} : Allows overriding the default or collection specified cloning method.
     *        Possible values include 'parse-stringify', 'jquery-extend-deep', and 'shallow'
     *
     * @returns {array} Array of documents in the resultset
     */
    Resultset.prototype.data = function (options) {
      var result = [],
        data = this.collection.data,
        len,
        i,
        method;

      options = options || {};

      // if this is chained resultset with no filters applied, just return collection.data
      if (this.searchIsChained && !this.filterInitialized) {
        if (this.filteredrows.length === 0) {
          // determine whether we need to clone objects or not
          if (this.collection.cloneObjects || options.forceClones) {
            len = data.length;
            method = options.forceCloneMethod || this.collection.cloneMethod;

            for (i = 0; i < len; i++) {
              result.push(clone(data[i], method));
            }
            return result;
          }
          // otherwise we are not cloning so return sliced array with same object references
          else {
            return data.slice();
          }
        } else {
          // filteredrows must have been set manually, so use it
          this.filterInitialized = true;
        }
      }

      var fr = this.filteredrows;
      len = fr.length;

      if (this.collection.cloneObjects || options.forceClones) {
        method = options.forceCloneMethod || this.collection.cloneMethod;
        for (i = 0; i < len; i++) {
          result.push(clone(data[fr[i]], method));
        }
      }
      else {
        for (i = 0; i < len; i++) {
          result.push(data[fr[i]]);
        }
      }
      return result;
    };

    /**
     * update() - used to run an update operation on all documents currently in the resultset.
     *
     * @param {function} updateFunction - User supplied updateFunction(obj) will be executed for each document object.
     * @returns {Resultset} this resultset for further chain ops.
     */
    Resultset.prototype.update = function (updateFunction) {

      if (typeof (updateFunction) !== "function") {
        throw new TypeError('Argument is not a function');
      }

      // if this is chained resultset with no filters applied, we need to populate filteredrows first
      if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
        this.filteredrows = this.collection.prepareFullDocIndex();
      }

      var len = this.filteredrows.length,
        rcd = this.collection.data;

      for (var idx = 0; idx < len; idx++) {
        // pass in each document object currently in resultset to user supplied updateFunction
        updateFunction(rcd[this.filteredrows[idx]]);

        // notify collection we have changed this object so it can update meta and allow DynamicViews to re-evaluate
        this.collection.update(rcd[this.filteredrows[idx]]);
      }

      return this;
    };

    /**
     * remove() - removes all document objects which are currently in resultset from collection (as well as resultset)
     *
     * @returns {Resultset} this (empty) resultset for further chain ops.
     */
    Resultset.prototype.remove = function () {

      // if this is chained resultset with no filters applied, we need to populate filteredrows first
      if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
        this.filteredrows = this.collection.prepareFullDocIndex();
      }

      this.collection.remove(this.data());

      this.filteredrows = [];

      return this;
    };

    /**
     * mapReduce() - data transformation via user supplied functions
     *
     * @param {function} mapFunction - this function accepts a single document for you to transform and return
     * @param {function} reduceFunction - this function accepts many (array of map outputs) and returns single value
     * @returns The output of your reduceFunction
     */
    Resultset.prototype.mapReduce = function (mapFunction, reduceFunction) {
      try {
        return reduceFunction(this.data().map(mapFunction));
      } catch (err) {
        throw err;
      }
    };

    /**
     * eqJoin() - Left joining two sets of data. Join keys can be defined or calculated properties
     * eqJoin expects the right join key values to be unique.  Otherwise left data will be joined on the last joinData object with that key
     * @param {Array} joinData - Data array to join to.
     * @param {String,function} leftJoinKey - Property name in this result set to join on or a function to produce a value to join on
     * @param {String,function} rightJoinKey - Property name in the joinData to join on or a function to produce a value to join on
     * @param {function} (optional) mapFun - A function that receives each matching pair and maps them into output objects - function(left,right){return joinedObject}
     * @returns {Resultset} A resultset with data in the format [{left: leftObj, right: rightObj}]
     */
    Resultset.prototype.eqJoin = function (joinData, leftJoinKey, rightJoinKey, mapFun) {

      var leftData = [],
        leftDataLength,
        rightData = [],
        rightDataLength,
        key,
        result = [],
        leftKeyisFunction = typeof leftJoinKey === 'function',
        rightKeyisFunction = typeof rightJoinKey === 'function',
        joinMap = {};

      //get the left data
      leftData = this.data();
      leftDataLength = leftData.length;

      //get the right data
      if (joinData instanceof Resultset) {
        rightData = joinData.data();
      } else if (Array.isArray(joinData)) {
        rightData = joinData;
      } else {
        throw new TypeError('joinData needs to be an array or result set');
      }
      rightDataLength = rightData.length;

      //construct a lookup table

      for (var i = 0; i < rightDataLength; i++) {
        key = rightKeyisFunction ? rightJoinKey(rightData[i]) : rightData[i][rightJoinKey];
        joinMap[key] = rightData[i];
      }

      if (!mapFun) {
        mapFun = function (left, right) {
          return {
            left: left,
            right: right
          };
        };
      }

      //Run map function over each object in the resultset
      for (var j = 0; j < leftDataLength; j++) {
        key = leftKeyisFunction ? leftJoinKey(leftData[j]) : leftData[j][leftJoinKey];
        result.push(mapFun(leftData[j], joinMap[key] || {}));
      }

      //return return a new resultset with no filters
      this.collection = new Collection('joinData');
      this.collection.insert(result);
      this.filteredrows = [];
      this.filterInitialized = false;

      return this;
    };

    Resultset.prototype.map = function (mapFun) {
      var data = this.data().map(mapFun);
      //return return a new resultset with no filters
      this.collection = new Collection('mappedData');
      this.collection.insert(data);
      this.filteredrows = [];
      this.filterInitialized = false;

      return this;
    };

    /**
     * DynamicView class is a versatile 'live' view class which can have filters and sorts applied.
     *    Collection.addDynamicView(name) instantiates this DynamicView object and notifies it
     *    whenever documents are add/updated/removed so it can remain up-to-date. (chainable)
     *
     *    Examples:
     *    var mydv = mycollection.addDynamicView('test');  // default is non-persistent
     *    mydv.applyWhere(function(obj) { return obj.name === 'Toyota'; });
     *    mydv.applyFind({ 'doors' : 4 });
     *    var results = mydv.data();
     *
     * @constructor
     * @param {Collection} collection - A reference to the collection to work against
     * @param {string} name - The name of this dynamic view
     * @param {object} options - (Optional) Pass in object with 'persistent' and/or 'sortPriority' options.
     */
    function DynamicView(collection, name, options) {
      this.collection = collection;
      this.name = name;
      this.rebuildPending = false;
      this.options = options || {};

      if (!this.options.hasOwnProperty('persistent')) {
        this.options.persistent = false;
      }

      // 'persistentSortPriority':
      // 'passive' will defer the sort phase until they call data(). (most efficient overall)
      // 'active' will sort async whenever next idle. (prioritizes read speeds)
      if (!this.options.hasOwnProperty('sortPriority')) {
        this.options.sortPriority = 'passive';
      }

      if (!this.options.hasOwnProperty('minRebuildInterval')) {
        this.options.minRebuildInterval = 1;
      }

      this.resultset = new Resultset(collection);
      this.resultdata = [];
      this.resultsdirty = false;

      this.cachedresultset = null;

      // keep ordered filter pipeline
      this.filterPipeline = [];

      // sorting member variables
      // we only support one active search, applied using applySort() or applySimpleSort()
      this.sortFunction = null;
      this.sortCriteria = null;
      this.sortDirty = false;

      // for now just have 1 event for when we finally rebuilt lazy view
      // once we refactor transactions, i will tie in certain transactional events

      this.events = {
        'rebuild': []
      };
    }

    DynamicView.prototype = new LokiEventEmitter();


    /**
     * rematerialize() - intended for use immediately after deserialization (loading)
     *    This will clear out and reapply filterPipeline ops, recreating the view.
     *    Since where filters do not persist correctly, this method allows
     *    restoring the view to state where user can re-apply those where filters.
     *
     * @param {Object} options - (Optional) allows specification of 'removeWhereFilters' option
     * @returns {DynamicView} This dynamic view for further chained ops.
     */
    DynamicView.prototype.rematerialize = function (options) {
      var fpl,
        fpi,
        idx;

      options = options || {};

      this.resultdata = [];
      this.resultsdirty = true;
      this.resultset = new Resultset(this.collection);

      if (this.sortFunction || this.sortCriteria) {
        this.sortDirty = true;
      }

      if (options.hasOwnProperty('removeWhereFilters')) {
        // for each view see if it had any where filters applied... since they don't
        // serialize those functions lets remove those invalid filters
        fpl = this.filterPipeline.length;
        fpi = fpl;
        while (fpi--) {
          if (this.filterPipeline[fpi].type === 'where') {
            if (fpi !== this.filterPipeline.length - 1) {
              this.filterPipeline[fpi] = this.filterPipeline[this.filterPipeline.length - 1];
            }

            this.filterPipeline.length--;
          }
        }
      }

      // back up old filter pipeline, clear filter pipeline, and reapply pipeline ops
      var ofp = this.filterPipeline;
      this.filterPipeline = [];

      // now re-apply 'find' filterPipeline ops
      fpl = ofp.length;
      for (idx = 0; idx < fpl; idx++) {
        this.applyFind(ofp[idx].val);
      }

      // during creation of unit tests, i will remove this forced refresh and leave lazy
      this.data();

      // emit rebuild event in case user wants to be notified
      this.emit('rebuild', this);

      return this;
    };

    /**
     * branchResultset() - Makes a copy of the internal resultset for branched queries.
     *    Unlike this dynamic view, the branched resultset will not be 'live' updated,
     *    so your branched query should be immediately resolved and not held for future evaluation.
     *
     * @param {string, array} : Optional name of collection transform, or an array of transform steps
     * @param {object} : optional parameters (if optional transform requires them)
     * @returns {Resultset} A copy of the internal resultset for branched queries.
     */
    DynamicView.prototype.branchResultset = function (transform, parameters) {
      var rs = this.resultset.branch();

      if (typeof transform === 'undefined') {
        return rs;
      }

      return rs.transform(transform, parameters);
    };

    /**
     * toJSON() - Override of toJSON to avoid circular references
     *
     */
    DynamicView.prototype.toJSON = function () {
      var copy = new DynamicView(this.collection, this.name, this.options);

      copy.resultset = this.resultset;
      copy.resultdata = []; // let's not save data (copy) to minimize size
      copy.resultsdirty = true;
      copy.filterPipeline = this.filterPipeline;
      copy.sortFunction = this.sortFunction;
      copy.sortCriteria = this.sortCriteria;
      copy.sortDirty = this.sortDirty;

      // avoid circular reference, reapply in db.loadJSON()
      copy.collection = null;

      return copy;
    };

    /**
     * removeFilters() - Used to clear pipeline and reset dynamic view to initial state.
     *     Existing options should be retained.
     */
    DynamicView.prototype.removeFilters = function () {
      this.rebuildPending = false;
      this.resultset.reset();
      this.resultdata = [];
      this.resultsdirty = false;

      this.cachedresultset = null;

      // keep ordered filter pipeline
      this.filterPipeline = [];

      // sorting member variables
      // we only support one active search, applied using applySort() or applySimpleSort()
      this.sortFunction = null;
      this.sortCriteria = null;
      this.sortDirty = false;
    };

    /**
     * applySort() - Used to apply a sort to the dynamic view
     *
     * @param {function} comparefun - a javascript compare function used for sorting
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     */
    DynamicView.prototype.applySort = function (comparefun) {
      this.sortFunction = comparefun;
      this.sortCriteria = null;

      this.queueSortPhase();

      return this;
    };

    /**
     * applySimpleSort() - Used to specify a property used for view translation.
     *
     * @param {string} propname - Name of property by which to sort.
     * @param {boolean} isdesc - (Optional) If true, the sort will be in descending order.
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     */
    DynamicView.prototype.applySimpleSort = function (propname, isdesc) {
      this.sortCriteria = [
        [propname, isdesc || false]
      ];
      this.sortFunction = null;

      this.queueSortPhase();

      return this;
    };

    /**
     * applySortCriteria() - Allows sorting a resultset based on multiple columns.
     *    Example : dv.applySortCriteria(['age', 'name']); to sort by age and then name (both ascending)
     *    Example : dv.applySortCriteria(['age', ['name', true]); to sort by age (ascending) and then by name (descending)
     *    Example : dv.applySortCriteria(['age', true], ['name', true]); to sort by age (descending) and then by name (descending)
     *
     * @param {array} properties - array of property names or subarray of [propertyname, isdesc] used evaluate sort order
     * @returns {DynamicView} Reference to this DynamicView, sorted, for future chain operations.
     */
    DynamicView.prototype.applySortCriteria = function (criteria) {
      this.sortCriteria = criteria;
      this.sortFunction = null;

      this.queueSortPhase();

      return this;
    };

    /**
     * startTransaction() - marks the beginning of a transaction.
     *
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     */
    DynamicView.prototype.startTransaction = function () {
      this.cachedresultset = this.resultset.copy();

      return this;
    };

    /**
     * commit() - commits a transaction.
     *
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     */
    DynamicView.prototype.commit = function () {
      this.cachedresultset = null;

      return this;
    };

    /**
     * rollback() - rolls back a transaction.
     *
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     */
    DynamicView.prototype.rollback = function () {
      this.resultset = this.cachedresultset;

      if (this.options.persistent) {
        // for now just rebuild the persistent dynamic view data in this worst case scenario
        // (a persistent view utilizing transactions which get rolled back), we already know the filter so not too bad.
        this.resultdata = this.resultset.data();

        this.emit('rebuild', this);
      }

      return this;
    };


    /**
     * Implementation detail.
     * _indexOfFilterWithId() - Find the index of a filter in the pipeline, by that filter's ID.
     *
     * @param {string|number} uid - The unique ID of the filter.
     * @returns {number}: index of the referenced filter in the pipeline; -1 if not found.
     */
    DynamicView.prototype._indexOfFilterWithId = function (uid) {
      if (typeof uid === 'string' || typeof uid === 'number') {
        for (var idx = 0, len = this.filterPipeline.length; idx < len; idx += 1) {
          if (uid === this.filterPipeline[idx].uid) {
            return idx;
          }
        }
      }
      return -1;
    };

    /**
     * Implementation detail.
     * _addFilter() - Add the filter object to the end of view's filter pipeline and apply the filter to the resultset.
     *
     * @param {object} filter - The filter object. Refer to applyFilter() for extra details.
     */
    DynamicView.prototype._addFilter = function (filter) {
      this.filterPipeline.push(filter);
      this.resultset[filter.type](filter.val);
    };

    /**
     * reapplyFilters() - Reapply all the filters in the current pipeline.
     *
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     */
    DynamicView.prototype.reapplyFilters = function () {
      this.resultset.reset();

      this.cachedresultset = null;
      if (this.options.persistent) {
        this.resultdata = [];
        this.resultsdirty = true;
      }

      var filters = this.filterPipeline;
      this.filterPipeline = [];

      for (var idx = 0, len = filters.length; idx < len; idx += 1) {
        this._addFilter(filters[idx]);
      }

      if (this.sortFunction || this.sortCriteria) {
        this.queueSortPhase();
      } else {
        this.queueRebuildEvent();
      }

      return this;
    };

    /**
     * applyFilter() - Adds or updates a filter in the DynamicView filter pipeline
     *
     * @param {object} filter - A filter object to add to the pipeline.
     *    The object is in the format { 'type': filter_type, 'val', filter_param, 'uid', optional_filter_id }
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     */
    DynamicView.prototype.applyFilter = function (filter) {
      var idx = this._indexOfFilterWithId(filter.uid);
      if (idx >= 0) {
        this.filterPipeline[idx] = filter;
        return this.reapplyFilters();
      }

      this.cachedresultset = null;
      if (this.options.persistent) {
        this.resultdata = [];
        this.resultsdirty = true;
      }

      this._addFilter(filter);

      if (this.sortFunction || this.sortCriteria) {
        this.queueSortPhase();
      } else {
        this.queueRebuildEvent();
      }

      return this;
    };

    /**
     * applyFind() - Adds or updates a mongo-style query option in the DynamicView filter pipeline
     *
     * @param {object} query - A mongo-style query object to apply to pipeline
     * @param {string|number} uid - Optional: The unique ID of this filter, to reference it in the future.
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     */
    DynamicView.prototype.applyFind = function (query, uid) {
      this.applyFilter({
        type: 'find',
        val: query,
        uid: uid
      });
      return this;
    };

    /**
     * applyWhere() - Adds or updates a javascript filter function in the DynamicView filter pipeline
     *
     * @param {function} fun - A javascript filter function to apply to pipeline
     * @param {string|number} uid - Optional: The unique ID of this filter, to reference it in the future.
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     */
    DynamicView.prototype.applyWhere = function (fun, uid) {
      this.applyFilter({
        type: 'where',
        val: fun,
        uid: uid
      });
      return this;
    };

    /**
     * removeFilter() - Remove the specified filter from the DynamicView filter pipeline
     *
     * @param {string|number} uid - The unique ID of the filter to be removed.
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     */
    DynamicView.prototype.removeFilter = function (uid) {
      var idx = this._indexOfFilterWithId(uid);
      if (idx < 0) {
        throw new Error("Dynamic view does not contain a filter with ID: " + uid);
      }

      this.filterPipeline.splice(idx, 1);
      this.reapplyFilters();
      return this;
    };

    /**
     * count() - returns the number of documents representing the current DynamicView contents.
     *
     * @returns {number} The number of documents representing the current DynamicView contents.
     */
    DynamicView.prototype.count = function () {
      if (this.options.persistent) {
        return this.resultdata.length;
      }
      return this.resultset.count();
    };

    /**
     * data() - resolves and pending filtering and sorting, then returns document array as result.
     *
     * @returns {array} An array of documents representing the current DynamicView contents.
     */
    DynamicView.prototype.data = function () {
      // using final sort phase as 'catch all' for a few use cases which require full rebuild
      if (this.sortDirty || this.resultsdirty) {
        this.performSortPhase({suppressRebuildEvent: true});
      }
      return (this.options.persistent) ? (this.resultdata) : (this.resultset.data());
    };

    /**
     * queueRebuildEvent() - When the view is not sorted we may still wish to be notified of rebuild events.
     *     This event will throttle and queue a single rebuild event when batches of updates affect the view.
     */
    DynamicView.prototype.queueRebuildEvent = function () {
      if (this.rebuildPending) {
        return;
      }
      this.rebuildPending = true;

      var self = this;
      setTimeout(function () {
        if (self.rebuildPending) {
          self.rebuildPending = false;
          self.emit('rebuild', self);
        }
      }, this.options.minRebuildInterval);
    };

    /**
     * queueSortPhase : If the view is sorted we will throttle sorting to either :
     *    (1) passive - when the user calls data(), or
     *    (2) active - once they stop updating and yield js thread control
     */
    DynamicView.prototype.queueSortPhase = function () {
      // already queued? exit without queuing again
      if (this.sortDirty) {
        return;
      }
      this.sortDirty = true;

      var self = this;
      if (this.options.sortPriority === "active") {
        // active sorting... once they are done and yield js thread, run async performSortPhase()
        setTimeout(function () {
          self.performSortPhase();
        }, this.options.minRebuildInterval);
      } else {
        // must be passive sorting... since not calling performSortPhase (until data call), lets use queueRebuildEvent to
        // potentially notify user that data has changed.
        this.queueRebuildEvent();
      }
    };

    /**
     * performSortPhase() - invoked synchronously or asynchronously to perform final sort phase (if needed)
     *
     */
    DynamicView.prototype.performSortPhase = function (options) {
      // async call to this may have been pre-empted by synchronous call to data before async could fire
      if (!this.sortDirty && !this.resultsdirty) {
        return;
      }

      options = options || {};

      if (this.sortDirty) {
        if (this.sortFunction) {
          this.resultset.sort(this.sortFunction);
        } else if (this.sortCriteria) {
          this.resultset.compoundsort(this.sortCriteria);
        }

        this.sortDirty = false;
      }

      if (this.options.persistent) {
        // persistent view, rebuild local resultdata array
        this.resultdata = this.resultset.data();
        this.resultsdirty = false;
      }

      if (!options.suppressRebuildEvent) {
        this.emit('rebuild', this);
      }
    };

    /**
     * evaluateDocument() - internal method for (re)evaluating document inclusion.
     *    Called by : collection.insert() and collection.update().
     *
     * @param {int} objIndex - index of document to (re)run through filter pipeline.
     * @param {bool} isNew - true if the document was just added to the collection.
     */
    DynamicView.prototype.evaluateDocument = function (objIndex, isNew) {
      var ofr = this.resultset.filteredrows;
      var oldPos = (isNew) ? (-1) : (ofr.indexOf(+objIndex));
      var oldlen = ofr.length;

      // creating a 1-element resultset to run filter chain ops on to see if that doc passes filters;
      // mostly efficient algorithm, slight stack overhead price (this function is called on inserts and updates)
      var evalResultset = new Resultset(this.collection);
      evalResultset.filteredrows = [objIndex];
      evalResultset.filterInitialized = true;
      var filter;
      for (var idx = 0, len = this.filterPipeline.length; idx < len; idx++) {
        filter = this.filterPipeline[idx];
        evalResultset[filter.type](filter.val);
      }

      // not a true position, but -1 if not pass our filter(s), 0 if passed filter(s)
      var newPos = (evalResultset.filteredrows.length === 0) ? -1 : 0;

      // wasn't in old, shouldn't be now... do nothing
      if (oldPos === -1 && newPos === -1) return;

      // wasn't in resultset, should be now... add
      if (oldPos === -1 && newPos !== -1) {
        ofr.push(objIndex);

        if (this.options.persistent) {
          this.resultdata.push(this.collection.data[objIndex]);
        }

        // need to re-sort to sort new document
        if (this.sortFunction || this.sortCriteria) {
          this.queueSortPhase();
        } else {
          this.queueRebuildEvent();
        }

        return;
      }

      // was in resultset, shouldn't be now... delete
      if (oldPos !== -1 && newPos === -1) {
        if (oldPos < oldlen - 1) {
          // http://dvolvr.davidwaterston.com/2013/06/09/restating-the-obvious-the-fastest-way-to-truncate-an-array-in-javascript/comment-page-1/
          ofr[oldPos] = ofr[oldlen - 1];
          ofr.length = oldlen - 1;

          if (this.options.persistent) {
            this.resultdata[oldPos] = this.resultdata[oldlen - 1];
            this.resultdata.length = oldlen - 1;
          }
        } else {
          ofr.length = oldlen - 1;

          if (this.options.persistent) {
            this.resultdata.length = oldlen - 1;
          }
        }

        // in case changes to data altered a sort column
        if (this.sortFunction || this.sortCriteria) {
          this.queueSortPhase();
        } else {
          this.queueRebuildEvent();
        }

        return;
      }

      // was in resultset, should still be now... (update persistent only?)
      if (oldPos !== -1 && newPos !== -1) {
        if (this.options.persistent) {
          // in case document changed, replace persistent view data with the latest collection.data document
          this.resultdata[oldPos] = this.collection.data[objIndex];
        }

        // in case changes to data altered a sort column
        if (this.sortFunction || this.sortCriteria) {
          this.queueSortPhase();
        } else {
          this.queueRebuildEvent();
        }

        return;
      }
    };

    /**
     * removeDocument() - internal function called on collection.delete()
     */
    DynamicView.prototype.removeDocument = function (objIndex) {
      var ofr = this.resultset.filteredrows;
      var oldPos = ofr.indexOf(+objIndex);
      var oldlen = ofr.length;
      var idx;

      if (oldPos !== -1) {
        // if not last row in resultdata, swap last to hole and truncate last row
        if (oldPos < oldlen - 1) {
          ofr[oldPos] = ofr[oldlen - 1];
          ofr.length = oldlen - 1;

          if (this.options.persistent) {
            this.resultdata[oldPos] = this.resultdata[oldlen - 1];
            this.resultdata.length = oldlen - 1;
          }
        }
        // last row, so just truncate last row
        else {
          ofr.length = oldlen - 1;

          if (this.options.persistent) {
            this.resultdata.length = oldlen - 1;
          }
        }

        // in case changes to data altered a sort column
        if (this.sortFunction || this.sortCriteria) {
          this.queueSortPhase();
        } else {
          this.queueRebuildEvent();
        }
      }

      // since we are using filteredrows to store data array positions
      // if they remove a document (whether in our view or not),
      // we need to adjust array positions -1 for all document array references after that position
      oldlen = ofr.length;
      for (idx = 0; idx < oldlen; idx++) {
        if (ofr[idx] > objIndex) {
          ofr[idx]--;
        }
      }
    };

    /**
     * mapReduce() - data transformation via user supplied functions
     *
     * @param {function} mapFunction - this function accepts a single document for you to transform and return
     * @param {function} reduceFunction - this function accepts many (array of map outputs) and returns single value
     * @returns The output of your reduceFunction
     */
    DynamicView.prototype.mapReduce = function (mapFunction, reduceFunction) {
      try {
        return reduceFunction(this.data().map(mapFunction));
      } catch (err) {
        throw err;
      }
    };


    /**
     * @constructor
     * Collection class that handles documents of same type
     * @param {string} collection name
     * @param {array} array of property names to be indicized
     * @param {object} configuration object
     */
    function Collection(name, options) {
      // the name of the collection

      this.name = name;
      // the data held by the collection
      this.data = [];
      this.idIndex = []; // index of id
      this.binaryIndices = {}; // user defined indexes
      this.constraints = {
        unique: {},
        exact: {}
      };

      // unique contraints contain duplicate object references, so they are not persisted.
      // we will keep track of properties which have unique contraint applied here, and regenerate on load
      this.uniqueNames = [];

      // transforms will be used to store frequently used query chains as a series of steps
      // which itself can be stored along with the database.
      this.transforms = {};

      // the object type of the collection
      this.objType = name;

      // in autosave scenarios we will use collection level dirty flags to determine whether save is needed.
      // currently, if any collection is dirty we will autosave the whole database if autosave is configured.
      // defaulting to true since this is called from addCollection and adding a collection should trigger save
      this.dirty = true;

      // private holders for cached data
      this.cachedIndex = null;
      this.cachedBinaryIndex = null;
      this.cachedData = null;
      var self = this;

      /* OPTIONS */
      options = options || {};

      // exact match and unique constraints
      if (options.hasOwnProperty('unique')) {
        if (!Array.isArray(options.unique)) {
          options.unique = [options.unique];
        }
        options.unique.forEach(function (prop) {
          self.uniqueNames.push(prop); // used to regenerate on subsequent database loads
          self.constraints.unique[prop] = new UniqueIndex(prop);
        });
      }

      if (options.hasOwnProperty('exact')) {
        options.exact.forEach(function (prop) {
          self.constraints.exact[prop] = new ExactIndex(prop);
        });
      }

      // is collection transactional
      this.transactional = options.hasOwnProperty('transactional') ? options.transactional : false;

      // options to clone objects when inserting them
      this.cloneObjects = options.hasOwnProperty('clone') ? options.clone : false;

      // default clone method (if enabled) is parse-stringify
      this.cloneMethod = options.hasOwnProperty('clonemethod') ? options.cloneMethod : "parse-stringify";

      // option to make event listeners async, default is sync
      this.asyncListeners = options.hasOwnProperty('asyncListeners') ? options.asyncListeners : false;

      // disable track changes
      this.disableChangesApi = options.hasOwnProperty('disableChangesApi') ? options.disableChangesApi : true;

      // option to observe objects and update them automatically, ignored if Object.observe is not supported
      this.autoupdate = options.hasOwnProperty('autoupdate') ? options.autoupdate : false;

      //option to activate a cleaner daemon - clears "aged" documents at set intervals.
      this.ttl = {
        age: null,
        ttlInterval: null,
        daemon: null
      };
      this.setTTL(options.ttl || -1, options.ttlInterval);

      // currentMaxId - change manually at your own peril!
      this.maxId = 0;

      this.DynamicViews = [];

      // events
      this.events = {
        'insert': [],
        'update': [],
        'pre-insert': [],
        'pre-update': [],
        'close': [],
        'flushbuffer': [],
        'error': [],
        'delete': [],
        'warning': []
      };

      // changes are tracked by collection and aggregated by the db
      this.changes = [];

      // initialize the id index
      this.ensureId();
      var indices = [];
      // initialize optional user-supplied indices array ['age', 'lname', 'zip']
      if (options && options.indices) {
        if (Object.prototype.toString.call(options.indices) === '[object Array]') {
          indices = options.indices;
        } else if (typeof options.indices === 'string') {
          indices = [options.indices];
        } else {
          throw new TypeError('Indices needs to be a string or an array of strings');
        }
      }

      for (var idx = 0; idx < indices.length; idx++) {
        this.ensureIndex(indices[idx]);
      }

      function observerCallback(changes) {

        var changedObjects = typeof Set === 'function' ? new Set() : [];

        if(!changedObjects.add)
          changedObjects.add = function(object) {
            if(this.indexOf(object) === -1)
              this.push(object);
            return this;
          };

        changes.forEach(function (change) {
          changedObjects.add(change.object);
        });

        changedObjects.forEach(function (object) {
          if(!hasOwnProperty.call(object, '$loki'))
            return self.removeAutoUpdateObserver(object);
          try {
            self.update(object);
          } catch(err) {}
        });
      }

      this.observerCallback = observerCallback;

      /**
       * This method creates a clone of the current status of an object and associates operation and collection name,
       * so the parent db can aggregate and generate a changes object for the entire db
       */
      function createChange(name, op, obj) {
        self.changes.push({
          name: name,
          operation: op,
          obj: JSON.parse(JSON.stringify(obj))
        });
      }

      // clear all the changes
      function flushChanges() {
        self.changes = [];
      }

      this.getChanges = function () {
        return self.changes;
      };

      this.flushChanges = flushChanges;

      /**
       * If the changes API is disabled make sure only metadata is added without re-evaluating everytime if the changesApi is enabled
       */
      function insertMeta(obj) {
        if (!obj) {
          return;
        }
        if (!obj.meta) {
          obj.meta = {};
        }

        obj.meta.created = (new Date()).getTime();
        obj.meta.revision = 0;
      }

      function updateMeta(obj) {
        if (!obj) {
          return;
        }
        obj.meta.updated = (new Date()).getTime();
        obj.meta.revision += 1;
      }

      function createInsertChange(obj) {
        createChange(self.name, 'I', obj);
      }

      function createUpdateChange(obj) {
        createChange(self.name, 'U', obj);
      }

      function insertMetaWithChange(obj) {
        insertMeta(obj);
        createInsertChange(obj);
      }

      function updateMetaWithChange(obj) {
        updateMeta(obj);
        createUpdateChange(obj);
      }


      /* assign correct handler based on ChangesAPI flag */
      var insertHandler, updateHandler;

      function setHandlers() {
        insertHandler = self.disableChangesApi ? insertMeta : insertMetaWithChange;
        updateHandler = self.disableChangesApi ? updateMeta : updateMetaWithChange;
      }

      setHandlers();

      this.setChangesApi = function (enabled) {
        self.disableChangesApi = !enabled;
        setHandlers();
      };
      /**
       * built-in events
       */
      this.on('insert', function insertCallback(obj) {
        insertHandler(obj);
      });

      this.on('update', function updateCallback(obj) {
        updateHandler(obj);
      });

      this.on('delete', function deleteCallback(obj) {
        if (!self.disableChangesApi) {
          createChange(self.name, 'R', obj);
        }
      });

      this.on('warning', function (warning) {
        self.console.warn(warning);
      });
      // for de-serialization purposes
      flushChanges();
    }

    Collection.prototype = new LokiEventEmitter();

    Collection.prototype.console = {
      log: function () {},
      warn: function () {},
      error: function () {},
    };

    Collection.prototype.addAutoUpdateObserver = function (object) {
      if(!this.autoupdate || typeof Object.observe !== 'function')
        return;

      Object.observe(object, this.observerCallback, ['add', 'update', 'delete', 'reconfigure', 'setPrototype']);
    };

    Collection.prototype.removeAutoUpdateObserver = function (object) {
      if(!this.autoupdate || typeof Object.observe !== 'function')
        return;

      Object.unobserve(object, this.observerCallback);
    };

    Collection.prototype.addTransform = function (name, transform) {
      if (this.transforms.hasOwnProperty(name)) {
        throw new Error("a transform by that name already exists");
      }

      this.transforms[name] = transform;
    };

    Collection.prototype.setTransform = function (name, transform) {
      this.transforms[name] = transform;
    };

    Collection.prototype.removeTransform = function (name) {
      delete this.transforms[name];
    };

    Collection.prototype.byExample = function (template) {
      var k, obj, query;
      query = [];
      for (k in template) {
        if (!template.hasOwnProperty(k)) continue;
        query.push((
          obj = {},
          obj[k] = template[k],
          obj
        ));
      }
      return {
        '$and': query
      };
    };

    Collection.prototype.findObject = function (template) {
      return this.findOne(this.byExample(template));
    };

    Collection.prototype.findObjects = function (template) {
      return this.find(this.byExample(template));
    };

    /*----------------------------+
    | TTL daemon                  |
    +----------------------------*/
    Collection.prototype.ttlDaemonFuncGen = function () {
      var collection = this;
      var age = this.ttl.age;
      return function ttlDaemon() {
        var now = Date.now();
        var toRemove = collection.chain().where(function daemonFilter(member) {
          var timestamp = member.meta.updated || member.meta.created;
          var diff = now - timestamp;
          return age < diff;
        });
        toRemove.remove();
      };
    };

    Collection.prototype.setTTL = function (age, interval) {
      if (age < 0) {
        clearInterval(this.ttl.daemon);
      }
      else {
        this.ttl.age = age;
        this.ttl.ttlInterval = interval;
        this.ttl.daemon = setInterval(this.ttlDaemonFuncGen(), interval);
      }
    };

    /*----------------------------+
    | INDEXING                    |
    +----------------------------*/

    /**
     * create a row filter that covers all documents in the collection
     */
    Collection.prototype.prepareFullDocIndex = function () {
      var len = this.data.length;
      var indexes = new Array(len);
      for (var i = 0; i < len; i += 1) {
        indexes[i] = i;
      }
      return indexes;
    };

    /**
     * Ensure binary index on a certain field
     */
    Collection.prototype.ensureIndex = function (property, force) {
      // optional parameter to force rebuild whether flagged as dirty or not
      if (typeof (force) === 'undefined') {
        force = false;
      }

      if (property === null || property === undefined) {
        throw new Error('Attempting to set index without an associated property');
      }

      if (this.binaryIndices[property] && !force) {
        if (!this.binaryIndices[property].dirty) return;
      }

      var index = {
        'name': property,
        'dirty': true,
        'values': this.prepareFullDocIndex()
      };
      this.binaryIndices[property] = index;

      var wrappedComparer =
        (function (p, data) {
          return function (a, b) {
            var objAp = data[a][p],
                objBp = data[b][p];
            if (objAp !== objBp) {
              if (ltHelper(objAp, objBp, false)) return -1;
              if (gtHelper(objAp, objBp, false)) return 1;
            }
            return 0;
          };
        })(property, this.data);

      index.values.sort(wrappedComparer);
      index.dirty = false;

      this.dirty = true; // for autosave scenarios
    };

    Collection.prototype.ensureUniqueIndex = function (field) {
      var index = this.constraints.unique[field];
      if (!index) {
        // keep track of new unique index for regenerate after database (re)load.
        if (this.uniqueNames.indexOf(field) == -1) {
          this.uniqueNames.push(field);
        }
        this.constraints.unique[field] = index = new UniqueIndex(field);
      }
      this.data.forEach(function (obj) {
        index.set(obj);
      });
      return index;
    };

    /**
     * Ensure all binary indices
     */
    Collection.prototype.ensureAllIndexes = function (force) {
      var key, bIndices = this.binaryIndices;
      for (key in bIndices) {
        if (hasOwnProperty.call(bIndices, key)) {
          this.ensureIndex(key, force);
        }
      }
    };

    Collection.prototype.flagBinaryIndexesDirty = function () {
      var key, bIndices = this.binaryIndices;
      for (key in bIndices) {
        if (hasOwnProperty.call(bIndices, key)) {
          bIndices[key].dirty = true;
        }
      }
    };

    Collection.prototype.flagBinaryIndexDirty = function (index) {
      if(this.binaryIndices[index])
        this.binaryIndices[index].dirty = true;
    };

    Collection.prototype.count = function (query) {
      if (!query) {
        return this.data.length;
      }

      return this.chain().find(query).filteredrows.length;
    };

    /**
     * Rebuild idIndex
     */
    Collection.prototype.ensureId = function () {
      var len = this.data.length,
        i = 0;

      this.idIndex = [];
      for (i; i < len; i += 1) {
        this.idIndex.push(this.data[i].$loki);
      }
    };

    /**
     * Rebuild idIndex async with callback - useful for background syncing with a remote server
     */
    Collection.prototype.ensureIdAsync = function (callback) {
      this.async(function () {
        this.ensureId();
      }, callback);
    };

    /**
     * Each collection maintains a list of DynamicViews associated with it
     **/

    Collection.prototype.addDynamicView = function (name, options) {
      var dv = new DynamicView(this, name, options);
      this.DynamicViews.push(dv);

      return dv;
    };

    Collection.prototype.removeDynamicView = function (name) {
      for (var idx = 0; idx < this.DynamicViews.length; idx++) {
        if (this.DynamicViews[idx].name === name) {
          this.DynamicViews.splice(idx, 1);
        }
      }
    };

    Collection.prototype.getDynamicView = function (name) {
      for (var idx = 0; idx < this.DynamicViews.length; idx++) {
        if (this.DynamicViews[idx].name === name) {
          return this.DynamicViews[idx];
        }
      }

      return null;
    };

    /**
     * find and update: pass a filtering function to select elements to be updated
     * and apply the updatefunctino to those elements iteratively
     */
    Collection.prototype.findAndUpdate = function (filterFunction, updateFunction) {
      var results = this.where(filterFunction),
        i = 0,
        obj;
      try {
        for (i; i < results.length; i++) {
          obj = updateFunction(results[i]);
          this.update(obj);
        }

      } catch (err) {
        this.rollback();
        this.console.error(err.message);
      }
    };

    /**
     * generate document method - ensure object(s) have meta properties, clone it if necessary, etc.
     * @param {object} doc: the document to be inserted (or an array of objects)
     * @returns document or documents (if passed an array of objects)
     */
    Collection.prototype.insert = function (doc) {
      if (!Array.isArray(doc)) {
        return this.insertOne(doc);
      }

      // holder to the clone of the object inserted if collections is set to clone objects
      var obj;
      var results = [];
      for (var i = 0, len = doc.length; i < len; i++) {
        obj = this.insertOne(doc[i]);
        if (!obj) {
          return undefined;
        }
        results.push(obj);
      }
      return results.length === 1 ? results[0] : results;
    };

    /**
     * generate document method - ensure object has meta properties, clone it if necessary, etc.
     * @param {object} the document to be inserted
     * @returns document or 'undefined' if there was a problem inserting it
     */
    Collection.prototype.insertOne = function (doc) {
      var err = null;
      if (typeof doc !== 'object') {
        err = new TypeError('Document needs to be an object');
      } else if (doc === null) {
        err = new TypeError('Object cannot be null');
      }

      if (err !== null) {
        this.emit('error', err);
        throw err;
      }

      // if configured to clone, do so now... otherwise just use same obj reference
      var obj = this.cloneObjects ? clone(doc, this.cloneMethod) : doc;

      if (typeof obj.meta === 'undefined') {
        obj.meta = {
          revision: 0,
          created: 0
        };
      }

      this.emit('pre-insert', obj);
      if (!this.add(obj)) {
        return undefined;
      }

      this.addAutoUpdateObserver(obj);
      this.emit('insert', obj);
      return obj;
    };

    Collection.prototype.clear = function () {
      this.data = [];
      this.idIndex = [];
      this.binaryIndices = {};
      this.cachedIndex = null;
      this.cachedBinaryIndex = null;
      this.cachedData = null;
      this.maxId = 0;
      this.DynamicViews = [];
      this.dirty = true;
    };

    /**
     * Update method
     */
    Collection.prototype.update = function (doc) {
      this.flagBinaryIndexesDirty();

      if (Array.isArray(doc)) {
        var k = 0,
          len = doc.length;
        for (k; k < len; k += 1) {
          this.update(doc[k]);
        }
        return;
      }

      // verify object is a properly formed document
      if (!hasOwnProperty.call(doc, '$loki')) {
        throw new Error('Trying to update unsynced document. Please save the document first by using insert() or addMany()');
      }
      try {
        this.startTransaction();
        var arr = this.get(doc.$loki, true),
          obj,
          position,
          self = this;

        if (!arr) {
          throw new Error('Trying to update a document not in collection.');
        }
        this.emit('pre-update', doc);

        obj = arr[0];

        Object.keys(this.constraints.unique).forEach(function (key) {
          self.constraints.unique[key].update(obj);
        });

        // get current position in data array
        position = arr[1];

        // operate the update
        this.data[position] = doc;

        if(obj !== doc) {
          this.addAutoUpdateObserver(doc);
        }

        // now that we can efficiently determine the data[] position of newly added document,
        // submit it for all registered DynamicViews to evaluate for inclusion/exclusion
        for (var idx = 0; idx < this.DynamicViews.length; idx++) {
          this.DynamicViews[idx].evaluateDocument(position, false);
        }

        this.idIndex[position] = obj.$loki;

        this.commit();
        this.dirty = true; // for autosave scenarios
        this.emit('update', doc);
        return doc;
      } catch (err) {
        this.rollback();
        this.console.error(err.message);
        this.emit('error', err);
        throw (err); // re-throw error so user does not think it succeeded
      }
    };

    /**
     * Add object to collection
     */
    Collection.prototype.add = function (obj) {
      // if parameter isn't object exit with throw
      if ('object' !== typeof obj) {
        throw new TypeError('Object being added needs to be an object');
      }
      // if object you are adding already has id column it is either already in the collection
      // or the object is carrying its own 'id' property.  If it also has a meta property,
      // then this is already in collection so throw error, otherwise rename to originalId and continue adding.
      if (typeof(obj.$loki) !== 'undefined') {
        throw new Error('Document is already in collection, please use update()');
      }

      this.flagBinaryIndexesDirty();

      /*
       * try adding object to collection
       */
      try {
        this.startTransaction();
        this.maxId++;

        if (isNaN(this.maxId)) {
          this.maxId = (this.data[this.data.length - 1].$loki + 1);
        }

        obj.$loki = this.maxId;
        obj.meta.version = 0;

        var key, constrUnique = this.constraints.unique;
        for (key in constrUnique) {
          if (hasOwnProperty.call(constrUnique, key)) {
            constrUnique[key].set(obj);
          }
        }

        // add new obj id to idIndex
        this.idIndex.push(obj.$loki);

        // add the object
        this.data.push(obj);

        // now that we can efficiently determine the data[] position of newly added document,
        // submit it for all registered DynamicViews to evaluate for inclusion/exclusion
        var addedPos = this.data.length - 1;
        var dvlen = this.DynamicViews.length;
        for (var i = 0; i < dvlen; i++) {
          this.DynamicViews[i].evaluateDocument(addedPos, true);
        }

        this.commit();
        this.dirty = true; // for autosave scenarios

        return (this.cloneObjects) ? (clone(obj, this.cloneMethod)) : (obj);
      } catch (err) {
        this.rollback();
        this.console.error(err.message);
      }
    };


    Collection.prototype.removeWhere = function (query) {
      var list;
      if (typeof query === 'function') {
        list = this.data.filter(query);
      } else {
        list = new Resultset(this, {
          queryObj: query
        });
      }
      this.remove(list);
    };

    Collection.prototype.removeDataOnly = function () {
      this.remove(this.data.slice());
    };

    /**
     * delete wrapped
     */
    Collection.prototype.remove = function (doc) {
      if (typeof doc === 'number') {
        doc = this.get(doc);
      }

      if ('object' !== typeof doc) {
        throw new Error('Parameter is not an object');
      }
      if (Array.isArray(doc)) {
        var k = 0,
          len = doc.length;
        for (k; k < len; k += 1) {
          this.remove(doc[k]);
        }
        return;
      }

      if (!hasOwnProperty.call(doc, '$loki')) {
        throw new Error('Object is not a document stored in the collection');
      }

      this.flagBinaryIndexesDirty();

      try {
        this.startTransaction();
        var arr = this.get(doc.$loki, true),
          // obj = arr[0],
          position = arr[1];
        var self = this;
        Object.keys(this.constraints.unique).forEach(function (key) {
          if (doc[key] !== null && typeof doc[key] !== 'undefined') {
            self.constraints.unique[key].remove(doc[key]);
          }
        });
        // now that we can efficiently determine the data[] position of newly added document,
        // submit it for all registered DynamicViews to remove
        for (var idx = 0; idx < this.DynamicViews.length; idx++) {
          this.DynamicViews[idx].removeDocument(position);
        }

        this.data.splice(position, 1);
        this.removeAutoUpdateObserver(doc);

        // remove id from idIndex
        this.idIndex.splice(position, 1);

        this.commit();
        this.dirty = true; // for autosave scenarios
        this.emit('delete', arr[0]);
        delete doc.$loki;
        delete doc.meta;
        return doc;

      } catch (err) {
        this.rollback();
        this.console.error(err.message);
        this.emit('error', err);
        return null;
      }
    };

    /*---------------------+
    | Finding methods     |
    +----------------------*/

    /**
     * Get by Id - faster than other methods because of the searching algorithm
     */
    Collection.prototype.get = function (id, returnPosition) {
      var retpos = returnPosition || false,
          data = this.idIndex,
          max = data.length - 1,
          min = 0,
          mid = (min + max) >> 1;

      id = typeof id === 'number' ? id : parseInt(id, 10);

      if (isNaN(id)) {
        throw new TypeError('Passed id is not an integer');
      }

      while (data[min] < data[max]) {
        mid = (min + max) >> 1;

        if (data[mid] < id) {
          min = mid + 1;
        } else {
          max = mid;
        }
      }

      if (max === min && data[min] === id) {
        if (retpos) {
          return [this.data[min], min];
        }
        return this.data[min];
      }
      return null;

    };

    Collection.prototype.by = function (field, value) {
      var self;
      if (!value) {
        self = this;
        return function (value) {
          return self.by(field, value);
        };
      }

      var result = this.constraints.unique[field].get(value);
      if (!this.cloneObjects) {
        return result;
      }
      else {
        return clone(result, this.cloneMethod);
      }
    };

    /**
     * Find one object by index property, by property equal to value
     */
    Collection.prototype.findOne = function (query) {
      // Instantiate Resultset and exec find op passing firstOnly = true param
      var result = new Resultset(this, {
        queryObj: query,
        firstOnly: true
      });
      if (Array.isArray(result) && result.length === 0) {
        return null;
      } else {
        if (!this.cloneObjects) {
          return result;
        }
        else {
          return clone(result, this.cloneMethod);
        }
      }
    };

    /**
     * Chain method, used for beginning a series of chained find() and/or view() operations
     * on a collection.
     *
     * @param {array} transform : Ordered array of transform step objects similar to chain
     * @param {object} parameters: Object containing properties representing parameters to substitute
     * @returns {Resultset} : (or data array if any map or join functions where called)
     */
    Collection.prototype.chain = function (transform, parameters) {
      var rs = new Resultset(this);

      if (typeof transform === 'undefined') {
        return rs;
      }

      return rs.transform(transform, parameters);
    };

    /**
     * Find method, api is similar to mongodb except for now it only supports one search parameter.
     * for more complex queries use view() and storeView()
     */
    Collection.prototype.find = function (query) {
      if (typeof (query) === 'undefined') {
        query = 'getAll';
      }

      var results = new Resultset(this, {
        queryObj: query
      });
      if (!this.cloneObjects) {
        return results;
      }
      else {
        return cloneObjectArray(results, this.cloneMethod);
      }
    };

    /**
     * Find object by unindexed field by property equal to value,
     * simply iterates and returns the first element matching the query
     */
    Collection.prototype.findOneUnindexed = function (prop, value) {
      var i = this.data.length,
        doc;
      while (i--) {
        if (this.data[i][prop] === value) {
          doc = this.data[i];
          return doc;
        }
      }
      return null;
    };

    /**
     * Transaction methods
     */

    /** start the transation */
    Collection.prototype.startTransaction = function () {
      if (this.transactional) {
        this.cachedData = clone(this.data, this.cloneMethod);
        this.cachedIndex = this.idIndex;
        this.cachedBinaryIndex = this.binaryIndices;

        // propagate startTransaction to dynamic views
        for (var idx = 0; idx < this.DynamicViews.length; idx++) {
          this.DynamicViews[idx].startTransaction();
        }
      }
    };

    /** commit the transation */
    Collection.prototype.commit = function () {
      if (this.transactional) {
        this.cachedData = null;
        this.cachedIndex = null;
        this.cachedBinaryIndex = null;

        // propagate commit to dynamic views
        for (var idx = 0; idx < this.DynamicViews.length; idx++) {
          this.DynamicViews[idx].commit();
        }
      }
    };

    /** roll back the transation */
    Collection.prototype.rollback = function () {
      if (this.transactional) {
        if (this.cachedData !== null && this.cachedIndex !== null) {
          this.data = this.cachedData;
          this.idIndex = this.cachedIndex;
          this.binaryIndices = this.cachedBinaryIndex;
        }

        // propagate rollback to dynamic views
        for (var idx = 0; idx < this.DynamicViews.length; idx++) {
          this.DynamicViews[idx].rollback();
        }
      }
    };

    // async executor. This is only to enable callbacks at the end of the execution.
    Collection.prototype.async = function (fun, callback) {
      setTimeout(function () {
        if (typeof fun === 'function') {
          fun();
          callback();
        } else {
          throw new TypeError('Argument passed for async execution is not a function');
        }
      }, 0);
    };

    /**
     * Create view function - filter
     */
    Collection.prototype.where = function (fun) {
      var results = new Resultset(this, {
        queryFunc: fun
      });
      if (!this.cloneObjects) {
        return results;
      }
      else {
        return cloneObjectArray(results, this.cloneMethod);
      }
    };

    /**
     * Map Reduce
     */
    Collection.prototype.mapReduce = function (mapFunction, reduceFunction) {
      try {
        return reduceFunction(this.data.map(mapFunction));
      } catch (err) {
        throw err;
      }
    };

    /**
     * eqJoin - Join two collections on specified properties
     */
    Collection.prototype.eqJoin = function (joinData, leftJoinProp, rightJoinProp, mapFun) {
      // logic in Resultset class
      return new Resultset(this).eqJoin(joinData, leftJoinProp, rightJoinProp, mapFun);
    };

    /* ------ STAGING API -------- */
    /**
     * stages: a map of uniquely identified 'stages', which hold copies of objects to be
     * manipulated without affecting the data in the original collection
     */
    Collection.prototype.stages = {};

    /**
     * create a stage and/or retrieve it
     */
    Collection.prototype.getStage = function (name) {
      if (!this.stages[name]) {
        this.stages[name] = {};
      }
      return this.stages[name];
    };
    /**
     * a collection of objects recording the changes applied through a commmitStage
     */
    Collection.prototype.commitLog = [];

    /**
     * create a copy of an object and insert it into a stage
     */
    Collection.prototype.stage = function (stageName, obj) {
      var copy = JSON.parse(JSON.stringify(obj));
      this.getStage(stageName)[obj.$loki] = copy;
      return copy;
    };

    /**
     * re-attach all objects to the original collection, so indexes and views can be rebuilt
     * then create a message to be inserted in the commitlog
     */
    Collection.prototype.commitStage = function (stageName, message) {
      var stage = this.getStage(stageName),
        prop,
        timestamp = new Date().getTime();

      for (prop in stage) {

        this.update(stage[prop]);
        this.commitLog.push({
          timestamp: timestamp,
          message: message,
          data: JSON.parse(JSON.stringify(stage[prop]))
        });
      }
      this.stages[stageName] = {};
    };

    Collection.prototype.no_op = function () {
      return;
    };

    Collection.prototype.extract = function (field) {
      var i = 0,
        len = this.data.length,
        isDotNotation = isDeepProperty(field),
        result = [];
      for (i; i < len; i += 1) {
        result.push(deepProperty(this.data[i], field, isDotNotation));
      }
      return result;
    };

    Collection.prototype.max = function (field) {
      return Math.max.apply(null, this.extract(field));
    };

    Collection.prototype.min = function (field) {
      return Math.min.apply(null, this.extract(field));
    };

    Collection.prototype.maxRecord = function (field) {
      var i = 0,
        len = this.data.length,
        deep = isDeepProperty(field),
        result = {
          index: 0,
          value: undefined
        },
        max;

      for (i; i < len; i += 1) {
        if (max !== undefined) {
          if (max < deepProperty(this.data[i], field, deep)) {
            max = deepProperty(this.data[i], field, deep);
            result.index = this.data[i].$loki;
          }
        } else {
          max = deepProperty(this.data[i], field, deep);
          result.index = this.data[i].$loki;
        }
      }
      result.value = max;
      return result;
    };

    Collection.prototype.minRecord = function (field) {
      var i = 0,
        len = this.data.length,
        deep = isDeepProperty(field),
        result = {
          index: 0,
          value: undefined
        },
        min;

      for (i; i < len; i += 1) {
        if (min !== undefined) {
          if (min > deepProperty(this.data[i], field, deep)) {
            min = deepProperty(this.data[i], field, deep);
            result.index = this.data[i].$loki;
          }
        } else {
          min = deepProperty(this.data[i], field, deep);
          result.index = this.data[i].$loki;
        }
      }
      result.value = min;
      return result;
    };

    Collection.prototype.extractNumerical = function (field) {
      return this.extract(field).map(parseBase10).filter(Number).filter(function (n) {
        return !(isNaN(n));
      });
    };

    Collection.prototype.avg = function (field) {
      return average(this.extractNumerical(field));
    };

    Collection.prototype.stdDev = function (field) {
      return standardDeviation(this.extractNumerical(field));
    };

    Collection.prototype.mode = function (field) {
      var dict = {},
        data = this.extract(field);
      data.forEach(function (obj) {
        if (dict[obj]) {
          dict[obj] += 1;
        } else {
          dict[obj] = 1;
        }
      });
      var max,
        prop, mode;
      for (prop in dict) {
        if (max) {
          if (max < dict[prop]) {
            mode = prop;
          }
        } else {
          mode = prop;
          max = dict[prop];
        }
      }
      return mode;
    };

    Collection.prototype.median = function (field) {
      var values = this.extractNumerical(field);
      values.sort(sub);

      var half = Math.floor(values.length / 2);

      if (values.length % 2) {
        return values[half];
      } else {
        return (values[half - 1] + values[half]) / 2.0;
      }
    };

    /**
     * General utils, including statistical functions
     */
    function isDeepProperty(field) {
      return field.indexOf('.') !== -1;
    }

    function parseBase10(num) {
      return parseFloat(num, 10);
    }

    function isNotUndefined(obj) {
      return obj !== undefined;
    }

    function add(a, b) {
      return a + b;
    }

    function sub(a, b) {
      return a - b;
    }

    function median(values) {
      values.sort(sub);
      var half = Math.floor(values.length / 2);
      return (values.length % 2) ? values[half] : ((values[half - 1] + values[half]) / 2.0);
    }

    function average(array) {
      return (array.reduce(add, 0)) / array.length;
    }

    function standardDeviation(values) {
      var avg = average(values);
      var squareDiffs = values.map(function (value) {
        var diff = value - avg;
        var sqrDiff = diff * diff;
        return sqrDiff;
      });

      var avgSquareDiff = average(squareDiffs);

      var stdDev = Math.sqrt(avgSquareDiff);
      return stdDev;
    }

    function deepProperty(obj, property, isDeep) {
      if (isDeep === false) {
        // pass without processing
        return obj[property];
      }
      var pieces = property.split('.'),
        root = obj;
      while (pieces.length > 0) {
        root = root[pieces.shift()];
      }
      return root;
    }

    function binarySearch(array, item, fun) {
      var lo = 0,
        hi = array.length,
        compared,
        mid;
      while (lo < hi) {
        mid = (lo + hi) >> 1;
        compared = fun.apply(null, [item, array[mid]]);
        if (compared === 0) {
          return {
            found: true,
            index: mid
          };
        } else if (compared < 0) {
          hi = mid;
        } else {
          lo = mid + 1;
        }
      }
      return {
        found: false,
        index: hi
      };
    }

    function BSonSort(fun) {
      return function (array, item) {
        return binarySearch(array, item, fun);
      };
    }

    function KeyValueStore() {}

    KeyValueStore.prototype = {
      keys: [],
      values: [],
      sort: function (a, b) {
        return (a < b) ? -1 : ((a > b) ? 1 : 0);
      },
      setSort: function (fun) {
        this.bs = new BSonSort(fun);
      },
      bs: function () {
        return new BSonSort(this.sort);
      },
      set: function (key, value) {
        var pos = this.bs(this.keys, key);
        if (pos.found) {
          this.values[pos.index] = value;
        } else {
          this.keys.splice(pos.index, 0, key);
          this.values.splice(pos.index, 0, value);
        }
      },
      get: function (key) {
        return this.values[binarySearch(this.keys, key, this.sort).index];
      }
    };

    function UniqueIndex(uniqueField) {
      this.field = uniqueField;
      this.keyMap = {};
      this.lokiMap = {};
    }
    UniqueIndex.prototype.keyMap = {};
    UniqueIndex.prototype.lokiMap = {};
    UniqueIndex.prototype.set = function (obj) {
      var fieldValue = obj[this.field];
      if (fieldValue !== null && typeof (fieldValue) !== 'undefined') {
        if (this.keyMap[fieldValue]) {
          throw new Error('Duplicate key for property ' + this.field + ': ' + fieldValue);
        } else {
          this.keyMap[fieldValue] = obj;
          this.lokiMap[obj.$loki] = fieldValue;
        }
      }
    };
    UniqueIndex.prototype.get = function (key) {
      return this.keyMap[key];
    };

    UniqueIndex.prototype.byId = function (id) {
      return this.keyMap[this.lokiMap[id]];
    };
    UniqueIndex.prototype.update = function (obj) {
      if (this.lokiMap[obj.$loki] !== obj[this.field]) {
        var old = this.lokiMap[obj.$loki];
        this.set(obj);
        // make the old key fail bool test, while avoiding the use of delete (mem-leak prone)
        this.keyMap[old] = undefined;
      } else {
        this.keyMap[obj[this.field]] = obj;
      }
    };
    UniqueIndex.prototype.remove = function (key) {
      var obj = this.keyMap[key];
      if (obj !== null && typeof obj !== 'undefined') {
        this.keyMap[key] = undefined;
        this.lokiMap[obj.$loki] = undefined;
      } else {
        throw new Error('Key is not in unique index: ' + this.field);
      }
    };
    UniqueIndex.prototype.clear = function () {
      this.keyMap = {};
      this.lokiMap = {};
    };

    function ExactIndex(exactField) {
      this.index = {};
      this.field = exactField;
    }

    // add the value you want returned to the key in the index
    ExactIndex.prototype = {
      set: function add(key, val) {
        if (this.index[key]) {
          this.index[key].push(val);
        } else {
          this.index[key] = [val];
        }
      },

      // remove the value from the index, if the value was the last one, remove the key
      remove: function remove(key, val) {
        var idxSet = this.index[key];
        for (var i in idxSet) {
          if (idxSet[i] == val) {
            idxSet.splice(i, 1);
          }
        }
        if (idxSet.length < 1) {
          this.index[key] = undefined;
        }
      },

      // get the values related to the key, could be more than one
      get: function get(key) {
        return this.index[key];
      },

      // clear will zap the index
      clear: function clear(key) {
        this.index = {};
      }
    };

    function SortedIndex(sortedField) {
      this.field = sortedField;
    }

    SortedIndex.prototype = {
      keys: [],
      values: [],
      // set the default sort
      sort: function (a, b) {
        return (a < b) ? -1 : ((a > b) ? 1 : 0);
      },
      bs: function () {
        return new BSonSort(this.sort);
      },
      // and allow override of the default sort
      setSort: function (fun) {
        this.bs = new BSonSort(fun);
      },
      // add the value you want returned  to the key in the index
      set: function (key, value) {
        var pos = binarySearch(this.keys, key, this.sort);
        if (pos.found) {
          this.values[pos.index].push(value);
        } else {
          this.keys.splice(pos.index, 0, key);
          this.values.splice(pos.index, 0, [value]);
        }
      },
      // get all values which have a key == the given key
      get: function (key) {
        var bsr = binarySearch(this.keys, key, this.sort);
        if (bsr.found) {
          return this.values[bsr.index];
        } else {
          return [];
        }
      },
      // get all values which have a key < the given key
      getLt: function (key) {
        var bsr = binarySearch(this.keys, key, this.sort);
        var pos = bsr.index;
        if (bsr.found) pos--;
        return this.getAll(key, 0, pos);
      },
      // get all values which have a key > the given key
      getGt: function (key) {
        var bsr = binarySearch(this.keys, key, this.sort);
        var pos = bsr.index;
        if (bsr.found) pos++;
        return this.getAll(key, pos, this.keys.length);
      },

      // get all vals from start to end
      getAll: function (key, start, end) {
        var results = [];
        for (var i = start; i < end; i++) {
          results = results.concat(this.values[i]);
        }
        return results;
      },
      // just in case someone wants to do something smart with ranges
      getPos: function (key) {
        return binarySearch(this.keys, key, this.sort);
      },
      // remove the value from the index, if the value was the last one, remove the key
      remove: function (key, value) {
        var pos = binarySearch(this.keys, key, this.sort).index;
        var idxSet = this.values[pos];
        for (var i in idxSet) {
          if (idxSet[i] == value) idxSet.splice(i, 1);
        }
        if (idxSet.length < 1) {
          this.keys.splice(pos, 1);
          this.values.splice(pos, 1);
        }
      },
      // clear will zap the index
      clear: function () {
        this.keys = [];
        this.values = [];
      }
    };


    Loki.LokiOps = LokiOps;
    Loki.Collection = Collection;
    Loki.KeyValueStore = KeyValueStore;
    return Loki;
  }());

}));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./loki-indexed-adapter.js":20,"fs":74}],22:[function(require,module,exports){
'use strict';

Array.prototype.uniq = function() {
  var u = {}, a = [];
  for (var i = 0, l = this.length; i < l; ++i) {
    if (Object.prototype.hasOwnProperty.call(u, this[i])) {
      continue;
    }
    a.push(this[i]);
    u[this[i]] = 1;
  }
  return a;
};

function _add(trie, array) {
  var i, j, node, prevNode, values, goRecursive;
  node = trie;
  goRecursive = false;
  // go through permission string array
  for (i = 0; i < array.length; i++) {
    // split by comma
    values = array[i].split(',');
    // default: only once (no comma separation)
    for (j = 0; j < values.length; j++) {
      // permission is new -> create
      if (!node.hasOwnProperty(values[j])) {
        node[values[j]] = {};
      }
      if (values.length > 1) {
        // if we have a comma separated permission list, we have to go recursive
        // save the remaining permission array (subTrie has to be appended to each one)
        goRecursive = goRecursive || array.slice(i + 1);
        // call recursion for this subTrie
        node[values[j]] = _add(node[values[j]], goRecursive);
        // break outer loop
        i = array.length;
      } else {
        // if we don't need recursion, we just go deeper
        prevNode = node;
        node = node[values[j]];
      }
    }
  }
  // if we did not went recursive, we close the Trie with a * leaf
  if (!goRecursive && (!prevNode || !prevNode.hasOwnProperty('*'))) {
    node['*'] = {};
  }
  return trie;
}

function _check(trie, array) {
  var i, node;
  node = trie;
  // add implicit star at the end
  if (array.length < 1 || array[array.length - 1] !== '*') {
    array.push('*');
  }
  for (i = 0; i < array.length; i++) {
    if (node.hasOwnProperty('*')) {
      // if we find a star leaf in the trie, we are done (everything below is allowed)
      if (Object.keys(node['*']).length === 0) {
        return true;
      }
      // otherwise we have to go deeper
      node = node['*'];
    } else {
      // if the wanted permission is not found, we return false
      if (!node.hasOwnProperty(array[i])) {
        return false;
      }
      // otherwise we go deeper
      node = node[array[i]];
    }
  }
  // word (array) was found in the trie. all good!
  return true;
}

function _permissions(trie, array) {
  var current, results;
  if (!trie || !array ||
    typeof(trie) !== 'object' || !Array.isArray(array) ||
    Object.keys(trie).length < 1 || array.length < 1) {
    // for recursion safety, we make sure we have really valid values
    return [];
  }
  // if we have a star permission, we can just return that
  if (trie.hasOwnProperty('*')) {
    return ['*'];
  }
  // take first element from array
  current = array.shift();
  // the requested part
  if (current === '?') {
    results = Object.keys(trie);
    // if something is coming after the ?,
    // we have to check permission and remove those that are not allowed
    if (array.length > 0 && array[0] !== '$') {
      results = results.filter(function(node) {
        return _check(trie[node], array);
      });
    }
    return results;
  }
  // if we have an 'any' flag, we have to go recursive for all alternatives
  if (current === '$') {
    results = [];
    Object.keys(trie).forEach(function concatPermissions(node) {
      results = results.concat(_permissions(trie[node], [].concat(array)));
    });
    // remove duplicates
    var uniq = results.uniq();
    // … and * from results
    for (var i = uniq.length - 1; i >= 0; i--) {
      if (uniq[i] === '*') {
        uniq.splice(i, 1);
      }
    }
    return uniq;
  }
  if (trie.hasOwnProperty(current)) {
    // we have to go deeper!
    return _permissions(trie[current], array);
  }
  return [];
}

function _expand(permission) {
  var results = [];
  var parts = permission.split(':');
  var i, alternatives;
  for (i = 0; i < parts.length; i++) {
    alternatives = parts[i].split(',');
    if (results.length === 0) {
      results = alternatives;
    } else {
      alternatives = alternatives.map(function(alternative) {
        return results.map(function(perm) {
          return perm + ':' + alternative;
        }, this);
      }, this);
      results = [].concat.apply([], alternatives.uniq());
    }
  }
  return results;
}

/**
 * Retuns a new ShiroTrie instance
 * @returns {ShiroTrie}
 * @constructor
 */
var ShiroTrie = function() {
  this.data = {};
  return this;
};

/**
 * removes all data from the Trie (clean startup)
 * @returns {ShiroTrie}
 */
ShiroTrie.prototype.reset = function() {
  this.data = {};
  return this;
};

/**
 * Add one or more permissions to the Trie
 * @param {...string|...Array} args - Any number of permission string(s) or String Array(s)
 * @returns {ShiroTrie}
 */
ShiroTrie.prototype.add = function() {
  var args = [].concat.apply([], arguments);
  var arg;
  for (arg in args) {
    if (args.hasOwnProperty(arg) && typeof(args[arg]) === 'string') {
      this.data = _add(this.data, args[arg].split(':'));
    }
  }
  return this;
};

/**
 * check if a specific permission is allowed in the current Trie.
 * @param string The string to check. Should not contain * – always check for the most explicit permission
 * @returns {*}
 */
ShiroTrie.prototype.check = function(string) {
  if (typeof(string) !== 'string') {
    return false;
  }
  if (string.indexOf(',') !== -1) { // expand string to single comma-less permissions...
    return _expand(string).map(function(permission) {
      return _check(this.data, permission.split(':'));
    }, this).every(Boolean); // ... and make sure they are all allowed
  }
  return _check(this.data, string.split(':'));
};

/**
 * return the Trie data
 * @returns {{}|*}
 */
ShiroTrie.prototype.get = function() {
  return this.data;
};

/**
 * check what permissions a certain Trie part contains
 * @param string String to check – should contain exactly one ?. Also possible is usage of the any ($) parameter. See
 *   docs for details.
 * @returns {*}
 */
ShiroTrie.prototype.permissions = function(string) {
  if (typeof(string) !== 'string') {
    return [];
  }
  return _permissions(this.data, string.split(':'));
};

module.exports = {
  new: function() {
    return new ShiroTrie();
  },
  _expand: _expand,
};

},{}],23:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var reduce = require('reduce');
var requestBase = require('./request-base');
var isObject = require('./is-object');

/**
 * Root reference for iframes.
 */

var root;
if (typeof window !== 'undefined') { // Browser window
  root = window;
} else if (typeof self !== 'undefined') { // Web Worker
  root = self;
} else { // Other environments
  root = this;
}

/**
 * Noop.
 */

function noop(){};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Expose `request`.
 */

var request = module.exports = require('./request').bind(null, Request);

/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest
      && (!root.location || 'file:' != root.location.protocol
          || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
};

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pushEncodedKeyValuePair(pairs, key, obj[key]);
        }
      }
  return pairs.join('&');
}

/**
 * Helps 'serialize' with serializing arrays.
 * Mutates the pairs array.
 *
 * @param {Array} pairs
 * @param {String} key
 * @param {Mixed} val
 */

function pushEncodedKeyValuePair(pairs, key, val) {
  if (Array.isArray(val)) {
    return val.forEach(function(v) {
      pushEncodedKeyValuePair(pairs, key, v);
    });
  }
  pairs.push(encodeURIComponent(key)
    + '=' + encodeURIComponent(val));
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Check if `mime` is json or has +json structured syntax suffix.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api private
 */

function isJSON(mime) {
  return /[\/+]json\b/.test(mime);
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  // responseText is accessible only if responseType is '' or 'text' and on older browsers
  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
     ? this.xhr.responseText
     : null;
  this.statusText = this.req.xhr.statusText;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this.parseBody(this.text ? this.text : this.xhr.response)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = request.parse[this.type];
  if (!parse && isJSON(this.type)) {
    parse = request.parse['application/json'];
  }
  return parse && str && (str.length || str instanceof Object)
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) {
    status = 204;
  }

  var type = status / 100 | 0;

  // status / class
  this.status = this.statusCode = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {}; // preserves header name case
  this._header = {}; // coerces header names to lowercase
  this.on('end', function(){
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      // issue #675: return the raw response if the response parsing fails
      err.rawResponse = self.xhr && self.xhr.responseText ? self.xhr.responseText : null;
      // issue #876: return the http status code if the response parsing fails
      err.statusCode = self.xhr && self.xhr.status ? self.xhr.status : null;
      return self.callback(err);
    }

    self.emit('response', res);

    if (err) {
      return self.callback(err, res);
    }

    if (res.status >= 200 && res.status < 300) {
      return self.callback(err, res);
    }

    var new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
    new_err.original = err;
    new_err.response = res;
    new_err.status = res.status;

    self.callback(new_err, res);
  });
}

/**
 * Mixin `Emitter` and `requestBase`.
 */

Emitter(Request.prototype);
for (var key in requestBase) {
  Request.prototype[key] = requestBase[key];
}

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set responseType to `val`. Presently valid responseTypes are 'blob' and 
 * 'arraybuffer'.
 *
 * Examples:
 *
 *      req.get('/')
 *        .responseType('blob')
 *        .end(callback);
 *
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.responseType = function(val){
  this._responseType = val;
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @param {Object} options with 'type' property 'auto' or 'basic' (default 'basic')
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass, options){
  if (!options) {
    options = {
      type: 'basic'
    }
  }

  switch (options.type) {
    case 'basic':
      var str = btoa(user + ':' + pass);
      this.set('Authorization', 'Basic ' + str);
    break;

    case 'auto':
      this.username = user;
      this.password = pass;
    break;
  }
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `filename`.
 *
 * ``` js
 * request.post('/upload')
 *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String} filename
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, filename){
  this._getFormData().append(field, file, filename || file.name);
  return this;
};

Request.prototype._getFormData = function(){
  if (!this._formData) {
    this._formData = new root.FormData();
  }
  return this._formData;
};

/**
 * Send `data` as the request body, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"}')
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this._header['content-type'];

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this._header['content-type'];
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj || isHost(data)) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * @deprecated
 */
Response.prototype.parse = function serialize(fn){
  if (root.console) {
    console.warn("Client-side parse() method has been renamed to serialize(). This method is not compatible with superagent v2.0");
  }
  this.serialize(fn);
  return this;
};

Response.prototype.serialize = function serialize(fn){
  this._parser = fn;
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  this.clearTimeout();
  fn(err, res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
  err.crossDomain = true;

  err.status = this.status;
  err.method = this.method;
  err.url = this.url;

  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = request.getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._formData || this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;

    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"
    var status;
    try { status = xhr.status } catch(e) { status = 0; }

    if (0 == status) {
      if (self.timedout) return self.timeoutError();
      if (self.aborted) return;
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  var handleProgress = function(e){
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;
    }
    e.direction = 'download';
    self.emit('progress', e);
  };
  if (this.hasListeners('progress')) {
    xhr.onprogress = handleProgress;
  }
  try {
    if (xhr.upload && this.hasListeners('progress')) {
      xhr.upload.onprogress = handleProgress;
    }
  } catch(e) {
    // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
    // Reported here:
    // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.timedout = true;
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  if (this.username && this.password) {
    xhr.open(this.method, this.url, true, this.username, this.password);
  } else {
    xhr.open(this.method, this.url, true);
  }

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    // serialize stuff
    var contentType = this._header['content-type'];
    var serialize = this._parser || request.serialize[contentType ? contentType.split(';')[0] : ''];
    if (!serialize && isJSON(contentType)) serialize = request.serialize['application/json'];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  if (this._responseType) {
    xhr.responseType = this._responseType;
  }

  // send stuff
  this.emit('request', this);

  // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
  // We need null here if data is undefined
  xhr.send(typeof data !== 'undefined' ? data : null);
  return this;
};


/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

function del(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

request['del'] = del;
request['delete'] = del;

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

},{"./is-object":24,"./request":26,"./request-base":25,"emitter":27,"reduce":28}],24:[function(require,module,exports){
/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return null != obj && 'object' == typeof obj;
}

module.exports = isObject;

},{}],25:[function(require,module,exports){
/**
 * Module of mixed-in functions shared between node and client code
 */
var isObject = require('./is-object');

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

exports.clearTimeout = function _clearTimeout(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Force given parser
 *
 * Sets the body parser no matter type.
 *
 * @param {Function}
 * @api public
 */

exports.parse = function parse(fn){
  this._parser = fn;
  return this;
};

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

exports.timeout = function timeout(ms){
  this._timeout = ms;
  return this;
};

/**
 * Faux promise support
 *
 * @param {Function} fulfill
 * @param {Function} reject
 * @return {Request}
 */

exports.then = function then(fulfill, reject) {
  return this.end(function(err, res) {
    err ? reject(err) : fulfill(res);
  });
}

/**
 * Allow for extension
 */

exports.use = function use(fn) {
  fn(this);
  return this;
}


/**
 * Get request header `field`.
 * Case-insensitive.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

exports.get = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Get case-insensitive header `field` value.
 * This is a deprecated internal API. Use `.get(field)` instead.
 *
 * (getHeader is no longer used internally by the superagent code base)
 *
 * @param {String} field
 * @return {String}
 * @api private
 * @deprecated
 */

exports.getHeader = exports.get;

/**
 * Set header `field` to `val`, or multiple fields with one object.
 * Case-insensitive.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

exports.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 * Case-insensitive.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 */
exports.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Write the field `name` and `val` for "multipart/form-data"
 * request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 * ```
 *
 * @param {String} name
 * @param {String|Blob|File|Buffer|fs.ReadStream} val
 * @return {Request} for chaining
 * @api public
 */
exports.field = function(name, val) {
  this._getFormData().append(name, val);
  return this;
};

},{"./is-object":24}],26:[function(require,module,exports){
// The node and browser modules expose versions of this with the
// appropriate constructor function bound as first argument
/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(RequestConstructor, method, url) {
  // callback
  if ('function' == typeof url) {
    return new RequestConstructor('GET', method).end(url);
  }

  // url first
  if (2 == arguments.length) {
    return new RequestConstructor('GET', method);
  }

  return new RequestConstructor(method, url);
}

module.exports = request;

},{}],27:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

if (typeof module !== 'undefined') {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],28:[function(require,module,exports){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
},{}],29:[function(require,module,exports){
'use strict';

var halfred = require('halfred');

function JsonHalAdapter(log) {
  this.log = log;
}

JsonHalAdapter.mediaType = 'application/hal+json';

JsonHalAdapter.prototype.findNextStep = function(t, linkObject) {
  if (typeof linkObject === 'undefined' || linkObject === null) {
    throw new Error('Link object is null or undefined.');
  }
  if (typeof linkObject !== 'object') {
    throw new Error('Links must be objects, not ' + typeof linkObject +
        ': ', linkObject);
  }
  if (!linkObject.type) {
    throw new Error('Link objects has no type attribute.', linkObject);
  }

  switch (linkObject.type) {
    case 'link-rel':
      return this._handleLinkRel(t, linkObject);
    case 'header':
      return this._handleHeader(t.lastStep.response, linkObject);
    default:
      throw new Error('Link objects with type ' + linkObject.type +
        ' are not supported by this adapter.', linkObject);
  }
};

JsonHalAdapter.prototype._handleLinkRel = function(t, linkObject) {
  var doc = t.lastStep.doc;
  var key = linkObject.value;
  var preferEmbedded = t.preferEmbedded;

  this.log.debug('parsing hal');
  var ctx = {
    doc: doc,
    halResource: halfred.parse(doc),
    parsedKey: parseKey(key),
    linkStep: null,
    embeddedStep: null,
  };
  resolveCurie(ctx);
  findLink(ctx, this.log);
  findEmbedded(ctx, this.log);
  return prepareResult(ctx, key, preferEmbedded);
};

function prepareResult(ctx, key, preferEmbedded) {
  var step;
  if (preferEmbedded || ctx.parsedKey.mode === 'all') {
    step = ctx.embeddedStep || ctx.linkStep;
  } else {
    step = ctx.linkStep || ctx.embeddedStep;
  }

  if (step) {
    return step;
  } else {
    var message = 'Could not find a matching link nor an embedded document '+
      'for ' + key + '.';
    if (ctx.linkError) {
      message += ' Error while resolving linked documents: ' + ctx.linkError;
    }
    if (ctx.embeddedError) {
      message += ' Error while resolving embedded documents: ' +
        ctx.embeddedError;
    }
    message += ' Document: ' + JSON.stringify(ctx.doc);

    throw new Error(message);
  }
}

function parseKey(key) {
  var match = key.match(/(.*)\[(.*):(.*)\]/);
  // ea:admin[title:Kate] => access by secondary key
  if (match) {
    return {
      mode: 'secondary',
      key: match[1],
      secondaryKey: match[2],
      secondaryValue: match[3],
      index: null,
    };
  }
  // ea:order[3] => index access into embedded array
  match = key.match(/(.*)\[(\d+)\]/);
  if (match) {
    return {
      mode: 'index',
      key: match[1],
      secondaryKey: null,
      secondaryValue: null,
      index: match[2],
    };
  }
  // ea:order[$all] => meta-key, return full array
  match = key.match(/(.*)\[\$all\]/);
  if (match) {
    return {
      mode: 'all',
      key: match[1],
      secondaryKey: null,
      secondaryValue: null,
      index: null,
    };
  }
  // ea:order => simple link relation
  return {
    mode: 'first',
    key: key,
    secondaryKey: null,
    secondaryValue: null,
    index: null,
  };
}

function resolveCurie(ctx) {
  if (ctx.halResource.hasCuries()) {
    ctx.parsedKey.curie =
      ctx.halResource.reverseResolveCurie(ctx.parsedKey.key);
  }
}

function findLink(ctx, log) {
  var linkArray = ctx.halResource.linkArray(ctx.parsedKey.key);
  if (!linkArray) {
    linkArray = ctx.halResource.linkArray(ctx.parsedKey.curie);
  }
  if (!linkArray || linkArray.length === 0) {
    return;
  }

  switch (ctx.parsedKey.mode) {
    case 'secondary':
      findLinkBySecondaryKey(ctx, linkArray, log);
      break;
    case 'index':
      findLinkByIndex(ctx, linkArray, log);
      break;
    case 'first':
      findLinkWithoutIndex(ctx, linkArray, log);
      break;
    case 'all':
      // do not process $all as a link at all, go straight to the findEmbedded
      break;
    default:
      throw new Error('Illegal mode: ' + ctx.parsedKey.mode);
  }
}

function findLinkBySecondaryKey(ctx, linkArray, log) {
  // client selected a specific link by an explicit secondary key like 'name',
  // so use it or fail
  var i = 0;
  for (; i < linkArray.length; i++) {
    var val = linkArray[i][ctx.parsedKey.secondaryKey];
    /* jshint -W116 */
    if (val != null && val == ctx.parsedKey.secondaryValue) {
      if (!linkArray[i].href) {
        ctx.linkError = 'The link ' + ctx.parsedKey.key + '[' +
          ctx.parsedKey.secondaryKey + ':' + ctx.parsedKey.secondaryValue +
            '] exists, but it has no href attribute.';
        return;
      }
      log.debug('found hal link: ' + linkArray[i].href);
      ctx.linkStep = { url: linkArray[i].href };
      return;
    }
    /* jshint +W116 */
  }
  ctx.linkError = ctx.parsedKey.key + '[' + ctx.parsedKey.secondaryKey + ':' +
      ctx.parsedKey.secondaryValue +
     '] requested, but there is no such link.';
}

function findLinkByIndex(ctx, linkArray, log) {
  // client specified an explicit array index for this link, so use it or fail
  if (!linkArray[ctx.parsedKey.index]) {
    ctx.linkError = 'The link array ' + ctx.parsedKey.key +
        ' exists, but has no element at index ' + ctx.parsedKey.index + '.';
    return;
  }
  if (!linkArray[ctx.parsedKey.index].href) {
    ctx.linkError = 'The link ' + ctx.parsedKey.key + '[' +
      ctx.parsedKey.index + '] exists, but it has no href attribute.';
    return;
  }
  log.debug('found hal link: ' + linkArray[ctx.parsedKey.index].href);
  ctx.linkStep = { url: linkArray[ctx.parsedKey.index].href };
}

function findLinkWithoutIndex(ctx, linkArray, log) {
  // client did not specify an array index for this link, arbitrarily choose
  // the first that has a href attribute
  var link;
  for (var index = 0; index < linkArray.length; index++) {
    if (linkArray[index].href) {
      link = linkArray[index];
      break;
    }
  }
  if (link) {
    if (linkArray.length > 1) {
      log.warn('Found HAL link array with more than one element for ' +
          'key ' + ctx.parsedKey.key + ', arbitrarily choosing index ' + index +
          ', because it was the first that had a href attribute.');
    }
    log.debug('found hal link: ' + link.href);
    ctx.linkStep = { url: link.href };
  }
}

function findEmbedded(ctx, log) {
  log.debug('checking for embedded: ' + ctx.parsedKey.key +
      (ctx.parsedKey.index ? ctx.parsedKey.index : ''));

  var resourceArray = ctx.halResource.embeddedArray(ctx.parsedKey.key);
  if ((!resourceArray || resourceArray.length === 0) &&
       ctx.parsedKey.mode !== 'all' ) {
    return null;
  }
  log.debug('Found an array of embedded resource for: ' + ctx.parsedKey.key);

  switch (ctx.parsedKey.mode) {
    case 'secondary':
      findEmbeddedBySecondaryKey(ctx, resourceArray, log);
      break;
    case 'index':
      findEmbeddedByIndex(ctx, resourceArray, log);
      break;
    case 'all':
      findEmbeddedAll(ctx, resourceArray, log);
      break;
    case 'first':
      findEmbeddedWithoutIndex(ctx, resourceArray, log);
      break;
    default:
      throw new Error('Illegal mode: ' + ctx.parsedKey.mode);
  }
}

function findEmbeddedBySecondaryKey(ctx, embeddedArray, log) {
  // client selected a specific embed by an explicit secondary key,
  // so use it or fail
  var i = 0;
  for (; i < embeddedArray.length; i++) {
    var val = embeddedArray[i][ctx.parsedKey.secondaryKey];
    /* jshint -W116 */
    if (val != null && val == ctx.parsedKey.secondaryValue) {
      log.debug('Found an embedded resource for: ' + ctx.parsedKey.key + '[' +
      ctx.parsedKey.secondaryKey + ':' + ctx.parsedKey.secondaryValue + ']');
      ctx.embeddedStep = { doc: embeddedArray[i].original() };
      return;
    }
    /* jshint +W116 */
  }
  ctx.embeddedError = ctx.parsedKey.key + '[' + ctx.parsedKey.secondaryKey +
    ':' + ctx.parsedKey.secondaryValue +
    '] requested, but the embedded array ' + ctx.parsedKey.key +
    ' has no such element.';
}

function findEmbeddedByIndex(ctx, resourceArray, log) {
  // client specified an explicit array index, so use it or fail
  if (!resourceArray[ctx.parsedKey.index]) {
    ctx.embeddedError = 'The embedded array ' + ctx.parsedKey.key +
      ' exists, but has no element at index ' + ctx.parsedKey.index + '.';
    return;
  }
  log.debug('Found an embedded resource for: ' + ctx.parsedKey.key + '[' +
      ctx.parsedKey.index + ']');
  ctx.embeddedStep = {
    doc: resourceArray[ctx.parsedKey.index].original()
  };
}

function findEmbeddedAll(ctx, embeddedArray, log) {
  var result = ctx.halResource.original()._embedded &&
      ctx.halResource.original()._embedded[ctx.parsedKey.key];
  if (!result) {
    result = [];
  } else if (! (result instanceof Array)) {
    result = [].concat(result);
  }

  ctx.embeddedStep = {
    doc: result
  };
}

function findEmbeddedWithoutIndex(ctx, resourceArray, log) {
  // client did not specify an array index, arbitrarily choose first
  if (resourceArray.length > 1) {
    log.warn('Found HAL embedded resource array with more than one element ' +
      ' for key ' + ctx.parsedKey.key +
      ', arbitrarily choosing first element.');
  }
  ctx.embeddedStep = { doc: resourceArray[0].original() };
}

JsonHalAdapter.prototype._handleHeader = function(httpResponse, link) {
  switch (link.value) {
    case 'location':
      var locationHeader = httpResponse.headers.location;
      if (!locationHeader) {
        throw new Error('Following the location header but there was no ' +
          'location header in the last response.');
      }
      return { url : locationHeader };
    default:
      throw new Error('Link objects with type header and value ' + link.value +
        ' are not supported by this adapter.', link);
  }
};

module.exports = JsonHalAdapter;

},{"halfred":30}],30:[function(require,module,exports){
var Parser = require('./lib/parser')
  , validationFlag = false;

module.exports = {

  parse: function(unparsed) {
    return new Parser().parse(unparsed, validationFlag);
  },

  enableValidation: function(flag) {
    validationFlag = (flag != null) ? flag : true;
  },

  disableValidation: function() {
    validationFlag = false;
  }
};

},{"./lib/parser":32}],31:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11}],32:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"./immutable_stack":31,"./resource":33,"dup":12}],33:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"dup":13}],34:[function(require,module,exports){
'use strict';

// TODO Replace by a proper lightweight logging module, suited for the browser

var enabled = false;
function Logger(id) {
  if (id == null) {
    id = '';
  }
  this.id = id;
}

Logger.prototype.enable = function() {
  this.enabled = true;
};

Logger.prototype.debug = function(message) {
  if (enabled) {
    console.log(this.id + '/debug: ' + message);
  }
};

Logger.prototype.info = function(message) {
  if (enabled) {
    console.log(this.id + '/info: ' + message);
  }
};

Logger.prototype.warn = function(message) {
  if (enabled) {
    console.log(this.id + '/warn: ' + message);
  }
};

Logger.prototype.error = function(message) {
  if (enabled) {
    console.log(this.id + '/error: ' + message);
  }
};

function minilog(id) {
  return new Logger(id);
}

minilog.enable = function() {
  enabled = true;
};

module.exports = minilog;

},{}],35:[function(require,module,exports){
'use strict';

module.exports = {
  isArray: function(o) {
    if (o == null) {
      return false;
    }
    return Object.prototype.toString.call(o) === '[object Array]';
  }
};

},{}],36:[function(require,module,exports){
'use strict';

var superagent = require('superagent');

function Request() {}

Request.prototype.get = function(uri, options, callback) {
  return mapRequest(superagent.get(uri), options)
    .end(handleResponse(callback));
};

Request.prototype.post = function(uri, options, callback) {
  return mapRequest(superagent.post(uri), options)
    .end(handleResponse(callback));
};

Request.prototype.put = function(uri, options, callback) {
  return mapRequest(superagent.put(uri), options)
    .end(handleResponse(callback));
};

Request.prototype.patch = function(uri, options, callback) {
  return mapRequest(superagent.patch(uri), options)
    .end(handleResponse(callback));
};

Request.prototype.del = function(uri, options, callback) {
  return mapRequest(superagent.del(uri), options)
    .end(handleResponse(callback));
};

function mapRequest(superagentRequest, options) {
  options = options || {};
  mapQuery(superagentRequest, options);
  mapHeaders(superagentRequest, options);
  mapAuth(superagentRequest, options);
  mapBody(superagentRequest, options);
  mapForm(superagentRequest, options);
  mapWithCredentials(superagentRequest, options);
  return superagentRequest;
}

function mapQuery(superagentRequest, options) {
  var qs = options.qs;
  if (qs != null) {
    superagentRequest = superagentRequest.query(qs);
  }
}

function mapHeaders(superagentRequest, options) {
  var headers = options.headers;
  if (headers != null) {
    superagentRequest = superagentRequest.set(headers);
  }
}

function mapAuth(superagentRequest, options) {
  var auth = options.auth;
  if (auth != null) {
    superagentRequest = superagentRequest.auth(
      auth.user || auth.username,
      auth.pass || auth.password
    );
  }
}

function mapBody(superagentRequest, options) {
  if (options != null) {
    var body = options.body;
    if (body != null) {
      superagentRequest = superagentRequest.send(body);
    }
  }
}

function mapForm(superagentRequest, options) {
  if (options != null) {
    var form = options.form;
    if (form != null) {
      superagentRequest = superagentRequest.send(form);
      superagentRequest = superagentRequest.set('Content-Type',
          'application/x-www-form-urlencoded');
    }
  }
}

function mapWithCredentials(superagentRequest, options) {
  if (options != null) {
    var withCredentials = options.withCredentials;
    if (withCredentials === true) {
      // https://visionmedia.github.io/superagent/#cors
      superagentRequest.withCredentials();
    }
  }
}

// map XHR response object properties to Node.js request lib's response object
// properties
function mapResponse(response) {
  response.body = response.text;
  response.statusCode = response.status;
  return response;
}

function handleResponse(callback) {
  return function(err, response) {
    if (err) {
      if (!response) {
        // network error or timeout, no response
        return callback(err);
      } else {
        // Since 1.0.0 superagent calls the callback with an error if the status
        // code of the response is not in the 2xx range. In this cases, it also
        // passes in the response. To align things with request, call the
        // callback without the error but just with the response.
        callback(null, mapResponse(response));
      }
    } else {
      callback(null, mapResponse(response));
    }
  };
}

module.exports = new Request();

},{"superagent":23}],37:[function(require,module,exports){
'use strict';

/*
 * Copied from underscore.string module. Just the functions we need, to reduce
 * the browserified size.
 */

var _s = {
  startsWith: function(str, starts) {
    if (starts === '') return true;
    if (str == null || starts == null) return false;
    str = String(str); starts = String(starts);
    return str.length >= starts.length && str.slice(0, starts.length) === starts;
  },

  endsWith: function(str, ends){
    if (ends === '') return true;
    if (str == null || ends == null) return false;
    str = String(str); ends = String(ends);
    return str.length >= ends.length &&
      str.slice(str.length - ends.length) === ends;
  },

  splice: function(str, i, howmany, substr){
    var arr = _s.chars(str);
    arr.splice(~~i, ~~howmany, substr);
    return arr.join('');
  },

  contains: function(str, needle){
    if (needle === '') return true;
    if (str == null) return false;
    return String(str).indexOf(needle) !== -1;
  },

  chars: function(str) {
    if (str == null) return [];
    return String(str).split('');
  }
};

module.exports = _s;

},{}],38:[function(require,module,exports){
'use strict';

var resolveUrl = require('resolve-url');

exports.resolve = function(from, to) {
  return resolveUrl(from, to);
};

},{"resolve-url":71}],39:[function(require,module,exports){
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson');

exports.abortTraversal = function abortTraversal() {
  log.debug('aborting link traversal');
  this.aborted = true;
  if (this.currentRequest) {
    log.debug('request in progress. trying to abort it, too.');
    this.currentRequest.abort();
  }
};

exports.registerAbortListener = function registerAbortListener(t, callback) {
  if (t.currentRequest) {
    t.currentRequest.on('abort', function() {
      exports.callCallbackOnAbort(t);
    });
  }
};

exports.callCallbackOnAbort = function callCallbackOnAbort(t) {
  log.debug('link traversal aborted');
  if (!t.callbackHasBeenCalledAfterAbort) {
    t.callbackHasBeenCalledAfterAbort = true;
    t.callback(exports.abortError(), t);
  }
};

exports.abortError = function abortError() {
  var error = new Error('Link traversal process has been aborted.');
  error.name = 'AbortError';
  error.aborted = true;
  return error;
};

},{"minilog":34}],40:[function(require,module,exports){
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson')
  , abortTraversal = require('./abort_traversal')
  , applyTransforms = require('./transforms/apply_transforms')
  , httpRequests = require('./http_requests')
  , isContinuation = require('./is_continuation')
  , walker = require('./walker');

var checkHttpStatus = require('./transforms/check_http_status')
  , continuationToDoc =
      require('./transforms/continuation_to_doc')
  , continuationToResponse =
      require('./transforms/continuation_to_response')
  , convertEmbeddedDocToResponse =
      require('./transforms/convert_embedded_doc_to_response')
  , extractDoc =  require('./transforms/extract_doc')
  , extractResponse =  require('./transforms/extract_response')
  , extractUrl =  require('./transforms/extract_url')
  , fetchLastResource =  require('./transforms/fetch_last_resource')
  , executeLastHttpRequest = require('./transforms/execute_last_http_request')
  , executeHttpRequest = require('./transforms/execute_http_request')
  , parse = require('./transforms/parse');

/**
 * Starts the link traversal process and end it with an HTTP get.
 */
exports.get = function(t, callback) {
  var transformsAfterLastStep;
  if (t.convertResponseToObject) {
    transformsAfterLastStep = [
      continuationToDoc,
      fetchLastResource,
      checkHttpStatus,
      parse,
      extractDoc,
    ];
  } else {
    transformsAfterLastStep = [
      continuationToResponse,
      fetchLastResource,
      convertEmbeddedDocToResponse,
      extractResponse,
    ];
  }
  walker.walk(t, transformsAfterLastStep, callback);
  return createTraversalHandle(t);
};

/**
 * Special variant of get() that does not execute the last request but instead
 * yields the last URL to the callback.
 */
exports.getUrl = function(t, callback) {
  walker.walk(t, [ extractUrl ], callback);
  return createTraversalHandle(t);
};

/**
 * Starts the link traversal process and sends an HTTP POST request with the
 * given body to the last URL. Passes the HTTP response of the POST request to
 * the callback.
 */
exports.post = function(t, callback) {
  walkAndExecute(t,
      t.requestModuleInstance,
      t.requestModuleInstance.post,
      callback);
  return createTraversalHandle(t);
};

/**
 * Starts the link traversal process and sends an HTTP PUT request with the
 * given body to the last URL. Passes the HTTP response of the PUT request to
 * the callback.
 */
exports.put = function(t, callback) {
  walkAndExecute(t,
      t.requestModuleInstance,
      t.requestModuleInstance.put,
      callback);
  return createTraversalHandle(t);
};

/**
 * Starts the link traversal process and sends an HTTP PATCH request with the
 * given body to the last URL. Passes the HTTP response of the PATCH request to
 * the callback.
 */
exports.patch = function(t, callback) {
  walkAndExecute(t,
      t.requestModuleInstance,
      t.requestModuleInstance.patch,
      callback);
  return createTraversalHandle(t);
};

/**
 * Starts the link traversal process and sends an HTTP DELETE request to the
 * last URL. Passes the HTTP response of the DELETE request to the callback.
 */
exports.delete = function(t, callback) {
  walkAndExecute(t,
      t.requestModuleInstance,
      t.requestModuleInstance.del,
      callback);
  return createTraversalHandle(t);
};

function walkAndExecute(t, request, method, callback) {
  var transformsAfterLastStep;
  if (t.convertResponseToObject) {
    transformsAfterLastStep = [
      executeHttpRequest,
      checkHttpStatus,
      parse,
      extractDoc,
    ];
  } else {
    transformsAfterLastStep = [
      executeLastHttpRequest,
    ];
  }

  t.lastMethod = method;
  walker.walk(t, transformsAfterLastStep, callback);
}

function createTraversalHandle(t) {
  return {
    abort: t.abortTraversal
  };
}

},{"./abort_traversal":39,"./http_requests":42,"./is_continuation":43,"./transforms/apply_transforms":49,"./transforms/check_http_status":50,"./transforms/continuation_to_doc":51,"./transforms/continuation_to_response":52,"./transforms/convert_embedded_doc_to_response":53,"./transforms/execute_http_request":55,"./transforms/execute_last_http_request":56,"./transforms/extract_doc":57,"./transforms/extract_response":58,"./transforms/extract_url":59,"./transforms/fetch_last_resource":60,"./transforms/parse":63,"./walker":69,"minilog":34}],41:[function(require,module,exports){
'use strict';

var minilog = require('minilog')
  , standardRequest = require('request')
  , util = require('util');

var actions = require('./actions')
  , abortTraversal = require('./abort_traversal').abortTraversal
  , mediaTypeRegistry = require('./media_type_registry')
  , mediaTypes = require('./media_types')
  , mergeRecursive = require('./merge_recursive');

var log = minilog('traverson');

// Maintenance notice: The constructor is usually called without arguments, the
// mediaType parameter is only used when cloning the request builder in
// newRequest().
function Builder(mediaType) {
  this.mediaType = mediaType || mediaTypes.CONTENT_NEGOTIATION;
  this.adapter = this._createAdapter(this.mediaType);
  this.contentNegotiation = true;
  this.convertResponseToObjectFlag = false;
  this.links = [];
  this.jsonParser = JSON.parse;
  this.requestModuleInstance = standardRequest;
  this.requestOptions = {};
  this.resolveRelativeFlag = false;
  this.preferEmbedded = false;
  this.lastTraversalState = null;
  this.continuation = null;
  // Maintenance notice: when extending the list of configuration parameters,
  // also extend this.newRequest and initFromTraversalState
}

Builder.prototype._createAdapter = function(mediaType) {
  var AdapterType = mediaTypeRegistry.get(mediaType);
  if (!AdapterType) {
    throw new Error('Unknown or unsupported media type: ' + mediaType);
  }
  log.debug('creating new ' + AdapterType.name);
  return new AdapterType(log);
};

/**
 * Returns a new builder instance which is basically a clone of this builder
 * instance. This allows you to initiate a new request but keeping all the setup
 * (start URL, template parameters, request options, body parser, ...).
 */
Builder.prototype.newRequest = function() {
  var clonedRequestBuilder = new Builder(this.getMediaType());
  clonedRequestBuilder.contentNegotiation =
    this.doesContentNegotiation();
  clonedRequestBuilder.convertResponseToObject(this.convertsResponseToObject());
  clonedRequestBuilder.from(shallowCloneArray(this.getFrom()));
  clonedRequestBuilder.withTemplateParameters(
    cloneArrayOrObject(this.getTemplateParameters()));
  clonedRequestBuilder.withRequestOptions(
    cloneArrayOrObject(this.getRequestOptions()));
  clonedRequestBuilder.withRequestLibrary(this.getRequestLibrary());
  clonedRequestBuilder.parseResponseBodiesWith(this.getJsonParser());
  clonedRequestBuilder.resolveRelative(this.doesResolveRelative());
  clonedRequestBuilder.preferEmbeddedResources(
      this.doesPreferEmbeddedResources());
  clonedRequestBuilder.continuation = this.continuation;
  // Maintenance notice: when extending the list of configuration parameters,
  // also extend initFromTraversalState
  return clonedRequestBuilder;
};

/**
 * Disables content negotiation and forces the use of a given media type.
 * The media type has to be registered at Traverson's media type registry
 * before via traverson.registerMediaType (except for media type
 * application/json, which is traverson.mediaTypes.JSON).
 */
Builder.prototype.setMediaType = function(mediaType) {
  this.mediaType = mediaType || mediaTypes.CONTENT_NEGOTIATION;
  this.adapter = this._createAdapter(mediaType);
  this.contentNegotiation =
    (mediaType === mediaTypes.CONTENT_NEGOTIATION);
  return this;
};

/**
 * Shortcut for
 * setMediaType(traverson.mediaTypes.JSON);
 */
Builder.prototype.json = function() {
  this.setMediaType(mediaTypes.JSON);
  return this;
};

/**
 * Shortcut for
 * setMediaType(traverson.mediaTypes.JSON_HAL);
 */
Builder.prototype.jsonHal = function() {
  this.setMediaType(mediaTypes.JSON_HAL);
  return this;
};

/**
 * Enables content negotiation (content negotiation is enabled by default, this
 * method can be used to enable it after a call to setMediaType disabled it).
 */
Builder.prototype.useContentNegotiation = function() {
  this.setMediaType(mediaTypes.CONTENT_NEGOTIATION);
  this.contentNegotiation = true;
  return this;
};

/**
 * Set the root URL of the API, that is, where the link traversal begins.
 */
Builder.prototype.from = function(url) {
  this.startUrl = url;
  return this;
};

/**
 * Adds link relations to the list of link relations to follow. The initial list
 * of link relations is the empty list. Each link relation in this list
 * corresponds to one step in the traversal.
 */
Builder.prototype.follow = function() {
  var newLinks = Array.prototype.slice.apply(
    arguments.length === 1 && util.isArray(arguments[0]) ?
      arguments[0] : arguments
  );

  for (var i = 0; i < newLinks.length; i++) {
    if (typeof newLinks[i] === 'string') {
      newLinks[i] = {
        type: 'link-rel',
        value: newLinks[i],
      };
    }
  }
  this.links = this.links.concat(newLinks);
  return this;
};

/**
 * Adds a special step to the list of link relations that will follow the
 * location header, that is, instead of reading the next URL from a link in the
 * document body, it uses the location header and follows the URL from this
 * header.
 */
Builder.prototype.followLocationHeader = function() {
  this.links.push({
    type: 'header',
    value: 'location',
  });
  return this;
};

/**
 * Alias for follow.
 */
Builder.prototype.walk = Builder.prototype.follow;

/**
 * Provide template parameters for URI template substitution.
 */
Builder.prototype.withTemplateParameters = function(parameters) {
  this.templateParameters = parameters;
  return this;
};

/**
 * Provide options for HTTP requests (additional HTTP headers, for example).
 * This function resets any request options, that had been set previously, that
 * is, multiple calls to withRequestOptions are not cumulative. Use
 * addRequestOptions to add request options in a cumulative way.
 *
 * Options can either be passed as an object or an array. If an object is
 * passed, the options will be used for each HTTP request. If an array is
 * passed, each element should be an options object and the first array element
 * will be used for the first request, the second element for the second request
 * and so on. null elements are allowed.
 */
Builder.prototype.withRequestOptions = function(options) {
  this.requestOptions = options;
  return this;
};

/**
 * Adds options for HTTP requests (additional HTTP headers, for example) on top
 * of existing options, if any. To reset all request options and set new ones
 * without keeping the old ones, you can use withRequestOptions.
 *
 * Options can either be passed as an object or an array. If an object is
 * passed, the options will be used for each HTTP request. If an array is
 * passed, each element should be an options object and the first array element
 * will be used for the first request, the second element for the second request
 * and so on. null elements are allowed.
 *
 * When called after a call to withRequestOptions or when combining multiple
 * addRequestOptions calls, some with objects and some with arrays, a multitude
 * of interesting situations can occur:
 *
 * 1) The existing request options are an object and the new options passed into
 * this method are also an object. Outcome: Both objects are merged and all
 * options are applied to all requests.
 *
 * 2) The existing options are an array and the new options passed into this
 * method are also an array. Outcome: Each array element is merged individually.
 * The combined options from the n-th array element in the existing options
 * array and the n-th array element in the given array are applied to the n-th
 * request.
 *
 * 3) The existing options are an object and the new options passed into this
 * method are an array. Outcome: A new options array will be created. For each
 * element, a clone of the existing options object will be merged with an
 * element from the given options array.
 *
 * Note that if the given array has less elements than the number of steps in
 * the link traversal (usually the number of steps is derived from the number
 * of link relations given to the follow method), only the first n http
 * requests will use options at all, where n is the number of elements in the
 * given array. HTTP request n + 1 and all following HTTP requests will use an
 * empty options object. This is due to the fact, that at the time of creating
 * the new options array, we can not know with certainty how many steps the
 * link traversal will have.
 *
 * 4) The existing options are an array and the new options passed into this
 * method are an object. Outcome: A clone of the given options object will be
 * merged into into each array element of the existing options.
 */
Builder.prototype.addRequestOptions = function(options) {

  // case 2: both the present options and the new options are arrays.
  // => merge each array element individually
  if (util.isArray(this.requestOptions) && util.isArray(options)) {
    mergeArrayElements(this.requestOptions, options);

  // case 3: there is an options object the new options are an array.
  // => create a new array, each element is a merge of the existing base object
  // and the array element from the new options array.
  } else if (typeof this.requestOptions === 'object' &&
             util.isArray(options)) {
    this.requestOptions =
      mergeBaseObjectWithArrayElements(this.requestOptions, options);

  // case 4: there is an options array and the new options are an object.
  // => merge the new object into each array element.
  } else if (util.isArray(this.requestOptions) &&
             typeof options === 'object') {
    mergeOptionObjectIntoEachArrayElement(this.requestOptions, options);

  // case 1: both are objects
  // => merge both objects
  } else {
    mergeRecursive(this.requestOptions, options);
  }
  return this;
};

function mergeArrayElements(existingOptions, newOptions) {
  for (var i = 0;
       i < Math.max(existingOptions.length, newOptions.length);
       i++) {
    existingOptions[i] =
      mergeRecursive(existingOptions[i], newOptions[i]);
  }
}

function mergeBaseObjectWithArrayElements(existingOptions, newOptions) {
  var newOptArray = [];
  for (var i = 0;
       i < newOptions.length;
       i++) {
    newOptArray[i] =
      mergeRecursive(newOptions[i], existingOptions);
  }
  return newOptArray;
}

function mergeOptionObjectIntoEachArrayElement(existingOptions, newOptions) {
  for (var i = 0;
       i < existingOptions.length;
       i++) {
    mergeRecursive(existingOptions[i], newOptions);
  }
}

/**
 * Injects a custom request library. When using this method, you should not
 * call withRequestOptions or addRequestOptions but instead pre-configure the
 * injected request library instance before passing it to withRequestLibrary.
 */
Builder.prototype.withRequestLibrary = function(request) {
  this.requestModuleInstance = request;
  return this;
};

/**
 * Injects a custom JSON parser.
 */
Builder.prototype.parseResponseBodiesWith = function(parser) {
  this.jsonParser = parser;
  return this;
};

/**
 * With this option enabled, the body of the response at the end of the
 * traversal will be converted into a JavaScript object (for example by passing
 * it into JSON.parse) and passing the resulting object into the callback.
 * The default is false, which means the full response is handed to the
 * callback.
 *
 * When response body conversion is enabled, you will not get the full
 * response, so you won't have access to the HTTP status code or headers.
 * Instead only the converted object will be passed into the callback.
 *
 * Note that the body of any intermediary responses during the traversal is
 * always converted by Traverson (to find the next link).
 *
 * If the method is called without arguments (or the first argument is undefined
 * or null), response body conversion is switched on, otherwise the argument is
 * interpreted as a boolean flag. If it is a truthy value, response body
 * conversion is switched to on, if it is a falsy value (but not null or
 * undefined), response body conversion is switched off.
 */
Builder.prototype.convertResponseToObject = function(flag) {
  if (typeof flag === 'undefined' || flag === null) {
    flag = true;
  }
  this.convertResponseToObjectFlag = !!flag;
  return this;
};

/**
 * Switches URL resolution to relative (default is absolute) or back to
 * absolute.
 *
 * If the method is called without arguments (or the first argument is undefined
 * or null), URL resolution is switched to relative, otherwise the argument is
 * interpreted as a boolean flag. If it is a truthy value, URL resolution is
 * switched to relative, if it is a falsy value, URL resolution is switched to
 * absolute.
 */
Builder.prototype.resolveRelative = function(flag) {
  if (typeof flag === 'undefined' || flag === null) {
    flag = true;
  }
  this.resolveRelativeFlag = !!flag;
  return this;
};

/**
 * Makes Traverson prefer embedded resources over traversing a link or vice
 * versa. This only applies to media types which support embedded resources
 * (like HAL). It has no effect when using a media type that does not support
 * embedded resources.
 *
 * It also only takes effect when a resource contains both a link _and_ an
 * embedded resource with the name that is to be followed at this step in the
 * link traversal process.
 *
 * If the method is called without arguments (or the first argument is undefined
 * or null), embedded resources will be preferred over fetching linked resources
 * with an additional HTTP request. Otherwise the argument is interpreted as a
 * boolean flag. If it is a truthy value, embedded resources will be preferred,
 * if it is a falsy value, traversing the link relation will be preferred.
 */
Builder.prototype.preferEmbeddedResources = function(flag) {
  if (typeof flag === 'undefined' || flag === null) {
    flag = true;
  }
  this.preferEmbedded = !!flag;
  return this;
};

/**
 * Returns the current media type. If no media type is enforced but content type
 * detection is used, the string `content-negotiation` is returned.
 */
Builder.prototype.getMediaType = function() {
  return this.mediaType;
};

/**
 * Returns the URL set by the from(url) method, that is, the root URL of the
 * API.
 */
Builder.prototype.getFrom = function() {
  return this.startUrl;
};

/**
 * Returns the template parameters set by the withTemplateParameters.
 */
Builder.prototype.getTemplateParameters = function() {
  return this.templateParameters;
};

/**
 * Returns the request options set by the withRequestOptions or
 * addRequestOptions.
 */
Builder.prototype.getRequestOptions = function() {
  return this.requestOptions;
};

/**
 * Returns the custom request library instance set by withRequestLibrary or the
 * standard request library instance, if a custom one has not been set.
 */
Builder.prototype.getRequestLibrary = function() {
  return this.requestModuleInstance;
};

/**
 * Returns the custom JSON parser function set by parseResponseBodiesWith or the
 * standard parser function, if a custom one has not been set.
 */
Builder.prototype.getJsonParser = function() {
  return this.jsonParser;
};

/**
 * Returns true if the body of the last response will be converted to a
 * JavaScript object before passing the result back to the callback.
 */
Builder.prototype.convertsResponseToObject = function() {
  return this.convertResponseToObjectFlag;
};

/**
 * Returns the flag controlling if URLs are resolved relative or absolute.
 * A return value of true means that URLs are resolved relative, false means
 * absolute.
 */
Builder.prototype.doesResolveRelative = function() {
  return this.resolveRelativeFlag;
};

/**
 * Returns the flag controlling if embedded resources are preferred over links.
 * A return value of true means that embedded resources are preferred, false
 * means that following links is preferred.
 */
Builder.prototype.doesPreferEmbeddedResources = function() {
  return this.preferEmbedded;
};

/**
 * Returns true if content negotiation is enabled and false if a particular
 * media type is forced.
 */
Builder.prototype.doesContentNegotiation = function() {
  return this.contentNegotiation;
};

/**
 * Starts the link traversal process and passes the last HTTP response to the
 * callback.
 */
Builder.prototype.get = function get(callback) {
  log.debug('initiating traversal (get)');
  var t = createInitialTraversalState(this);
  return actions.get(t, wrapForContinue(this, t, callback, 'get'));
};

/**
 * Special variant of get() that does not yield the full http response to the
 * callback but instead the already parsed JSON as an object.
 *
 * This is a shortcut for builder.convertResponseToObject().get(callback).
 */
Builder.prototype.getResource = function getResource(callback) {
  log.debug('initiating traversal (getResource)');
  this.convertResponseToObjectFlag = true;
  var t = createInitialTraversalState(this);
  return actions.get(t, wrapForContinue(this, t, callback,
      'getResource'));
};

/**
 * Special variant of get() that does not execute the last request but instead
 * yields the last URL to the callback.
 */
Builder.prototype.getUrl = function getUrl(callback) {
  log.debug('initiating traversal (getUrl)');
  var t = createInitialTraversalState(this);
  return actions.getUrl(t, wrapForContinue(this, t, callback, 'getUrl'));
};

/**
 * Alias for getUrl.
 */
Builder.prototype.getUri = Builder.prototype.getUrl;


/**
 * Starts the link traversal process and sends an HTTP POST request with the
 * given body to the last URL. Passes the HTTP response of the POST request to
 * the callback.
 */
Builder.prototype.post = function post(body, callback) {
  log.debug('initiating traversal (post)');
  var t = createInitialTraversalState(this, body);
  return actions.post(t, wrapForContinue(this, t, callback, 'post'));
};

/**
 * Starts the link traversal process and sends an HTTP PUT request with the
 * given body to the last URL. Passes the HTTP response of the PUT request to
 * the callback.
 */
Builder.prototype.put = function put(body, callback) {
  log.debug('initiating traversal (put)');
  var t = createInitialTraversalState(this, body);
  return actions.put(t, wrapForContinue(this, t, callback, 'put'));
};

/**
 * Starts the link traversal process and sends an HTTP PATCH request with the
 * given body to the last URL. Passes the HTTP response of the PATCH request to
 * the callback.
 */
Builder.prototype.patch = function patch(body, callback) {
  log.debug('initiating traversal (patch)');
  var t = createInitialTraversalState(this, body);
  return actions.patch(t, wrapForContinue(this, t, callback, 'patch'));
};

/**
 * Starts the link traversal process and sends an HTTP DELETE request to the
 * last URL. Passes the HTTP response of the DELETE request to the callback.
 */
Builder.prototype.delete = function del(callback) {
  log.debug('initiating traversal (delete)');
  var t = createInitialTraversalState(this);
  return actions.delete(t, wrapForContinue(this, t, callback, 'delete'));
};

/**
 * Alias for delete.
 */
Builder.prototype.del = Builder.prototype.delete;

function createInitialTraversalState(self, body) {

  var traversalState = {
    aborted: false,
    adapter: self.adapter || null,
    body: body || null,
    callbackHasBeenCalledAfterAbort: false,
    contentNegotiation: self.doesContentNegotiation(),
    continuation: null,
    convertResponseToObject: self.convertsResponseToObject(),
    links: self.links,
    jsonParser: self.getJsonParser(),
    requestModuleInstance: self.getRequestLibrary(),
    requestOptions: self.getRequestOptions(),
    resolveRelative: self.doesResolveRelative(),
    preferEmbedded: self.doesPreferEmbeddedResources(),
    startUrl: self.startUrl,
    step : {
      url: self.startUrl,
      index: 0,
    },
    templateParameters: self.getTemplateParameters(),
  };
  traversalState.abortTraversal = abortTraversal.bind(traversalState);

  if (self.continuation) {
    traversalState.continuation = self.continuation;
    traversalState.step = self.continuation.step;
    self.continuation = null;
  }

  return traversalState;
}

function wrapForContinue(self, t, callback, firstTraversalAction) {
  return function(err, result) {
    if (err) { return callback(err); }
    return callback(null, result, {
      continue: function() {
        if (!t) {
          throw new Error('no traversal state to continue from.');
        }

        log.debug('> continuing finished traversal process');
        self.continuation = {
          step: t.step,
          action: firstTraversalAction,
        };
        self.continuation.step.index = 0;
        initFromTraversalState(self, t);
        return self;
      },
    });
  };
}

/*
 * Copy configuration from traversal state to builder instance to
 * prepare for next traversal process.
 */
function initFromTraversalState(self, t) {
  self.aborted = false;
  self.adapter = t.adapter;
  self.body = t.body;
  self.callbackHasBeenCalledAfterAbort = false;
  self.contentNegotiation = t.contentNegotiation;
  self.convertResponseToObjectFlag = t.convertResponseToObject;
  self.links = [];
  self.jsonParser =  t.jsonParser;
  self.requestModuleInstance = t.requestModuleInstance,
  self.requestOptions = t.requestOptions,
  self.resolveRelativeFlag = t.resolveRelative;
  self.preferEmbedded = t.preferEmbedded;
  self.startUrl = t.startUrl;
  self.templateParameters = t.templateParameters;
}

function cloneArrayOrObject(thing) {
  if (util.isArray(thing)) {
    return shallowCloneArray(thing);
  } else if (typeof thing === 'object') {
    return deepCloneObject(thing);
  } else {
    return thing;
  }
}

function deepCloneObject(object) {
  return mergeRecursive(null, object);
}

function shallowCloneArray(array) {
  if (!array) {
    return array;
  }
  return array.slice(0);
}

module.exports = Builder;

},{"./abort_traversal":39,"./actions":40,"./media_type_registry":45,"./media_types":46,"./merge_recursive":47,"minilog":34,"request":36,"util":35}],42:[function(require,module,exports){
(function (process){
'use strict';
var minilog = require('minilog')
  , log = minilog('traverson')
  , abortTraversal = require('./abort_traversal')
  , detectContentType = require('./transforms/detect_content_type')
  , getOptionsForStep = require('./transforms/get_options_for_step');

/**
 * Executes a HTTP GET request during the link traversal process.
 */
// This method is currently used for all intermediate GET requests during the
// link traversal process. Coincidentally, it is also used for the final request
// in a link traversal should this happen to be a GET request. Otherwise (POST/
// PUT/PATCH/DELETE), Traverson uses exectueHttpRequest.
exports.fetchResource = function fetchResource(t, callback) {
  log.debug('fetching resource for next step');
  if (t.step.url) {
    log.debug('fetching resource from ', t.step.url);
    return executeHttpGet(t, callback);
  } else if (t.step.doc) {
    // The step already has an attached result document, so all is fine and we
    // can call the callback immediately
    log.debug('resource for next step has already been fetched, using ' +
        'embedded');
    return process.nextTick(function() {
      callback(null, t);
    });
  } else {
    return process.nextTick(function() {
      var error = new Error('Can not process step');
      error.step = t.step;
      callback(error, t);
    });
  }
};

function executeHttpGet(t, callback) {
  var options = getOptionsForStep(t);
  log.debug('HTTP GET request to ', t.step.url);
  log.debug('options ', options);
  t.currentRequest =
    t.requestModuleInstance.get(t.step.url, options,
        function(err, response, body) {
    log.debug('HTTP GET request to ' + t.step.url + ' returned');
    t.currentRequest = null;

    // workaround for cases where response body is empty but body comes in as
    // the third argument
    if (body && !response.body) {
      response.body = body;
    }
    t.step.response = response;

    if (err) {
     return callback(err, t);
    }
    log.debug('request to ' + t.step.url + ' finished without error (' +
      response.statusCode + ')');

    if (!detectContentType(t, callback)) return;

    return callback(null, t);
  });
  abortTraversal.registerAbortListener(t, callback);
}

/**
 * Executes an arbitrary HTTP request.
 */
// This method is currently used for POST/PUT/PATCH/DELETE at the end of a link
// traversal process. If the link traversal process requires a GET as the last
// request, Traverson uses exectueHttpGet.
exports.executeHttpRequest = function(t, request, method, callback) {
  var requestOptions = getOptionsForStep(t);
  if (t.body) {
    requestOptions.body = JSON.stringify(t.body);
  }

  log.debug('HTTP ' + method.name + ' request to ', t.step.url);
  log.debug('options ', requestOptions);
  t.currentRequest =
    method.call(request, t.step.url, requestOptions,
        function(err, response, body) {
    log.debug('HTTP ' + method.name + ' request to ' + t.step.url +
      ' returned');
    t.currentRequest = null;

    // workaround for cases where response body is empty but body comes in as
    // the third argument
    if (body && !response.body) {
      response.body = body;
    }
    t.step.response = response;

    if (err) {
      return callback(err);
    }

    return callback(null, response);
  });
  abortTraversal.registerAbortListener(t, callback);
};

}).call(this,require('_process'))
},{"./abort_traversal":39,"./transforms/detect_content_type":54,"./transforms/get_options_for_step":62,"_process":76,"minilog":34}],43:[function(require,module,exports){
'use strict';

module.exports = function isContinuation(t) {
  return t.continuation && t.step && t.step.response;
};

},{}],44:[function(require,module,exports){
'use strict';

var jsonpath = require('jsonpath-plus')
  , minilog = require('minilog')
  , _s = require('underscore.string');

function JsonAdapter(log) {
  this.log = log;
}

JsonAdapter.prototype.findNextStep = function(t, link) {
  validateLinkObject(link);
  var doc = t.lastStep.doc;
  this.log.debug('resolving link', link);
  switch (link.type) {
    case 'link-rel':
      return this._handleLinkRel(doc, link);
    case 'header':
      return this._handleHeader(t.lastStep.response, link);
    default:
      throw new Error('Link objects with type ' + link.type + ' are not ' +
        'supported by this adapter.', link);
  }
};

JsonAdapter.prototype._handleLinkRel = function(doc, link) {
  var linkRel = link.value;
  this.log.debug('looking for link-rel in doc', linkRel, doc);
  var url;
  if (this._testJSONPath(linkRel)) {
    return { url: this._resolveJSONPath(doc, linkRel) };
  } else if (doc[linkRel]) {
    return { url : doc[linkRel] };
  } else {
    throw new Error('Could not find property ' + linkRel +
        ' in document:\n', doc);
  }
};

function validateLinkObject(link) {
  if (typeof link === 'undefined' || link === null) {
    throw new Error('Link object is null or undefined.');
  }
  if (typeof link !== 'object') {
    throw new Error('Links must be objects, not ' + typeof link +
        ': ', link);
  }
  if (!link.type) {
    throw new Error('Link objects has no type attribute.', link);
  }
}

JsonAdapter.prototype._testJSONPath = function(link) {
  return _s.startsWith(link, '$.') || _s.startsWith(link, '$[');
};

JsonAdapter.prototype._resolveJSONPath = function(doc, link) {
  var matches = jsonpath({
    json: doc,
    path: link,
  });
  if (matches.length === 1) {
    var url = matches[0];
    if (!url) {
      throw new Error('JSONPath expression ' + link +
        ' was resolved but the result was null, undefined or an empty' +
        ' string in document:\n' + JSON.stringify(doc));
    }
    if (typeof url !== 'string') {
      throw new Error('JSONPath expression ' + link +
        ' was resolved but the result is not a property of type string. ' +
        'Instead it has type "' + (typeof url) +
        '" in document:\n' + JSON.stringify(doc));
    }
    return url;
  } else if (matches.length > 1) {
    // ambigious match
    throw new Error('JSONPath expression ' + link +
      ' returned more than one match in document:\n' +
      JSON.stringify(doc));
  } else {
    // no match at all
    throw new Error('JSONPath expression ' + link +
      ' returned no match in document:\n' + JSON.stringify(doc));
  }
};

JsonAdapter.prototype._handleHeader = function(httpResponse, link) {
  switch (link.value) {
    case 'location':
      var locationHeader = httpResponse.headers.location;
      if (!locationHeader) {
        throw new Error('Following the location header but there was no ' +
          'location header in the last response.');
      }
      return { url : locationHeader };
    default:
      throw new Error('Link objects with type header and value ' + link.value +
        ' are not supported by this adapter.', link);
  }
};

module.exports = JsonAdapter;

},{"jsonpath-plus":70,"minilog":34,"underscore.string":37}],45:[function(require,module,exports){
'use strict';

var mediaTypes = require('./media_types');

var registry = {};

exports.register = function register(contentType, constructor) {
  registry[contentType] = constructor;
};

exports.get = function get(contentType) {
  return registry[contentType];
};

exports.register(mediaTypes.CONTENT_NEGOTIATION,
    require('./negotiation_adapter'));
exports.register(mediaTypes.JSON, require('./json_adapter'));

},{"./json_adapter":44,"./media_types":46,"./negotiation_adapter":48}],46:[function(require,module,exports){
'use strict';

module.exports = {
  CONTENT_NEGOTIATION: 'content-negotiation',
  JSON: 'application/json',
  JSON_HAL: 'application/hal+json',
};

},{}],47:[function(require,module,exports){
'use strict';

// TODO Maybe replace with https://github.com/Raynos/xtend
// check browser build size, though.
function mergeRecursive(obj1, obj2) {
  if (!obj1 && obj2) {
    obj1 = {};
  }
  for (var key in obj2) {
    if (!obj2.hasOwnProperty(key)) {
      continue;
    }
    merge(obj1, obj2, key);
  }
  return obj1;
}

function merge(obj1, obj2, key) {
  if (typeof obj2[key] === 'object') {
    // if it is an object (that is, a non-leave in the tree),
    // and it is not present in obj1
    if (!obj1[key] || typeof obj1[key] !== 'object') {
      // ... we create an empty object in obj1
      obj1[key] = {};
    }
    // and we recurse deeper into the structure
    mergeRecursive(obj1[key], obj2[key]);
  } else if (typeof obj2[key] !== 'function') {
    // if it is primitive (string, number, boolean), we overwrite/add it to
    // obj1
    obj1[key] = obj2[key];
  }
}

module.exports = mergeRecursive;

},{}],48:[function(require,module,exports){
'use strict';

function NegotiationAdapter(log) {}

NegotiationAdapter.prototype.findNextStep = function(doc, link) {
  throw new Error('Content negotiation did not happen');
};

module.exports = NegotiationAdapter;

},{}],49:[function(require,module,exports){
(function (process){
/* jshint loopfunc: true */
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson');

/*
 * Applies async and sync transforms, one after another.
 */
function applyTransforms(transforms, t, callback) {
  log.debug('applying', transforms.length, 'transforms');
  for (var i = 0; i < transforms.length; i++) {
    var transform = transforms[i];
    log.debug('next transform', transform);
    if (transform.isAsync) {
      // asynchronous case
      return transform(t, function(t) {
        // this is only called when the async transform was successful,
        // otherwise t.callback has already been called with an error.
        applyTransforms(transforms.slice(i + 1), t, callback);
      });
    } else {
      // synchronous case
      var result = transform(t);
      if (!result) {
        log.debug('transform has failed or was a final transform');
        // stop processing t.callback has already been called
        return;
      }
    }
  }
  log.debug('all transformations done, starting next step');
  return process.nextTick(function() {
    callback(t);
  });
}

module.exports = applyTransforms;

}).call(this,require('_process'))
},{"_process":76,"minilog":34}],50:[function(require,module,exports){
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson')
  , isContinuation = require('../is_continuation');

module.exports = function checkHttpStatus(t) {
  // this step is ommitted for continuations
  if (isContinuation(t)) {
    return true;
  }

  log.debug('checking http status');
  if (!t.step.response && t.step.doc) {
    // Last step probably did not execute a HTTP request but used an embedded
    // document.
    log.debug('found embedded document, assuming no HTTP request has been ' +
        'made');
    return true;
  }

  // Only process response if http status was in 200 - 299 range.
  // The request module follows redirects for GET requests all by itself, so
  // we should not have to handle them here. If a 3xx http status get's here
  // something went wrong. 4xx and 5xx of course also indicate an error
  // condition. 1xx should not occur.
  var httpStatus = t.step.response.statusCode;
  if (httpStatus && (httpStatus < 200 || httpStatus >= 300)) {
    var error = httpError(t.step.url, httpStatus, t.step.response.body);
    log.error('unexpected http status code');
    log.error(error);
    t.callback(error);
    return false;
  }
  log.debug('http status code ok (' + httpStatus + ')');
  return true;
};

function httpError(url, httpStatus, body) {
  var error = new Error('HTTP GET for ' + url +
      ' resulted in HTTP status code ' + httpStatus + '.');
  error.name = 'HTTPError';
  error.url = url;
  error.httpStatus = httpStatus;
  error.body = body;
  try {
    error.doc = JSON.parse(body);
  } catch (e) {
    // ignore
  }
  return error;
}

},{"../is_continuation":43,"minilog":34}],51:[function(require,module,exports){
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson')
  , isContinuation = require('../is_continuation');

/*
 * This transform covers the case of a follow() call *without any links* after
 * a continue(). Actually, there is nothing to do here since we should have
 * fetched everything last time.
 */
module.exports = function continuationToDoc(t) {
  if (isContinuation(t)) {
    log.debug('continuing from last traversal process (actions)');
    t.continuation = null;
    t.callback(null, t.step.doc);
    return false;
  }
  return true;
};

},{"../is_continuation":43,"minilog":34}],52:[function(require,module,exports){
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson')
  , convertEmbeddedDocToResponse =
      require('./convert_embedded_doc_to_response')
  , isContinuation = require('../is_continuation');

/*
 * follow() call without links after continue(). Actually, there is nothing
 * to do here since we should have fetched everything last time.
 */
module.exports = function continuationToResponse(t) {
  if (isContinuation(t)) {
    log.debug('continuing from last traversal process (actions)');
    t.continuation = null;
    // Hm, a transform using another transform. This feels a bit fishy.
    convertEmbeddedDocToResponse(t);
    t.callback(null, t.step.response);
    return false;
  }
  return true;
};

},{"../is_continuation":43,"./convert_embedded_doc_to_response":53,"minilog":34}],53:[function(require,module,exports){
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson');

module.exports = function convertEmbeddedDocToResponse(t) {
  if (!t.step.response && t.step.doc) {
    log.debug('faking HTTP response for embedded resource');
    t.step.response = {
      statusCode: 200,
      body: JSON.stringify(t.step.doc),
      remark: 'This is not an actual HTTP response. The resource you ' +
        'requested was an embedded resource, so no HTTP request was ' +
        'made to acquire it.'
    };
  }
  return true;
};

},{"minilog":34}],54:[function(require,module,exports){
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson');

var mediaTypeRegistry = require('../media_type_registry');

module.exports = function detectContentType(t, callback) {
  if (t.contentNegotiation &&
      t.step.response &&
      t.step.response.headers &&
      t.step.response.headers['content-type']) {
    var contentType = t.step.response.headers['content-type'].split(/[; ]/)[0];
    var AdapterType = mediaTypeRegistry.get(contentType);
    if (!AdapterType) {
      callback(new Error('Unknown content type for content ' +
          'type detection: ' + contentType));
      return false;
    }
    // switch to new Adapter depending on Content-Type header of server
    t.adapter = new AdapterType(log);
  }
  return true;
};

},{"../media_type_registry":45,"minilog":34}],55:[function(require,module,exports){
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson')
  , abortTraversal = require('../abort_traversal')
  , httpRequests = require('../http_requests');

/*
 * Execute the last HTTP request in a traversal that ends in
 * post/put/patch/delete, but do not call t.callback immediately
 * (because we still need to do response body to object conversion
 * afterwards, for example)
 */
// TODO Why is this different from when do a GET?
// Probably only because the HTTP method is configurable here (with
// t.lastMethod), we might be able to unify this with the
// fetch_resource/fetch_last_resource transform.
function executeLastHttpRequest(t, callback) {
  // always check for aborted before doing an HTTP request
  if (t.aborted) {
    return abortTraversal.callCallbackOnAbort(t);
  }
  // only diff to execute_last_http_request: pass a new callback function
  // instead of t.callback.
  httpRequests.executeHttpRequest(
      t, t.requestModuleInstance, t.lastMethod, function(err, response) {
    if (err) {
      if (!err.aborted) {
        log.debug('error while processing step ', t.step);
        log.error(err);
      }
      return t.callback(err);
    }
    callback(t);
  });
}

executeLastHttpRequest.isAsync = true;

module.exports = executeLastHttpRequest;

},{"../abort_traversal":39,"../http_requests":42,"minilog":34}],56:[function(require,module,exports){
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson')
  , abortTraversal = require('../abort_traversal')
  , httpRequests = require('../http_requests');

/*
 * Execute the last http request in a traversal that ends in
 * post/put/patch/delete.
 */
// TODO Why is this different from when do a GET at the end of the traversal?
// Probably only because the HTTP method is configurable here (with
// t.lastMethod), we might be able to unify this with the
// fetch_resource/fetch_last_resource transform.
function executeLastHttpRequest(t, callback) {
  // always check for aborted before doing an HTTP request
  if (t.aborted) {
    return abortTraversal.callCallbackOnAbort(t);
  }
  httpRequests.executeHttpRequest(
      t, t.requestModuleInstance, t.lastMethod, t.callback);
}

executeLastHttpRequest.isAsync = true;

module.exports = executeLastHttpRequest;

},{"../abort_traversal":39,"../http_requests":42,"minilog":34}],57:[function(require,module,exports){
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson');

/*
 * This transform is meant to be run at the very end of a getResource call. It
 * just extracts the last doc from the step and calls t.callback with it.
 */
module.exports = function extractDoc(t) {
  log.debug('walker.walk has finished');
  /*
  TODO Breaks a lot of tests although it seems to make perfect sense?!?
  if (!t.doc) {
    t.callback(new Error('No document available'));
    return false;
  }
  */

  t.callback(null, t.step.doc);

  // This is a so called final transform that is only applied at the very end
  // and it always calls t.callback - in contrast to other transforms it does
  // not call t.callback in the error case, but as a success.
  // We return false to make sure processing ends here.
  return false;
};

},{"minilog":34}],58:[function(require,module,exports){
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson');

/*
 * This transform is meant to be run at the very end of a get/post/put/patch/
 * delete call. It just extracts the last response from the step and calls
 * t.callback with it.
 */
module.exports = function extractDoc(t) {
  log.debug('walker.walk has finished');
  /*
  TODO Breaks a lot of tests although it seems to make perfect sense?!?
  if (!t.response) {
    t.callback(new Error('No response available'));
    return false;
  }
  */

  t.callback(null, t.step.response);

  // This is a so called final transform that is only applied at the very end
  // and it always calls t.callback - in contrast to other transforms it does
  // not call t.callback in the error case, but as a success.
  // We return false to make sure processing ends here.
  return false;
};

},{"minilog":34}],59:[function(require,module,exports){
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson')
  , url = require('url');

/*
 * This transform is meant to be run at the very end of a get/post/put/patch/
 * delete call. It just extracts the last accessed url from the step and calls
 * t.callback with it.
 */
module.exports = function extractDoc(t) {
  log.debug('walker.walk has finished');
  if (t.step.url) {
    return t.callback(null, t.step.url);
  } else if (t.step.doc &&
    // TODO actually this is very HAL specific :-/
    t.step.doc._links &&
    t.step.doc._links.self &&
    t.step.doc._links.self.href) {
    return t.callback(
        null, url.resolve(t.startUrl, t.step.doc._links.self.href));
  } else {
    return t.callback(new Error('You requested an URL but the last ' +
        'resource is an embedded resource and has no URL of its own ' +
        '(that is, it has no link with rel=\"self\"'));
  }
};

},{"minilog":34,"url":38}],60:[function(require,module,exports){
'use strict';

// TODO Only difference to lib/transform/fetch_resource is the continuation
// checking, which is missing here. Maybe we can delete this transform and use
// fetch_resource in its place everywhere?

var minilog = require('minilog')
  , log = minilog('traverson')
  , abortTraversal = require('../abort_traversal')
  , httpRequests = require('../http_requests');

/*
 * Execute the last step in a traversal that ends with an HTTP GET.
 */
// This is similar to lib/transforms/fetch_resource.js - refactoring potential?
function fetchLastResource(t, callback) {
  // always check for aborted before doing an HTTP request
  if (t.aborted) {
    return abortTraversal.callCallbackOnAbort(t);
  }
  httpRequests.fetchResource(t, function(err, t) {
    log.debug('fetchResource returned (fetchLastResource).');
    if (err) {
      if (!err.aborted) {
        log.debug('error while processing step ', t.step);
        log.error(err);
      }
      return t.callback(err);
    }
    callback(t);
  });
}

fetchLastResource.isAsync = true;

module.exports = fetchLastResource;

},{"../abort_traversal":39,"../http_requests":42,"minilog":34}],61:[function(require,module,exports){
(function (process){
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson')
  , abortTraversal = require('../abort_traversal')
  , isContinuation = require('../is_continuation')
  , httpRequests = require('../http_requests');

/*
 * Execute the next step in the traversal. In most cases that is an HTTP get to
 *the next URL.
 */

function fetchResource(t, callback) {
  if (isContinuation(t)) {
    convertContinuation(t, callback);
  } else {
    fetchViaHttp(t, callback);
  }
}

fetchResource.isAsync = true;

/*
 * This is a continuation of an earlier traversal process.
 * We need to shortcut to the next step (without executing the final HTTP
 * request of the last traversal again.
 */
function convertContinuation(t, callback) {
  log.debug('continuing from last traversal process (walker)');
  process.nextTick(function() { // de-zalgo continuations
    callback(t);
  });
}

function fetchViaHttp(t, callback) {
  // always check for aborted before doing an HTTP request
  if (t.aborted) {
    return abortTraversal.callCallbackOnAbort(t);
  }
  httpRequests.fetchResource(t, function(err, t) {
    log.debug('fetchResource returned');
    if (err) {
      if (!err.aborted) {
        log.debug('error while processing step ', t.step);
        log.error(err);
      }
      return t.callback(err);
    }
    callback(t);
  });
}

module.exports = fetchResource;

}).call(this,require('_process'))
},{"../abort_traversal":39,"../http_requests":42,"../is_continuation":43,"_process":76,"minilog":34}],62:[function(require,module,exports){
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson')
  , util = require('util');

module.exports = function getOptionsForStep(t) {
  var options = t.requestOptions;
  if (util.isArray(t.requestOptions)) {
    options = t.requestOptions[t.step.index] || {};
  }
  log.debug('options: ', options);
  return options;
};

},{"minilog":34,"util":35}],63:[function(require,module,exports){
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson')
  , isContinuation = require('../is_continuation');

module.exports = function parse(t) {
  // TODO Duplicated in actions#afterGetResource etc.
  // this step is ommitted for continuations that parse at the end
  if (isContinuation(t)) {
    log.debug('continuing from last traversal process (transforms/parse)');
    // if last traversal did a parse at the end we do not need to parse again
    // (this condition will need to change with
    // https://github.com/basti1302/traverson/issues/44)
    if (t.continuation.action === 'getResource') {
      return true;
    }
  }
  if (t.step.doc) {
    // Last step probably did not execute a HTTP request but used an embedded
    // document.
    log.debug('no parsing necessary, probably an embedded document');
    return true;
  }

  try {
    log.debug('parsing response body');
    t.step.doc = t.jsonParser(t.step.response.body);
    return true;
  } catch (e) {
    var error = e;
    if (e.name === 'SyntaxError') {
      error = jsonError(t.step.url, t.step.response.body);
    }
    log.error('parsing failed');
    log.error(error);
    t.callback(error);
    return false;
  }
};

function jsonError(url, body) {
  var error = new Error('The document at ' + url +
      ' could not be parsed as JSON: ' + body);
  error.name = 'JSONError';
  error.url = url;
  error.body = body;
  return error;
}

},{"../is_continuation":43,"minilog":34}],64:[function(require,module,exports){
'use strict';

var isContinuation = require('../is_continuation');

module.exports = function resetLastStep(t) {
  // this step is ommitted for continuations
  if (isContinuation(t)) {
    return true;
  }

  t.continuation = null;
  return true;
};

},{"../is_continuation":43}],65:[function(require,module,exports){
'use strict';

var isContinuation = require('../is_continuation');

module.exports = function resetLastStep(t) {
  // this step is ommitted for continuations
  if (isContinuation(t)) {
    return true;
  }

  t.lastStep = null;
  return true;
};

},{"../is_continuation":43}],66:[function(require,module,exports){
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson')
  , _s = require('underscore.string')
  , url = require('url');

var protocolRegEx = /https?:\/\//i;

module.exports = function resolveNextUrl(t) {
  if (t.step.url) {
    if (t.step.url.search(protocolRegEx) !== 0) {
      log.debug('found non full qualified URL');
      if (t.resolveRelative && t.lastStep && t.lastStep.url) {
        // edge case: resolve URL relatively (only when requested by client)
        log.debug('resolving URL relative');
        if (_s.startsWith(t.step.url, '/') &&
          _s.endsWith(t.lastStep.url, '/')) {
          t.step.url = _s.splice(t.step.url, 0, 1);
        }
        t.step.url = t.lastStep.url + t.step.url;
      } else {
        // This is the default case and what happens most likely (not a full
        // qualified URL, not resolving relatively) and we simply use Node's url
        // module (or the appropriate shim) here.
        t.step.url = url.resolve(t.startUrl, t.step.url);
      }
    } // edge case: full qualified URL -> no URL resolving necessary
  } // no t.step.url -> no URL resolving (step might contain an embedded doc)
  return true;
};

},{"minilog":34,"underscore.string":37,"url":38}],67:[function(require,module,exports){
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson')
  , _s = require('underscore.string')
  , uriTemplate = require('url-template')
  , util = require('util');

module.exports = function resolveUriTemplate(t) {
  if (t.step.url) {
    // next link found in last response, might be a URI template
    var templateParams = t.templateParameters;
    if (util.isArray(templateParams)) {
      // if template params were given as an array, only use the array element
      // for the current index for URI template resolving.
      templateParams = templateParams[t.step.index];
    }
    templateParams = templateParams || {};

    if (_s.contains(t.step.url, '{')) {
      log.debug('resolving URI template');
      var template = uriTemplate.parse(t.step.url);
      var resolved = template.expand(templateParams);
      log.debug('resolved to ', resolved);
      t.step.url = resolved;
    }
  }
  return true;
};



},{"minilog":34,"underscore.string":37,"url-template":72,"util":35}],68:[function(require,module,exports){
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson');

module.exports = function switchToNextStep(t) {
  // extract next link to follow from last response
  var link = t.links[t.step.index];
  log.debug('next link: ' + link);

  // save last step before overwriting it with the next step (required for
  // relative URL resolution, where we need the last URL)
  t.lastStep = t.step;

  t.step = findNextStep(t, link);
  if (!t.step) return false;

  log.debug('found next step', t.step);

  // backward compatibility fix for media type plug-ins using step.uri instead
  // of step.url (until 1.0.0)
  t.step.url = t.step.url || t.step.uri;

  t.step.index = t.lastStep.index + 1;
  return true;
};

function findNextStep(t, link) {
  try {
    return t.adapter.findNextStep(t, link);
  } catch (e) {
    log.error('could not find next step');
    log.error(e);
    t.callback(e);
    return null;
  }
}

},{"minilog":34}],69:[function(require,module,exports){
'use strict';

var minilog = require('minilog')
  , log = minilog('traverson')
  , abortTraversal = require('./abort_traversal')
  , applyTransforms = require('./transforms/apply_transforms')
  , isContinuation = require('./is_continuation')
  , resolveUriTemplate = require('./transforms/resolve_uri_template');

var transforms = [
  require('./transforms/fetch_resource'),
  require('./transforms/reset_last_step'),
  // check HTTP status code
  require('./transforms/check_http_status'),
  // parse JSON from last response
  require('./transforms/parse'),
  // retrieve next link and switch to next step
  require('./transforms/switch_to_next_step'),
  // URI template has to be resolved before post processing the URL,
  // because we do url.resolve with it (in json_hal) and this would URL-
  // encode curly braces.
  resolveUriTemplate,
  require('./transforms/resolve_next_url'),
  require('./transforms/reset_continuation'),
];

/**
 * Walks from resource to resource along the path given by the link relations
 * from this.links until it has reached the last URL. On reaching this, it calls
 * the given callback with the last resulting step.
 */
exports.walk = function(t, transformsAfterLastStep, callback) {
  // even the root URL might be a template, so we apply the resolveUriTemplate
  // once before starting the walk.
  if (!resolveUriTemplate(t)) return;

  // starts the link rel walking process
  log.debug('starting to follow links');
  transformsAfterLastStep = transformsAfterLastStep || [];
  t.callback = callback;
  processStep(t, transformsAfterLastStep);
};

function processStep(t, transformsAfterLastStep) {
  log.debug('processing next step');
  if (moreLinksToFollow(t) && !isAborted(t)) {
    applyTransforms(transforms, t, function(t) {
      log.debug('successfully processed step');
      // call processStep recursively again to follow next link
      processStep(t, transformsAfterLastStep);
    });
  } else if (isAborted(t)) {
    return abortTraversal.callCallbackOnAbort(t);
  } else {
    // link array is exhausted, we are done and return the last response
    // and URL to the callback the client passed into the walk method.
    log.debug('link array exhausted');

    applyTransforms(transformsAfterLastStep, t, function(t) {
      // This is pretty ugly. This code implies, that we call t.callback from
      // here, but actually we usually call it from lib/transforms/extract_doc
      // or lib/transforms/extract_response which then return false to terminate
      // the processing.
      return t.callback();
    });
  }
}

function moreLinksToFollow(t) {
  return t.step.index < t.links.length;
}

function isAborted(t) {
  return t.aborted;
}

},{"./abort_traversal":39,"./is_continuation":43,"./transforms/apply_transforms":49,"./transforms/check_http_status":50,"./transforms/fetch_resource":61,"./transforms/parse":63,"./transforms/reset_continuation":64,"./transforms/reset_last_step":65,"./transforms/resolve_next_url":66,"./transforms/resolve_uri_template":67,"./transforms/switch_to_next_step":68,"minilog":34}],70:[function(require,module,exports){
/*global exports, require*/
/* eslint-disable no-eval */
/* JSONPath 0.8.0 - XPath for JSON
 *
 * Copyright (c) 2007 Stefan Goessner (goessner.net)
 * Licensed under the MIT (MIT-LICENSE.txt) licence.
 */

var module;
(function (require) {'use strict';

// Make sure to know if we are in real node or not (the `require` variable
// could actually be require.js, for example.
var isNode = module && !!module.exports;

var allowedResultTypes = ['value', 'path', 'pointer', 'parent', 'parentProperty', 'all'];

var vm = isNode
    ? require('vm') : {
        runInNewContext: function (expr, context) {
            return eval(Object.keys(context).reduce(function (s, vr) {
                return 'var ' + vr + '=' + JSON.stringify(context[vr]).replace(/\u2028|\u2029/g, function (m) {
                    // http://www.thespanner.co.uk/2011/07/25/the-json-specification-is-now-wrong/
                    return '\\u202' + (m === '\u2028' ? '8' : '9');
                }) + ';' + s;
            }, expr));
        }
    };

function push (arr, elem) {arr = arr.slice(); arr.push(elem); return arr;}
function unshift (elem, arr) {arr = arr.slice(); arr.unshift(elem); return arr;}
function NewError (value) {
  this.avoidNew = true;
  this.value = value;
  this.message = 'JSONPath should not be called with "new" (it prevents return of (unwrapped) scalar values)';
}

function JSONPath (opts, expr, obj, callback, otherTypeCallback) {
    if (!(this instanceof JSONPath)) {
        try {
            return new JSONPath(opts, expr, obj, callback, otherTypeCallback);
        }
        catch (e) {
            if (!e.avoidNew) {
                throw e;
            }
            return e.value;
        }
    }

    if (typeof opts === 'string') {
        otherTypeCallback = callback;
        callback = obj;
        obj = expr;
        expr = opts;
        opts = {};
    }
    opts = opts || {};
    var objArgs = opts.hasOwnProperty('json') && opts.hasOwnProperty('path');
    this.json = opts.json || obj;
    this.path = opts.path || expr;
    this.resultType = (opts.resultType && opts.resultType.toLowerCase()) || 'value';
    this.flatten = opts.flatten || false;
    this.wrap = opts.hasOwnProperty('wrap') ? opts.wrap : true;
    this.sandbox = opts.sandbox || {};
    this.preventEval = opts.preventEval || false;
    this.parent = opts.parent || null;
    this.parentProperty = opts.parentProperty || null;
    this.callback = opts.callback || callback || null;
    this.otherTypeCallback = opts.otherTypeCallback || otherTypeCallback || function () {
        throw new Error('You must supply an otherTypeCallback callback option with the @other() operator.');
    };

    if (opts.autostart !== false) {
        var ret = this.evaluate({
            path: (objArgs ? opts.path : expr),
            json: (objArgs ? opts.json : obj)
        });
        if (!ret || typeof ret !== 'object') {
            throw new NewError(ret);
        }
        return ret;
    }
}

// PUBLIC METHODS

JSONPath.prototype.evaluate = function (expr, json, callback, otherTypeCallback) {
    var self = this,
        flatten = this.flatten,
        wrap = this.wrap,
        currParent = this.parent,
        currParentProperty = this.parentProperty;

    this.currResultType = this.resultType;
    this.currPreventEval = this.preventEval;
    this.currSandbox = this.sandbox;
    callback = callback || this.callback;
    this.currOtherTypeCallback = otherTypeCallback || this.otherTypeCallback;

    json = json || this.json;
    expr = expr || this.path;
    if (expr && typeof expr === 'object') {
        if (!expr.path) {
            throw new Error('You must supply a "path" property when providing an object argument to JSONPath.evaluate().');
        }
        json = expr.hasOwnProperty('json') ? expr.json : json;
        flatten = expr.hasOwnProperty('flatten') ? expr.flatten : flatten;
        this.currResultType = expr.hasOwnProperty('resultType') ? expr.resultType : this.currResultType;
        this.currSandbox = expr.hasOwnProperty('sandbox') ? expr.sandbox : this.currSandbox;
        wrap = expr.hasOwnProperty('wrap') ? expr.wrap : wrap;
        this.currPreventEval = expr.hasOwnProperty('preventEval') ? expr.preventEval : this.currPreventEval;
        callback = expr.hasOwnProperty('callback') ? expr.callback : callback;
        this.currOtherTypeCallback = expr.hasOwnProperty('otherTypeCallback') ? expr.otherTypeCallback : this.currOtherTypeCallback;
        currParent = expr.hasOwnProperty('parent') ? expr.parent : currParent;
        currParentProperty = expr.hasOwnProperty('parentProperty') ? expr.parentProperty : currParentProperty;
        expr = expr.path;
    }
    currParent = currParent || null;
    currParentProperty = currParentProperty || null;

    if (Array.isArray(expr)) {
        expr = JSONPath.toPathString(expr);
    }
    if (!expr || !json || allowedResultTypes.indexOf(this.currResultType) === -1) {
        return;
    }
    this._obj = json;

    var exprList = JSONPath.toPathArray(expr);
    if (exprList[0] === '$' && exprList.length > 1) {exprList.shift();}
    var result = this._trace(exprList, json, ['$'], currParent, currParentProperty, callback);
    result = result.filter(function (ea) {return ea && !ea.isParentSelector;});

    if (!result.length) {return wrap ? [] : undefined;}
    if (result.length === 1 && !wrap && !Array.isArray(result[0].value)) {
        return this._getPreferredOutput(result[0]);
    }
    return result.reduce(function (result, ea) {
        var valOrPath = self._getPreferredOutput(ea);
        if (flatten && Array.isArray(valOrPath)) {
            result = result.concat(valOrPath);
        }
        else {
            result.push(valOrPath);
        }
        return result;
    }, []);
};

// PRIVATE METHODS

JSONPath.prototype._getPreferredOutput = function (ea) {
    var resultType = this.currResultType;
    switch (resultType) {
    case 'all':
        ea.path = typeof ea.path === 'string' ? ea.path : JSONPath.toPathString(ea.path);
        return ea;
    case 'value': case 'parent': case 'parentProperty':
        return ea[resultType];
    case 'path':
        return JSONPath.toPathString(ea[resultType]);
    case 'pointer':
        return JSONPath.toPointer(ea.path);
    }
};

JSONPath.prototype._handleCallback = function (fullRetObj, callback, type) {
    if (callback) {
        var preferredOutput = this._getPreferredOutput(fullRetObj);
        fullRetObj.path = typeof fullRetObj.path === 'string' ? fullRetObj.path : JSONPath.toPathString(fullRetObj.path);
        callback(preferredOutput, type, fullRetObj);
    }
};

JSONPath.prototype._trace = function (expr, val, path, parent, parentPropName, callback) {
    // No expr to follow? return path and value as the result of this trace branch
    var retObj, self = this;
    if (!expr.length) {
        retObj = {path: path, value: val, parent: parent, parentProperty: parentPropName};
        this._handleCallback(retObj, callback, 'value');
        return retObj;
    }

    var loc = expr[0], x = expr.slice(1);

    // We need to gather the return value of recursive trace calls in order to
    // do the parent sel computation.
    var ret = [];
    function addRet (elems) {ret = ret.concat(elems);}

    if (val && Object.prototype.hasOwnProperty.call(val, loc)) { // simple case--directly follow property
        addRet(this._trace(x, val[loc], push(path, loc), val, loc, callback));
    }
    else if (loc === '*') { // all child properties
        this._walk(loc, x, val, path, parent, parentPropName, callback, function (m, l, x, v, p, par, pr, cb) {
            addRet(self._trace(unshift(m, x), v, p, par, pr, cb));
        });
    }
    else if (loc === '..') { // all descendent parent properties
        addRet(this._trace(x, val, path, parent, parentPropName, callback)); // Check remaining expression with val's immediate children
        this._walk(loc, x, val, path, parent, parentPropName, callback, function (m, l, x, v, p, par, pr, cb) {
            // We don't join m and x here because we only want parents, not scalar values
            if (typeof v[m] === 'object') { // Keep going with recursive descent on val's object children
                addRet(self._trace(unshift(l, x), v[m], push(p, m), v, m, cb));
            }
        });
    }
    else if (loc[0] === '(') { // [(expr)] (dynamic property/index)
        if (this.currPreventEval) {
            throw new Error('Eval [(expr)] prevented in JSONPath expression.');
        }
        // As this will resolve to a property name (but we don't know it yet), property and parent information is relative to the parent of the property to which this expression will resolve
        addRet(this._trace(unshift(this._eval(loc, val, path[path.length - 1], path.slice(0, -1), parent, parentPropName), x), val, path, parent, parentPropName, callback));
    }
    // The parent sel computation is handled in the frame above using the
    // ancestor object of val
    else if (loc === '^') {
        // This is not a final endpoint, so we do not invoke the callback here
        return path.length ? {
            path: path.slice(0, -1),
            expr: x,
            isParentSelector: true
        } : [];
    }
    else if (loc === '~') { // property name
        retObj = {path: push(path, loc), value: parentPropName, parent: parent, parentProperty: null};
        this._handleCallback(retObj, callback, 'property');
        return retObj;
    }
    else if (loc === '$') { // root only
        addRet(this._trace(x, val, path, null, null, callback));
    }
    else if (loc.indexOf('?(') === 0) { // [?(expr)] (filtering)
        if (this.currPreventEval) {
            throw new Error('Eval [?(expr)] prevented in JSONPath expression.');
        }
        this._walk(loc, x, val, path, parent, parentPropName, callback, function (m, l, x, v, p, par, pr, cb) {
            if (self._eval(l.replace(/^\?\((.*?)\)$/, '$1'), v[m], m, p, par, pr)) {
                addRet(self._trace(unshift(m, x), v, p, par, pr, cb));
            }
        });
    }
    else if (loc.indexOf(',') > -1) { // [name1,name2,...]
        var parts, i;
        for (parts = loc.split(','), i = 0; i < parts.length; i++) {
            addRet(this._trace(unshift(parts[i], x), val, path, parent, parentPropName, callback));
        }
    }
    else if (loc[0] === '@') { // value type: @boolean(), etc.
        var addType = false;
        var valueType = loc.slice(1, -2);
        switch (valueType) {
        case 'boolean': case 'string': case 'undefined': case 'function':
            if (typeof val === valueType) {
                addType = true;
            }
            break;
        case 'number':
            if (typeof val === valueType && isFinite(val)) {
                addType = true;
            }
            break;
        case 'nonFinite':
            if (typeof val === 'number' && !isFinite(val)) {
                addType = true;
            }
            break;
        case 'object':
            if (val && typeof val === valueType) {
                addType = true;
            }
            break;
        case 'array':
            if (Array.isArray(val)) {
                addType = true;
            }
            break;
        case 'other':
            addType = this.currOtherTypeCallback(val, path, parent, parentPropName);
            break;
        case 'integer':
            if (val === +val && isFinite(val) && !(val % 1)) {
                addType = true;
            }
            break;
        case 'null':
            if (val === null) {
                addType = true;
            }
            break;
        }
        if (addType) {
            retObj = {path: path, value: val, parent: parent, parentProperty: parentPropName};
            this._handleCallback(retObj, callback, 'value');
            return retObj;
        }
    }
    else if (/^(-?[0-9]*):(-?[0-9]*):?([0-9]*)$/.test(loc)) { // [start:end:step]  Python slice syntax
        addRet(this._slice(loc, x, val, path, parent, parentPropName, callback));
    }

    // We check the resulting values for parent selections. For parent
    // selections we discard the value object and continue the trace with the
    // current val object
    return ret.reduce(function (all, ea) {
        return all.concat(ea.isParentSelector ? self._trace(ea.expr, val, ea.path, parent, parentPropName, callback) : ea);
    }, []);
};

JSONPath.prototype._walk = function (loc, expr, val, path, parent, parentPropName, callback, f) {
    var i, n, m;
    if (Array.isArray(val)) {
        for (i = 0, n = val.length; i < n; i++) {
            f(i, loc, expr, val, path, parent, parentPropName, callback);
        }
    }
    else if (typeof val === 'object') {
        for (m in val) {
            if (Object.prototype.hasOwnProperty.call(val, m)) {
                f(m, loc, expr, val, path, parent, parentPropName, callback);
            }
        }
    }
};

JSONPath.prototype._slice = function (loc, expr, val, path, parent, parentPropName, callback) {
    if (!Array.isArray(val)) {return;}
    var i,
        len = val.length, parts = loc.split(':'),
        start = (parts[0] && parseInt(parts[0], 10)) || 0,
        end = (parts[1] && parseInt(parts[1], 10)) || len,
        step = (parts[2] && parseInt(parts[2], 10)) || 1;
    start = (start < 0) ? Math.max(0, start + len) : Math.min(len, start);
    end = (end < 0) ? Math.max(0, end + len) : Math.min(len, end);
    var ret = [];
    for (i = start; i < end; i += step) {
        ret = ret.concat(this._trace(unshift(i, expr), val, path, parent, parentPropName, callback));
    }
    return ret;
};

JSONPath.prototype._eval = function (code, _v, _vname, path, parent, parentPropName) {
    if (!this._obj || !_v) {return false;}
    if (code.indexOf('@parentProperty') > -1) {
        this.currSandbox._$_parentProperty = parentPropName;
        code = code.replace(/@parentProperty/g, '_$_parentProperty');
    }
    if (code.indexOf('@parent') > -1) {
        this.currSandbox._$_parent = parent;
        code = code.replace(/@parent/g, '_$_parent');
    }
    if (code.indexOf('@property') > -1) {
        this.currSandbox._$_property = _vname;
        code = code.replace(/@property/g, '_$_property');
    }
    if (code.indexOf('@path') > -1) {
        this.currSandbox._$_path = JSONPath.toPathString(path.concat([_vname]));
        code = code.replace(/@path/g, '_$_path');
    }
    if (code.match(/@([\.\s\)\[])/)) {
        this.currSandbox._$_v = _v;
        code = code.replace(/@([\.\s\)\[])/g, '_$_v$1');
    }
    try {
        return vm.runInNewContext(code, this.currSandbox);
    }
    catch (e) {
        console.log(e);
        throw new Error('jsonPath: ' + e.message + ': ' + code);
    }
};

// PUBLIC CLASS PROPERTIES AND METHODS

// Could store the cache object itself
JSONPath.cache = {};

JSONPath.toPathString = function (pathArr) {
    var i, n, x = pathArr, p = '$';
    for (i = 1, n = x.length; i < n; i++) {
        if (!(/^(~|\^|@.*?\(\))$/).test(x[i])) {
            p += (/^[0-9*]+$/).test(x[i]) ? ('[' + x[i] + ']') : ("['" + x[i] + "']");
        }
    }
    return p;
};

JSONPath.toPointer = function (pointer) {
    var i, n, x = pointer, p = '';
    for (i = 1, n = x.length; i < n; i++) {
        if (!(/^(~|\^|@.*?\(\))$/).test(x[i])) {
            p += '/' + x[i].toString()
                  .replace(/\~/g, '~0')
                  .replace(/\//g, '~1');
        }
    }
    return p;
};

JSONPath.toPathArray = function (expr) {
    var cache = JSONPath.cache;
    if (cache[expr]) {return cache[expr];}
    var subx = [];
    var normalized = expr
                    // Properties
                    .replace(/@(?:null|boolean|number|string|array|object|integer|undefined|nonFinite|function|other)\(\)/g, ';$&;')
                    // Parenthetical evaluations (filtering and otherwise), directly within brackets or single quotes
                    .replace(/[\['](\??\(.*?\))[\]']/g, function ($0, $1) {return '[#' + (subx.push($1) - 1) + ']';})
                    // Escape periods and tildes within properties
                    .replace(/\['([^'\]]*)'\]/g, function ($0, prop) {
                        return "['" + prop.replace(/\./g, '%@%').replace(/~/g, '%%@@%%') + "']";
                    })
                    // Properties operator
                    .replace(/~/g, ';~;')
                    // Split by property boundaries
                    .replace(/'?\.'?(?![^\[]*\])|\['?/g, ';')
                    // Reinsert periods within properties
                    .replace(/%@%/g, '.')
                    // Reinsert tildes within properties
                    .replace(/%%@@%%/g, '~')
                    // Parent
                    .replace(/(?:;)?(\^+)(?:;)?/g, function ($0, ups) {return ';' + ups.split('').join(';') + ';';})
                    // Descendents
                    .replace(/;;;|;;/g, ';..;')
                    // Remove trailing
                    .replace(/;$|'?\]|'$/g, '');

    var exprList = normalized.split(';').map(function (expr) {
        var match = expr.match(/#([0-9]+)/);
        return !match || !match[1] ? expr : subx[match[1]];
    });
    cache[expr] = exprList;
    return cache[expr];
};

// For backward compatibility (deprecated)
JSONPath.eval = function (obj, expr, opts) {
    return JSONPath(opts, expr, obj);
};

if (typeof define === 'function' && define.amd) {
    define(function () {return JSONPath;});
}
else if (isNode) {
    module.exports = JSONPath;
}
else {
    self.jsonPath = { // Deprecated
        eval: JSONPath.eval
    };
    self.JSONPath = JSONPath;
}
}(typeof require === 'undefined' ? null : require));

},{"vm":77}],71:[function(require,module,exports){
// Copyright 2014 Simon Lydell
// X11 (“MIT”) Licensed. (See LICENSE.)

void (function(root, factory) {
  if (typeof define === "function" && define.amd) {
    define(factory)
  } else if (typeof exports === "object") {
    module.exports = factory()
  } else {
    root.resolveUrl = factory()
  }
}(this, function() {

  function resolveUrl(/* ...urls */) {
    var numUrls = arguments.length

    if (numUrls === 0) {
      throw new Error("resolveUrl requires at least one argument; got none.")
    }

    var base = document.createElement("base")
    base.href = arguments[0]

    if (numUrls === 1) {
      return base.href
    }

    var head = document.getElementsByTagName("head")[0]
    head.insertBefore(base, head.firstChild)

    var a = document.createElement("a")
    var resolved

    for (var index = 1; index < numUrls; index++) {
      a.href = arguments[index]
      resolved = a.href
      base.href = resolved
    }

    head.removeChild(base)

    return resolved
  }

  return resolveUrl

}));

},{}],72:[function(require,module,exports){
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        root.urltemplate = factory();
    }
}(this, function () {
  /**
   * @constructor
   */
  function UrlTemplate() {
  }

  /**
   * @private
   * @param {string} str
   * @return {string}
   */
  UrlTemplate.prototype.encodeReserved = function (str) {
    return str.split(/(%[0-9A-Fa-f]{2})/g).map(function (part) {
      if (!/%[0-9A-Fa-f]/.test(part)) {
        part = encodeURI(part);
      }
      return part;
    }).join('');
  };

  /**
   * @private
   * @param {string} operator
   * @param {string} value
   * @param {string} key
   * @return {string}
   */
  UrlTemplate.prototype.encodeValue = function (operator, value, key) {
    value = (operator === '+' || operator === '#') ? this.encodeReserved(value) : encodeURIComponent(value);

    if (key) {
      return encodeURIComponent(key) + '=' + value;
    } else {
      return value;
    }
  };

  /**
   * @private
   * @param {*} value
   * @return {boolean}
   */
  UrlTemplate.prototype.isDefined = function (value) {
    return value !== undefined && value !== null;
  };

  /**
   * @private
   * @param {string}
   * @return {boolean}
   */
  UrlTemplate.prototype.isKeyOperator = function (operator) {
    return operator === ';' || operator === '&' || operator === '?';
  };

  /**
   * @private
   * @param {Object} context
   * @param {string} operator
   * @param {string} key
   * @param {string} modifier
   */
  UrlTemplate.prototype.getValues = function (context, operator, key, modifier) {
    var value = context[key],
        result = [];

    if (this.isDefined(value) && value !== '') {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        value = value.toString();

        if (modifier && modifier !== '*') {
          value = value.substring(0, parseInt(modifier, 10));
        }

        result.push(this.encodeValue(operator, value, this.isKeyOperator(operator) ? key : null));
      } else {
        if (modifier === '*') {
          if (Array.isArray(value)) {
            value.filter(this.isDefined).forEach(function (value) {
              result.push(this.encodeValue(operator, value, this.isKeyOperator(operator) ? key : null));
            }, this);
          } else {
            Object.keys(value).forEach(function (k) {
              if (this.isDefined(value[k])) {
                result.push(this.encodeValue(operator, value[k], k));
              }
            }, this);
          }
        } else {
          var tmp = [];

          if (Array.isArray(value)) {
            value.filter(this.isDefined).forEach(function (value) {
              tmp.push(this.encodeValue(operator, value));
            }, this);
          } else {
            Object.keys(value).forEach(function (k) {
              if (this.isDefined(value[k])) {
                tmp.push(encodeURIComponent(k));
                tmp.push(this.encodeValue(operator, value[k].toString()));
              }
            }, this);
          }

          if (this.isKeyOperator(operator)) {
            result.push(encodeURIComponent(key) + '=' + tmp.join(','));
          } else if (tmp.length !== 0) {
            result.push(tmp.join(','));
          }
        }
      }
    } else {
      if (operator === ';') {
        result.push(encodeURIComponent(key));
      } else if (value === '' && (operator === '&' || operator === '?')) {
        result.push(encodeURIComponent(key) + '=');
      } else if (value === '') {
        result.push('');
      }
    }
    return result;
  };

  /**
   * @param {string} template
   * @return {function(Object):string}
   */
  UrlTemplate.prototype.parse = function (template) {
    var that = this;
    var operators = ['+', '#', '.', '/', ';', '?', '&'];

    return {
      expand: function (context) {
        return template.replace(/\{([^\{\}]+)\}|([^\{\}]+)/g, function (_, expression, literal) {
          if (expression) {
            var operator = null,
                values = [];

            if (operators.indexOf(expression.charAt(0)) !== -1) {
              operator = expression.charAt(0);
              expression = expression.substr(1);
            }

            expression.split(/,/g).forEach(function (variable) {
              var tmp = /([^:\*]*)(?::(\d+)|(\*))?/.exec(variable);
              values.push.apply(values, that.getValues(context, operator, tmp[1], tmp[2] || tmp[3]));
            });

            if (operator && operator !== '+') {
              var separator = ',';

              if (operator === '?') {
                separator = '&';
              } else if (operator !== '#') {
                separator = operator;
              }
              return (values.length !== 0 ? operator : '') + values.join(separator);
            } else {
              return values.join(',');
            }
          } else {
            return that.encodeReserved(literal);
          }
        });
      }
    };
  };

  return new UrlTemplate();
}));

},{}],73:[function(require,module,exports){
(function (process){
'use strict';

var minilog = require('minilog')
  , mediaTypes = require('./lib/media_types')
  , Builder = require('./lib/builder')
  , mediaTypes = require('./lib/media_types')
  , mediaTypeRegistry = require('./lib/media_type_registry');

// activate this line to enable logging
if (process.env.TRAVERSON_LOGGING) {
  require('minilog').enable();
}

// export builder for traverson-angular
exports._Builder = Builder;

/**
 * Creates a new request builder instance.
 */
exports.newRequest = function newRequest() {
  return new Builder();
};

/**
 * Creates a new request builder instance with the given root URL.
 */
exports.from = function from(url) {
  var builder = new Builder();
  builder.from(url);
  return builder;
};

// Provided for backward compatibility with pre-1.0.0 versions.
// The preferred way is to use newRequest() or from() to create a request
// builder and either set the media type explicitly by calling json() on the
// request builder instance - or use content negotiation.
exports.json = {
  from: function(url) {
    var builder = new Builder();
    builder.from(url);
    builder.setMediaType(mediaTypes.JSON);
    return builder;
  }
},

// Provided for backward compatibility with pre-1.0.0 versions.
// The preferred way is to use newRequest() or from() to create a request
// builder and then either set the media type explicitly by calling jsonHal() on
// the request builder instance - or use content negotiation.
exports.jsonHal = {
  from: function(url) {
    if (!mediaTypeRegistry.get(mediaTypes.JSON_HAL)) {
      throw new Error('JSON HAL adapter is not registered. From version ' +
        '1.0.0 on, Traverson has no longer built-in support for ' +
        'application/hal+json. HAL support was moved to a separate, optional ' +
        'plug-in. See https://github.com/basti1302/traverson-hal');
    }
    var builder = new Builder();
    builder.from(url);
    builder.setMediaType(mediaTypes.JSON_HAL);
    return builder;
  }
};

// expose media type registry so that media type plug-ins can register
// themselves
exports.registerMediaType = mediaTypeRegistry.register;

// export media type constants
exports.mediaTypes = mediaTypes;

}).call(this,require('_process'))
},{"./lib/builder":41,"./lib/media_type_registry":45,"./lib/media_types":46,"_process":76,"minilog":34}],74:[function(require,module,exports){

},{}],75:[function(require,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],76:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],77:[function(require,module,exports){
var indexOf = require('indexof');

var Object_keys = function (obj) {
    if (Object.keys) return Object.keys(obj)
    else {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    }
};

var forEach = function (xs, fn) {
    if (xs.forEach) return xs.forEach(fn)
    else for (var i = 0; i < xs.length; i++) {
        fn(xs[i], i, xs);
    }
};

var defineProp = (function() {
    try {
        Object.defineProperty({}, '_', {});
        return function(obj, name, value) {
            Object.defineProperty(obj, name, {
                writable: true,
                enumerable: false,
                configurable: true,
                value: value
            })
        };
    } catch(e) {
        return function(obj, name, value) {
            obj[name] = value;
        };
    }
}());

var globals = ['Array', 'Boolean', 'Date', 'Error', 'EvalError', 'Function',
'Infinity', 'JSON', 'Math', 'NaN', 'Number', 'Object', 'RangeError',
'ReferenceError', 'RegExp', 'String', 'SyntaxError', 'TypeError', 'URIError',
'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape',
'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'undefined', 'unescape'];

function Context() {}
Context.prototype = {};

var Script = exports.Script = function NodeScript (code) {
    if (!(this instanceof Script)) return new Script(code);
    this.code = code;
};

Script.prototype.runInContext = function (context) {
    if (!(context instanceof Context)) {
        throw new TypeError("needs a 'context' argument.");
    }
    
    var iframe = document.createElement('iframe');
    if (!iframe.style) iframe.style = {};
    iframe.style.display = 'none';
    
    document.body.appendChild(iframe);
    
    var win = iframe.contentWindow;
    var wEval = win.eval, wExecScript = win.execScript;

    if (!wEval && wExecScript) {
        // win.eval() magically appears when this is called in IE:
        wExecScript.call(win, 'null');
        wEval = win.eval;
    }
    
    forEach(Object_keys(context), function (key) {
        win[key] = context[key];
    });
    forEach(globals, function (key) {
        if (context[key]) {
            win[key] = context[key];
        }
    });
    
    var winKeys = Object_keys(win);

    var res = wEval.call(win, this.code);
    
    forEach(Object_keys(win), function (key) {
        // Avoid copying circular objects like `top` and `window` by only
        // updating existing context properties or new properties in the `win`
        // that was only introduced after the eval.
        if (key in context || indexOf(winKeys, key) === -1) {
            context[key] = win[key];
        }
    });

    forEach(globals, function (key) {
        if (!(key in context)) {
            defineProp(context, key, win[key]);
        }
    });
    
    document.body.removeChild(iframe);
    
    return res;
};

Script.prototype.runInThisContext = function () {
    return eval(this.code); // maybe...
};

Script.prototype.runInNewContext = function (context) {
    var ctx = Script.createContext(context);
    var res = this.runInContext(ctx);

    forEach(Object_keys(ctx), function (key) {
        context[key] = ctx[key];
    });

    return res;
};

forEach(Object_keys(Script.prototype), function (name) {
    exports[name] = Script[name] = function (code) {
        var s = Script(code);
        return s[name].apply(s, [].slice.call(arguments, 1));
    };
});

exports.createScript = function (code) {
    return exports.Script(code);
};

exports.createContext = Script.createContext = function (context) {
    var copy = new Context();
    if(typeof context === 'object') {
        forEach(Object_keys(context), function (key) {
            copy[key] = context[key];
        });
    }
    return copy;
};

},{"indexof":75}],"ec.datamanager.js":[function(require,module,exports){
'use strict';

module.exports = require('./lib/DataManager');
},{"./lib/DataManager":2}]},{},[])("ec.datamanager.js")
});