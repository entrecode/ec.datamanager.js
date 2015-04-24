'use strict';

/*
 * Main DataManager class and SDK entry point
 * */

var _   = require('lodash')

  , api = require('./api.js')
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

  if (options.hasOwnProperty('accessToken')) {
    this.accessToken = options.accessToken;
  } else {
    this.accessToken = this.register().then(function(user) {
      return user.value.temporaryToken;
    });
  }
};

function waitUntilDataManagerIsReady(dataManager) {
  return new Promise(function(resolve, reject) {
    if (typeof dataManager.accessToken === 'object') {
      dataManager.accessToken.then(function(b) {
        dataManager.accessToken = b;
        resolve(dataManager);
      }, function(error) {
        reject(error);
      });
    } else {
      resolve(dataManager);
    }
  });
}

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
      })
  });
};

DataManager.prototype.model = function(modelID) {
  var url = this.url + modelID;
  var shortID = this.id;
  var authHeaderValue = this.accessToken ? 'Bearer ' + this.accessToken : null;
  return {
    id: modelID,

    createEntry: function(object) {
      return api.post(url, {
        Authorization: authHeaderValue
      }, {}, object, function(data) {
        var body = JSON.parse(data);

        return new Entry(body._embedded[shortID + ':' + modelID], authHeaderValue);
      });
    },

    deleteEntry: function(entryID) {
      return api.delete(url, {
          Authorization: authHeaderValue
        },
        {
          id: entryID
        });
    },

    entries: function(options) {
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
      return api.get(url, {
          Authorization: authHeaderValue
        }, query, function(data) {
          var body = JSON.parse(data);
          return _.map(body._embedded[shortID + ':' + modelID], function(entry) {
            return new Entry(entry, authHeaderValue);
          });
        }
      );
    },

    entry: function(entryID) {
      return api.get(url, {
          Authorization: authHeaderValue
        },
        {
          id: entryID
        },
        function(data) {
          var body = JSON.parse(data);

          return new Entry(body._embedded[shortID + ':' + modelID], authHeaderValue);
        }
      );
    },

    getSchema: function(method) {
      if (!method) {
        method = 'get';
      }
      method.toLowerCase();
      if (['get', 'put', 'post'].indexOf(method) === -1) {
        throw new Error('invalid value for method. Allowed values: get, put, post');
      }
      return api.get(url.replace('/api', '/api/schema'), {}, {template: method}, JSON.parse);
    }
  }
};

DataManager.prototype.user = function(userID) {
  return this.model('user').entry(userID);
};

DataManager.prototype.register = function() {
  return this.model('user').createEntry({private: true});
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
