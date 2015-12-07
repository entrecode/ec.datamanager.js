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
                if (!entries) { // single result due to filter
                  return resolve(new Entry(body, dm, traversal));
                }
                var out = [];
                for (var i in entries) {
                  out.push(new Entry(entries[i], dm, traversal)); // TODO traversal
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
          if (list.hasOwnProperty('entries')) {
            return resolve(list.entries);
          }
          return resolve(list);
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
                return resolve(new Entry(halfred.parse(JSON.parse(res.body)), dm, traversal)); // TODO auth header // TODO traversal
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
                return resolve(new Entry(halfred.parse(JSON.parse(res.body)), dm, traversal));
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
            if (!assets) { // single result due to filter
              return resolve(new Asset(body, dm, traversal));
            }
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
      if (list.hasOwnProperty('assets')) {
        return resolve(list.assets);
      }
      return resolve(list);
    }, reject);
  });
};

DataManager.prototype.asset = function(assetID) {
  var dm = this;
  return new Promise(function(resolve, reject) {
    if (!assetID) {
      return reject(new Error('ec_sdk_no_assetid_provided'));
    }
    dm._getTraversal().then(function(traversal) {
      traversal.continue().newRequest()
        .follow('ec:api/assets', 'ec:api/assets/options') // TODO remove options relation
        .withTemplateParameters({assetID: assetID})
        .withRequestOptions(dm._requestOptions())
        .get(function(err, res, traversal) {
          checkResponse(err, res).then(function(res) {
            return resolve(new Asset(halfred.parse(JSON.parse(res.body)), dm, traversal));
          }, reject);
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
          if (err) {
            return resolve(err);
          }
          var req = request
            .post(url);
          if (dm.accessToken) {
            req.set('Authorization', 'Bearer ' + dm.accessToken);
          }
          if (typeof input === 'string') {        // File path
            req.attach('file', input);
          } else if (Array.isArray(input)) {      // Array of file paths
            for (var i in input) {
              req.attach('file', input[i]);
            }
          } else {                                // FormData
            req.send(input);
          }
          req.end(function(err, res) {
            checkResponse(err, res).then(function(res) {
              var regex = /^.*\?assetID=([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12})$/;
              var body = halfred.parse(res.body);
              var assets = body.linkArray('ec:asset');
              var out = [];
              for (var i in assets) {
                out.push(dm.asset(regex.exec(assets[i].href)[1]));
              }
              return resolve(out);
            }, reject);
          });
        });
    }, reject);
  });
};

DataManager.prototype.tagList = function(options) {
  var dm = this;
  return new Promise(function(resolve, reject) {
    dm._getTraversal().then(function(traversal) {
      traversal.continue().newRequest()
        .follow('ec:api/assets', 'ec:api/tags', 'ec:api/tags/options')
        .withTemplateParameters(optionsToQueryParameter(options))
        .withRequestOptions(dm._requestOptions())
        .get(function(err, res, traversal) {
          checkResponse(err, res).then(function(res) {
            var body = halfred.parse(JSON.parse(res.body));
            var tags = body.embeddedArray('ec:api/tag');
            if (!tags) { // single result due to filter
              return resolve(new Tag(body, dm, traversal));
            }
            var out = [];
            for (var i in tags) {
              out.push(new Tag(tags[i], dm, traversal));
            }
            return resolve({tags: out, count: body.count, total: body.total});
          }, reject);
        });
    });
  });
};

DataManager.prototype.tags = function(options) {
  var dm = this;
  return new Promise(function(resolve, reject) {
    dm.tagList(options).then(function(list) {
      if (list.hasOwnProperty('tags')) {
        return resolve(list.tags)
      }
      return resolve(list);
    }, reject);
  });
};

DataManager.prototype.tag = function(tag) {
  var dm = this;
  return new Promise(function(resolve, reject) {
    dm._getTraversal().then(function(traversal) {
      traversal.continue().newRequest()
        .follow('ec:api/assets', 'ec:api/tags', 'ec:api/tags/options')
        .withTemplateParameters({tag: tag})
        .withRequestOptions(dm._requestOptions())
        .get(function(err, res, traversal) {
          checkResponse(err, res).then(function(res) {
            var body = halfred.parse(JSON.parse(res.body));
            return resolve(new Tag(body, dm, traversal));
          }, reject);
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

var Entry = function(entry, dm, traversal) {
  this.value = entry;
  this._dm = dm;
  this._traversal = traversal;

  this.save = function() {
    var entry = this;
    return new Promise(function(resolve, reject) {
      entry._getTraversal().then(function(traversal) {
        var out = {};
        for (var key in entry.value._original) {
          out[key] = entry.value[key];
        }
        traversal.continue().newRequest()
          .follow('self')
          .withRequestOptions(entry._dm._requestOptions({
            'Content-Type': 'application/json'
          }))
          .put(out, function(err, res, traversal) { // TODO auth header
            checkResponse(err, res).then(function(res) {
              if (res.statusCode === 204) {
                return resolve(true);
              }
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
      return reject(new Error('ec_sdk_could_not_get_traversal'));
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
          out[key] = asset.value[key];
        }
        traversal.continue().newRequest()
          .follow('self')
          .withRequestOptions(asset._dm._requestOptions({
            'Content-Type': 'application/json'
          }))
          .put(out, function(err, res, traversal) {
            checkResponse(err, res).then(function(res) {
              if (res.statusCode === 204) {
                return resolve(true);
              }
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
              return resolve(true);
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
      return reject(new Error('ec_sdk_could_not_get_traversal'));
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

var Tag = function(tag, dm, traversal) {
  this.value = tag;
  this._dm = dm;
  this._traversal = traversal;

  this.save = function() {
    var tag = this;
    return new Promise(function(resolve, reject) {
      tag._getTraversal().then(function(traversal) {
        var out = {};
        for (var key in tag.value._original) {
          out[key] = tag.value[key];
        }
        traversal.continue().newRequest()
          .follow('self')
          .withRequestOptions(tag._dm._requestOptions({
            'Content-Type': 'application/json'
          }))
          .put(out, function(err, res, traversal) {
            checkResponse(err, res).then(function(res) {
              if (res.statusCode === 204) {
                return resolve(true);
              }
              tag.value = halfred.parse(JSON.parse(res.body));
              tag._traversal = traversal;
              return resolve(tag);
            }, reject);
          });
      }, reject);
    });
  };

  this.delete = function() {
    var tag = this;
    return new Promise(function(resolve, reject) {
      tag._getTraversal().then(function(traversal) {
        traversal.continue().newRequest()
          .follow('self')
          .withRequestOptions(tag._dm._requestOptions())
          .delete(function(err, res) {
            checkResponse(err, res).then(function() {
              return resolve(true);
            }, reject);
          });
      });
    });
  };

  this._getTraversal = function() {
    var tag = this;
    return new Promise(function(resolve, reject) {
      if (tag._traversal) {
        return resolve(tag._traversal);
      }
      return reject(new Error('ec_sdk_could_not_get_traversal'));
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

module.exports = DataManager;
