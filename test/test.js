'use strict';

var chai = require('chai') // main testing lib
  , chaiAsPromised = require('chai-as-promised')
  , sinon = require('sinon') // for spies
  , sinonChai = require('sinon-chai') // chai assertions for sinon spies
  , expect = chai.expect
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
    sinon.spy(api, 'post'); // registers a spy for api.post(…)
    sinon.spy(api, 'delete'); // registers a spy for api.delete(…)

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
    it('retrieves accessToken if not sent', function() {
      var instance = new DataManager({
        url: '/api/f84710b8/'
      });
      expect(instance).to.have.property('accessToken');
      return expect(instance.accessToken).to.eventually.match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
    });
  });

  describe('model/entry functions', function() {
    beforeEach(function() {
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
      it('fail if unknown method', function(done) {
        expect(function() {
          dataManager.model('to-do-item').getSchema('patch');
        }).to.throw(Error);
        done();
      })
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
      describe('with options', function() {
        it('size and page', function(done) {
          dataManager.model('to-do-item').entries({
            size: 5,
            page: 3
          });
          expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer test"}, {
            size: 5,
            page: 3
          });
          done();
        });
        it('sort', function(done) {
          dataManager.model('to-do-item').entries({
            sort: [
              'propertyAsc',
              '-propertyDesc',
              '+propertyExplAsc'
            ]
          });
          expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer test"}, {sort: 'propertyAsc,-propertyDesc,+propertyExplAsc'});
          done();
        });
        it('filter', function(done) {
          dataManager.model('to-do-item').entries({
            filter: {
              key1: {
                exact: 'key1exact'
              },
              key2: {
                search: 'key2search'
              },
              key3: {
                from: 3,
                to: 5
              },
              key4: {
                any: [
                  'either',
                  'or'
                ]
              },
              key5: {
                all: [
                  'this',
                  'and_this'
                ]
              }
            }
          });
          expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer test"}, {
            key1: 'key1exact',
            'key2~': 'key2search',
            key3From: 3,
            key3To: 5,
            key4: 'either,or',
            key5: 'this+and_this'
          });
          done();
        });
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
    describe('create entry', function() {
      var object = {'todo-text': 'my new item', done: false};
      it('api called with correct arguments', function(done) { // check that API connector is correctly called
        dataManager.model('to-do-item').createEntry(object);
        expect(api.post).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer test"}, {}, object);
        done();
      });
      it('api responds correctly', function() { // check that correct result is output (from mock)
        return expect(dataManager.model('to-do-item').createEntry(object))
          .to.eventually.have.deep.property('value.todo-text', 'my new item');
      });
    });
    describe('delete entry', function() {
      it('after getting entry', function(done) { // check that API connector is correctly called
        dataManager.model('to-do-item').entry('my7fmeXh').then(function(entry) {
          return entry.delete();
        }).then(function() {
          process.nextTick(function() {
            expect(api.delete).to.have.been.calledWith('/api/f84710b8/to-do-item?id=my7fmeXh', {Authorization: "Bearer test"});
            done();
          });
        }, function(error) {
          done(error);
        });
      });
      it('directly', function(done) { // check that API connector is correctly called
        dataManager.model('to-do-item').deleteEntry('my7fmeXh');
        expect(api.delete).to.have.been.calledWith('/api/f84710b8/to-do-item?id=my7fmeXh', {Authorization: "Bearer test"});
        done();
      });
    });
    describe('register new anonymous user', function() {
      it('api called with correct arguments', function(done) { // check that API connector is correctly called
        dataManager.register();
        expect(api.post).to.have.been.calledWith('/api/f84710b8/user');
        done();
      });
      it('api responds correctly', function() { // check that correct result is output (from mock)
        return expect(dataManager.register())
          .to.eventually.have.deep.property('value.temporaryToken');
      });
    });
    describe('get and set data manager token', function() {
      it('reading out token', function(done) {
        var token = dataManager.accessToken;
        expect(token).to.equal('test');
        done();
      });
      it('setting token', function(done) {
        dataManager.accessToken = 'newToken';
        dataManager.model('to-do-item').entry('my7fmeXh');
        expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer newToken"}, {id: 'my7fmeXh'});
        done();
      });
      it('getting new token and saving it', function() {
        return dataManager.register().then(function(user) {
          dataManager.accessToken = user.value.temporaryToken;
          dataManager.model('to-do-item').entry('my7fmeXh');
          return expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer " + user.value.temporaryToken}, {id: 'my7fmeXh'});
        });
      });
    });
    describe('dataManager.user() shorthand', function() {
      it('api called with correct arguments', function(done) { // check that API connector is correctly called
        dataManager.user('my7fmeXh').then(function(user) {
          return user.save();
        }).then(function() {
          process.nextTick(function() {
            expect(api.put).to.have.been.calledWith('/api/f84710b8/user?id=my7fmeXh', {Authorization: "Bearer test"});
            done();
          });
        }, function(error) {
          done(error);
        });
      });
    });
  });
});
