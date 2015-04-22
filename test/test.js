'use strict';

var chai        = require('chai') // main testing lib
  , sinon       = require('sinon') // for spies
  , sinonChai   = require('sinon-chai') // chai assertions for sinon spies
  , expect      = chai.expect
  ;

chai.use(sinonChai);

describe('Mocha', function() {
  describe('basic check of testing library', function() {
    it('assert that JavaScript is still a little crazy', function() {
      expect([] + []).to.equal('');
    });
  });
});

var dataManager, api;
describe('get entries', function() {
  before(function() { // before hook – loads libraries to be tested
    api         = require('../lib/api.js'); // API connector to spy at
    var DataManager = require('../lib/DataManager.js') // DM Class
    dataManager = new DataManager({
      url: '/api/f84710b8/',
      accessToken: 'e63dca99-6a56-43a5-8864-1a63ee8565e7'
    });
    sinon.spy(api, 'get'); // registers a spy for api.get(…)
  });
  it('api called with correct arguments', function(done) { // check that API connector is correctly called
    dataManager.model('to-do-item').entries();
    expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', { Authorization: "Bearer e63dca99-6a56-43a5-8864-1a63ee8565e7" });
    done();
  });
  it('api responds correctly', function(done) { // check that correct result is output (from mock)
    dataManager.model('to-do-item').entries().then(function(data) {
      expect(data).to.have.property('count', 2);
      done();
    }, function(error) {
      done(error);
    });
  });
});