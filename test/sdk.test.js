'use strict';

var isNode = typeof process !== 'undefined';

if (isNode) { // require only in node, frontend knows things. ;)
  var chai                    = require('chai') // main testing lib
    , expect                  = chai.expect
    , traverson               = require('traverson')
    , TraversonJsonHalAdapter = require('traverson-hal')

    , DataManager             = require('../lib/DataManager.js')

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

describe('model', function() {
  var dm;
  beforeEach(function() {
    dm = new DataManager({
      url: baseUrl + '58b9a1f5'
    });
  });
  afterEach(function() {
    dm = null;
  });
  it('datamanager with 2 models', function() {
    return dm.modelList().then(function(models) {
      expect(models).to.be.ok;
      expect(models).to.be.instanceOf(Object);
      expect(models).to.have.property('to-do-list');
      expect(models).to.have.property('to-do-item');
    });
  });
  it('model resolve', function() {
    var model = dm.model('to-do-list');
    expect(model).to.be.ok;
    expect(model).to.have.property('metadata');
    expect(model.metadata).to.be.undefined;
    return model.resolve().then(function(model) {
      expect(model).to.be.ok;
      expect(model).to.have.property('metadata');
      expect(model.metadata).to.have.property('title', 'to-do-list');
      expect(model.metadata).to.have.property('titleField', 'title');
      expect(model.metadata).to.have.property('hexColor', '#d23738');
    })
  });
  it('datamanager with 1 model', function() {
    var dmSingle = new DataManager({
      url: baseUrl + '3d52509f'
    });
    return dmSingle.modelList().then(function(models) {
      expect(models).to.be.ok;
      expect(models).to.be.instanceOf(Object);
      expect(models).to.have.property('single');
    });
  });
  it('datamanager with 0 models', function() {
    var dmNone = new DataManager({
      url: baseUrl + 'aa3b242e'
    });
    return dmNone.modelList().then(function(models) {
      expect(models).to.be.ok;
      expect(models).to.be.instanceOf(Object);
      expect(models).to.be.empty;
    });
  });
  it('get schema', function() {
    return dm.model('to-do-list').getSchema().then(function(schema) {
      expect(schema).to.be.ok;
      expect(schema).to.have.property('id', baseUrl + 'schema/58b9a1f5/to-do-item');
      expect(schema).to.have.property('type', 'object');
    });
  });
  it('get schema with method', function() {
    return dm.model('to-do-list').getSchema('get').then(function(schema) {
      expect(schema).to.be.ok;
      expect(schema).to.have.property('id', baseUrl + 'schema/58b9a1f5/to-do-item');
      expect(schema).to.have.property('type', 'object');
    });
  });
  it('put schema', function() {
    return dm.model('to-do-list').getSchema('put').then(function(schema) {
      expect(schema).to.be.ok;
      expect(schema).to.have.property('id', baseUrl + 'schema/58b9a1f5/to-do-item?template=put');
      expect(schema).to.have.property('type', 'object');
    });
  });
  it('post schema', function() {
    return dm.model('to-do-list').getSchema('post').then(function(schema) {
      expect(schema).to.be.ok;
      expect(schema).to.have.property('id', baseUrl + 'schema/58b9a1f5/to-do-item?template=post');
      expect(schema).to.have.property('type', 'object');
    });
  });
});

describe('entry/entries', function() { // this is basically modelList
  var dm;
  beforeEach(function() {
    dm = new DataManager({
      url: baseUrl + '58b9a1f5'
    });
  });
  afterEach(function() {
    dm = null;
  });
  it('get entries, list single item', function() {
    return dm.model('to-do-list').entries({
      filter: {
        exact: {
          title: 'Beef'
        }
      }
    }).then(function(entries) {
      expect(entries).to.be.ok;
      expect(entries).to.be.instanceOf(Array);
      expect(entries.length).to.be.equal(1);
    });
  });
  it('get entries, list multiple item', function() {
    return dm.model('to-do-item').entries().then(function(entries) {
      expect(entries).to.be.ok;
      expect(entries).to.be.instanceOf(Array);
      expect(entries.length).to.be.at.least(4);
    });
  });
  it('get single entry', function() {
    return dm.model('to-do-item').entry('VkGhAPQ2Qe').then(function(entry) {
      expect(entry).to.be.ok;
      expect(entry).to.be.instanceOf(Object);
      expect(entry).to.have.property('value');
      expect(entry.value).to.have.property('_id', 'VkGhAPQ2Qe');
    });
  });
  it('list: get entries, list single item', function() {
    return dm.model('to-do-list').entryList({
      filter: {
        exact: {
          title: 'Beef'
        }
      }
    }).then(function(list) {
      expect(list).to.be.ok;
      expect(list).to.be.instanceOf(Object);
      expect(list).to.have.property('entries');
      expect(list.entries).to.be.instanceOf(Array);
      expect(list.entries.length).to.be.equal(1);
      expect(list).to.have.property('count', 1);
      expect(list).to.have.property('total', 1);
    });
  });
  it('get entries, list multiple item', function() {
    return dm.model('to-do-item').entryList().then(function(list) {
      expect(list).to.be.ok;
      expect(list).to.be.instanceOf(Object);
      expect(list).to.have.property('entries');
      expect(list.entries.length).to.be.at.least(4);
      expect(list).to.have.property('count')
        .that.is.at.least(4);
      expect(list).to.have.property('total')
        .that.is.at.least(4);
    });
  });
  it('create entry', function() {
    return dm.model('to-do-item').createEntry({
      title: 'NewItem',
      description: '<p>A New Item.</p>'
    }).then(function(entry) {
      expect(entry).to.be.ok;
      expect(entry).to.be.instanceOf(Object);
      expect(entry).to.have.property('value')
        .that.is.instanceOf(Object);
      expect(entry.value).to.have.property('_id', 'N1GJuenPEl');
      expect(entry.value).to.have.property('title', 'NewItem');
      expect(entry.value).to.have.property('description', '<p>A New Item.</p>');
    });
  });
  it('create entry fail', function() {
    return dm.model('to-do-item').createEntry({
      description: 'But No Title.'
    }).then(function(result) {
      throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
    }, function(err) {
      expect(err).to.be.ok;
      expect(err).to.have.property('status', 400);
      expect(err).to.have.property('code', 2201);
    });
  });
  it('delete entry', function() {
    return dm.model('to-do-item').deleteEntry('N1GJuenPEl').then(function(deleted) {
      expect(deleted).to.be.true;
    });
  });
  it('put entry', function() {
    return dm.model('to-do-item').entry('N1GJuenPEl').then(function(entry) {
      entry.value.description = '<p>New Description.</p>';
      return entry.save();
    }).then(function(entry) {
      expect(entry).to.be.ok;
      expect(entry).to.have.property('value');
      expect(entry.value).to.have.property('_id', 'N1GJuenPEl');
      expect(entry.value).to.have.property('description', '<p>New Description.</p>');
    });
  });
});
