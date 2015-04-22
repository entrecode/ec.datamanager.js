'use strict';

/*
* Main DataManager class and SDK entry point
* */

var _     = require('lodash')

  , api = require('./api.js')
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


DataManager.prototype.model = function(modelID) {
  var url = this.url + modelID;
  var shortID = this.id;
  var authHeaderValue = 'Bearer ' + this.accessToken;
  return {
    entries: function(options) {
      return api.get(url, {
          Authorization: authHeaderValue
        }, {}, function(data) {
          var body = JSON.parse(data);
          var mapped = _.map(body._embedded[shortID + ':' + modelID], function(entry) {
            return new Entry(entry, authHeaderValue);
          });
          return mapped;
        }
      );
    },

    entry: function(entryID) {
      var promise = api.get(url, {
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

      return promise;
    }
  }
};

module.exports = DataManager;

var Entry = function(entry, authHeaderValue) {
  this.value = entry;
  this.authHeaderValue = authHeaderValue;
  this.save = function() {
    return api.put(this.value._links.self.href, {
      Authorization: this.authHeaderValue
    }, null, this.value);
  }
}
