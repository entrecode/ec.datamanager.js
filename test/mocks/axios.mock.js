'use strict';

var es6Promise = require('es6-promise') // use the same promise lib as axios
  , request    = require('supertest-as-promised')(es6Promise.Promise) // allows sending request to a not-listed express server, supporting promises
  , appcmsMock = require('ec.appcms-mock.js') // mock server
  ;

var axiosMock = function(axiosOptions) { // translates axios call to supertest call
  var req = request(appcmsMock.express)[axiosOptions.method]('/datamanager'+axiosOptions.url)
    .query(axiosOptions.params)
    .set(axiosOptions.headers || {})
    .send(axiosOptions.data)
    .then(function(result) {
      var data = axiosOptions.transformResponse[0](JSON.stringify(result.body));
      if (result.error) {
        throw result.error;
      }
      if (result.status === 302) {
        return es6Promise.Promise.reject(result);
      }
      return data;
    });
  return req;
};

axiosMock.interceptors = { // stub for setting interceptor (does nothing)
  response: {
    use: function(a, b) {
      a({data:null});
      b();
    }
  }
};

module.exports = axiosMock;