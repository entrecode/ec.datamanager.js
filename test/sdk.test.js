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
  it('should reach root', function() {
    return traverson.from(baseUrl + '58b9a1f5')
      .jsonHal()
      .getResource(function(err, res, traversal) {
        expect(err).to.be.not.ok;
        expect(res).to.be.ok;
        expect(res).to.have.property('dataManagerID');
        expect(res).to.have.property('_links');
      });
  });
  it('should reach root again', function() {
    return traverson.from(baseUrl + '58b9a1f5')
      .jsonHal()
      .getResource(function(err, res, traversal) {
        expect(err).to.be.not.ok;
        expect(res).to.be.ok;
        expect(res).to.have.property('dataManagerID');
        expect(res).to.have.property('_links');
      });
  });
  it('should get list', function() {
    return traverson.from(baseUrl + '58b9a1f5')
      .jsonHal()
      .follow('58b9a1f5:to-do-list')
      .getResource(function(err, res, traversal) {
        expect(err).to.be.not.ok;
        expect(res).to.be.ok;
        expect(res).to.have.property('count');
        expect(res).to.have.property('total');
        expect(res).to.have.property('_links');
        expect(res).to.have.property('_embedded');
      });
  });
  it('should get single item', function() {
    return traverson.from(baseUrl + '58b9a1f5')
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
      });
  });
});

describe('datamanager constructor', function() {
  it('create datamanager from url', function(done) {
    var dm = new DataManager({
      url: 'https://datamanager.entrecode.de/api/58b9a1f5/'
    });
    expect(dm).to.be.instanceOf(DataManager);
    expect(dm).to.have.property('url', 'https://datamanager.entrecode.de/api/58b9a1f5');
    return done();
  });
  it('create datamanager from url without trailing slash', function(done) {
    var dm = new DataManager({
      url: 'https://datamanager.entrecode.de/api/58b9a1f5'
    });
    expect(dm).to.be.instanceOf(DataManager);
    expect(dm).to.have.property('url', 'https://datamanager.entrecode.de/api/58b9a1f5');
    return done();
  });
  it('create datamanager from url and accessToken', function(done) {
    var dm = new DataManager({
      url: 'https://datamanager.entrecode.de/api/58b9a1f5/',
      accessToken: 'test'
    });
    expect(dm).to.be.instanceOf(DataManager);
    expect(dm).to.have.property('url', 'https://datamanager.entrecode.de/api/58b9a1f5');
    expect(dm).to.have.property('id', '58b9a1f5');
    expect(dm).to.have.property('accessToken', 'test');
    return done();
  });
  it('create datamanager from id', function(done) {
    var dm = new DataManager({
      id: '58b9a1f5'
    });
    expect(dm).to.be.instanceOf(DataManager);
    expect(dm).to.have.property('url', 'https://datamanager.entrecode.de/api/58b9a1f5');
    return done();
  });
  it('create datamanager from id and accessToken', function(done) {
    var dm = new DataManager({
      id: '58b9a1f5',
      accessToken: 'test'
    });
    expect(dm).to.be.instanceOf(DataManager);
    expect(dm).to.have.property('url', 'https://datamanager.entrecode.de/api/58b9a1f5');
    expect(dm).to.have.property('id', '58b9a1f5');
    expect(dm).to.have.property('accessToken', 'test');
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

describe('static best file routes', function() {
  it('get file url', function() {
    return DataManager.getFileUrl('4920f5ac-eab9-400b-8e41-5a202488b249').then(function(url) {
      expect(url).to.be.ok;
      expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM.jpg');
    });
  });
  it('get file url with locale', function() {
    return DataManager.getFileUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 'de_DE').then(function(url) {
      expect(url).to.be.ok;
      expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM.jpg');
    });
  });
  it('get image url', function() {
    return DataManager.getImageUrl('4920f5ac-eab9-400b-8e41-5a202488b249').then(function(url) {
      expect(url).to.be.ok;
      expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM.jpg');
    });
  });
  it('get image url with size', function() {
    return DataManager.getImageUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 200).then(function(url) {
      expect(url).to.be.ok;
      expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM_256.jpg');
    });
  });
  it('get image url wit size and locale', function() {
    DataManager.getImageUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 200, 'de_DE').then(function(url) {
      expect(url).to.be.ok;
      expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM_256.jpg');
    });
  });
  it('get thumb url', function() {
    return DataManager.getImageThumbUrl('4920f5ac-eab9-400b-8e41-5a202488b249').then(function(url) {
      expect(url).to.be.ok;
      expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM_400_thumb.jpg');
    });
  });
  it('get thumb url with size', function() {
    return DataManager.getImageThumbUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 100).then(function(url) {
      expect(url).to.be.ok;
      expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM_100_thumb.jpg');
    });
  });
  it('get thumb url wit size and locale', function() {
    return DataManager.getImageThumbUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 100, 'de_DE').then(function(url) {
      expect(url).to.be.ok;
      expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM_100_thumb.jpg');
    });
  });
});

describe('best file routes', function() {
  var dm;
  before(function() {
    dm = new DataManager({
      url: baseUrl + '58b9a1f5'
    });
  });
  it('get file url', function() {
    return dm.getFileUrl('4920f5ac-eab9-400b-8e41-5a202488b249').then(function(url) {
      expect(url).to.be.ok;
      expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM.jpg');
    });
  });
  it('get file url with locale', function() {
    return dm.getFileUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 'de_DE').then(function(url) {
      expect(url).to.be.ok;
      expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM.jpg');
    });
  });
  it('get image url', function() {
    return dm.getImageUrl('4920f5ac-eab9-400b-8e41-5a202488b249').then(function(url) {
      expect(url).to.be.ok;
      expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM.jpg');
    });
  });
  it('get image url with size', function() {
    return dm.getImageUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 200).then(function(url) {
      expect(url).to.be.ok;
      expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM_256.jpg');
    });
  });
  it('get image url wit size and locale', function() {
    return dm.getImageUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 200, 'de_DE').then(function(url) {
      expect(url).to.be.ok;
      expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM_256.jpg');
    });
  });
  it('get thumb url', function() {
    return dm.getImageThumbUrl('4920f5ac-eab9-400b-8e41-5a202488b249').then(function(url) {
      expect(url).to.be.ok;
      expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM_400_thumb.jpg');
    });
  });
  it('get thumb url with size', function() {
    return dm.getImageThumbUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 100).then(function(url) {
      expect(url).to.be.ok;
      expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM_100_thumb.jpg');
    });
  });
  it('get thumb url with size and locale', function() {
    return dm.getImageThumbUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 100, 'de_DE').then(function(url) {
      expect(url).to.be.ok;
      expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM_100_thumb.jpg');
    });
  });
});
