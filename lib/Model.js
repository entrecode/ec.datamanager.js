'use strict';

var halfred = require('halfred');
var request = require('superagent');
var traverson = require('traverson');

var Asset = require('./Asset');
var Entry = require('./Entry');
var util = require('./util');

var Model = function(title, metadata, dm) {
  this.id = title;
  this.title = title;
  this.metadata = metadata;
  this._traversal = null;
  this._dm = dm;
};

Model.prototype.enableCache = function(maxCacheAge) {
  return this._dm._makeDB().then(function(db) {
    this._maxAge = maxCacheAge || 600000;
    this._items = db.getCollection(this.title) || db.addCollection(this.title, {
        indices: [
          '_id',
          '_entryTitle'
        ]
      });
    return this._loadData();
  }.bind(this));
};

Model.prototype._loadData = function(force) {
  return Promise.resolve()
  .then(function() {
    if (this._items.data.length > 0 && !force) {
      return Promise.resolve(this._items);
    }
    return this._getTraversal()
    .then(function(traversal) {
      return new Promise(function(resolve, reject) {
        traversal.continue().newRequest()
        .follow(this._dm.id + ':' + this.title)
        .withRequestOptions(this._dm._requestOptions())
        .withTemplateParameters({ size: 0 })
        .get(function(err, res, traversal) {
          return util.checkResponse(err, res)
          .then(function(res) {
            var body = halfred.parse(JSON.parse(res.body));
            var entries = body.embeddedResourceArray(this._dm.id + ':' + this.title);
            this._items.removeDataOnly();
            for (var i = 0; i < entries.length; i++) {
              this._items.insert(entries[i].original());
            }
            this._dm._cacheMetaData.removeWhere({ title: this.title });
            this._dm._cacheMetaData.insert({
              title: this.title,
              etag: res.headers.etag,
              created: new Date().toISOString()
            });
            this._dm._db.save(function(err) {
              /* istanbul ignore if */
              if (err) {
                return reject(err);
              }
              return resolve(this._items);
            }.bind(this));
          }.bind(this))
          .catch(reject);
        }.bind(this));
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

Model.prototype._getTraversal = function() {
  var model = this;
  return new Promise(function(resolve, reject) {
    if (model._traversal) {
      return resolve(model._traversal);
    }
    if (model._dm._rootTraversal) {
      model._dm._rootTraversal.continue().newRequest()
      .withRequestOptions(model._dm._requestOptions())
      .get(function(err, res, traversal) {
        util.checkResponse(err, res).then(function() {
          model._traversal = traversal;
          return resolve(traversal);
        }).catch(reject);
      });
    }

    traverson.from(model._dm.url).jsonHal()
    .withRequestOptions(model._dm._requestOptions())
    .get(function(err, res, traversal) {
      util.checkResponse(err, res).then(function(res) {
        model._traversal = traversal;
        return resolve(traversal);
      }).catch(reject);
    });
  });
};

Model.prototype._ensureNotStale = function() {
  var maxAge = new Date().getTime() - this._maxAge;
  var created = new Date(this._dm._cacheMetaData.find({ title: this.title })[0].created).getTime();
  if (created < maxAge) {
    return Promise.resolve(this._items);
  }
  return this._loadData(true);
};

Model.prototype.resolve = function() {
  var model = this;
  return new Promise(function(resolve, reject) {
    traverson.from(model._dm.url).jsonHal()
    .withRequestOptions(model._dm._requestOptions())
    .get(function(err, res, traversal) {
      util.checkResponse(err, res).then(function(res) {
        var body = JSON.parse(res.body);
        for (var i = 0; i < body.models.length; i++) {
          if (body.models[i].title === model.title) {
            model.metadata = body.models[i];
            model._dm._rootTraversal = traversal;
            return resolve(model);
          }
        }
        return reject(new Error('ec_sdk_model_not_found'));
      }).catch(reject);
    });
  });
};

Model.prototype.getSchema = function(method) {
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
    .get(model._dm.url.replace('/api/', '/api/schema/') + '/' + model.title)
    .query({ template: method })
    .end(function(err, res) {
      util.checkResponse(err, res).then(function(res) {
        return resolve(res.body);
      }).catch(reject);
    });
  });
};

Model.prototype.entryList = function(options) {
  var model = this;
  if (this._maxAge) {
    return Promise.resolve()
    .then(function() {
      switch (options && options.cacheType ? options.cacheType : 'default') {
      case 'stale':
        return Promise.resolve(this._items);
      case 'refresh':
        return this._loadData(true);
      case 'default':
      default:
        return this._ensureNotStale();
      }
    }.bind(this))
    .then(function(items) {
      return util.filterCached(items, options);
    }.bind(this))
    .then(function(filtered) {
      filtered.elements.map(function(entry) {
        return new Entry(halfred.parse(entry), this._dm, this)
      }.bind(this));
      filtered.entries = filtered.elements;
      delete filtered.elements;
      if (options && options.cacheType === 'stale') {
        options.cacheType = 'refresh';
        filtered.refreshedData = this.entryList(options);
      }
      return Promise.resolve(filtered);
    }.bind(this));
  }

  return this._getTraversal().then(function(traversal) {
    return new Promise(function(resolve, reject) {
      var t = traversal.continue().newRequest()
      .follow(model._dm.id + ':' + model.title);
      if (options) {
        t.withTemplateParameters(util.optionsToQueryParameter(options));
      }
      t.withRequestOptions(model._dm._requestOptions())
      .get(function(err, res, traversal) {
        util.checkResponse(err, res).then(function(res) {
          var body = halfred.parse(JSON.parse(res.body));
          // empty list due to filter
          if (body.hasOwnProperty('count') && body.count === 0 && body.hasOwnProperty('total')) {
            return resolve({ entries: [], count: body.count, total: body.total });
          }
          var entries = body.embeddedArray(model._dm.id + ':' + model.title);
          // single result due to filter
          var out = [];
          if (!entries) {
            out.push(new Entry(body, model._dm, model));
          } else {
            for (var i = 0; i < entries.length; i++) {
              out.push(new Entry(entries[i], model._dm, model));
            }
          }
          return resolve({ entries: out, count: body.count, total: body.total });
        }).catch(reject);
      });
    });
  });
};

Model.prototype.entries = function(options) {
  var model = this;
  // cache type stale not allowed on entries, only on entryList
  if (options && options.hasOwnProperty('cacheType') && options.cacheType === 'stale') {
    options.cacheType = 'default';
  }

  return model.entryList(options)
  .then(function(list) {
    return Promise.resolve(list.entries);
  });
};

Model.prototype.entry = function(id, levels) {
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

  return this.entries(options)
  .then(function(res) {
    if (!res.length) {
      return Promise.reject(new Error('ec_sdk_no_match_due_to_filter'));
    }
    return Promise.resolve(res[0]);
  });
};

Model.prototype.nestedEntry = function(id, levels) {
  return this.entry(id, levels)
  .then(function(entry) {
    makeNestedToResource(entry, this._dm, this);
    return Promise.resolve(entry);
  }.bind(this));
};

Model.prototype.createEntry = function(entry) {
  var model = this;
  return this._getTraversal().then(function(traversal) {
    return new Promise(function(resolve, reject) {
      traversal.continue().newRequest()
      .follow(model._dm.id + ':' + model.title)
      .withRequestOptions(model._dm._requestOptions({
        'Content-Type': 'application/json'
      }))
      .post(entry, function(err, res, traversal) {
        util.checkResponse(err, res).then(function(res) {
          if (res.statusCode === 204) {
            return resolve(true);
          }
          return resolve(new Entry(halfred.parse(JSON.parse(res.body)), model._dm, model, traversal));
        }, reject);
      });
    });
  });
};

Model.prototype.deleteEntry = function(entryId) {
  var model = this;
  return this._getTraversal().then(function(traversal) {
    return new Promise(function(resolve, reject) {
      traversal.continue().newRequest()
      .follow(model._dm.id + ':' + model.title)
      .withTemplateParameters({ _id: entryId })
      .withRequestOptions(model._dm._requestOptions())
      .delete(function(err, res) {
        util.checkResponse(err, res).then(function() {
          return resolve(true);
        }).catch(reject);
      });
    });
  });
};

function makeNestedToResource(entry, dm, model) {
  for (var link in entry.value._links) {
    var l = /^[a-f0-9]{8}:.+\/(.+)$/.exec(link);
    if (l) {
      if (Array.isArray(entry.value[l[1]])) {
        entry.value[l[1]] = entry.value[l[1]].map(function(e) {
          if (e.hasOwnProperty('assetID')) {
            return new Asset(halfred.parse(e), dm);
          }
          var entry = new Entry(halfred.parse(e), dm, model);
          makeNestedToResource(entry, dm, model);
          return entry;
        });
      } else {
        if (entry.value[l[1]].hasOwnProperty('assetID')) {
          entry.value[l[1]] = new Asset(halfred.parse(entry.value[l[1]]), dm);
        }
        entry.value[l[1]] = new Entry(halfred.parse(entry.value[l[1]]), dm, model);
        makeNestedToResource(entry.value[l[1]], dm, model);
      }
    }
  }
}

module.exports = Model;
