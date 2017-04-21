'use strict';

var util = {};
util._dm = null;

util.optionsToQueryParameter = function(options) {
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
  if (options && options.hasOwnProperty('fields') && Array.isArray(options.fields)) {
    query._fields = options.fields.join(',');
  }
  if (options && options.hasOwnProperty('filter')) {
    for (var key in options.filter) {
      /* istanbul ignore else */
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
        /* istanbul ignore next */
        if (value.hasOwnProperty('any') && Array.isArray(value.any) && value.any.length > 0) {
          query[key] = value.any.join(',');
        }
        /* istanbul ignore next */
        if (value.hasOwnProperty('all') && Array.isArray(value.all) && value.all.length > 0) {
          query[key] = value.all.join('+');
        }
      }
    }
  }
  return query;
};

util.filterCached = function(items, options) {
  var chain = items.chain();
  if (options && options.hasOwnProperty('filter')) {
    for (var field in options.filter) {
      /* istanbul ignore else */
      if (options.filter.hasOwnProperty(field)) {
        var fieldFilter = options.filter[field];
        for (var filter in fieldFilter) {
          /* istanbul ignore else */
          if (fieldFilter.hasOwnProperty(filter)) {
            var f = {};
            if (filter === 'exact') {
              f[field] = fieldFilter[filter];
            }
            if (filter === 'search') {
              f[field] = { '$contains': fieldFilter[filter] };
            }
            if (filter === 'from') {
              f[field] = { '$gte': fieldFilter[filter] };
            }
            if (filter === 'to') {
              f[field] = { '$lte': fieldFilter[filter] };
            }
            /*
             if (filter === 'any' && Array.isArray(fieldFilter[filter])) {
             f[field] = fieldFilter[filter].join(',');
             }
             if (filter === 'all' && Array.isArray(fieldFilter[filter])) {
             f[field] = fieldFilter[filter].join('+');
             }
             */
            chain = chain.find(f);
          }
        }
      }
    }
  }
  if (options && options.hasOwnProperty('sort') && Array.isArray(options.sort)) {
    var sort = [];
    for (var i = 0; i < options.sort.length; i++) {
      if (options.sort[i].indexOf('-') === 0) {
        sort.push([options.sort[i].slice(1), true]);
      } else if (options.sort[i].indexOf('+') === 0) {
        sort.push(options.sort[i].slice(1));
      } else {
        sort.push(options.sort[i]);
      }
    }
    chain = chain.compoundsort(sort);
  }

  var out = {};
  out.total = chain.copy().data().length;
  chain = chain.copy();
  if (options && options.hasOwnProperty('size') && options.size === 0) {
    options.size = Number.MAX_VALUE;
  }
  if (options && options.hasOwnProperty('page')) {
    chain = chain.offset(options.page * (options.size || 10) - (options.size || 10));
  }
  if (options && options.hasOwnProperty('size')) {
    chain = chain.limit(options.size);
  }
  out.elements = chain.data();
  out.count = out.elements.length;
  return Promise.resolve(out);
};

util.checkResponse = function(res) {
  if (res.statusCode >= 200 && res.statusCode <= 299) {
    return Promise.resolve(res);
  }
  var errorMessage;
  try {
    errorMessage = JSON.parse(res.body);
  } catch (parsingError) {
    errorMessage = res.body;
  }
  return Promise.reject(errorMessage);
};

util.getP = function(t) {
  return new Promise(function(resolve, reject) {
    t.get(function(err, res, traversal) {
      /* istanbul ignore if */
      if (err) {
        return reject(err);
      }
      return resolve([res, traversal]);
    });
  });
};

util.getUrlP = function(t) {
  return new Promise(function(resolve, reject) {
    t.getUrl(function(err, res, traversal) {
      if (err) {
        return reject(err);
      }
      return resolve([res, traversal]);
    });
  });
};

util.postP = function(t, body) {
  return new Promise(function(resolve, reject) {
    t.post(body, function(err, res, traversal) {
      /* istanbul ignore if */
      if (err) {
        return reject(err);
      }
      return resolve([res, traversal]);
    });
  });
};

util.putP = function(t, body) {
  return new Promise(function(resolve, reject) {
    t.put(body, function(err, res, traversal) {
      /* istanbul ignore if */
      if (err) {
        return reject(err);
      }
      return resolve([res, traversal]);
    });
  });
};

util.deleteP = function(t) {
  return new Promise(function(resolve, reject) {
    t.delete(function(err, res, traversal) {
      /* istanbul ignore if */
      if (err) {
        return reject(err);
      }
      return resolve([res, traversal]);
    });
  });
};

util.superagentEndP = function(r) {
  return new Promise(function(resolve, reject) {
    r.end(function(err, res) {
      /* istanbul ignore if */
      if (err) {
        return reject(err)
      }
      return resolve(res);
    });
  });
};

util.errorHandler = function(err) {
  if (util._dm.hasOwnProperty('errorHandler') && util._dm.errorHandler) {
    util._dm.errorHandler(err);
  }
  return Promise.reject(err);
};

module.exports = util;
