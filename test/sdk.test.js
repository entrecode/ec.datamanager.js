'use strict';

var isNode = typeof process !== 'undefined';

if (isNode) { // require only in node, frontend knows things. ;)
  var chai                    = require('chai') // main testing lib
    , expect                  = chai.expect
    , traverson               = require('traverson')
    , TraversonJsonHalAdapter = require('traverson-hal')

    , DataManager             = require('../lib/DataManager.js');

  ;

  var baseUrl = 'https://datamanager.entrecode.de/api/';
} else {
  var baseUrl = 'http://localhost:54815/datamanager/api/';
}
traverson.registerMediaType(TraversonJsonHalAdapter.mediaType, TraversonJsonHalAdapter);

describe('basic check of testing library', function() {
  it('assert that JavaScript is still a little crazy', function() {
    expect([] + []).to.equal('');
  });
});

describe('tests for working mocks', function() {
  it('should reach root', function(done) {
    traverson.from(baseUrl + '58b9a1f5')
      .jsonHal()
      .getResource(function(err, res, traversal) {
        expect(err).to.be.not.ok;
        expect(res).to.be.ok;
        expect(res).to.have.property('dataManagerID');
        expect(res).to.have.property('_links');
        expect(res).to.have.property('_embedded');
        done();
      });
  });
  it('should reach root again', function(done) {
    traverson.from(baseUrl + '58b9a1f5')
      .jsonHal()
      .getResource(function(err, res, traversal) {
        expect(err).to.be.not.ok;
        expect(res).to.be.ok;
        expect(res).to.have.property('dataManagerID');
        expect(res).to.have.property('_links');
        expect(res).to.have.property('_embedded');
        done();
      });
  });
  it('should get list', function(done) {
    traverson.from(baseUrl + '58b9a1f5')
      .jsonHal()
      .follow('58b9a1f5:to-do-list')
      .getResource(function(err, res, traversal) {
        expect(err).to.be.not.ok;
        expect(res).to.be.ok;
        expect(res).to.have.property('count');
        expect(res).to.have.property('total');
        expect(res).to.have.property('_links');
        expect(res).to.have.property('_embedded');
        done();
      });
  });
  it('should get single item', function(done) {
    traverson.from(baseUrl + '58b9a1f5')
      .jsonHal()
      .follow('58b9a1f5:to-do-list')
      .follow('58b9a1f5:to-do-list/options')
      .withTemplateParameters({_id: '4JMjeO737e'})
      .getResource(function(err, res, traversal) {
        expect(err).to.be.not.ok;
        expect(res).to.be.ok;
        expect(res).to.have.property('_created');
        expect(res).to.have.property('_creator');
        expect(res).to.have.property('_id');
        expect(res).to.have.property('_modified');
        expect(res).to.have.property('title');
        expect(res).to.have.property('description');
        expect(res).to.have.property('list-items');
        expect(res).to.have.property('_links');
        done();
      });
  });
});

describe('datamanager constructor', function() {
  it('create datamanger instance from url', function(done) {
    var dm = new DataManager({
      url: 'https://datamanager.entrecode.de/api/58b9a1f5/'
    });
    expect(dm).to.be.instanceOf(DataManager);
    expect(dm).to.have.property('url', 'https://datamanager.entrecode.de/api/58b9a1f5');
    return done();
  });
  it('create datamanger instance from url without trailing slash', function(done) {
    var dm = new DataManager({
      url: 'https://datamanager.entrecode.de/api/58b9a1f5'
    });
    expect(dm).to.be.instanceOf(DataManager);
    expect(dm).to.have.property('url', 'https://datamanager.entrecode.de/api/58b9a1f5');
    return done();
  });
  it('create datamanager instance from url and accessToken', function(done) {
    var dm = new DataManager({
      url: 'https://datamanager.entrecode.de/api/58b9a1f5/',
      accessToken: 'test'
    });
    expect(dm).to.be.instanceOf(DataManager);
    expect(dm).to.have.property('url', 'https://datamanager.entrecode.de/api/58b9a1f5');
    expect(dm).to.have.property('id', '58b9a1f5');
    expect(dm).to.have.property('token', 'test');
    expect(dm).to.have.property('accessToken', 'test');
    return done();
  });
  it('create datamanager instance from url and token', function(done) {
    var dm = new DataManager({
      url: 'https://datamanager.entrecode.de/api/58b9a1f5',
      token: 'test'
    });
    expect(dm).to.be.instanceOf(DataManager);
    expect(dm).to.have.property('url', 'https://datamanager.entrecode.de/api/58b9a1f5');
    expect(dm).to.have.property('id', '58b9a1f5');
    expect(dm).to.have.property('token', 'test');
    return done();
  });
  it('create datamanger instance from id', function(done) {
    var dm = new DataManager({
      id: '58b9a1f5'
    });
    expect(dm).to.be.instanceOf(DataManager);
    expect(dm).to.have.property('url', 'https://datamanager.entrecode.de/api/58b9a1f5');
    return done();
  });
  it('create datamanager instance from id and accessToken', function(done) {
    var dm = new DataManager({
      id: '58b9a1f5',
      accessToken: 'test'
    });
    expect(dm).to.be.instanceOf(DataManager);
    expect(dm).to.have.property('url', 'https://datamanager.entrecode.de/api/58b9a1f5');
    expect(dm).to.have.property('id', '58b9a1f5');
    expect(dm).to.have.property('token', 'test');
    expect(dm).to.have.property('accessToken', 'test');
    return done();
  });
  it('create datamanager instance from id and token', function(done) {
    var dm = new DataManager({
      id: '58b9a1f5',
      token: 'test'
    });
    expect(dm).to.be.instanceOf(DataManager);
    expect(dm).to.have.property('url', 'https://datamanager.entrecode.de/api/58b9a1f5');
    expect(dm).to.have.property('id', '58b9a1f5');
    expect(dm).to.have.property('token', 'test');
    return done();
  });
  it('fails if illegal url is given', function(done) {
    expect(function() {
      new DataManager({
        url: 'https://anything.entrecode.de'
      });
    }).to.throw(Error);
    return done();
  });
  it('fails if illegal id is given', function(done) {
    expect(function() {
      new DataManager({
        id: 'notAID'
      });
    }).to.throw(Error);
    return done();
  });
});

