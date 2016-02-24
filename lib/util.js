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
        if (value.hasOwnProperty('any') && Array.isArray(value.any)) {
          query[key] = value.any.join(',');
        }
        /* istanbul ignore next */
        if (value.hasOwnProperty('all') && Array.isArray(value.all)) {
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
    for (var key in options.filter) {
      /* istanbul ignore else */
      if (options.filter.hasOwnProperty(key)) {
        var value = options.filter[key];
        var filter = {};
        if (value.hasOwnProperty('exact')) {
          filter[key] = value.exact;
        }
        if (value.hasOwnProperty('search')) {
          filter[key] = { '$contains': value.search };
        }
        if (value.hasOwnProperty('from')) {
          filter[key] = { '$gte': value.from };
        }
        if (value.hasOwnProperty('to')) {
          filter[key] = { '$lte': value.to };
        }
        /* istanbul ignore next */
        /*
         if (value.hasOwnProperty('any') && Array.isArray(value.any)) {
         query[key] = value.any.join(',');
         }
         */
        /* istanbul ignore next */
        /*
         if (value.hasOwnProperty('all') && Array.isArray(value.all)) {
         query[key] = value.all.join('+');
         }
         */
        chain = chain.find(filter);
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
  if (options && options.hasOwnProperty('size')) {
    chain = chain.limit(options.size);
  }
  if (options && options.hasOwnProperty('page')) {
    chain = chain.offset(options.page * options.size || 10);
  }
  out.elements = chain.data();
  out.count = out.elements.length;
  return Promise.resolve(out);
};

util.checkResponse = function(err, res) {
  var ctx = this;
  return new Promise(function(resolve, reject) {
    if (err) {
      if (ctx._dm.hasOwnProperty('errorHandler') && ctx._dm.errorHandler) {
        ctx._dm.errorHandler(err);
      }
      return reject(err);
    }
    if (res.statusCode >= 200 && res.statusCode <= 299) {
      return resolve(res);
    }
    return reject(JSON.parse(res.body));
  });
};

module.exports = util;
