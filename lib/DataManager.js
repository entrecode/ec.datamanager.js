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
    return util.getP(
      traverson.from(dm.url).jsonHal()
      .withRequestOptions(dm._requestOptions())
    );
  })
  .then(function(r) {
    dm._rootTraversal = r[1];
    return util.checkResponse(r[0])
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
    return util.getP(
      traverson.from(dm.url).jsonHal()
      .withRequestOptions(dm._requestOptions())
    );
  })
  .then(function(r) {
    dm._rootTraversal = r[1];
    return util.checkResponse(r[0])
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

DataManager.prototype.clearCache = function(models) {
  if (!models) {
    models = this._db.listCollections().map(function(collection) {
      return collection.name;
    })
  }
  if (typeof models === 'string') {
    models = [models];
  }

  return Promise.all(
    models.map(function(model) {
      this.model(model).clearCache();
    }.bind(this))
  )
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
    t.withRequestOptions(dm._requestOptions());
    return util.getP(t);
  })
  .then(function(res) {
    return util.checkResponse(res[0]);
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
    return util.getUrlP(
      traversal.continue().newRequest()
      .follow('ec:api/assets')
    );
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
    return util.checkResponse(res);
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
    return util.getP(
      traversal.continue().newRequest()
      .follow('ec:api/assets', 'ec:api/tags')
      .withTemplateParameters([null, null, util.optionsToQueryParameter(options)])
      .withRequestOptions(dm._requestOptions())
    );
  })
  .then(function(res) {
    return util.checkResponse(res[0]);
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
    return util.postP(t, {});
  })
  .then(function(res) {
    userTraversal = res[1];
    return util.checkResponse(res[0]);
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
    return util.getP(
      traverson.from(dm.url).jsonHal()
      .withRequestOptions(dm._requestOptions())
    );
  })
  .then(function(res) {
    rootTraversal = res[1];
    return util.checkResponse(res[0]);
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
    return util.getUrlP(t);
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
    return util.getP(
      traversal.continue().newRequest()
      .follow(dm.id + ':_auth/email-available')
      .withTemplateParameters({ email: email })
    );
  })
  .then(function(res) {
    return util.checkResponse(res[0]);
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
    return util.getP(
      traversal.continue().newRequest()
      .follow(dm.id + ':' + modelTitle + '/_permissions')
      .withRequestOptions(dm._requestOptions())
    );
  })
  .then(function(res) {
    return util.checkResponse(res[0]);
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
  this._modelCache = {};
  this._db = null;
  this._cacheMetaData = null;
};

DataManager.cloneEntry = function(entry) {
  console.warn('DataManager.cloneEntry is deprecated. Use entry.clone() instead.');
  return entry.clone();
};

DataManager.cloneEntries = function(entries) {
  return entries.map(function(entry) {
    return entry.clone();
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
    return util.getP(
      traverson.from(dm.url).jsonHal()
      .withRequestOptions(dm._requestOptions())
    );
  })
  .then(function(res) {
    rootTraversal = res[1];
    return util.checkResponse(res[0])
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
