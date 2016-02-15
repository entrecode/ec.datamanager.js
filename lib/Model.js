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

Model.prototype._getTraversal = function() {
  var model = this;
  return new Promise(function(resolve, reject) {
    if (model._traversal) {
      return resolve(model._traversal);
    }
    if (model._dm._rootTraversal) {
      model._dm._rootTraversal.continue().newRequest()
      .withRequestOptions(util.requestOptions())
      .get(function(err, res, traversal) {
        util.checkResponse(err, res).then(function() {
          model._traversal = traversal;
          return resolve(traversal);
        }).catch(reject);
      });
    }

    traverson.from(model._dm.url).jsonHal()
    .withRequestOptions(util.requestOptions())
    .get(function(err, res, traversal) {
      util.checkResponse(err, res).then(function(res) {
        model._traversal = traversal;
        return resolve(traversal);
      }).catch(reject);
    });
  });
};

Model.prototype.resolve = function() {
  var model = this;
  return new Promise(function(resolve, reject) {
    traverson.from(model._dm.url).jsonHal()
    .withRequestOptions(util.requestOptions())
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
  return this._getTraversal().then(function(traversal) {
    return new Promise(function(resolve, reject) {
      var t = traversal.continue().newRequest()
      .follow(model._dm.id + ':' + model.title);
      if (options) {
        t.withTemplateParameters(util.optionsToQueryParameter(options));
      }
      t.withRequestOptions(util.requestOptions())
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
            for (var i in entries) {
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
  return new Promise(function(resolve, reject) {
    model.entryList(options).then(function(list) {
      return resolve(list.entries);
    }).catch(reject);
  });
};

Model.prototype.entry = function(id, levels) {
  var model = this;
  return this._getTraversal().then(function(traversal) {
    return new Promise(function(resolve, reject) {
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
      traversal.continue().newRequest()
      .follow(model._dm.id + ':' + model.title)
      .withTemplateParameters(util.optionsToQueryParameter(options))
      .withRequestOptions(util.requestOptions())
      .get(function(err, res, traversal) {
        util.checkResponse(err, res).then(function(res) {
          var body = halfred.parse(JSON.parse(res.body));
          if (body.hasOwnProperty('count') && body.hasOwnProperty('total')) {
            var entry = body.embeddedResource(model._dm.id + ':' + model.title);
            if (entry) {
              return resolve(new Entry(entry, model._dm, model));
            } else {
              return reject(new Error('ec_sdk_no_match_due_to_filter'));
            }
          }
          return resolve(new Entry(body, model._dm, model, traversal));
        }).catch(reject);
      });
    });
  });
};

Model.prototype.nestedEntry = function(id, levels) {
  var model = this;
  return new Promise(function(resolve, reject) {
    model.entry(id, levels).then(function(entry) {
      makeNestedToResource(entry, model._dm, model);
      resolve(entry);
    }).catch(reject);
  });
};

Model.prototype.createEntry = function(entry) {
  var model = this;
  return this._getTraversal().then(function(traversal) {
    return new Promise(function(resolve, reject) {
      traversal.continue().newRequest()
      .follow(model._dm.id + ':' + model.title)
      .withRequestOptions(util.requestOptions({
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
      .withRequestOptions(util.requestOptions())
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
