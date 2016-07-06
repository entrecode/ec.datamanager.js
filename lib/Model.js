'use strict';

var halfred = require('halfred');
var request = require('superagent');
var traverson = require('traverson');
var isReachableLib = require('is-reachable');

var Asset = require('./Asset');
var Entry = require('./Entry');
var util = require('./util');

var sizeRegex = /[&\?]size=(\d+)/;
var pageRegex = /[&\?]page=(\d+)/;

var Model = function(title, metadata, dm) {
  this.id = title;
  this.title = title;
  this.metadata = metadata;
  this._traversal = null;
  this._dm = dm;
};

Model.prototype.enableCache = function(env, maxCacheAge) {
  return Promise.resolve()
  .then(function() {
    return this._dm._makeDB(env)
  }.bind(this))
  .then(function(db) {
    this._maxAge = maxCacheAge || 600000;
    this._items = db.getCollection(this.title) || db.addCollection(this.title, {
        indices: [
          '_id',
          '_entryTitle'
        ]
      });
    this._dm._modelCache[this.title] = this;
    return this._loadData();
  }.bind(this))
  .catch(util.errorHandler);
};

Model.prototype.clearCache = function() {
  if (!this._maxAge) {
    return Promise.resolve(new Error('Cache not activated.'));
  }
  return Promise.resolve()
  .then(function() {
    delete this._maxAge;
    this._dm._cacheMetaData.removeWhere({ title: this.title });
    this._items.removeDataOnly();
    delete this._items;
    return new Promise(function(resolve, reject) {
      this._dm._db.save(function(err) {
        /* istanbul ignore if */
        if (err) {
          return reject(err);
        }
        return resolve();
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

Model.prototype.resolve = function() {
  var model = this;
  var traversal;
  return Promise.resolve()
  .then(function() {
    return util.getP(
      traverson.from(model._dm.url).jsonHal()
      .withRequestOptions(model._dm._requestOptions())
    );
  })
  .then(function(res) {
    traversal = res[1];
    return util.checkResponse(res[0]);
  })
  .then(function(res) {
    var body = JSON.parse(res.body);
    for (var i = 0; i < body.models.length; i++) {
      if (body.models[i].title === model.title) {
        model.metadata = body.models[i];
        model._dm._rootTraversal = traversal;
        return Promise.resolve(model);
      }
    }
    return Promise.reject(new Error('ec_sdk_model_not_found'));
  })
  .catch(util.errorHandler);
};

Model.prototype.getSchema = function(method) {
  var model = this;
  return Promise.resolve()
  .then(function() {
    if (!method) {
      method = 'get';
    }
    method.toLowerCase();
    if (['get', 'put', 'post'].indexOf(method) === -1) {
      return Promise.reject(new Error('ec_sdk_invalid_method_for_schema'));
    }
    return util.superagentEndP(
      request
      .get(model._dm.url.replace('/api/', '/api/schema/') + '/' + model.title)
      .query({ template: method })
    );
  })
  .then(function(res) {
    return util.checkResponse(res);
  })
  .then(function(res) {
    return Promise.resolve(res.body);
  })
  .catch(util.errorHandler);
};

Model.prototype.entryList = function(options) {
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
      filtered.entries = filtered.elements.map(function(entry) {
        return new Entry(halfred.parse(entry), this._dm, this)
      }.bind(this));
      delete filtered.elements;
      if (options && options.cacheType === 'stale') {
        options.cacheType = 'refresh';
        filtered.refreshedData = this.entryList(options);
      }

      var size;
      var page;
      if (options) {
        size = options.size;
        page = options.page;
      }

      if (size * page < filtered.total) {
        options.size = size;
        /* istanbul ignore next */
        options.page = page + 1 || 2;
        filtered.next = this.entryList(options);
      }

      if (size * page - size > 0) {
        options.size = size;
        /* istanbul ignore next */
        options.page = page - 1 || undefined;
        filtered.prev = this.entryList(options);
      }

      if (page && page >= 2) {
        options.size = size;
        delete options.page;
        filtered.first = this.entryList(options);
      }
      return Promise.resolve(filtered);
    }.bind(this))
    .catch(util.errorHandler);
  }
  
  var model = this;
  return Promise.resolve()
  .then(function() {
    return model._dm._getTraversal();
  })
  .then(function(traversal) {
    var t = traversal.continue().newRequest()
    .follow(model._dm.id + ':' + model.title);
    if (options) {
      t.withTemplateParameters(util.optionsToQueryParameter(options));
    }
    t.withRequestOptions(model._dm._requestOptions());
    return util.getP(t);
  })
  .then(function(res) {
    return util.checkResponse(res[0]);
  })
  .then(function(res) {
    var body = halfred.parse(JSON.parse(res.body));
    // empty list due to filter
    if (body.hasOwnProperty('count') && body.count === 0 && body.hasOwnProperty('total')) {
      return Promise.resolve({ entries: [], count: body.count, total: body.total });
    }
    var entries = body.embeddedArray(model._dm.id + ':' + model.title);
    // single result due to filter
    var e = [];
    if (!entries) {
      e.push(new Entry(body, model._dm, model));
    } else {
      for (var i = 0; i < entries.length; i++) {
        e.push(new Entry(entries[i], model._dm, model));
      }
    }
    var out = {
      entries: e,
      count: body.count,
      total: body.total,
    };

    var optionsClone = options ? JSON.parse(JSON.stringify(options)) : {};

    var next = body.link('next');
    if (next) {
      var s = sizeRegex.exec(next.href);
      var p = pageRegex.exec(next.href);
      if (s) {
        optionsClone.size = s[1];
      } else {
        delete optionsClone.size;
      }
      if (p) {
        optionsClone.page = p[1];
      } else {
        delete options.page;
      }
      out.next = function() {
        return model.entryList(optionsClone);
      };
    }
  
    var prev = body.link('prev');
    if (prev) {
      var s = sizeRegex.exec(prev.href);
      var p = pageRegex.exec(prev.href);
      if (s) {
        optionsClone.size = s[1];
      } else {
        delete optionsClone.size;
      }
      if (p) {
        optionsClone.page = p[1];
      } else {
        delete optionsClone.page;
      }
      out.prev = function() {
        return model.entryList(optionsClone);
      };
    }

    var first = body.link('first');
    if (first) {
      var s = sizeRegex.exec(first.href);
      var p = pageRegex.exec(first.href);
      if (s) {
        optionsClone.size = s[1];
      } else {
        delete optionsClone.size;
      }
      if (p) {
        optionsClone.page = p[1];
      } else {
        delete optionsClone.page;
      }
      out.first = function() {
        return model.entryList(optionsClone);
      };
    }

    return Promise.resolve(out);
  })
  .catch(util.errorHandler);
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
    Entry._makeNestedToResource(entry, this._dm);
    return Promise.resolve(entry);
  }.bind(this));
};

Model.prototype.createEntry = function(entry) {
  var model = this;
  return Promise.resolve()
  .then(function() {
    return model._dm._getTraversal();
  })
  .then(function(traversal) {
    return util.postP(
      traversal.continue().newRequest()
      .follow(model._dm.id + ':' + model.title)
      .withRequestOptions(model._dm._requestOptions({
        'Content-Type': 'application/json'
      })),
      entry
    );
  })
  .then(function(res) {
    return util.checkResponse(res[0]);
  })
  .then(function(res) {
    if (res.statusCode === 204) {
      return Promise.resolve(true);
    }
    return Promise.resolve(new Entry(halfred.parse(JSON.parse(res.body)), model._dm, model));
  })
  .catch(util.errorHandler);
};

Model.prototype.deleteEntry = function(entryId) {
  var model = this;
  return Promise.resolve()
  .then(function() {
    return model._dm._getTraversal();
  })
  .then(function(traversal) {
    return util.deleteP(
      traversal.continue().newRequest()
      .follow(model._dm.id + ':' + model.title)
      .withTemplateParameters({ _id: entryId })
      .withRequestOptions(model._dm._requestOptions())
    );
  })
  .then(function(res) {
    return util.checkResponse(res[0]);
  })
  .then(function() {
    return Promise.resolve(true);
  })
  .catch(util.errorHandler);
};

Model.prototype._ensureNotStale = function() {
  var maxAge = new Date().getTime() - this._maxAge;
  var metadata = this._dm._cacheMetaData.find({ title: this.title })[0];
  if (!metadata || !metadata.hasOwnProperty('created')) {
    metadata = {
      created: 0,
    }
  }
  var created = new Date(metadata.created).getTime();
  if (created > maxAge) {
    return Promise.resolve(this._items);
  }
  if (!this._loadDataActivePromise) {
    this._loadDataActivePromise = this._loadData(true);
  }
  return this._loadDataActivePromise;
};

Model.prototype._loadData = function(force) {
  return Promise.resolve()
  .then(function() {
    return this._isReachable('google.de');
  }.bind(this))
  .then(function() {
    if (this._items.data.length > 0 && !force) {
      return Promise.resolve(this._items);
    }
    return this._load();
  }.bind(this))
  .catch(function(error) {
    this._loadDataActivePromise = null;
    /* istanbul ignore else */
    if (error.message === 'offline') {
      if (this._items.data.length > 0) {
        console.warn('Network unreachable. Loading cached data for model ' + this.title + '.');
        return Promise.resolve(this._items);
      }
      return Promise.reject(new Error('Network unreachable. No cached data available for model ' + this.title + '.'));
    }
    /* istanbul ignore next */
    return Promise.reject(error);
  }.bind(this));
};

Model.prototype._load = function() {
  return Promise.resolve()
  .then(function() {
    return this._dm._getTraversal()
  }.bind(this))
  .then(function(traversal) {
    return util.getP(
      traversal.continue().newRequest()
      .follow(this._dm.id + ':' + this.title)
      .withRequestOptions(this._dm._requestOptions())
      .withTemplateParameters({ size: 0 })
    );
  }.bind(this))
  .then(function(res) {
    return util.checkResponse(res[0]);
  }.bind(this))
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
    return new Promise(function(resolve, reject) {
      this._dm._db.save(function(err) {
        /* istanbul ignore if */
        if (err) {
          return reject(err);
        }
        this._loadDataActivePromise = null;
        return resolve(this._items);
      }.bind(this));
    }.bind(this));
  }.bind(this))
  .catch(function(err) {
    this._loadDataActivePromise = null;
    return Promise.reject(err);
  }.bind(this))
};

Model.prototype._isReachable = function(dests) {
  return new Promise(function(resolve, reject) {
    isReachableLib(dests, function(onBrowserOKOnNodeNull, reachable) {
      /* istanbul ignore else */
      if (onBrowserOKOnNodeNull || reachable) {
        return resolve();
      }
      /* istanbul ignore next */ // is stubbed in tests
      return reject(new Error('offline'));
    });
  });
};

module.exports = Model;
