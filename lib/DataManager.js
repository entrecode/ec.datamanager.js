'use strict';

/*
 * Main DataManager class and SDK entry point
 *
 */

var api     = require('./api.js')
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
  this.tagUrl = this.url.replace('/api/' + this.id + '/', '/tag/' + this.id);
  this.fileUrl = this.url.replace('api/' + this.id + '/', 'files/');

  if (!/^[a-f0-9]+$/i.test(this.id)) {
    throw new Error('Invalid URL');
  }

  if (options.hasOwnProperty('accessToken')) {
    this.accessToken = options.accessToken;
  }

  /*
   this.accessToken = this.register().then(function(user) {
   return user.value.temporaryToken;
   });
   */
};

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

DataManager.prototype.authHeader = function() {
  return this.accessToken ? {Authorization: 'Bearer ' + this.accessToken} : null;
};

DataManager.prototype.getFileURL = function(assetID, locale) {
  var headers = locale ? {'Accept-Language': locale} : null;
  return api.get(this.fileUrl + assetID + '/url', headers, {}, function(res) {
    res = JSON.parse(res);
    return res.url;
  });
};

DataManager.prototype.getImageURL = function(assetID, size, locale) {
  var headers = locale ? {'Accept-Language': locale} : null;
  return api.get(this.fileUrl + assetID + '/url', headers, {size: size}, function(res) {
    res = JSON.parse(res);
    return res.url;
  });
};

DataManager.prototype.getImageThumbURL = function(assetID, size, locale) {
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
  return api.get(this.fileUrl + assetID + '/url', headers, {size: size, thumb: true}, function(res) {
    res = JSON.parse(res);
    return res.url;
  });
};

DataManager.prototype.getRoot = function() {
  return waitUntilDataManagerIsReady(this).then(function(dataManager) {
    return api.get(dataManager.url, null, null, function(data) {
      return JSON.parse(data);
    });
  });
};

DataManager.prototype.modelList = function() {
  return waitUntilDataManagerIsReady(this).then(function(dataManager) {
    return api.get(dataManager.url, dataManager.authHeader(), {},
      function(data) {
        var body = JSON.parse(data);
        var regex = new RegExp('^' + dataManager.id + ':(.+$)');
        var listOfModels = {};
        for (var key in body._embedded) {
          if (body._embedded.hasOwnProperty(key)) {
            var modelName = regex.exec(key)[1];
            var embedded = body._embedded[key];
            listOfModels[modelName] = dataManager.model(modelName, embedded.titleField, embedded.hexColor);
          }
        }
        return listOfModels;
      });
  });
};

