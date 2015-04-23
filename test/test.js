'use strict';

var chai           = require('chai') // main testing lib
  , chaiAsPromised = require('chai-as-promised')
  , sinon          = require('sinon') // for spies
  , sinonChai      = require('sinon-chai') // chai assertions for sinon spies
  , expect         = chai.expect
  ;

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('Mocha', function() {
  describe('basic check of testing library', function() {
    it('assert that JavaScript is still a little crazy', function() {
      expect([] + []).to.equal('');
    });
  });
});

var DataManager, dataManager, api;
describe('DataManager SDK', function() {
  before(function() { // before hook – loads libraries to be tested
    api = require('../lib/api.js'); // API connector to spy at
    DataManager = require('../lib/DataManager.js') // DM Class
    sinon.spy(api, 'get'); // registers a spy for api.get(…)
    sinon.spy(api, 'put'); // registers a spy for api.put(…)

  });
  describe('datamanager constructor', function() {
    it('returns DataManager instance', function(done) {
      var instance = new DataManager({
        url: 'test',
        accessToken: 'test'
      });
      expect(instance).to.be.instanceOf(DataManager);
      expect(instance).to.have.property('url', 'test/');
      expect(instance).to.have.property('accessToken', 'test');
      done();
    });
    it('interpolates URL from given id', function(done) {
      var instance = new DataManager({
        id: 'test',
        accessToken: 'test'
      });
      expect(instance).to.have.property('url', 'https://datamanager.entrecode.de/api/test/');
      done();
    });
    it('extracts ID from given url', function(done) {
      var instance = new DataManager({
        url: 'https://datamanager.entrecode.de/api/0123/',
        accessToken: 'test'
      });
      expect(instance).to.have.property('id', '0123');
      done();
    });
    it('fails if neither url nor id is given', function(done) {
      expect(function() {
        new DataManager({})
      }).to.throw(Error);
      done();
    });
    it.skip('retrieves accessToken if not sent', function(done) {
      var instance = new DataManager({
        url: 'https://datamanager.entrecode.de/api/0123/'
      });
      expect(instance).to.have.property('accessToken');
      done();
    });
  });

  describe('model/entry functions', function() {
    before(function() {
      dataManager = new DataManager({
        url: '/api/f84710b8/',
        accessToken: 'test'
      });
    });
    describe('list models', function() {
      it('api called with correct arguments', function(done) {
        dataManager.modelList();
        expect(api.get).to.have.been.calledWith('/api/f84710b8/', {Authorization: "Bearer test"});
        done();
      });
      it('api responds correctly', function() { // check that correct result is output (from mock)
        return expect(dataManager.modelList())
          .to.eventually.have.all.keys('to-do-item', 'user');
      });
    });
    describe('get schema', function() {
      describe('default (get)', function() {
        it('api called with correct arguments', function(done) {
          dataManager.model('to-do-item').getSchema();
          expect(api.get).to.have.been.calledWith('/api/schema/f84710b8/to-do-item');
          done();
        });
        it('api responds correctly', function() { // check that correct result is output (from mock)
          return expect(dataManager.model('to-do-item').getSchema())
            .to.eventually.have.property('id', 'https://datamanager.entrecode.de/api/schema/f84710b8/to-do-item');
        });
      });
      describe('post', function() {
        it('api called with correct arguments', function(done) {
          dataManager.model('to-do-item').getSchema('post');
          expect(api.get).to.have.been.calledWith('/api/schema/f84710b8/to-do-item', {}, {template: 'post'});
          done();
        });
        it('api responds correctly', function() { // check that correct result is output (from mock)
          return expect(dataManager.model('to-do-item').getSchema('post'))
            .to.eventually.have.property('id', 'https://datamanager.entrecode.de/api/schema/f84710b8/to-do-item?template=post');
        });
      });
    });
    describe('get entries', function() {
      it('api called with correct arguments', function(done) { // check that API connector is correctly called
        dataManager.model('to-do-item').entries();
        expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer test"});
        done();
      });
      it('api responds correctly', function() { // check that correct result is output (from mock)
        return expect(dataManager.model('to-do-item').entries())
          .to.eventually.have.deep.property('0.value.id', 'm1yUQlm2');
      });
    });
    describe('get entry', function() {
      it('api called with correct arguments', function(done) { // check that API connector is correctly called
        dataManager.model('to-do-item').entry('my7fmeXh');
        expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer test"}, {id: 'my7fmeXh'});
        done();
      });
      it('api responds correctly', function() { // check that correct result is output (from mock)
        return expect(dataManager.model('to-do-item').entry('my7fmeXh'))
          .to.eventually.have.deep.property('value.id', 'my7fmeXh');
      });
    });
    describe('save entry', function() {
      this.timeout(5000);
      it('api called with correct arguments', function(done) { // check that API connector is correctly called
        var theEntry;
        dataManager.model('to-do-item').entry('my7fmeXh').then(function(entry) {
          theEntry = entry;
          return entry.save();
        }).then(function() {
          process.nextTick(function() {
            expect(api.put).to.have.been.calledWith('/api/f84710b8/to-do-item?id=my7fmeXh', {Authorization: "Bearer test"}, null, theEntry.value);
            done();
          });
        }, function(error) {
          done(error);
        });
      });
    });
  });
});
