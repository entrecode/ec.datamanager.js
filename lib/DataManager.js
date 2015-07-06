'use strict';

/*
 * Main DataManager class and SDK entry point
 *
 */

var _       = require('lodash')

  , api     = require('./api.js')
  , request = require('superagent')
  ;
require('es6-promise').polyfill();

var DataManager = function(options) {
  if (!options || (!options.hasOwnProperty('url') && !options.hasOwnProperty('id'))) {
    throw new Error('DataManager constructor requires an options object with either \'url\'  or \'id\' set.');
  }
  if (options.hasOwnProperty('url')) {
    this.url = options.url;
  } else {
    this.id = options.id;
    this.url = 'https://datamanager.entrecode.de/api/' + this.id;
  }

  if (this.url.slice(-1) !== '/') {
    this.url += '/';
  }

  if (!this.id) {
    this.id = this.url.split('/').reverse()[1];
  }

  this.assetUrl = this.url.replace('/api/' + this.id + '/', '/asset/' + this.id);

  if (!/^[a-f0-9]+$/i.test(this.id)) {
    throw new Error('Invalid URL');
  }

  if (options.hasOwnProperty('accessToken')) {
    this.accessToken = options.accessToken;
    this.readonly = false;
  } else if (options.hasOwnProperty('readonly') && options.readonly) {
    this.accessToken = null;
    this.readonly = true;
  } else {
    this.accessToken = this.register().then(function(user) {
      return user.value.temporaryToken;
    });
    this.readonly = false;
  }
};

