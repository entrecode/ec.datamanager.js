'use strict';

var mockery = require('mockery')
  , mocks   = {
      axios: require('./mocks/axios.mock')
    }
  ;

before(function() { // global before hook: swap axios for axios mock
  mockery.enable({
    warnOnUnregistered: false
  });
  mockery.registerMock('axios', mocks.axios);
});