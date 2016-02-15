'use strict';

var halfred = require('halfred');
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
  if (options.hasOwnProperty('url')) {
    this.url = options.url;
  } else {
    this.id  = options.id;
    this.url = 'https://datamanager.entrecode.de/api/' + this.id;
  }

  if (this.url.slice(-1) === '/') {
    this.url = this.url.substr(0, this.url.length - 1);
  }

  if (!this.id) {
    this.id = this.url.split('/').reverse()[0];
  }

  this._fileUrl = this.url.replace('api/' + this.id, 'files'); // TODO relation for bestFile api
  this._modelCache = {};
  if (!/^[a-f0-9]+$/i.test(this.id)) {
    throw new Error('ec_sdk_invalid_url');
  }

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
  return new Promise(function(resolve, reject) {
    if (!assetID) {
      return reject(new Error('ec_sdk_no_assetid_provided'));
    }
    var req = request.get(url + '/' + assetID + '/url');
    if (locale) {
      req.set('Accept-Language', locale);
    }
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
  return new Promise(function(resolve, reject) {
    if (!assetID) {
      return reject(new Error('ec_sdk_no_assetid_provided'));
    }
    var req = request.get(url + '/' + assetID + '/url');
    if (locale) {
      req.set('Accept-Language', locale);
    }
    if (size) {
      req.query({size: size});
    }
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
  return new Promise(function(resolve, reject) {
    if (!assetID) {
      return reject(new Error('ec_sdk_no_assetid_provided'));
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
    req.query({size: size, thumb: true});
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
  return new Promise(function(resolve, reject) {
    traverson.from(dm.url).jsonHal()
    .withRequestOptions(util.requestOptions())
    .get(function(err, res, traversal) {
      util.checkResponse(err, res).then(function(res) {
        var body          = halfred.parse(JSON.parse(res.body));
        dm._rootTraversal = traversal;
        dm.metadata       = body;
        return resolve(dm);
      }).catch(reject);
    });
  });
};

DataManager.prototype.modelList = function() {
  var dm = this;
  return new Promise(function(resolve, reject) {
    traverson.from(dm.url).jsonHal()
    .withRequestOptions(util.requestOptions())
    .get(function(err, res, traversal) {
      util.checkResponse(err, res).then(function(res) {
        var body = JSON.parse(res.body);
        var out  = {};
        for (var i in body.models) {
          out[body.models[i].title] = new Model(body.models[i].title, body.models[i]);
        }
        dm._modelCache = out;
        dm._rootTraversal = traversal;
        return resolve(out);
      }).catch(reject);
    });
  });
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
  return new Promise(function(resolve, reject) {
    dm._getTraversal().then(function(traversal) {
      var t = traversal.continue().newRequest()
      .follow('ec:api/assets');
      if (options) {
        t.withTemplateParameters(util.optionsToQueryParameter(options));
      }
      t.withRequestOptions(util.requestOptions())
      .get(function(err, res, traversal) {
        util.checkResponse(err, res).then(function(res) {
          var body = halfred.parse(JSON.parse(res.body));
          if (body.hasOwnProperty('count') && body.count === 0 && body.hasOwnProperty('total')) {
            return resolve({assets: [], count: body.count, total: body.total});
          }
          var assets = body.embeddedArray('ec:api/asset');
          var out    = [];
          if (!assets) { // single result due to filter
            out.push(new Asset(body, dm));
          } else {
            for (var i in assets) {
              /* istanbul ignore else */
              if (assets.hasOwnProperty(i)) {
                out.push(new Asset(assets[i], dm));
              }
            }
          }
          return resolve({assets: out, count: body.count, total: body.total});
        }).catch(reject);
      });
    });
  });
};

DataManager.prototype.assets = function(options) {
  var dm = this;
  return new Promise(function(resolve, reject) {
    dm.assetList(options).then(function(list) {
      return resolve(list.assets);
    }).catch(reject);
  });
};

DataManager.prototype.asset = function(assetID) {
  var dm = this;
  return new Promise(function(resolve, reject) {
    if (!assetID) {
      return reject(new Error('ec_sdk_no_assetid_provided'));
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
    dm._getTraversal().then(function(traversal) {
      traversal.continue().newRequest()
      .follow('ec:api/assets')
      .withTemplateParameters(util.optionsToQueryParameter(options))
      .withRequestOptions(util.requestOptions())
      .get(function(err, res, traversal) {
        util.checkResponse(err, res).then(function(res) {
          var body = halfred.parse(JSON.parse(res.body));
          if (body.hasOwnProperty('count') && body.hasOwnProperty('total')) {
            var asset = body.embeddedResource('ec:api/asset');
            if (asset) {
              return resolve(new Asset(asset, dm, traversal));
            } else {
              return reject(new Error('ec_sdk_no_match_due_to_filter'));
            }
          }
          return resolve(new Asset(body, dm, traversal));
        }).catch(reject);
      });
    });
  });
};

DataManager.prototype.createAsset = function(input) {
  // https://blog.gaya.ninja/articles/uploading-files-superagent-in-browser/
  var dm = this;
  return new Promise(function(resolve, reject) {
    dm._getTraversal().then(function(traversal) {
      traversal.continue().newRequest()
      .follow('ec:api/assets')
      .getUrl(function(err, url) {
        /* istanbul ignore if */
        if (err) {
          return reject(err);
        }
        var req = request
        .post(url);
        /* istanbul ignore else */
        if (dm.accessToken) {
          req.set('Authorization', 'Bearer ' + dm.accessToken);
        }
        if (typeof input === 'string') {        // File path
          req.attach('file', input);
          /* istanbul ignore else */
        } else if (Array.isArray(input)) {      // Array of file paths
          for (var i in input) {
            req.attach('file', input[i]);
          }
        } else {                                // FormData
          req.send(input);
        }
        req.end(function(err, res) {
          util.checkResponse(err, res).then(function(res) {
            var regex  = /^.*\?assetID=([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12})$/;
            var body   = halfred.parse(res.body);
            var assets = body.linkArray('ec:asset');
            var out    = [];
            for (var i in assets) {
              out.push(dm.asset(regex.exec(assets[i].href)[1]));
            }
            return resolve(out);
          }).catch(reject);
        });
      });
    }).catch(reject);
  });
};

DataManager.prototype.tagList = function(options) {
  var dm = this;
  return new Promise(function(resolve, reject) {
    dm._getTraversal().then(function(traversal) {
      traversal.continue().newRequest()
      .follow('ec:api/assets', 'ec:api/tags')
      .withTemplateParameters([null, null, util.optionsToQueryParameter(options)])
      .withRequestOptions(util.requestOptions())
      .get(function(err, res, traversal) {
        util.checkResponse(err, res).then(function(res) {
          var body = halfred.parse(JSON.parse(res.body));
          if (body.hasOwnProperty('count') && body.count === 0 && body.hasOwnProperty('total')) {
            return resolve({tags: [], count: body.count, total: body.total});
          }
          var tags = body.embeddedArray('ec:api/tag');
          var out  = [];
          if (!tags) { // single result due to filter
            out.push(new Tag(body, dm));
          } else {
            for (var i in tags) {
              out.push(new Tag(tags[i], dm));
            }
          }
          return resolve({tags: out, count: body.count, total: body.total});
        }).catch(reject);
      });
    });
  });
};

DataManager.prototype.tags = function(options) {
  var dm = this;
  return new Promise(function(resolve, reject) {
    dm.tagList(options).then(function(list) {
      return resolve(list.tags)
    }).catch(reject);
  });
};

DataManager.prototype.tag = function(tag) {
  var dm = this;
  return new Promise(function(resolve, reject) {
    if (!tag) {
      return reject(new Error('ec_sdk_no_tag_name_provided'));
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
    dm._getTraversal().then(function(traversal) {
      traversal.continue().newRequest()
      .follow('ec:api/assets', 'ec:api/tags')
      .withTemplateParameters([null, null, util.optionsToQueryParameter(options)])
      .withRequestOptions(util.requestOptions())
      .get(function(err, res, traversal) {
        util.checkResponse(err, res).then(function(res) {
          var body = halfred.parse(JSON.parse(res.body));
          if (body.hasOwnProperty('count') && body.hasOwnProperty('total')) {
            var tag = body.embeddedResource('ec:api/tag');
            if (tag) {
              return resolve(new Tag(tag, dm, traversal));
            } else {
              return reject(new Error('ec_sdk_no_match_due_to_filter'));
            }
          }
          return resolve(new Tag(body, dm, traversal));
        }).catch(reject);
      });
    });
  });
};

DataManager.prototype.registerAnonymous = function(validUntil) {
  var dm = this;
  return new Promise(function(resolve, reject) {
    dm._getTraversal().then(function(traversal) {
      var t = traversal.continue().newRequest()
      .follow(dm.id + ':_auth/anonymous');
      if (validUntil) {
        t.withTemplateParameters({validUntil: validUntil})
      }
      t.post({}, function(err, res, traversal) {
        util.checkResponse(err, res).then(function(res) {
          var body       = JSON.parse(res.body);
          dm.accessToken = body.jwt;
          dm._user       = new User(true, body, dm, traversal);
          return resolve(dm._user);
        }).catch(reject);
      });
    });
  });
};

DataManager.prototype.account = function() {
  var dm = this;
  return new Promise(function(resolve, reject) {
    if (!dm.accessToken) {
      return reject(new Error('ec_sdk_not_logged_in'));
    }
    traverson.from(dm.url).jsonHal()
    .withRequestOptions(util.requestOptions())
    .get(function(err, res, traversal) {
      util.checkResponse(err, res).then(function(res) {
        var body          = halfred.parse(JSON.parse(res.body));
        dm._rootTraversal = traversal;
        dm.metadata       = body;
        return resolve(dm.metadata.account);
      }).catch(reject);
    });
  });
};

DataManager.prototype.getAuthLink = function(relation, templateParameter) {
  var dm = this;
  return new Promise(function(resolve, reject) {
    if (dm.clientID) {
      if (!templateParameter) {
        templateParameter = {};
      }
      if (!templateParameter.hasOwnProperty('clientID')) {
        templateParameter.clientID = dm.clientID;
      }
    }

    dm._getTraversal().then(function(traversal) {
      var t = traversal.continue().newRequest()
      .follow(dm.id + ':_auth/' + relation);
      if (templateParameter) {
        t.withTemplateParameters(templateParameter);
      }
      t.getUrl(function(err, url) {
        if (err) {
          return reject(err);
        }
        return resolve(url);
      });
    }).catch(reject);
  });
};

DataManager.prototype.emailAvailable = function(email) {
  var dm = this;
  return new Promise(function(resolve, reject) {
    dm._getTraversal().then(function(traversal) {
      traversal.continue().newRequest()
      .follow(dm.id + ':_auth/email-available')
      .withTemplateParameters({email: email})
      .get(function(err, res) {
        util.checkResponse(err, res).then(function(res) {
          return resolve(JSON.parse(res.body).available);
        }).catch(reject);
      });
    });
  });
};

DataManager.prototype.can = function(permission) {
  var dm = this;
  var modelTitle = permission.split(':')[0];
  return new Promise(function(resolve, reject) {
    dm._getTraversal().then(function(traversal) {
      traversal.continue().newRequest()
      .follow(dm.id + ':' + modelTitle + '/_permissions')
      .withRequestOptions(util.requestOptions())
      .get(function(err, res) {
        util.checkResponse(err, res).then(function(res) {
          var body = halfred.parse(JSON.parse(res.body));
          var permissions = shiroTrie.new();
          permissions.add(body.permissions);
          if (permissions.check(permission)) {
            return resolve(true);
          }
          return reject(new Error('permission_denied'));
        }).catch(reject);
      });
    }).catch(reject);
  });
};

DataManager.prototype.logout = function() {
  this.accessToken = null;
  this._rootTraversal = null;
};

DataManager.prototype._getTraversal = function() {
  var dm = this;
  return new Promise(function(resolve, reject) {
    if (dm._rootTraversal) {
      return resolve(dm._rootTraversal);
    }
    traverson.from(dm.url).jsonHal()
    .withRequestOptions(util.requestOptions())
    .get(function(err, res, traversal) {
      util.checkResponse(err, res).then(function(res) {
        dm._rootTraversal = traversal;
        return resolve(traversal);
      }).catch(reject);
    });
  });
};

module.exports = DataManager;