function waitUntilDataManagerIsReady(dataManager) {
  return new Promise(function(resolve, reject) {
    if (!dataManager.readonly && typeof dataManager.accessToken === 'object') {
      dataManager.accessToken.then(function(b) {
        dataManager.accessToken = b;
        resolve(dataManager);
      }, reject);
    } else {
      resolve(dataManager);
    }
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
    _.forOwn(options.filter, function(value, key) {
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
    });
  }
  return query;
}

DataManager.prototype.getFileURL = function(assetID, locale) {
  var fileURL = this.url.replace('datamanager', 'f').replace('api/' + this.id + '/', assetID);
  fileURL = fileURL + '/url';
  var headers = locale ? {'Accept-Language': locale} : null;
  return api.get(fileURL, headers, {}, function(res) {
    res = JSON.parse(res);
    return res.url;
  });
};

DataManager.prototype.getImageURL = function(assetID, size, locale) {
  var fileURL = this.url.replace('datamanager', 'f').replace('api/' + this.id + '/', assetID);
  fileURL = fileURL + '/url';
  var headers = locale ? {'Accept-Language': locale} : null;
  return api.get(fileURL, headers, {size: size}, function(res) {
    res = JSON.parse(res);
    return res.url;
  });
};

DataManager.prototype.getImageThumbURL = function(assetID, size, locale) {
  var fileURL = this.url.replace('datamanager', 'f').replace('api/' + this.id + '/', assetID);
  fileURL = fileURL + '/url';
  if (size && size <= 50) {
    size = 50;
  } else if (size && size <= 100) {
    size = 100;
  } else if (size && size <= 200) {
    size = 200;
  } else {
    size = 400;
  }
  var headers = locale ? {'Accept-Language': locale} : null;
  return api.get(fileURL, headers, {size: size, thumb: true}, function(res) {
    res = JSON.parse(res);
    return res.url;
  });
};

DataManager.prototype.modelList = function() {
  return waitUntilDataManagerIsReady(this).then(function(dataManager) {
    var authHeaderValue = 'Bearer ' + dataManager.accessToken;
    return api.get(dataManager.url,
      {
        Authorization: authHeaderValue
      },
      {},
      function(data) {
        var body = JSON.parse(data);
        var regex = new RegExp('^' + dataManager.id + ':(.+$)');
        var listOfModels = {};
        _.forOwn(_.pick(body._links, function(link, relationname) {
          return relationname.match(regex);
        }), function(link, relationname) {
          var modelID = regex.exec(relationname)[1];
          listOfModels[modelID] = dataManager.model(modelID);
        });
        return listOfModels;
      });
  });
};

DataManager.prototype.model = function(modelID) {
  var thisDataManager = this;
  var url = thisDataManager.url + modelID;
  var shortID = thisDataManager.id;
  return {
    id: modelID,

    createEntry: function(object) {
      return waitUntilDataManagerIsReady(thisDataManager).then(function(thisDataManager) {
        return api.post(url, {
          Authorization: 'Bearer ' + thisDataManager.accessToken
        }, {}, object, function(data) {
          var body = JSON.parse(data);

          return new Entry(body._embedded[shortID + ':' + modelID], 'Bearer ' + thisDataManager.accessToken);
        });
      });
    },

    deleteEntry: function(entryID) {
      return waitUntilDataManagerIsReady(thisDataManager).then(function(thisDataManager) {
        return api.delete(url, {
            Authorization: 'Bearer ' + thisDataManager.accessToken
          },
          {
            id: entryID
          });
      });
    },

    entries: function(options) {
      return waitUntilDataManagerIsReady(thisDataManager).then(function(thisDataManager) {
        return api.get(url, {
          Authorization: 'Bearer ' + thisDataManager.accessToken
        }, optionsToQueryParameter(options), function(data) {
          var body = JSON.parse(data);
          if (body.hasOwnProperty('_embedded') && body._embedded.hasOwnProperty((shortID + ':' + modelID))) {
            if (!_.isArray(body._embedded[shortID + ':' + modelID])) {
              body._embedded[shortID + ':' + modelID] = [body._embedded[shortID + ':' + modelID]];
            }
            return _.map(body._embedded[shortID + ':' + modelID], function(entry) {
              return new Entry(entry, 'Bearer ' + thisDataManager.accessToken);
            });
          }
          return body;
        });
      });
    },

    entry: function(entryID) {
      return waitUntilDataManagerIsReady(thisDataManager).then(function(thisDataManager) {
        return api.get(url, {
            Authorization: 'Bearer ' + thisDataManager.accessToken
          },
          {
            id: entryID
          },
          function(data) {
            var body = JSON.parse(data);
            if (body.hasOwnProperty('_embedded') && body._embedded.hasOwnProperty((shortID + ':' + modelID))) {
              return new Entry(body._embedded[shortID + ':' + modelID], 'Bearer ' + thisDataManager.accessToken);
            }
            return body;
          }
        );
      });
    },

    getSchema: function(method) {
      if (!method) {
        method = 'get';
      }
      method.toLowerCase();
      if (['get', 'put', 'post'].indexOf(method) === -1) {
        throw new Error('invalid value for method. Allowed values: get, put, post');
      }
      return api.get(replaceLastOccurrence(url, '/api', '/api/schema'), {}, {template: method}, JSON.parse);
    }
  };
};

DataManager.prototype.user = function(userID) {
  return this.model('user').entry(userID);
};

DataManager.prototype.register = function() {
  return this.model('user').createEntry({private: true});
};

DataManager.prototype.assets = function(options) {
  return waitUntilDataManagerIsReady(this).then(function(thisDataManager) {
    var authHeaderValue = 'Bearer ' + thisDataManager.accessToken;
    return api.get(thisDataManager.assetUrl,
      {
        Authorization: authHeaderValue
      },
      optionsToQueryParameter(options),
      function(data) {
        var body = JSON.parse(data);
        if (body.hasOwnProperty('_embedded') && body._embedded.hasOwnProperty('ec:api/asset')) {
          if (!_.isArray(body._embedded['ec:api/asset'])) {
            body._embedded['ec:api/asset'] = [body._embedded['ec:api/asset']];
          }
          return _.map(body._embedded['ec:api/asset'], function(asset) {
            return new Asset(asset, authHeaderValue);
          });
        }
        return body;
      });
  });
};

DataManager.prototype.asset = function(assetID) {
  return waitUntilDataManagerIsReady(this).then(function(thisDataManager) {
    return api.get(thisDataManager.assetUrl, {
        Authorization: 'Bearer ' + thisDataManager.accessToken
      },
      {
        assetID: assetID
      },
      function(data) {
        return new Asset(JSON.parse(data), 'Bearer ' + thisDataManager.accessToken);
      }
    );
  });
};

DataManager.prototype.createAsset = function(input) {
  return waitUntilDataManagerIsReady(this).then(function(thisDataManager) {
    if (typeof input === 'string') {
      return new Promise(function(resolve, reject) {
        request('POST', thisDataManager.assetUrl)
          .set('Authorization', 'Bearer ' + thisDataManager.accessToken)
          .attach('file', input)
          .end(function(err, res) {
            if (err) {
              return reject(err);
            }

            if (res.status >= 200 && res.status < 300) {
              if (res.body.hasOwnProperty('_links') && res.body._links.hasOwnProperty('ec:asset')) {
                if (!_.isArray(res.body._links['ec:asset'])) {
                  res.body._links['ec:asset'] = [res.body._links['ec:asset']];
                }

                var regex = /^.*\?assetID=([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12})$/;
                return resolve(_.map(res.body._links['ec:asset'], function(assetRelation) {
                  var id = regex.exec(assetRelation.href)[1]
                  return thisDataManager.asset(id);
                }));
              }

              return resolve(res.body);
            } else {
              return reject(res.body);
            }
          });
      });
    } else if (typeof input === 'object') {
      // either form data or readable input stream. send direktly.
      return api.post(thisDataManager.assetUrl,
        {Authorization: 'Bearer ' + thisDataManager.accessToken}, {}, input, function(data) {
          var body = JSON.parse(data);
          if (body.hasOwnProperty('_links') && body._links.hasOwnProperty('ec:asset')) {
            if (!_.isArray(body._links['ec:asset'])) {
              body._links['ec:asset'] = [body._links['ec:asset']];
            }

            var regex = /^.*\?assetID=([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12})$/;
            return _.map(body._links['ec:asset'], function(assetRelation) {
              var id = regex.exec(assetRelation.href)[1]
              return thisDataManager.asset(id);
            });
          }
        });
    }
  });
};

module.exports = DataManager;

var Entry = function(entry, authHeaderValue) {
  this.value = entry;
  this.authHeaderValue = authHeaderValue;
  this.save = function() {
    return api.put(this.value._links.self.href, {
      Authorization: this.authHeaderValue
    }, null, this.value);
  };
  this.delete = function() {
    return api.delete(this.value._links.self.href, {
      Authorization: this.authHeaderValue
    });
  };
};

var Asset = function(asset, authHeaderValue) {
  this.value = asset;
  this.authHeaderValue = authHeaderValue;
  /*this.save = function() {
   // TODO edit functionality for asset
   };
   */
  this.delete = function() {
    return api.delete(this.value._links.self.href, {
      Authorization: this.authHeaderValue
    });
  };
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
