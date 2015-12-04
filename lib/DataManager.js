'use strict';

var api                     = require('./api.js')
  , halfred                 = require('halfred')
  , request                 = require('superagent')
  , traverson               = require('traverson')
  , TraversonJsonHalAdapter = require('traverson-hal')
  ;
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
    throw new Error('DataManager constructor requires an options object with either \'url\'  or \'id\' set.'); // TODO snake case error.
  }
  if (options.hasOwnProperty('url')) {
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

  this.tagUrl = this.url.replace('api/' + this.id, 'tag' + this.id); // TODO relation for tag api
  this._fileUrl = this.url.replace('api/' + this.id, 'files'); // TODO relation for bestFile api

  if (!/^[a-f0-9]+$/i.test(this.id)) {
    throw new Error('Invalid URL'); // TODO snake case error
  }

  if (options.hasOwnProperty('accessToken')) {
    this.accessToken = options.accessToken;
  }
};

/**
 * Default fileUrl for bestFile functions {@link DataManager.getFileUrl}, {@link DataManager.getImageUrl}, and {@link DataManager.getImageThumbUrl}.
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
  return DataManager.getFileUrl(assetID, locale, this._fileUrl);
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
  return DataManager.getImageUrl(assetID, size, locale, this._fileUrl);
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
  return DataManager.getImageThumbUrl(assetID, size, locale, this._fileUrl);
};

DataManager.prototype.modelList = function() {
  var dm = this;
  return new Promise(function(resolve, reject) {
    traverson.from(dm.url).jsonHal()
      .withRequestOptions(dm._requestOptions())
      .get(function(err, res, traversal) {
        checkResponse(err, res).then(function(res) {
          var body = JSON.parse(res.body);
          var out = {};
          if (body.models) {
            for (var i = 0; i < body.models.length; i++) {
              dm._rootTraversal = traversal;
              out[body.models[i].title] = dm.model(body.models[i].title, body.models[i]);
            }
          }
          return resolve(out);
        }, reject);
      });
  });
};

DataManager.prototype.model = function(title, metadata) {
  var dm = this;
  return {
    id: title,
    title: title,
    metadata: metadata,
    _traversal: null,

    _getTraversal: function() {
      var model = this;
      return new Promise(function(resolve, reject) {
        if (model._traversal) {
          return resolve(model._traversal);
        }
        if (dm._rootTraversal) {
          dm._rootTraversal.continue().newRequest()
            .follow(dm.id + ':' + model.title)
            .withRequestOptions(dm._requestOptions())
            .get(function(err, res, traversal) {
              checkResponse(err, res).then(function() {
                model._traversal = traversal;
                return resolve(traversal);
              }, reject);
            });
        }

        traverson.from(dm.url).jsonHal()
          .follow(dm.id + ':' + model.title)
          .withRequestOptions(dm._requestOptions())
          .get(function(err, res, traversal) { // TODO remove this traversal when CMS-1761 is done
            checkResponse(err, res).then(function(res) {
              model._traversal = traversal;
              return resolve(traversal);
            }, reject);
          });
      });
    },

    resolve: function() {
      var model = this;
      return new Promise(function(resolve, reject) {
        traverson.from(dm.url).jsonHal()
          .withRequestOptions(dm._requestOptions())
          .get(function(err, res, traversal) {
            checkResponse(err, res).then(function(res) {
              var body = JSON.parse(res.body);
              for (var i = 0; i < body.models.length; i++) {
                if (body.models[i].title === model.title) {
                  model.metadata = body.models[i];
                  dm._rootTraversal = traversal;
                  return resolve(model);
                }
              }
              return reject(new Error('ec_sdk_model_not_found'));
            }, reject);
          });
      });
    },

    getSchema: function(method) {
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
          .get(dm.url.replace('/api/', '/api/schema/') + '/' + model.title)
          .query({template: method})
          .end(function(err, res) {
            checkResponse(err, res).then(function(res) {
              return resolve(res.body);
            }, reject);
          });
      });
    },

    entryList: function(options) {
      var model = this;
      return this._getTraversal().then(function(traversal) {
        return new Promise(function(resolve, reject) {
          var t = traversal.continue().newRequest()
            .follow(dm.id + ':' + model.title + '/options');
          if (options) {
            t.withTemplateParameters(optionsToQueryParameter(options));
          }
          t.withRequestOptions(dm._requestOptions())
            .get(function(err, res, traversal) {
              checkResponse(err, res).then(function(res) {
                var body = halfred.parse(JSON.parse(res.body));
                var entries = body.embeddedArray(dm.id + ':' + model.title);
                var out = [];
                for (var i in entries) {
                  out.push(new Entry(entries[i], dm, model)); // TODO traversal
                }
                return resolve({entries: out, count: body.count, total: body.total});
              }, reject);
            });
        });
      });
    },

    entries: function(options) {
      var model = this;
      return new Promise(function(resolve, reject) {
        model.entryList(options).then(function(list) {
          return resolve(list.entries);
        }, reject);
      });
    },

    entry: function(id, levels) {
      var model = this;
      return this._getTraversal().then(function(traversal) {
        return new Promise(function(resolve, reject) {
          if (typeof id !== 'string') {
            levels = id.levels;
            if (id.hasOwnProperty('id')) {
              id = id.id;
            } else {
              id = id._id;
            }
          }
          var t = traversal.continue().newRequest()
            .follow(dm.id + ':' + model.title + '/options'); // TODO options
          if (levels) {
            t.withTemplateParameters({_id: id, _levels: levels});
          } else {
            t.withTemplateParameters({_id: id});
          }
          t.withRequestOptions(dm._requestOptions())
            .get(function(err, res, traversal) {
              checkResponse(err, res).then(function(res) {
                return resolve(new Entry(halfred.parse(JSON.parse(res.body)), dm, model, traversal)); // TODO auth header // TODO traversal
              }, reject);
            });
        });
      });
    },

    createEntry: function(entry) {
      var model = this;
      return this._getTraversal().then(function(traversal) {
        return new Promise(function(resolve, reject) {
          traversal.continue().newRequest()
            .follow(dm.id + ':' + model.title + '/options') // TODO options
            .withRequestOptions(dm._requestOptions({
              'Content-Type': 'application/json'
            }))
            .post(entry, function(err, res, traversal) {
              checkResponse(err, res).then(function(res) {
                if (res.statusCode === 204) {
                  return resolve(true);
                }
                return resolve(new Entry(halfred.parse(JSON.parse(res.body)), dm, model, traversal));
              }, reject);
            });
        });
      });
    },

    deleteEntry: function(entryId) {
      var model = this;
      return this._getTraversal().then(function(traversal) {
        return new Promise(function(resolve, reject) {
          traversal.continue().newRequest()
            .follow(dm.id + ':' + model.title + '/options')
            .withTemplateParameters({_id: entryId})
            .withRequestOptions(dm._requestOptions())
            .delete(function(err, res) {
              checkResponse(err, res).then(function() {
                return resolve(true);
              }, reject);
            });
        });
      });
    }
  }
};

DataManager.prototype.assetList = function(options) {
  var dm = this;
  return new Promise(function(resolve, reject) {
    dm._getTraversal().then(function(traversal) {
      var t = traversal.continue().newRequest()
        .follow('ec:api/assets', 'ec:api/assets/options'); // TODO remove options relation
      if (options) {
        t.withTemplateParameters(optionsToQueryParameter(options));
      }
      t.withRequestOptions(dm._requestOptions())
        .get(function(err, res, traversal) {
          checkResponse(err, res).then(function(res) {
            var body = halfred.parse(JSON.parse(res.body));
            var assets = body.embeddedArray('ec:api/asset');
            var out = [];
            for (var i in assets) {
              out.push(new Asset(assets[i], dm, traversal));
            }
            return resolve({assets: out, count: body.count, total: body.total});
          }, reject);
        });
    });
  });
};

DataManager.prototype.assets = function(options) {
  var dm = this;
  return new Promise(function(resolve, reject) {
    dm.assetList(options).then(function(list) {
      return resolve(list.assets);
    }, reject);
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
        checkResponse(err, res).then(function(res) {
          var body = JSON.parse(res.body);
          dm.accessToken = body.jwt;
          dm._user = new User(true, body, dm, traversal);
          return resolve(dm._user);
        }, reject);
      });
    });
  });
};

DataManager.prototype._getTraversal = function() {
  var dm = this;
  return new Promise(function(resolve, reject) {
    if (dm._rootTraversal) {
      return resolve(dm._rootTraversal);
    }
    traverson.from(dm.url).jsonHal()
      .withRequestOptions(dm._requestOptions())
      .get(function(err, res, traversal) {
        checkResponse(err, res).then(function(res) {
          dm._rootTraversal = traversal;
          return resolve(traversal);
        }, reject);
      });
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
      out.headers[header] = additionalHeaders[header];
    }
  }
  return out;
};

var Entry = function(entry, dm, model, traversal) {
  this.value = entry;
  this._dm = dm;
  this._model = model;
  this._traversal = traversal;

  this.save = function() {
    var entry = this;
    return new Promise(function(resolve, reject) {
      entry._getTraversal().then(function(traversal) {
        var out = {};
        for (var key in entry.value._original) {
          if (key.indexOf('_') !== '0') {
            out[key] = entry.value[key];
          }
        }
        traversal.continue().newRequest()
          .follow('self')
          .withRequestOptions(entry._dm._requestOptions({
            'Content-Type': 'application/json'
          }))
          .put(out, function(err, res, traversal) { // TODO auth header
            checkResponse(err, res).then(function(res) {
              entry.value = halfred.parse(JSON.parse(res.body));
              entry._traversal = traversal;
              return resolve(entry);
            }, reject);
          });
      }, reject);
    });
  };

  this.delete = function() {
    var entry = this;
    return new Promise(function(resolve, reject) {
      entry._getTraversal().then(function(traversal) {
        traversal.continue().newRequest().follow('self')
          .withRequestOptions(entry._dm._requestOptions())
          .delete(function(err, res) {
            checkResponse(err, res).then(function() {
              return resolve(true);
            }, reject);
          });
      }, reject);
    });
  };

  this._getTraversal = function() {
    var entry = this;
    return new Promise(function(resolve, reject) {
      if (entry._traversal) {
        return resolve(entry._traversal);
      }
      traverson.from(entry.link('self')).jsonHal()
        .withRequestOptions(entry._dm._requestOptions())
        .get(function(err, res, traversal) { // TODO traversal from model? from dm?
          checkResponse(err, res).then(function() {
            entry._traversal = traversal;
            return resolve(traversal);
          }, reject);
        });
    });
  };
};

var Asset = function(asset, dm, traversal) {
  this.value = asset;
  this._dm = dm;
  this._traversal = traversal;

  this.save = function() {
    var asset = this;
    return new Promise(function(resolve, reject) {
      asset._getTraversal().then(function(traversal) {
        var out = {};
        for (var key in asset.value._original) {
          if (key.indexOf('_') !== '0') {
            out[key] = asset.value[key];
          }
        }
        traversal.continue().newRequest()
          .follow('self')
          .withRequestOptions(asset._dm._requestOptions({
            'Content-Type': 'application/json'
          }))
          .put(out, function(err, res, traversal) {
            checkResponse(err, res).then(function(res) {
              asset.value = halfred.parse(JSON.parse(res.body));
              asset._traversal = traversal;
              return resolve(asset);
            }, reject);
          });
      }, reject);
    });
  };

  this.delete = function() {
    var asset = this;
    return new Promise(function(resolve, reject) {
      asset._getTraversal().then(function(traversal) {
        traversal.continue().newRequest()
          .follow('self')
          .withRequestOptions(asset._dm._requestOptions())
          .delete(function(err, res) {
            checkResponse(err, res).then(function() {
              return resolve();
            }, reject);
          });
      });
    });
  };

  this._getTraversal = function() {
    var asset = this;
    return new Promise(function(resolve, reject) {
      if (asset._traversal) {
        return resolve(traversal);
      }
      traverson.from(asset.link('self')).jsonHal()
        .withRequestOptions(asset._dm._requestOptions())
        .get(function(err, res, traversal) {
          checkResponse(err, res).then(function() {
            asset._traversal = traversal;
            return resolve(traversal);
          }, reject);
        }, reject);
    });
  }
};

var User = function(isAnon, user, dm, traversal) {
  this.value = user;
  this._isAnon = isAnon;
  this._dm = dm;
  this._traversal = traversal;

  this.logout = function() {
    var user = this;
    return new Promise(function(resolve, reject) {
      if (user._isAnon) {
        user._dm.accessToken = undefined;
        user._dm._user = undefined;
        return resolve();
      }
      return reject(new Error('ec_sdk_user_not_logged_out'));
    });
  }
};

function checkResponse(err, res) {
  return new Promise(function(resolve, reject) {
    if (err) {
      return reject(err);
    }
    if (res.statusCode >= 200 && res.statusCode <= 299) {
      return resolve(res);
    }
    return reject(JSON.parse(res.body));
  });
}

function optionsToQueryParameter(options) {
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
        if (value.hasOwnProperty('any') && Array.isArray(value.any)) {
          query[key] = value.any.join(',');
        }
        if (value.hasOwnProperty('all') && Array.isArray(value.all)) {
          query[key] = value.all.join('+');
        }
      }
    }
  }
  return query;
}

// TODO createAsset
// TODO tags
// TODO tag

// TODO registerPW
// TODO anonToPW
// TODO loginAnon
// TODO loginPW
// TODO logoutPW

// TODO 2016
// TODO oauth
// TODO pwReset
// TODO eMailAvail
// TODO eMAilChange

/////////////////////////////////////////////////////
/// we can't got beyond this, this is bat country ///
/////////////////////////////////////////////////////

function waitUntilDataManagerIsReady(dataManager) {
  return new Promise(function(resolve, reject) {
    if (typeof dataManager.accessToken === 'undefined') {
      resolve(dataManager);
    } else if (typeof dataManager.accessToken === 'object') {
      dataManager.accessToken.then(function(b) {
        dataManager.accessToken = b;
        resolve(dataManager);
      }, reject);
    } else if (typeof dataManager.accessToken === 'string') {
      resolve(dataManager);
    }
  });
}

DataManager.prototype.authHeader = function() {
  return this.accessToken ? {Authorization: 'Bearer ' + this.accessToken} : {};
};

DataManager.prototype.user = function(userID) {
  return this.model('user').entry(userID);
};

DataManager.prototype.register = function() {
  var context = this;
  return new Promise(function(resolve, reject) {
    waitUntilDataManagerIsReady(context).then(function(dataManager) {
      return dataManager.getRoot();
    }).then(function(rootResponse) {
      if (!rootResponse._links.hasOwnProperty(context.id + ':_auth/anonymous')) {
        return Promise.reject('no_anonymous_users');
      }
      return api.post(rootResponse._links[context.id + ':_auth/anonymous'].href.substr(0, rootResponse._links[context.id + ':_auth/anonymous'].href.indexOf('{')), null, null, null, function(data) {
        return JSON.parse(data);
      });
    }).then(function(response) {
      if (response.hasOwnProperty('jwt')) {
        context.accessToken = response.jwt;
        resolve(response);
      } else if (response.hasOwnProperty('status') && response.hasOwnProperty('code') && response.hasOwnProperty('title')) {
        reject(response);
      }
    }).catch(reject);
  });
  //return this.model('user').createEntry({private: true});
};

DataManager.prototype.assets = function(options) {
  return waitUntilDataManagerIsReady(this).then(function(thisDataManager) {
    var authHeaderValue = 'Bearer ' + thisDataManager.accessToken;
    return api.get(thisDataManager.assetUrl,
      thisDataManager.authHeader(),
      optionsToQueryParameter(options),
      function(data) {
        var body = JSON.parse(data);
        if (body.hasOwnProperty('status') && body.hasOwnProperty('code') && body.hasOwnProperty('title')) {
          // is error
          return body;
        }
        if (body.hasOwnProperty('_embedded') && body._embedded.hasOwnProperty('ec:api/asset')) {
          if (!Array.isArray(body._embedded['ec:api/asset'])) {
            body._embedded['ec:api/asset'] = [body._embedded['ec:api/asset']];
          }
          var out = [];
          for (var key in body._embedded['ec:api/asset']) {
            if (body._embedded['ec:api/asset'].hasOwnProperty(key)) {
              out.push(new Asset(body._embedded['ec:api/asset'][key], authHeaderValue))
            }
          }
          return out;
        }
        return [];
      });
  });
};

DataManager.prototype.asset = function(assetID) {
  return waitUntilDataManagerIsReady(this).then(function(thisDataManager) {
    return api.get(thisDataManager.assetUrl, thisDataManager.authHeader(), {assetID: assetID},
      function(data) {
        var body = JSON.parse(data);
        if (body.hasOwnProperty('status') && body.hasOwnProperty('code') && body.hasOwnProperty('title')) {
          // is error
          return body;
        }
        return new Asset(body, 'Bearer ' + thisDataManager.accessToken);
      }
    );
  });
};

DataManager.prototype.createAsset = function(input) {
  return waitUntilDataManagerIsReady(this).then(function(thisDataManager) {
    if (typeof input === 'string') {
      return new Promise(function(resolve, reject) {
        var r = request('POST', thisDataManager.assetUrl);
        if (thisDataManager.accessToken) {
          r.set('Authorization', 'Bearer ' + thisDataManager.accessToken);
        }
        r.attach('file', input)
          .end(function(err, res) {
            if (err) {
              return reject(err);
            }

            if (res.status >= 200 && res.status < 300) {
              if (res.body.hasOwnProperty('_links') && res.body._links.hasOwnProperty('ec:asset')) {
                if (!Array.isArray(res.body._links['ec:asset'])) {
                  res.body._links['ec:asset'] = [res.body._links['ec:asset']];
                }

                var regex = /^.*\?assetID=([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12})$/;
                var out = [];
                for (var key in res.body._links['ec:asset']) {
                  if (res.body._links['ec:asset'].hasOwnProperty(key)) {
                    var id = regex.exec(res.body._links['ec:asset'][key].href)[1];
                    out.push(thisDataManager.asset(id));
                  }
                }
                return resolve(out);
              }

              return resolve(res.body);
            } else {
              return reject(res.body);
            }
          });
      });
    } else if (typeof input === 'object') {
      // either form data or readable input stream. send direktly.
      return api.post(thisDataManager.assetUrl, thisDataManager.authHeader(), {}, input, function(data) {
        var body = JSON.parse(data);
        if (body.hasOwnProperty('status') && body.hasOwnProperty('code') && body.hasOwnProperty('title')) {
          // is error
          return body;
        }
        if (body.hasOwnProperty('_links') && body._links.hasOwnProperty('ec:asset')) {
          if (!Array.isArray(body._links['ec:asset'])) {
            body._links['ec:asset'] = [body._links['ec:asset']];
          }

          var regex = /^.*\?assetID=([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12})$/;
          var out = [];
          for (var key in body._links['ec:asset']) {
            if (body._links['ec:asset'].hasOwnProperty(key)) {
              var id = regex.exec(body._links['ec:asset'][key].href)[1];
              out.push(thisDataManager.asset(id));
            }
          }
          return out;
        }
      });
    }
  });
};

DataManager.prototype.tags = function(options) {
  return waitUntilDataManagerIsReady(this).then(function(thisDataManager) {
    var authHeaderValue = 'Bearer ' + thisDataManager.accessToken;
    return api.get(thisDataManager.tagUrl,
      thisDataManager.authHeader(),
      optionsToQueryParameter(options),
      function(data) {
        var body = JSON.parse(data);
        if (body.hasOwnProperty('status') && body.hasOwnProperty('code') && body.hasOwnProperty('title')) {
          // is error
          return body;
        }
        if (body.hasOwnProperty('_embedded') && body._embedded.hasOwnProperty('ec:api/tag')) {
          if (!Array.isArray(body._embedded['ec:api/tag'])) {
            body._embedded['ec:api/tag'] = [body._embedded['ec:api/tag']];
          }
          var out = [];
          for (var key in body._embedded['ec:api/tag']) {
            if (body._embedded['ec:api/tag'].hasOwnProperty(key)) {
              out.push(new Tag(body._embedded['ec:api/tag'][key], authHeaderValue));
            }
          }
          return out;
        }
        return [];
      });
  });
};

DataManager.prototype.tag = function(tag) {
  return waitUntilDataManagerIsReady(this).then(function(thisDataManager) {
    return api.get(thisDataManager.tagUrl, thisDataManager.authHeader(), {tag: tag},
      function(data) {
        var body = JSON.parse(data);
        if (body.hasOwnProperty('status') && body.hasOwnProperty('code') && body.hasOwnProperty('title')) {
          // is error
          return body;
        }
        return new Tag(body, 'Bearer ' + thisDataManager.accessToken);
      }
    );
  });
};

module.exports = DataManager;

var Tag = function(tag, authHeaderValue) {
  this.value = tag;
  this.authHeaderValue = authHeaderValue;
  this.save = function() {
    return api.put(this.value._links.self.href, authHeaderValue ? {Authorization: authHeaderValue} : null, null, this.value, function(data) {
      var body = JSON.parse(data);
      if (body.hasOwnProperty('status') && body.hasOwnProperty('code') && body.hasOwnProperty('title')) {
        // is error
        return body;
      }
      return new Tag(body, authHeaderValue);
    });
  };
  this.delete = function() {
    return api.delete(this.value._links.self.href, authHeaderValue ? {Authorization: authHeaderValue} : null);
  }
};

function replaceLastOccurrence(str, search, replace) {
  var n = str.lastIndexOf(search);
  if (n >= 0 && n + search.length <= str.length) {
    str = str.substring(0, n) + replace + str.substring(n + search.length);
  }
  return str;
}
DataManager.prototype.__helpers = {
  replaceLastOccurrence: replaceLastOccurrence
};
