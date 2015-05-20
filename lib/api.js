'use strict';

/* wrapper for HTTP Requests around axios */

var axios = require('axios');

/* pulls out the data of the response */
axios.interceptors.response.use(function(response) {
  // Do something with response data
  return response.data;
}, function(error) {
  // Do something with response error
  return Promise.reject(error);
});

// generic call function that requires a method parameter
function call(method, url, headers, querystring, body, responseMiddleware) {
  if (!responseMiddleware) {
    responseMiddleware = function(data) {
      return data;
    };
  }
  return axios({
    url: url,
    method: method,
    headers: headers,
    params: querystring,
    data: body,
    transformResponse: [responseMiddleware]
  })/*.catch(function(error) {
   /* if (error.status < 400 && error.headers.hasOwnProperty('location')) {
      return Promise.reject(error.headers.location);
    }
    return Promise.reject(error);

  })*/;
}

// exposed interface
var api = {

  call: call,

  get: function(url, headers, querystring, responseMiddleware) {
    return this.call('get', url, headers, querystring, null, responseMiddleware);
  },

  put: function(url, headers, querystring, body, responseMiddleware) {
    return this.call('put', url, headers, querystring, body, responseMiddleware);
  },

  post: function(url, headers, querystring, body, responseMiddleware) {
    return this.call('post', url, headers, querystring, body, responseMiddleware);
  },

  delete: function(url, headers, querystring, responseMiddleware) {
    return this.call('delete', url, headers, querystring, null, responseMiddleware);
  }
};

module.exports = api;