DataManager.prototype.model = function(modelID, title, color) {
  var thisDataManager = this;
  var url = thisDataManager.url + modelID;
  var shortID = thisDataManager.id;
  return {
    id: modelID,
    titleField: title || 'id',
    hexColor: color || '#ffffff',

    createEntry: function(object) {
      return waitUntilDataManagerIsReady(thisDataManager).then(function(thisDataManager) {
        return api.post(url, thisDataManager.authHeader(), {}, object, function(data) {
          var body = JSON.parse(data);
          if (body.hasOwnProperty('status') && body.hasOwnProperty('code') && body.hasOwnProperty('title')) {
            // is error
            return body;
          }
          if (body.hasOwnProperty('_embedded') && body._embedded.hasOwnProperty(shortID + ':' + modelID)) {
            // is successful
            return new Entry(body._embedded[shortID + ':' + modelID], 'Bearer ' + thisDataManager.accessToken, shortID, modelID);
          }
          if (!body.hasOwnProperty('count') && !body.hasOwnProperty('total')) {
            return new Entry(body, 'Bearer ' + thisDataManager.accessToken, shortID, modelID);
          }
          return body;
        });
      });
    },

    deleteEntry: function(entryID) {
      return waitUntilDataManagerIsReady(thisDataManager).then(function(thisDataManager) {
        return api.delete(url, thisDataManager.authHeader(), {id: entryID});
      });
    },

    entries: function(options) {
      return waitUntilDataManagerIsReady(thisDataManager).then(function(thisDataManager) {
        return api.get(url, thisDataManager.authHeader(), optionsToQueryParameter(options), function(data) {
          var body = JSON.parse(data);
          if (body.hasOwnProperty('status') && body.hasOwnProperty('code') && body.hasOwnProperty('title')) {
            // is error
            return body;
          }
          if (body.hasOwnProperty('_embedded') && body._embedded.hasOwnProperty((shortID + ':' + modelID))) {
            if (!Array.isArray(body._embedded[shortID + ':' + modelID])) {
              body._embedded[shortID + ':' + modelID] = [body._embedded[shortID + ':' + modelID]];
            }
            var out = [];
            for (var key in body._embedded[shortID + ':' + modelID]) {
              if (body._embedded[shortID + ':' + modelID].hasOwnProperty(key)) {
                out.push(new Entry(body._embedded[shortID + ':' + modelID][key], 'Bearer ' + thisDataManager.accessToken, shortID, modelID));
              }
            }
            return out;
          }
          return [];
        });
      });
    },

    entryList: function(options) {
      return api.get(url, thisDataManager.authHeader(), optionsToQueryParameter(options), function(data) {
        var body = JSON.parse(data);
        if (body.hasOwnProperty('status') && body.hasOwnProperty('code') && body.hasOwnProperty('title')) {
          // is error
          return body;
        }
        if (body.hasOwnProperty('_embedded') && body._embedded.hasOwnProperty((shortID + ':' + modelID))) {
          if (!Array.isArray(body._embedded[shortID + ':' + modelID])) {
            body._embedded[shortID + ':' + modelID] = [body._embedded[shortID + ':' + modelID]];
          }
          var out = [];
          for (var key in body._embedded[shortID + ':' + modelID]) {
            if (body._embedded[shortID + ':' + modelID].hasOwnProperty(key)) {
              out.push(new Entry(body._embedded[shortID + ':' + modelID][key], 'Bearer ' + thisDataManager.accessToken, shortID, modelID));
            }
          }
          return {
            entries: out, count: body.count, total: body.total
          };
        }
        return {entries: [], count: 0, total: 0};
      });
    },

    entry: function(entryIDOrOptionsObject) {
      return waitUntilDataManagerIsReady(thisDataManager).then(function(thisDataManager) {
        if (typeof entryIDOrOptionsObject === 'object') {
          var id = entryIDOrOptionsObject.id;
          delete entryIDOrOptionsObject.id;
          entryIDOrOptionsObject = optionsToQueryParameter(entryIDOrOptionsObject);
          entryIDOrOptionsObject.id = id;
        } else {
          entryIDOrOptionsObject = {id: entryIDOrOptionsObject};
        }
        return api.get(url, thisDataManager.authHeader(), entryIDOrOptionsObject,
          function(data) {
            var body = JSON.parse(data);
            if (body.hasOwnProperty('status') && body.hasOwnProperty('code') && body.hasOwnProperty('title')) {
              // is error
              return body;
            }
            if (body.hasOwnProperty('_embedded') && body._embedded.hasOwnProperty((shortID + ':' + modelID))) {
              return new Entry(body._embedded[shortID + ':' + modelID], 'Bearer ' + thisDataManager.accessToken, shortID, modelID);
            }
            if (!body.hasOwnProperty('count') && !body.hasOwnProperty('total')) {
              return new Entry(body, 'Bearer ' + thisDataManager.accessToken, shortID, modelID);
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
  var context = this;
  return new Promise(function(resolve, reject) {
    waitUntilDataManagerIsReady(context).then(function(dataManager) {
      return dataManager.getRoot();
    }).then(function(rootResponse) {
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

DataManager.prototype.assetList = function(options) {
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
          return {
            assets: out, count: body.count, total: body.total
          };
        }
        return {assets: [], count: 0, total: 0};
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

var Entry = function(entry, authHeaderValue, shortID, modelID) {
  this.value = entry;
  this.authHeaderValue = authHeaderValue;
  this.save = function() {
    return api.put(this.value._links.self.href, authHeaderValue ? {Authorization: authHeaderValue} : null, null, this.value, function(data) {
      var body = JSON.parse(data);
      if (body.hasOwnProperty('status') && body.hasOwnProperty('code') && body.hasOwnProperty('title')) {
        // is error
        return body;
      }
      if (body.hasOwnProperty('_embedded') && body._embedded.hasOwnProperty((shortID + ':' + modelID))) {
        return new Entry(body._embedded[shortID + ':' + modelID], authHeaderValue, shortID, modelID);
      }
      if (!body.hasOwnProperty('count') && !body.hasOwnProperty('total')) {
        return new Entry(body, authHeaderValue, shortID, modelID);
      }
      return body;
    });
  };
  this.delete = function() {
    return api.delete(this.value._links.self.href, authHeaderValue ? {Authorization: authHeaderValue} : null);
  };
};

var Asset = function(asset, authHeaderValue) {
  this.value = asset;
  this.authHeaderValue = authHeaderValue;
  this.save = function() {
    return api.put(this.value._links.self.href, authHeaderValue ? {Authorization: authHeaderValue} : null, null, this.value, function(data) {
      var body = JSON.parse(data);
      if (body.hasOwnProperty('status') && body.hasOwnProperty('code') && body.hasOwnProperty('title')) {
        // is error
        return body;
      }
      return new Asset(body, authHeaderValue);
    });
  };
  this.delete = function() {
    return api.delete(this.value._links.self.href, authHeaderValue ? {Authorization: authHeaderValue} : null);
  };
};

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
