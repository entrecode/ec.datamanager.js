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

DataManager.prototype.modelList = function() {
  var url = this.url;
  var shortID = this.id;
  var authHeaderValue = 'Bearer ' + this.accessToken;
  var dataManager = this;
  return api.get(this.url, {
    Authorization: authHeaderValue
  }, {}, function(data) {
    var body = JSON.parse(data);
    var regex = new RegExp('^' + shortID + ':(.+$)');
    var listOfModels = {};
    _.forOwn(_.pick(body._links, function(link, relationname) {
      return relationname.match(regex);
    }), function(link, relationname) {
      var modelID = regex.exec(relationname)[1];
      listOfModels[modelID] = dataManager.model(modelID);
    });
    return listOfModels;
  })
}

DataManager.prototype.model = function(modelID) {
  var url = this.url + modelID;
  var shortID = this.id;
  var authHeaderValue = 'Bearer ' + this.accessToken;
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

    entries: function(options) {
      return api.get(url, {
          Authorization: authHeaderValue
        }, {}, function(data) {
          var body = JSON.parse(data);
          return _.map(body._embedded[shortID + ':' + modelID], function(entry) {
            return new Entry(entry, authHeaderValue);
          });
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
