'use strict';

var halfred                 = require('halfred')
  , locale                  = require('locale')
  , request                 = require('superagent')
  , shiroTrie               = require('shiro-trie')
  , traverson               = require('traverson')
  , TraversonJsonHalAdapter = require('traverson-hal')
  , _                       = require('lodash')
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

  if (!/^[a-f0-9]+$/i.test(this.id)) {
    throw new Error('ec_sdk_invalid_url');
  }

  if (options.hasOwnProperty('accessToken')) {
    this.accessToken = options.accessToken;
  }
  if (options.hasOwnProperty('clientID')) {
    this.clientID = options.clientID;
  }
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
    .withRequestOptions(dm._requestOptions())
    .get(function(err, res, traversal) {
      checkResponse(err, res).then(function(res) {
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
    .withRequestOptions(dm._requestOptions())
    .get(function(err, res, traversal) {
      checkResponse(err, res).then(function(res) {
        var body = JSON.parse(res.body);
        var out  = {};
        if (body.models) {
          for (var i = 0; i < body.models.length; i++) {
            dm._rootTraversal         = traversal;
            out[body.models[i].title] = dm.model(body.models[i].title, body.models[i]);
          }
        }
        return resolve(out);
      }).catch(reject);
    });
  });
};

DataManager.prototype.model = function(title, metadata) {
  var dm = this;
  return {
    id:         title,
    title:      title,
    metadata:   metadata,
    _traversal: null,

    _getTraversal: function() {
      var model = this;
      return new Promise(function(resolve, reject) {
        if (model._traversal) {
          return resolve(model._traversal);
        }
        if (dm._rootTraversal) {
          dm._rootTraversal.continue().newRequest()
          .withRequestOptions(dm._requestOptions())
          .get(function(err, res, traversal) {
            checkResponse(err, res).then(function() {
              model._traversal = traversal;
              return resolve(traversal);
            }).catch(reject);
          });
        }

        traverson.from(dm.url).jsonHal()
        .withRequestOptions(dm._requestOptions())
        .get(function(err, res, traversal) {
          checkResponse(err, res).then(function(res) {
            model._traversal = traversal;
            return resolve(traversal);
          }).catch(reject);
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
                model.metadata    = body.models[i];
                dm._rootTraversal = traversal;
                return resolve(model);
              }
            }
            return reject(new Error('ec_sdk_model_not_found'));
          }).catch(reject);
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
          }).catch(reject);
        });
      });
    },

    entryList: function(options) {
      var model = this;
      return this._getTraversal().then(function(traversal) {
        return new Promise(function(resolve, reject) {
          var t = traversal.continue().newRequest()
          .follow(dm.id + ':' + model.title);
          if (options) {
            t.withTemplateParameters(optionsToQueryParameter(options));
          }
          t.withRequestOptions(dm._requestOptions())
          .get(function(err, res, traversal) {
            checkResponse(err, res).then(function(res) {
              var body = halfred.parse(JSON.parse(res.body));
              // empty list due to filter
              if (body.hasOwnProperty('count') && body.count === 0 && body.hasOwnProperty('total') && body.total === 0) {
                return resolve({entries: [], count: 0, total: 0});
              }
              var entries = body.embeddedArray(dm.id + ':' + model.title);
              // single result due to filter
              var out = [];
              if (!entries) {
                out.push(new Entry(body, dm, model));
              } else {
                for (var i in entries) {
                  out.push(new Entry(entries[i], dm, model));
                }
              }
              return resolve({entries: out, count: body.count, total: body.total});
            }).catch(reject);
          });
        });
      });
    },

    entries: function(options) {
      var model = this;
      return new Promise(function(resolve, reject) {
        model.entryList(options).then(function(list) {
          return resolve(list.entries);
        }).catch(reject);
      });
    },

    entry: function(id, levels) {
      var model = this;
      return this._getTraversal().then(function(traversal) {
        return new Promise(function(resolve, reject) {
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
          traversal.continue().newRequest()
          .follow(dm.id + ':' + model.title)
          .withTemplateParameters(optionsToQueryParameter(options))
          .withRequestOptions(dm._requestOptions())
          .get(function(err, res, traversal) {
            checkResponse(err, res).then(function(res) {
              var body = halfred.parse(JSON.parse(res.body));
              if (body.hasOwnProperty('count') && body.hasOwnProperty('total')) {
                var entry = body.embeddedResource(dm.id + ':' + model.title);
                if (entry) {
                  return resolve(new Entry(entry, dm, model));
                } else {
                  return reject(new Error('ec_sdk_no_match_due_to_filter'));
                }
              }
              return resolve(new Entry(body, dm, model, traversal));
            }).catch(reject);
          });
        });
      });
    },

    createEntry: function(entry) {
      var model = this;
      return this._getTraversal().then(function(traversal) {
        return new Promise(function(resolve, reject) {
          traversal.continue().newRequest()
          .follow(dm.id + ':' + model.title)
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
          .follow(dm.id + ':' + model.title)
          .withTemplateParameters({_id: entryId})
          .withRequestOptions(dm._requestOptions())
          .delete(function(err, res) {
            checkResponse(err, res).then(function() {
              return resolve(true);
            }).catch(reject);
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
      .follow('ec:api/assets');
      if (options) {
        t.withTemplateParameters(optionsToQueryParameter(options));
      }
      t.withRequestOptions(dm._requestOptions())
      .get(function(err, res, traversal) {
        checkResponse(err, res).then(function(res) {
          var body = halfred.parse(JSON.parse(res.body));
          if (body.hasOwnProperty('count') && body.count === 0 && body.hasOwnProperty('total') && body.total === 0) {
            return resolve({assets: [], count: 0, total: 0});
          }
          var assets = body.embeddedArray('ec:api/asset');
          var out    = [];
          if (!assets) { // single result due to filter
            out.push(new Asset(body, dm));
          } else {
            for (var i in assets) {
              out.push(new Asset(assets[i], dm));
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
      .withTemplateParameters(optionsToQueryParameter(options))
      .withRequestOptions(dm._requestOptions())
      .get(function(err, res, traversal) {
        checkResponse(err, res).then(function(res) {
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
        if (err) {
          return reject(err);
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
      .withTemplateParameters([null, null, optionsToQueryParameter(options)])
      .withRequestOptions(dm._requestOptions())
      .get(function(err, res, traversal) {
        checkResponse(err, res).then(function(res) {
          var body = halfred.parse(JSON.parse(res.body));
          if (body.hasOwnProperty('count') && body.count === 0 && body.hasOwnProperty('total') && body.total === 0) {
            return resolve({tags: [], count: 0, total: 0});
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
      .withTemplateParameters([null, null, optionsToQueryParameter(options)])
      .withRequestOptions(dm._requestOptions())
      .get(function(err, res, traversal) {
        checkResponse(err, res).then(function(res) {
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
        checkResponse(err, res).then(function(res) {
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
    .withRequestOptions(dm._requestOptions())
    .get(function(err, res, traversal) {
      checkResponse(err, res).then(function(res) {
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
        checkResponse(err, res).then(function(res) {
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
      .withRequestOptions(dm._requestOptions())
      .get(function(err, res) {
        checkResponse(err, res).then(function(res) {
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
      }).catch(reject);
    });
  });
};

DataManager.prototype._requestOptions = function(additionalHeaders) {
  var out     = {};
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
  this.value      = entry;
  this._dm        = dm;
  this._model     = model;
  this._traversal = traversal;

  this.save = function() {
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
          checkResponse(err, res).then(function(res) {
            if (res.statusCode === 204) {
              return resolve(true);
            }
            entry.value      = halfred.parse(JSON.parse(res.body));
            entry._traversal = traversal;
            return resolve(entry);
          }).catch(reject);
        });
      }).catch(reject);
    });
  };

  this.delete = function() {
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
          checkResponse(err, res).then(function() {
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
  this.getTitle = function(property) {
    var links = this.value.linkArray(this._dm.id + ':' + this._model.title + '/' + property);
    if (!links) {
      return undefined;
    }
    if (links.length === 1) {
      return links[0].title;
    }
    var out = [];
    for (var i in links) {
      out.push(links[i].title);
    }
    return out;
  };
};

var Asset = function(asset, dm, traversal) {
  this.value      = asset;
  this._dm        = dm;
  this._traversal = traversal;

  this.save = function() {
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
          checkResponse(err, res).then(function(res) {
            if (res.statusCode === 204) {
              return resolve(true);
            }
            asset.value      = halfred.parse(JSON.parse(res.body));
            asset._traversal = traversal;
            return resolve(asset);
          }).catch(reject);
        });
      }).catch(reject);
    });
  };

  this.delete = function() {
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
          checkResponse(err, res).then(function() {
            return resolve(true);
          }).catch(reject);
        });
      });
    });
  };

  this.getFileUrl = function(locale) {
    return this._negotiate(false, false, null, locale);
  };
  this.getImageUrl = function(size, locale) {
    if (this.value.type !== 'image') {
      throw new Error('ec.datamanager.js getImageUrl only works on image assets');
    }
    return this._negotiate(true, false, size, locale);
  };
  this.getImageThumbUrl = function(size, locale) {
    if (this.value.type !== 'image') {
      throw new Error('ec.datamanager.js getImageThumbUrl only works on image assets');
    }
    return this._negotiate(true, true, size, locale);
  };

  this._negotiate = function(image, thumb, size, requestedLocale) {
    var asset = _.cloneDeep(this.value);

    if (requestedLocale) {
      var supportedLocales = new locale.Locales(_.chain(asset.files).map('locale').uniq().compact().value());
      var bestLocale = (new locale.Locales(requestedLocale)).best(supportedLocales).toString();
      bestLocale = /^([^\.]+)/.exec(bestLocale)[1]; //remove charset
      if (bestLocale) {
        var filesWithLocale = _.filter(asset.files, function(file) {
          return file.locale === bestLocale;
        });
        if (filesWithLocale && filesWithLocale.length > 0) {
          asset.files = filesWithLocale;
        }
      }
    }
    if (!image && !thumb && asset.type !== 'image') { // for getFileUrl pic fist file and return - not for images
      return asset.files[0].url;
    }
    var allFiles = _.cloneDeep(asset.files);
    _.remove(asset.files, function(file) { // remove image files we have no resolution for (image/svg+xml; fix for CMS-1091)
      return file.resolution === null;
    });
    if (asset.files.length === 0) { // if no file is left pick first of original data
      return allFiles[0].url;
    }
    asset.files = _.sortBy(asset.files, function(file) { // sort by size descending
      return -1 * Math.max(file.resolution.height, file.resolution.width);
    });
    var imageFiles = _.filter(asset.files, function(file) {
      if (thumb) {
        return file.url.indexOf('_thumb') !== -1; // is thumbnail
      } else {
        return file.url.indexOf('_thumb') === -1; // is not a thumbnail
      }
    });
    var largest = imageFiles[0];
    if (size) {
      imageFiles = _.filter(imageFiles, function(file) { // remove all image resolutions that are too small
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
};

var Tag = function(tag, dm, traversal) {
  this.value      = tag;
  this._dm        = dm;
  this._traversal = traversal;

  this.save = function() {
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
          checkResponse(err, res).then(function(res) {
            if (res.statusCode === 204) {
              return resolve(true);
            }
            tag.value      = halfred.parse(JSON.parse(res.body));
            tag._traversal = traversal;
            return resolve(tag);
          }).catch(reject);
        });
      }).catch(reject);
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
          }).catch(reject);
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
      traverson.from(tag.value.link('self').href).jsonHal()
      .withRequestOptions(entry._dm._requestOptions())
      .get(function(err, res, traversal) {
        checkResponse(err, res).then(function() {
          tag._traversal = traversal;
          return resolve(traversal);
        }).catch(reject);
      });
    });
  };
};

// TODO document
var User = function(isAnon, user, dm, traversal) {
  this.value      = user;
  this._isAnon    = isAnon;
  this._dm        = dm;
  this._traversal = traversal;

  // TODO document
  this.logout = function() {
    var user = this;
    return new Promise(function(resolve, reject) {
      if (user._isAnon) {
        user._dm.accessToken = undefined;
        user._dm._user       = undefined;
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

module.exports = DataManager;
