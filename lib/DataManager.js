'use strict';

var axios = require('axios')
  , q     = require('q')
  , _     = require('lodash')
  ;

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
  } else { // TODO retrieve access token

  }
};

axios.interceptors.response.use(function(response) {
  // Do something with response data
  return response.data;
}, function(error) {
  // Do something with response error
  return Promise.reject(error);
});

DataManager.prototype.model = function(modelID) {
  var url = this.url + modelID;
  var shortID = this.id;
  var authHeaderValue = 'Bearer ' + this.accessToken;
  return {
    entries: function(options) {
      return axios.get(url, {
        headers: {
          Authorization: authHeaderValue
        },
        transformResponse: [function(data) {
          var body = JSON.parse(data);

          return body._embedded[shortID + ':' + modelID];
        }]
      });
    },

    entry: function(entryID) {
      var promise = axios.get(url + '?id=' + entryID, {
        headers: {
          Authorization: authHeaderValue
        },
        transformResponse: [function(data) {
          var body = JSON.parse(data);

          return new Entry(body._embedded[shortID + ':' + modelID]);
        }]
      });

     /* promise.save = function() {
        /*return axios.put(entry._links.self, {
          headers: {
            Authorization: authHeaderValue
          }
        });

        console.log('save');
      };*/

      return promise;
    }
  }
};

module.exports = DataManager;

var Entry = function(entry) {
  _.assign(this, entry);
  this.save = function() {
    return axios.put(entry._links.self, {
      headers: {
        Authorization: authHeaderValue
      }
    });
  }
}