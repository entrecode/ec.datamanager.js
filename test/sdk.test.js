'use strict';

var isNode = typeof process !== 'undefined';

if (isNode) { // require only in node, frontend knows things. ;)
  var chai = require('chai') // main testing lib
    , expect = chai.expect
    , fs = require('fs')
    , path = require('path')
    , traverson = require('traverson')
    , TraversonJsonHalAdapter = require('traverson-hal')
    , sinon = require('sinon')

    , DataManager = require('../lib/DataManager.js')
    , Model = require('../lib/Model.js')

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
    .withTemplateParameters({ _id: '4JMjeO737e' })
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
  it('from url', function(done) {
    var dm = new DataManager({
      url: 'https://datamanager.entrecode.de/api/58b9a1f5/'
    });
    expect(dm).to.be.instanceOf(DataManager);
    expect(dm).to.have.property('url', 'https://datamanager.entrecode.de/api/58b9a1f5');
    return done();
  });
  it('from url without trailing slash', function(done) {
    var dm = new DataManager({
      url: 'https://datamanager.entrecode.de/api/58b9a1f5'
    });
    expect(dm).to.be.instanceOf(DataManager);
    expect(dm).to.have.property('url', 'https://datamanager.entrecode.de/api/58b9a1f5');
    return done();
  });
  it('from url and accessToken', function(done) {
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
  it('from id', function(done) {
    var dm = new DataManager({
      id: '58b9a1f5'
    });
    expect(dm).to.be.instanceOf(DataManager);
    expect(dm).to.have.property('url', 'https://datamanager.entrecode.de/api/58b9a1f5');
    return done();
  });
  it('from id and accessToken', function(done) {
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
  it('from id and clientID', function(done) {
    var dm = new DataManager({
      id: '58b9a1f5',
      clientID: 'test'
    });
    expect(dm).to.be.instanceOf(DataManager);
    expect(dm).to.have.property('url', 'https://datamanager.entrecode.de/api/58b9a1f5');
    expect(dm).to.have.property('id', '58b9a1f5');
    expect(dm).to.have.property('clientID', 'test');
    return done();
  });
  it('from id with url null', function(done) {
    var dm = new DataManager({
      url: null,
      id: '58b9a1f5'
    });
    expect(dm).to.be.instanceOf(DataManager);
    expect(dm).to.have.property('url', 'https://datamanager.entrecode.de/api/58b9a1f5');
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
  it('fails if no id or url is given', function(done) {
    expect(function() {
      new DataManager({});
    }).to.throw(Error);
    return done();
  });
});

if (isNode) {
  // These test only run in node since we cannot change base url to frontend mocks.
  describe('static best file routes', function() {
    it('get file url', function() {
      return DataManager.getFileUrl('4920f5ac-eab9-400b-8e41-5a202488b249').then(function(url) {
        expect(url).to.be.ok;
        expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM.jpg');
      });
    });
    it('get file url with locale', function() {
      return DataManager.getFileUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 'de-DE').then(function(url) {
        expect(url).to.be.ok;
        expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM.jpg');
      });
    });
    it('get file url fail, no assetID', function() {
      return DataManager.getFileUrl().then(function(result) {
        throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
      }).catch(function(err) {
        expect(err).to.be.ok;
        expect(err).to.have.property('message', 'ec_sdk_no_assetid_provided');
      });
    });
    it('get file url fail, not found', function() {
      return DataManager.getFileUrl('eab1bfdf-2184-48c2-abfa-a69119a8acec').then(function(result) {
        throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
      }).catch(function(err) {
        expect(err).to.be.ok;
        expect(err).to.have.property('message', 'ec_sdk_could_not_get_url_for_file');
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
      DataManager.getImageUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 200, 'de-DE').then(function(url) {
        expect(url).to.be.ok;
        expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM_256.jpg');
      });
    });
    it('get image url fail, no assetID', function() {
      return DataManager.getImageUrl().then(function(result) {
        throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
      }).catch(function(err) {
        expect(err).to.be.ok;
        expect(err).to.have.property('message', 'ec_sdk_no_assetid_provided');
      });
    });
    it('get image url fail, not found', function() {
      return DataManager.getImageUrl('eab1bfdf-2184-48c2-abfa-a69119a8acec').then(function(result) {
        throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
      }).catch(function(err) {
        expect(err).to.be.ok;
        expect(err).to.have.property('message', 'ec_sdk_could_not_get_url_for_file');
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
    it('get thumb url with size', function() {
      return DataManager.getImageThumbUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 150).then(function(url) {
        expect(url).to.be.ok;
        expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM_200_thumb.jpg');
      });
    });
    it('get thumb url with size', function() {
      return DataManager.getImageThumbUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 50).then(function(url) {
        expect(url).to.be.ok;
        expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM_50_thumb.jpg');
      });
    });
    it('get thumb url with size and locale', function() {
      return DataManager.getImageThumbUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 100, 'de-DE').then(function(url) {
        expect(url).to.be.ok;
        expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM_100_thumb.jpg');
      });
    });
    it('get thumb url fail, no assetID', function() {
      return DataManager.getImageThumbUrl().then(function(result) {
        throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
      }).catch(function(err) {
        expect(err).to.be.ok;
        expect(err).to.have.property('message', 'ec_sdk_no_assetid_provided');
      });
    });
    it('get thumb url fail, not found', function() {
      return DataManager.getImageThumbUrl('eab1bfdf-2184-48c2-abfa-a69119a8acec').then(function(result) {
        throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
      }).catch(function(err) {
        expect(err).to.be.ok;
        expect(err).to.have.property('message', 'ec_sdk_could_not_get_url_for_file');
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
    it('get file url - server error', function() {
      return dm.getFileUrl('8b941ee5-3bb9-4911-b5b4-f1e0d558a3aa').then(function(result) {
        throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
      }).catch(function(err) {
        expect(err).to.be.ok;
        expect(err).to.have.property('title', 'Internal Server Error');
      });
    });
    it('get file url with locale', function() {
      return dm.getFileUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 'de-DE').then(function(url) {
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
    it('get image url - server error', function() {
      return dm.getImageUrl('8b941ee5-3bb9-4911-b5b4-f1e0d558a3aa').then(function(result) {
        throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
      }).catch(function(err) {
        expect(err).to.be.ok;
        expect(err).to.have.property('title', 'Internal Server Error');
      });
    });
    it('get image url with size', function() {
      return dm.getImageUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 200).then(function(url) {
        expect(url).to.be.ok;
        expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM_256.jpg');
      });
    });
    it('get image url wit size and locale', function() {
      return dm.getImageUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 200, 'de-DE').then(function(url) {
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
    it('get thumb url - server error', function() {
      return dm.getImageThumbUrl('8b941ee5-3bb9-4911-b5b4-f1e0d558a3aa').then(function(result) {
        throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
      }).catch(function(err) {
        expect(err).to.be.ok;
        expect(err).to.have.property('title', 'Internal Server Error');
      });
    });
    it('get thumb url with size', function() {
      return dm.getImageThumbUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 100).then(function(url) {
        expect(url).to.be.ok;
        expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM_100_thumb.jpg');
      });
    });
    it('get thumb url with size and locale', function() {
      return dm.getImageThumbUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 100, 'de-DE').then(function(url) {
        expect(url).to.be.ok;
        expect(url).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/BXf6iMdEd4MBBoAZAWTod5dM_100_thumb.jpg');
      });
    });
  });
}

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
  it('model resolve, then entries', function() {
    return dm.model('to-do-item').resolve().then(function(model) {
      return model.entries();
    }).then(function(entries) {
      expect(entries).to.be.ok;
      expect(entries).to.be.instanceOf(Array);
      expect(entries.length).to.be.at.least(4);
    });
  });
  it('model not found', function() {
    return dm.model('not-found').resolve().then(function(result) {
      throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
    }).catch(function(err) {
      expect(err).to.be.ok;
      expect(err).to.have.property('message', 'ec_sdk_model_not_found');
    });
  });
  it('model not found on entries', function() {
    return dm.model('not-found').entries().then(function(result) {
      throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
    }).catch(function(err) {
      expect(err).to.be.ok;
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
  it('invalid schema method', function() {
    return dm.model('to-do-list').getSchema('not-a-method').then(function(result) {
      throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
    }).catch(function(err) {
      expect(err).to.be.ok;
      expect(err).to.have.property('message', 'ec_sdk_invalid_method_for_schema');
    });
  });
});

if (isNode) {
  describe('offline model', function() {
    var dm;
    beforeEach(function() {
      dm = new DataManager({
        url: baseUrl + '58b9a1f5'
      });
    });
    afterEach(function() {
      dm = null;
    });
    it('make single model offline by dm', function() {
      return dm.enableCache('to-do-list').then(function(models) {
        expect(dm._cacheMetaData).to.be.a('object');
        expect(models[0]).to.be.a('object');
        expect(models[0].name).to.be.equal('to-do-list');
      });
    });
    it('make single model offline by model', function() {
      return dm.model('to-do-list').enableCache().then(function(model) {
        expect(dm._cacheMetaData).to.be.a('object');
        expect(model).to.be.a('object');
        expect(model.name).to.be.equal('to-do-list');
      });
    });
    it('make multiple models offline by dm', function() {
      return dm.enableCache([
        'to-do-list',
        'to-do-item'
      ]).then(function(models) {
        expect(models).to.be.a('array');
        expect(models.length).to.be.equal(2);
      }).catch();
    });
  });

  describe('cache data age: -1', function() {
    var dm;
    before(function(done) {
      dm = new DataManager({
        url: baseUrl + '58b9a1f5'
      });
      dm.enableCache([
        'to-do-item',
        'to-do-list'
      ], -1)
      .then(function() {
        done();
      })
      .catch(done);
    });
    after(function(done) {
      dm = null;
      fs.unlink(path.resolve(__dirname, '..', '58b9a1f5.db.json'), done);
    });
    it('entries, no cacheType', function() {
      return dm.model('to-do-list').entries()
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
      });
    });
    it('entries, cacheType default', function() {
      return dm.model('to-do-list').entries({ cacheType: 'default' })
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
      });
    });
    it('entries, cacheType refresh', function() {
      return dm.model('to-do-list').entries({ cacheType: 'refresh' })
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
      });
    });
    it('entryList, cacheType stale', function() {
      return dm.model('to-do-list').entryList({ cacheType: 'stale' })
      .then(function(list) {
        expect(list.entries.length).to.be.equal(2);
        expect(list).to.have.property('refreshedData');
        return list.refreshedData.then(function(list2) {
          expect(list2.entries.length).to.be.equal(2);
        });
      });
    });
    it('entries, cacheType stale', function() {
      return dm.model('to-do-list').entries({ cacheType: 'stale' })
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
      });
    });
    it('entries, filter exact', function() {
      return dm.model('to-do-list').entries({
        filter: {
          _id: {
            exact: 'V1EXdcJHl'
          }
        }
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(1);
        expect(entries[0]).to.have.property('_id', 'V1EXdcJHl');
      });
    });
    it('entries, filter search', function() {
      return dm.model('to-do-list').entries({
        filter: {
          title: {
            search: 'Single'
          }
        }
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(1);
        expect(entries[0]).to.have.property('title', 'Single Item List');
      });
    });
    it('entries, filter from', function() {
      return dm.model('to-do-list').entries({
        filter: {
          _created: {
            from: '2015-12-08T09:55:15.000Z'
          }
        }
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(1);
        expect(entries[0]).to.have.property('_created', '2015-12-08T09:55:15.171Z');
      });
    });
    it('entries, filter to', function() {
      return dm.model('to-do-list').entries({
        filter: {
          _created: {
            to: '2015-12-08T09:55:15.000Z'
          }
        }
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(1);
        expect(entries[0]).to.have.property('_created', '2015-11-23T16:03:38.304Z');
      });
    });
    it('entries, sort -', function() {
      return dm.model('to-do-list').entries({
        sort: [
          '-created'
        ]
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
        expect(entries[0]).to.have.property('_created', '2015-12-08T09:55:15.171Z');
        expect(entries[1]).to.have.property('_created', '2015-11-23T16:03:38.304Z');
      });
    });
    it('entries, sort implicit +', function() {
      return dm.model('to-do-list').entries({
        sort: [
          'created'
        ]
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
        expect(entries[0]).to.have.property('_created', '2015-11-23T16:03:38.304Z');
        expect(entries[1]).to.have.property('_created', '2015-12-08T09:55:15.171Z');
      });
    });
    it('entries, sort +', function() {
      return dm.model('to-do-list').entries({
        sort: [
          '+created'
        ]
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
        expect(entries[0]).to.have.property('_created', '2015-11-23T16:03:38.304Z');
        expect(entries[1]).to.have.property('_created', '2015-12-08T09:55:15.171Z');
      });
    });
    it('entries, size & page 1', function() { // TODO
      return dm.model('to-do-item').entries({
        size: 3,
        page: 1
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(3);
        expect(entries[0]._id).to.be.equal('4kt6UzOGBl');
        expect(entries[1]._id).to.be.equal('41zp8Guzrx');
        expect(entries[2]._id).to.be.equal('N1GJuenPEl');
      });
    });
    it('entries, size & page 2', function() { // TODO
      return dm.model('to-do-item').entries({
        size: 3,
        page: 2
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(3);
        expect(entries[0]._id).to.be.equal('VkGhAPQ2Qe');
        expect(entries[1]._id).to.be.equal('4JGrCvm27e');
        expect(entries[2]._id).to.be.equal('V1G2TvQnXx');
      });
    });
    it('entries, size & page 3', function() { // TODO
      return dm.model('to-do-item').entries({
        size: 3,
        page: 3
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(1);
        expect(entries[0]._id).to.be.equal('VkM8aPQnQe');
      });
    });
    it('entries, page', function() { // TODO
      return dm.model('to-do-item').entries({
        page: 1
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(7);
      });
    });
  });
  describe('cache data age: 120000', function() {
    var dm;
    before(function(done) {
      dm = new DataManager({
        url: baseUrl + '58b9a1f5'
      });
      dm.enableCache([
        'to-do-item',
        'to-do-list'
      ], 120000)
      .then(function() {
        done();
      })
      .catch(done);
    });
    after(function(done) {
      dm = null;
      fs.unlink(path.resolve(__dirname, '..', '58b9a1f5.db.json'), done);
    });
    it('entries, no cacheType', function() {
      return dm.model('to-do-list').entries()
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
      });
    });
    it('entries, cacheType default', function() {
      return dm.model('to-do-list').entries({ cacheType: 'default' })
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
      });
    });
    it('entries, cacheType refresh', function() {
      return dm.model('to-do-list').entries({ cacheType: 'refresh' })
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
      });
    });
    it('entryList, cacheType stale', function() {
      return dm.model('to-do-list').entryList({ cacheType: 'stale' })
      .then(function(list) {
        expect(list.entries.length).to.be.equal(2);
        expect(list).to.have.property('refreshedData');
        return list.refreshedData.then(function(list2) {
          expect(list2.entries.length).to.be.equal(2);
        });
      });
    });
    it('entries, cacheType stale', function() {
      return dm.model('to-do-list').entries({ cacheType: 'stale' })
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
      });
    });
    it('entries, filter exact', function() {
      return dm.model('to-do-list').entries({
        filter: {
          _id: {
            exact: 'V1EXdcJHl'
          }
        }
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(1);
        expect(entries[0]).to.have.property('_id', 'V1EXdcJHl');
      });
    });
    it('entries, filter search', function() {
      return dm.model('to-do-list').entries({
        filter: {
          title: {
            search: 'Single'
          }
        }
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(1);
        expect(entries[0]).to.have.property('title', 'Single Item List');
      });
    });
    it('entries, filter from', function() {
      return dm.model('to-do-list').entries({
        filter: {
          _created: {
            from: '2015-12-08T09:55:15.000Z'
          }
        }
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(1);
        expect(entries[0]).to.have.property('_created', '2015-12-08T09:55:15.171Z');
      });
    });
    it('entries, filter to', function() {
      return dm.model('to-do-list').entries({
        filter: {
          _created: {
            to: '2015-12-08T09:55:15.000Z'
          }
        }
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(1);
        expect(entries[0]).to.have.property('_created', '2015-11-23T16:03:38.304Z');
      });
    });
    it('entries, sort -', function() {
      return dm.model('to-do-list').entries({
        sort: [
          '-created'
        ]
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
        expect(entries[0]).to.have.property('_created', '2015-12-08T09:55:15.171Z');
        expect(entries[1]).to.have.property('_created', '2015-11-23T16:03:38.304Z');
      });
    });
    it('entries, sort implicit +', function() {
      return dm.model('to-do-list').entries({
        sort: [
          'created'
        ]
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
        expect(entries[0]).to.have.property('_created', '2015-11-23T16:03:38.304Z');
        expect(entries[1]).to.have.property('_created', '2015-12-08T09:55:15.171Z');
      });
    });
    it('entries, sort +', function() {
      return dm.model('to-do-list').entries({
        sort: [
          '+created'
        ]
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
        expect(entries[0]).to.have.property('_created', '2015-11-23T16:03:38.304Z');
        expect(entries[1]).to.have.property('_created', '2015-12-08T09:55:15.171Z');
      });
    });
    it('entries, size & page 1', function() { // TODO
      return dm.model('to-do-item').entries({
        size: 3,
        page: 1
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(3);
        expect(entries[0]._id).to.be.equal('4kt6UzOGBl');
        expect(entries[1]._id).to.be.equal('41zp8Guzrx');
        expect(entries[2]._id).to.be.equal('N1GJuenPEl');
      });
    });
    it('entries, size & page 2', function() { // TODO
      return dm.model('to-do-item').entries({
        size: 3,
        page: 2
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(3);
        expect(entries[0]._id).to.be.equal('VkGhAPQ2Qe');
        expect(entries[1]._id).to.be.equal('4JGrCvm27e');
        expect(entries[2]._id).to.be.equal('V1G2TvQnXx');
      });
    });
    it('entries, size & page 3', function() { // TODO
      return dm.model('to-do-item').entries({
        size: 3,
        page: 3
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(1);
        expect(entries[0]._id).to.be.equal('VkM8aPQnQe');
      });
    });
    it('entries, page', function() { // TODO
      return dm.model('to-do-item').entries({
        page: 1
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(7);
      });
    });
  });
  describe('cache data age: undefined', function() {
    var dm;
    before(function(done) {
      dm = new DataManager({
        url: baseUrl + '58b9a1f5'
      });
      dm.enableCache([
        'to-do-item',
        'to-do-list'
      ])
      .then(function() {
        done();
      })
      .catch(done);
    });
    after(function(done) {
      dm = null;
      fs.unlink(path.resolve(__dirname, '..', '58b9a1f5.db.json'), done);
    });
    it('entries, no cacheType', function() {
      return dm.model('to-do-list').entries()
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
      });
    });
    it('entries, cacheType default', function() {
      return dm.model('to-do-list').entries({ cacheType: 'default' })
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
      });
    });
    it('entries, cacheType refresh', function() {
      return dm.model('to-do-list').entries({ cacheType: 'refresh' })
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
      });
    });
    it('entryList, cacheType stale', function() {
      return dm.model('to-do-list').entryList({ cacheType: 'stale' })
      .then(function(list) {
        expect(list.entries.length).to.be.equal(2);
        expect(list).to.have.property('refreshedData');
        return list.refreshedData.then(function(list2) {
          expect(list2.entries.length).to.be.equal(2);
        });
      });
    });
    it('entries, cacheType stale', function() {
      return dm.model('to-do-list').entries({ cacheType: 'stale' })
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
      });
    });
    it('entries, filter exact', function() {
      return dm.model('to-do-list').entries({
        filter: {
          _id: {
            exact: 'V1EXdcJHl'
          }
        }
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(1);
        expect(entries[0]).to.have.property('_id', 'V1EXdcJHl');
      });
    });
    it('entries, filter search', function() {
      return dm.model('to-do-list').entries({
        filter: {
          title: {
            search: 'Single'
          }
        }
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(1);
        expect(entries[0]).to.have.property('title', 'Single Item List');
      });
    });
    it('entries, filter from', function() {
      return dm.model('to-do-list').entries({
        filter: {
          _created: {
            from: '2015-12-08T09:55:15.000Z'
          }
        }
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(1);
        expect(entries[0]).to.have.property('_created', '2015-12-08T09:55:15.171Z');
      });
    });
    it('entries, filter to', function() {
      return dm.model('to-do-list').entries({
        filter: {
          _created: {
            to: '2015-12-08T09:55:15.000Z'
          }
        }
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(1);
        expect(entries[0]).to.have.property('_created', '2015-11-23T16:03:38.304Z');
      });
    });
    it('entries, sort -', function() {
      return dm.model('to-do-list').entries({
        sort: [
          '-created'
        ]
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
        expect(entries[0]).to.have.property('_created', '2015-12-08T09:55:15.171Z');
        expect(entries[1]).to.have.property('_created', '2015-11-23T16:03:38.304Z');
      });
    });
    it('entries, sort implicit +', function() {
      return dm.model('to-do-list').entries({
        sort: [
          'created'
        ]
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
        expect(entries[0]).to.have.property('_created', '2015-11-23T16:03:38.304Z');
        expect(entries[1]).to.have.property('_created', '2015-12-08T09:55:15.171Z');
      });
    });
    it('entries, sort +', function() {
      return dm.model('to-do-list').entries({
        sort: [
          '+created'
        ]
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
        expect(entries[0]).to.have.property('_created', '2015-11-23T16:03:38.304Z');
        expect(entries[1]).to.have.property('_created', '2015-12-08T09:55:15.171Z');
      });
    });
    it('entries, size & page 1', function() { // TODO
      return dm.model('to-do-item').entries({
        size: 3,
        page: 1
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(3);
        expect(entries[0]._id).to.be.equal('4kt6UzOGBl');
        expect(entries[1]._id).to.be.equal('41zp8Guzrx');
        expect(entries[2]._id).to.be.equal('N1GJuenPEl');
      });
    });
    it('entries, size & page 2', function() { // TODO
      return dm.model('to-do-item').entries({
        size: 3,
        page: 2
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(3);
        expect(entries[0]._id).to.be.equal('VkGhAPQ2Qe');
        expect(entries[1]._id).to.be.equal('4JGrCvm27e');
        expect(entries[2]._id).to.be.equal('V1G2TvQnXx');
      });
    });
    it('entries, size & page 3', function() { // TODO
      return dm.model('to-do-item').entries({
        size: 3,
        page: 3
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(1);
        expect(entries[0]._id).to.be.equal('VkM8aPQnQe');
      });
    });
    it('entries, page', function() { // TODO
      return dm.model('to-do-item').entries({
        page: 1
      })
      .then(function(entries) {
        expect(entries.length).to.be.equal(7);
      });
    });
  });

  describe('offline detection', function() {
    var dm;
    var stub;
    before(function(done) {
      dm = new DataManager({
        url: baseUrl + '58b9a1f5'
      });
      dm.enableCache([
        'to-do-list'
      ])
      .then(function() {
        stub = sinon.stub(Model.prototype, '_isReachable', function(dests) {
          return Promise.reject();
        });
        done();
      })
      .catch(done);
    });
    after(function(done) {
      dm = null;
      stub.restore();
      fs.unlink(path.resolve(__dirname, '..', '58b9a1f5.db.json'), done);
    });
    it('entries loaded from cache', function() {
      return dm.model('to-do-list').entries({ cacheType: 'refresh' })
      .then(function(entries) {
        expect(entries.length).to.be.equal(2);
      });
    });
    it('set model offline when not reachable', function() {
      return dm.model('to-do-item').enableCache()
      .then(function() {
        throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
      })
      .catch(function(err) {
        expect(err).to.be.ok;
        expect(err.message).to.be.equal('Network unreachable. No cached data available for model to-do-item.');
      });
    });
  });
}

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
    return dm.model('to-do-item').entries({
      filter: {
        title: {
          exact: 'Beef'
        }
      }
    }).then(function(entries) {
      expect(entries).to.be.ok;
      expect(entries).to.be.instanceOf(Array);
      expect(entries.length).to.be.equal(1);
    });
  });
  it('get entries, list multiple item, cloning', function() {
    return dm.model('to-do-item').entries().then(function(entries) {
      expect(entries).to.be.ok;
      expect(entries).to.be.instanceOf(Array);
      expect(entries.length).to.be.at.least(4);
      expect(entries[0].value.title).to.be.equal('Beef');
      var clonedEntries = DataManager.cloneEntries(entries);
      expect(clonedEntries).to.be.ok;
      expect(clonedEntries).to.be.instanceOf(Array);
      expect(clonedEntries.length).to.be.at.least(4);
      expect(clonedEntries[0].value.title).to.be.equal('Beef');
      clonedEntries[0].value.title = 'Turkey';
      expect(clonedEntries[0].value.title).to.be.equal('Turkey');
      expect(entries[0].value.title).to.be.equal('Beef');
    });
  });
  it('get entries, then single (tests _getTraversal)', function() {
    return dm.model('to-do-list').resolve().then(function(model) {
      return model.entries().then(function() {
        return model.entry('4JMjeO737e').then(function(entry) {
          expect(entry).to.be.ok;
          expect(entry).to.be.instanceOf(Object);
          expect(entry).to.have.property('value');
          expect(entry.value).to.have.property('_id', '4JMjeO737e');
        });
      });
    });
  });
  it('get entries, filter exact', function() {
    return dm.model('to-do-item').entries({
      filter: {
        title: {
          exact: 'Beef'
        }
      }
    }).then(function(entries) {
      expect(entries).to.be.ok;
      expect(entries).to.be.instanceOf(Array);
      expect(entries.length).to.be.equal(1);
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
  it('get single entry, with levels', function() {
    return dm.model('to-do-list').entry('4JMjeO737e', 2).then(function(entry) {
      expect(entry).to.be.ok;
      expect(entry).to.be.instanceOf(Object);
      expect(entry).to.have.property('value');
      expect(entry.value).to.have.property('_id', '4JMjeO737e');
      expect(entry.value).to.have.property('list-items')
      .that.is.instanceOf(Array);
      expect(entry.value['list-items'][0]).to.have.property('_id', '4JGrCvm27e');
    });
  });
  it('get single entry, with levels, with object', function() {
    return dm.model('to-do-list').entry({ id: '4JMjeO737e', levels: 2 }).then(function(entry) {
      expect(entry).to.be.ok;
      expect(entry).to.be.instanceOf(Object);
      expect(entry).to.have.property('value');
      expect(entry.value).to.have.property('_id', '4JMjeO737e');
      expect(entry.value).to.have.property('list-items')
      .that.is.instanceOf(Array);
      expect(entry.value['list-items'][0]).to.have.property('_id', '4JGrCvm27e');
    });
  });
  it('get single entry, with levels, with object 2', function() {
    return dm.model('to-do-list').entry({ _id: '4JMjeO737e', levels: 2 }).then(function(entry) {
      expect(entry).to.be.ok;
      expect(entry).to.be.instanceOf(Object);
      expect(entry).to.have.property('value');
      expect(entry.value).to.have.property('_id', '4JMjeO737e');
      expect(entry.value).to.have.property('list-items')
      .that.is.instanceOf(Array);
      expect(entry.value['list-items'][0]).to.have.property('_id', '4JGrCvm27e');
    });
  });
  it('get single entry, on list', function() {
    return dm.model('to-do-item').entry({
      filter: {
        title: {
          exact: 'Beef'
        }
      }
    }).then(function(entry) {
      expect(entry).to.be.ok;
      expect(entry).to.be.instanceOf(Object);
      expect(entry).to.have.property('value');
      expect(entry.value).to.have.property('_id', 'VkGhAPQ2Qe');
    });
  });
  it('single result on list', function() {
    return dm.model('to-do-item').entries({
      filter: {
        _id: {
          exact: 'VkGhAPQ2Qe'
        }
      }
    }).then(function(entries) {
      expect(entries).to.be.ok;
      expect(entries).to.be.instanceOf(Array);
      expect(entries[0]).to.be.instanceOf(Object);
      expect(entries[0]).to.have.property('value');
      expect(entries[0].value).to.have.property('_id', 'VkGhAPQ2Qe');
    });
  });
  it('empty result on list', function() {
    return dm.model('to-do-item').entries({
      filter: {
        title: {
          exact: 'asdfasdf'
        }
      }
    }).then(function(entries) {
      expect(entries).to.be.instanceOf(Array);
      expect(entries.length).to.be.equal(0)
    });
  });
  it('empty result on entry', function() {
    return dm.model('to-do-item').entry({
      filter: {
        title: {
          exact: 'asdfasdf'
        }
      }
    }).then(function(result) {
      throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
    }, function(err) {
      expect(err).to.be.ok;
      expect(err).to.have.property('message', 'ec_sdk_no_match_due_to_filter');
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
  it('list: get entries, list multiple item', function() {
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
  it('create entry, 204', function() {
    return dm.model('to-do-item').createEntry({
      title: 'NewItem204',
      description: '<p>A New Item.</p>'
    }).then(function(entry) {
      expect(entry).to.be.true;
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
  it('entry delete', function() {
    return dm.model('to-do-item').entry('N1GJuenPEl').then(function(entry) {
      return entry.delete();
    }).then(function(deleted) {
      expect(deleted).to.be.true;
    });
  });
  it('entry delete on entry from list', function() {
    return dm.model('to-do-item').entries().then(function(entries) {
      return entries[0].delete().then(function(deleted) {
        expect(deleted).to.be.true;
      });
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
  it('put entry, 204', function() {
    return dm.model('to-do-item').entry('VkGhAPQ2Qe').then(function(entry) {
      return entry.save();
    }).then(function(saved) {
      expect(saved).to.be.true;
    });
  });
  it('get link title', function() {
    return dm.model('to-do-list').entry('4JMjeO737e').then(function(entry) {
      var title = entry.getTitle('list-items');
      expect(title).to.be.instanceOf(Array);
      expect(title.length).to.be.equal(3);
      expect(title[0]).to.be.equal('Bananas');
      expect(title[1]).to.be.equal('Oranges');
      expect(title[2]).to.be.equal('Apples');
    });
  });
  it('get link title single link', function() {
    return dm.model('to-do-list').entry('V1EXdcJHl').then(function(entry) {
      var title = entry.getTitle('list-items');
      expect(title).to.be.equal('NewItem');
    });
  });
  it('get model title', function() {
    return dm.model('to-do-list').entry('4JMjeO737e').then(function(entry) {
      var title = entry.getModelTitle('list-items');
      expect(title).to.be.equal('to-do-item');
    });
  });
  it('get model title single link', function() {
    return dm.model('to-do-list').entry('V1EXdcJHl').then(function(entry) {
      var title = entry.getModelTitle('list-items');
      expect(title).to.be.equal('to-do-item');
    });
  });
  it('500 error', function() {
    return dm.model('to-do-item').entries({
      filter: {
        title: {
          exact: 'thisIsA500Error'
        }
      }
    }).then(function(result) {
      throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
    }).catch(function(err) {
      expect(err).to.be.ok;
      expect(err).to.have.property('code', 2000);
      expect(err).to.have.property('status', 500);
    });
  });
  it('500 error with error handler', function() {
    dm = new DataManager({
      url: baseUrl + '58b9a1f5',
      errorHandler: function(err) {
        expect(err).to.be.ok;
        expect(err).to.have.property('code', 2000);
        expect(err).to.have.property('status', 500);
      }
    });
    return dm.model('to-do-item').entries({
      filter: {
        title: {
          exact: 'thisIsA500Error'
        }
      }
    }).then(function(result) {
      throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
    }).catch(function(err) {
      expect(err).to.be.ok;
      expect(err).to.have.property('code', 2000);
      expect(err).to.have.property('status', 500);
    });
  });
  it('using model cache', function() {
    return dm.model('to-do-item').entry('VkGhAPQ2Qe').then(function(entry) {
      expect(entry).to.be.ok;
      expect(entry).to.be.instanceOf(Object);
      expect(entry).to.have.property('value');
      expect(entry.value).to.have.property('_id', 'VkGhAPQ2Qe');
      return dm.model('to-do-item').entry('VkGhAPQ2Qe').then(function(entry) {
        expect(entry).to.be.ok;
        expect(entry).to.be.instanceOf(Object);
        expect(entry).to.have.property('value');
        expect(entry.value).to.have.property('_id', 'VkGhAPQ2Qe');
      });
    });
  });
});

describe('nested Entry', function() { // this is basically modelList
  var dm;
  beforeEach(function() {
    dm = new DataManager({
      url: baseUrl + '58b9a1f5'
    });
  });
  afterEach(function() {
    dm = null;
  });
  it('get single entry', function() {
    return dm.model('to-do-item').nestedEntry('VkGhAPQ2Qe').then(function(entry) {
      expect(entry).to.be.ok;
      expect(entry).to.be.instanceOf(Object);
      expect(entry).to.have.property('value');
      expect(entry.value).to.have.property('_id', 'VkGhAPQ2Qe');
    });
  });
  it('get single entry, with levels', function() {
    return dm.model('to-do-list').nestedEntry('4JMjeO737e', 2).then(function(entry) {
      expect(entry).to.be.ok;
      expect(entry).to.be.instanceOf(Object);
      expect(entry).to.have.property('value');
      expect(entry.value).to.have.property('_id', '4JMjeO737e');
      expect(entry.value).to.have.property('list-items')
      .that.is.instanceOf(Array);
      expect(entry.value['list-items'][0].value).to.have.property('_id', '4JGrCvm27e');
    });
  });
  it('get single entry, with levels, with object', function() {
    return dm.model('to-do-list').nestedEntry({ id: '4JMjeO737e', levels: 2 }).then(function(entry) {
      expect(entry).to.be.ok;
      expect(entry).to.be.instanceOf(Object);
      expect(entry).to.have.property('value');
      expect(entry.value).to.have.property('_id', '4JMjeO737e');
      expect(entry.value).to.have.property('list-items')
      .that.is.instanceOf(Array);
      expect(entry.value['list-items'][0].value).to.have.property('_id', '4JGrCvm27e');
    });
  });
  it('get single entry, with levels, with object 2', function() {
    return dm.model('to-do-list').nestedEntry({ _id: '4JMjeO737e', levels: 2 }).then(function(entry) {
      expect(entry).to.be.ok;
      expect(entry).to.be.instanceOf(Object);
      expect(entry).to.have.property('value');
      expect(entry.value).to.have.property('_id', '4JMjeO737e');
      expect(entry.value).to.have.property('list-items')
      .that.is.instanceOf(Array);
      expect(entry.value['list-items'][0].value).to.have.property('_id', '4JGrCvm27e');
    });
  });
  it('empty result on entry', function() {
    return dm.model('to-do-item').nestedEntry({
      filter: {
        title: {
          exact: 'asdfasdf'
        }
      }
    }).then(function(result) {
      throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
    }, function(err) {
      expect(err).to.be.ok;
      expect(err).to.have.property('message', 'ec_sdk_no_match_due_to_filter');
    });
  });
});

describe('asset/assets', function() {
  var dm;
  beforeEach(function() {
    dm = new DataManager({
      url: baseUrl + '58b9a1f5',
      accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzUxMiJ9.eyJlbWFpbCI6bnVsbCwianRpIjoiM2EzYmQ5MzYtOWFlZS00ZWY0LTg0MjUtNjZhOGViODcyODk4IiwiaWF0IjoxNDQ5MTM2Njg0LCJleHAiOjQ2MDI3MzY2ODQsImlzcyI6ImVjX2RhdGFtYW5hZ2VyX3Nka190ZXN0c18xIiwic3ViIjoiMWNmOWUyOGUtZmE1NC00ZGVhLWJlMTQtZDlkYmNjMGMzYzY5In0.VMA0onkx4fpwBdTL9AQ2bzR4JBziY8UIavrAleIl7wj1Rh1-ZU09i-vze2sObarOZSygx74cO1uRkX37CFYj3Lf45mWPpHj-prJtfnS1xkn4KlfffTuz3VWINCorcZX-OyVeFWSexC6AwEQ9cW8FMEZPDpMLKodiFkhDUt1AIQg'
    });
  });
  afterEach(function() {
    dm = null;
  });
  it('get assets, list multiple items, cloning', function() {
    return dm.assets().then(function(assets) {
      expect(assets).to.be.ok;
      expect(assets).to.be.instanceOf(Array);
      expect(assets.length).to.be.equal(3);
      expect(assets[0].value.title).to.be.equal('anotherhardday');
      var clonedAssets = DataManager.cloneAssets(assets);
      expect(clonedAssets).to.be.ok;
      expect(clonedAssets).to.be.instanceOf(Array);
      expect(clonedAssets.length).to.be.equal(3);
      expect(clonedAssets[0].value.title).to.be.equal('anotherhardday');
      clonedAssets[0].value.title = 'beinginvacationisawesome';
      expect(clonedAssets[0].value.title).to.be.equal('beinginvacationisawesome');
      expect(assets[0].value.title).to.be.equal('anotherhardday');
    });
  });
  it('get assets, list single item', function() {
    return dm.assets({
      filter: {
        title: {
          exact: 'anotherhardday'
        }
      }
    }).then(function(assets) {
      expect(assets).to.be.ok;
      expect(assets).to.be.instanceOf(Array);
      expect(assets.length).to.be.equal(1);
    });
  });
  it('get single asset', function() {
    return dm.asset('443163b2-71a9-4f2a-987b-c7c7f31c7e30').then(function(asset) {
      expect(asset).to.be.ok;
      expect(asset).to.be.instanceOf(Object);
      expect(asset).to.have.property('value');
      expect(asset.value).to.have.property('assetID', '443163b2-71a9-4f2a-987b-c7c7f31c7e30');
    });
  });
  it('get single asset, on list', function() {
    return dm.asset({
      filter: {
        title: {
          exact: 'anotherhardday'
        }
      }
    }).then(function(asset) {
      expect(asset).to.be.ok;
      expect(asset).to.be.instanceOf(Object);
      expect(asset.value).to.have.property('assetID', 'bce957c9-7512-4dc1-bb19-0d843574c5b7');
      expect(asset.value).to.have.property('title', 'anotherhardday');
    });
  });
  it('no assetID provided', function() {
    return dm.asset().then(function(result) {
      throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
    }).catch(function(err) {
      expect(err).to.be.ok;
      expect(err).to.have.property('message', 'ec_sdk_no_assetid_provided');
    });
  });
  it('single result on list', function() {
    return dm.assets({
      filter: {
        assetID: {
          exact: '443163b2-71a9-4f2a-987b-c7c7f31c7e30'
        }
      }
    }).then(function(assets) {
      expect(assets).to.be.ok;
      expect(assets).to.be.instanceOf(Array);
      expect(assets[0]).to.be.instanceOf(Object);
      expect(assets[0]).to.have.property('value');
      expect(assets[0].value).to.have.property('assetID', '443163b2-71a9-4f2a-987b-c7c7f31c7e30');
    });
  });
  it('empty result on list', function() {
    return dm.assets({
      filter: {
        title: {
          exact: 'hello'
        }
      }
    }).then(function(assets) {
      expect(assets).to.be.instanceOf(Array);
      expect(assets.length).to.be.equal(0)
    });
  });
  it('empty result on entry', function() {
    return dm.asset({
      filter: {
        title: {
          exact: 'hello'
        }
      }
    }).then(function(result) {
      throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
    }, function(err) {
      expect(err).to.be.ok;
      expect(err).to.have.property('message', 'ec_sdk_no_match_due_to_filter');
    });
  });
  it('list: get asset, list single item', function() {
    return dm.assetList().then(function(list) {
      expect(list).to.be.ok;
      expect(list).to.be.instanceOf(Object);
      expect(list).to.have.property('count', 3);
      expect(list).to.have.property('total', 3);
      expect(list).to.have.property('assets');
      expect(list.assets).to.have.instanceOf(Array);
      expect(list.assets.length).to.be.equal(3);
    });
  });
  it('list: get asset, list multiple item', function() {
    return dm.assetList({
      filter: {
        title: {
          exact: 'anotherhardday'
        }
      }
    }).then(function(list) {
      expect(list).to.be.ok;
      expect(list).to.be.instanceOf(Object);
      expect(list).to.have.property('count', 1);
      expect(list).to.have.property('total', 1);
      expect(list).to.have.property('assets');
      expect(list.assets).to.have.instanceOf(Array);
      expect(list.assets.length).to.be.equal(1);
    });
  });
  it('list: empty result on list', function() {
    return dm.assetList({
      filter: {
        title: {
          exact: 'hello'
        }
      }
    }).then(function(assets) {
      expect(assets).to.be.instanceOf(Object);
      expect(assets).to.have.property('count', 0);
      expect(assets).to.have.property('total', 0);
      expect(assets.assets.length).to.be.equal(0);
    });
  });
  it('empty page', function() {
    return dm.assetList({
      page: 2,
      size: 10
    }).then(function(assets) {
      expect(assets).to.be.instanceOf(Object);
      expect(assets).to.have.property('count', 0);
      expect(assets).to.have.property('total', 9);
      expect(assets.assets.length).to.be.equal(0);
    });
  });

  if (isNode) {
    it('create asset, node', function() {
      return dm.createAsset(__dirname + '/whynotboth.jpg').then(function(assets) {
        expect(assets).to.be.instanceOf(Array);
        expect(assets.length).to.be.equal(1);
        return assets[0].then(function(asset) {
          expect(asset).to.be.ok;
          expect(asset).to.be.instanceOf(Object);
          expect(asset).to.have.property('value');
          expect(asset.value).to.have.property('assetID', 'ad994f77-9d89-4f7d-ab98-f2947a335da1');
        });
      });
    });
    it('create asset, node, multiple', function() {
      // nock cannot differ request for multipart file upload. so this test receives same response as single upload
      return dm.createAsset([__dirname + '/whynotboth.jpg', __dirname + '/whynotboth.jpg']).then(function(assets) {
        expect(assets).to.be.instanceOf(Array);
        expect(assets.length).to.be.equal(1);
        return assets[0].then(function(asset) {
          expect(asset).to.be.ok;
          expect(asset).to.be.instanceOf(Object);
          expect(asset).to.have.property('value');
          expect(asset.value).to.have.property('assetID', 'ad994f77-9d89-4f7d-ab98-f2947a335da1');
        });
      });
    });
  }
  if (!isNode) {
    it('create asset, browser', function() {
      // TODO how can this be done?
    });
    it('create asset, browser, multiple', function() {
      // TODO how can this be done?
    });
  }
  it('delete asset', function() {
    return dm.asset('443163b2-71a9-4f2a-987b-c7c7f31c7e30').then(function(asset) {
      expect(asset).to.be.ok;
      expect(asset).to.be.instanceOf(Object);
      expect(asset).to.have.property('value');
      expect(asset.value).to.have.property('assetID', '443163b2-71a9-4f2a-987b-c7c7f31c7e30');
      return asset.delete().then(function(deleted) {
        expect(deleted).to.be.true;
      });
    });
  });
  it('put asset', function() {
    return dm.asset('443163b2-71a9-4f2a-987b-c7c7f31c7e30').then(function(asset) {
      expect(asset).to.be.ok;
      expect(asset).to.be.instanceOf(Object);
      expect(asset).to.have.property('value');
      expect(asset.value).to.have.property('assetID', '443163b2-71a9-4f2a-987b-c7c7f31c7e30');
      expect(asset.value).to.have.property('title', 'vrooom');
      asset.value.title = 'brum';
      return asset.save().then(function(asset) {
        expect(asset).to.be.ok;
        expect(asset).to.be.instanceOf(Object);
        expect(asset).to.have.property('value');
        expect(asset.value).to.have.property('assetID', '443163b2-71a9-4f2a-987b-c7c7f31c7e30');
        expect(asset.value).to.have.property('title', 'brum');
      });
    });
  });
  it('put asset, 204', function() {
    return dm.asset('bce957c9-7512-4dc1-bb19-0d843574c5b7').then(function(asset) {
      expect(asset).to.be.ok;
      expect(asset).to.be.instanceOf(Object);
      expect(asset).to.have.property('value');
      expect(asset.value).to.have.property('assetID', 'bce957c9-7512-4dc1-bb19-0d843574c5b7');
      expect(asset.value).to.have.property('title', 'anotherhardday');
      asset.value.title = 'michl';
      return asset.save().then(function(saved) {
        expect(saved).to.be.true;
      });
    });
  });
});

describe('asset best file helper', function() {
  describe('gif', function() {
    var dm;
    var asset;
    beforeEach(function(done) {
      dm = new DataManager({
        url: baseUrl + '58b9a1f5',
        accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzUxMiJ9.eyJlbWFpbCI6bnVsbCwianRpIjoiM2EzYmQ5MzYtOWFlZS00ZWY0LTg0MjUtNjZhOGViODcyODk4IiwiaWF0IjoxNDQ5MTM2Njg0LCJleHAiOjQ2MDI3MzY2ODQsImlzcyI6ImVjX2RhdGFtYW5hZ2VyX3Nka190ZXN0c18xIiwic3ViIjoiMWNmOWUyOGUtZmE1NC00ZGVhLWJlMTQtZDlkYmNjMGMzYzY5In0.VMA0onkx4fpwBdTL9AQ2bzR4JBziY8UIavrAleIl7wj1Rh1-ZU09i-vze2sObarOZSygx74cO1uRkX37CFYj3Lf45mWPpHj-prJtfnS1xkn4KlfffTuz3VWINCorcZX-OyVeFWSexC6AwEQ9cW8FMEZPDpMLKodiFkhDUt1AIQg'
      });
      dm.asset('321de232-0cc6-46e8-82f7-2a7573c5134c').then(function(a) {
        expect(a).to.be.ok;
        expect(a).to.be.instanceOf(Object);
        expect(a).to.have.property('value');
        expect(a.value).to.have.property('assetID', '321de232-0cc6-46e8-82f7-2a7573c5134c');
        asset = a;
        done();
      }).catch(done);
    });
    afterEach(function() {
      dm = null;
      asset = null;
    });
    it('get file url', function() {
      expect(asset.getFileUrl()).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/qaRs3a9dFiiu_Mq7P0R7gG2e.gif');
    });
    it('get file url with locale', function() {
      expect(asset.getFileUrl('de-DE')).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/qaRs3a9dFiiu_Mq7P0R7gG2e.gif');
    });
    it('get image url', function() {
      expect(asset.getImageUrl()).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/qaRs3a9dFiiu_Mq7P0R7gG2e.gif');
    });
    it('get image url with size', function() {
      expect(asset.getImageUrl(200)).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/qaRs3a9dFiiu_Mq7P0R7gG2e.gif');
    });
    it('get image url with bigger size', function() {
      expect(asset.getImageUrl(200000)).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/qaRs3a9dFiiu_Mq7P0R7gG2e.gif');
    });
    it('get image url wit size and locale', function() {
      expect(asset.getImageUrl(200, 'de-DE')).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/qaRs3a9dFiiu_Mq7P0R7gG2e.gif');
    });
    it('get thumb url', function() {
      expect(asset.getImageThumbUrl()).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/qaRs3a9dFiiu_Mq7P0R7gG2e.gif');
    });
    it('get thumb url with size', function() {
      expect(asset.getImageThumbUrl(100)).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/qaRs3a9dFiiu_Mq7P0R7gG2e.gif');
    });
    it('get thumb url with size and locale', function() {
      expect(asset.getImageThumbUrl(100, 'de-DE')).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/qaRs3a9dFiiu_Mq7P0R7gG2e.gif');
    });
  });

  describe('image', function() {
    var dm;
    var asset;
    beforeEach(function(done) {
      dm = new DataManager({
        url: baseUrl + '58b9a1f5',
        accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzUxMiJ9.eyJlbWFpbCI6bnVsbCwianRpIjoiM2EzYmQ5MzYtOWFlZS00ZWY0LTg0MjUtNjZhOGViODcyODk4IiwiaWF0IjoxNDQ5MTM2Njg0LCJleHAiOjQ2MDI3MzY2ODQsImlzcyI6ImVjX2RhdGFtYW5hZ2VyX3Nka190ZXN0c18xIiwic3ViIjoiMWNmOWUyOGUtZmE1NC00ZGVhLWJlMTQtZDlkYmNjMGMzYzY5In0.VMA0onkx4fpwBdTL9AQ2bzR4JBziY8UIavrAleIl7wj1Rh1-ZU09i-vze2sObarOZSygx74cO1uRkX37CFYj3Lf45mWPpHj-prJtfnS1xkn4KlfffTuz3VWINCorcZX-OyVeFWSexC6AwEQ9cW8FMEZPDpMLKodiFkhDUt1AIQg'
      });
      dm.asset('443163b2-71a9-4f2a-987b-c7c7f31c7e30').then(function(a) {
        expect(a).to.be.ok;
        expect(a).to.be.instanceOf(Object);
        expect(a).to.have.property('value');
        expect(a.value).to.have.property('assetID', '443163b2-71a9-4f2a-987b-c7c7f31c7e30');
        asset = a;
        done();
      }).catch(done);
    });
    afterEach(function() {
      dm = null;
      asset = null;
    });
    it('get file url', function() {
      expect(asset.getFileUrl()).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/b_in72f5iM6szybZ4Un4W1zr.jpg');
    });
    it('get file url with locale', function() {
      expect(asset.getFileUrl('de-DE')).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/b_in72f5iM6szybZ4Un4W1zr.jpg');
    });
    it('get image url', function() {
      expect(asset.getImageUrl()).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/b_in72f5iM6szybZ4Un4W1zr.jpg');
    });
    it('get image url with size', function() {
      expect(asset.getImageUrl(200)).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/b_in72f5iM6szybZ4Un4W1zr_256.jpg');
    });
    it('get image url with bigger size', function() {
      expect(asset.getImageUrl(200000)).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/b_in72f5iM6szybZ4Un4W1zr.jpg');
    });
    it('get image url wit size and locale', function() {
      expect(asset.getImageUrl(200, 'de-DE')).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/b_in72f5iM6szybZ4Un4W1zr_256.jpg');
    });
    it('get thumb url', function() {
      expect(asset.getImageThumbUrl()).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/b_in72f5iM6szybZ4Un4W1zr_400_thumb.jpg');
    });
    it('get thumb url with size', function() {
      expect(asset.getImageThumbUrl(100)).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/b_in72f5iM6szybZ4Un4W1zr_100_thumb.jpg');
    });
    it('get thumb url with size and locale', function() {
      expect(asset.getImageThumbUrl(100, 'de-DE')).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/b_in72f5iM6szybZ4Un4W1zr_100_thumb.jpg');
    });
  });
  describe('text', function() {
    var dm;
    var asset;
    beforeEach(function(done) {
      dm = new DataManager({
        url: baseUrl + '58b9a1f5',
        accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzUxMiJ9.eyJlbWFpbCI6bnVsbCwianRpIjoiM2EzYmQ5MzYtOWFlZS00ZWY0LTg0MjUtNjZhOGViODcyODk4IiwiaWF0IjoxNDQ5MTM2Njg0LCJleHAiOjQ2MDI3MzY2ODQsImlzcyI6ImVjX2RhdGFtYW5hZ2VyX3Nka190ZXN0c18xIiwic3ViIjoiMWNmOWUyOGUtZmE1NC00ZGVhLWJlMTQtZDlkYmNjMGMzYzY5In0.VMA0onkx4fpwBdTL9AQ2bzR4JBziY8UIavrAleIl7wj1Rh1-ZU09i-vze2sObarOZSygx74cO1uRkX37CFYj3Lf45mWPpHj-prJtfnS1xkn4KlfffTuz3VWINCorcZX-OyVeFWSexC6AwEQ9cW8FMEZPDpMLKodiFkhDUt1AIQg'
      });
      dm.asset('162e97bd-cbc7-4821-ba6a-0d5299324bb6').then(function(a) {
        expect(a).to.be.ok;
        expect(a).to.be.instanceOf(Object);
        expect(a).to.have.property('value');
        expect(a.value).to.have.property('assetID', '162e97bd-cbc7-4821-ba6a-0d5299324bb6');
        asset = a;
        done();
      }).catch(done);
    });
    afterEach(function() {
      dm = null;
      asset = null;
    });
    it('get file url', function() {
      expect(asset.getFileUrl()).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/KTQMkX_MY5d0BrJmE6rxWS44.txt');
    });
    it('get file url with locale', function() {
      expect(asset.getFileUrl('de-DE')).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/KTQMkX_MY5d0BrJmE6rxWS44.txt');
    });
    it('get image url', function() {
      expect(asset.getImageUrl.bind(asset)).to.throw('ec.datamanager.js getImageUrl only works on image assets');
    });
    it('get thumb url', function() {
      expect(asset.getImageThumbUrl.bind(asset)).to.throw('ec.datamanager.js getImageThumbUrl only works on image assets');
    });
  });
  describe('svg with locale', function() {
    var dm;
    var asset;
    beforeEach(function(done) {
      dm = new DataManager({
        url: baseUrl + '58b9a1f5',
        accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzUxMiJ9.eyJlbWFpbCI6bnVsbCwianRpIjoiM2EzYmQ5MzYtOWFlZS00ZWY0LTg0MjUtNjZhOGViODcyODk4IiwiaWF0IjoxNDQ5MTM2Njg0LCJleHAiOjQ2MDI3MzY2ODQsImlzcyI6ImVjX2RhdGFtYW5hZ2VyX3Nka190ZXN0c18xIiwic3ViIjoiMWNmOWUyOGUtZmE1NC00ZGVhLWJlMTQtZDlkYmNjMGMzYzY5In0.VMA0onkx4fpwBdTL9AQ2bzR4JBziY8UIavrAleIl7wj1Rh1-ZU09i-vze2sObarOZSygx74cO1uRkX37CFYj3Lf45mWPpHj-prJtfnS1xkn4KlfffTuz3VWINCorcZX-OyVeFWSexC6AwEQ9cW8FMEZPDpMLKodiFkhDUt1AIQg'
      });
      dm.asset('55628c81-abb0-4a21-8420-a5b06e2e9ce0').then(function(a) {
        expect(a).to.be.ok;
        expect(a).to.be.instanceOf(Object);
        expect(a).to.have.property('value');
        expect(a.value).to.have.property('assetID', '55628c81-abb0-4a21-8420-a5b06e2e9ce0');
        asset = a;
        done();
      }).catch(done);
    });
    afterEach(function() {
      dm = null;
      asset = null;
    });
    it('get file url', function() {
      expect(asset.getFileUrl()).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/ZX5FmOjwGeRVJH-F1htU_5cg_de.svg');
    });
    it('get file url with locale', function() {
      expect(asset.getFileUrl('de-DE')).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/ZX5FmOjwGeRVJH-F1htU_5cg_de.svg');
    });
    it('get file url with locale en', function() {
      expect(asset.getFileUrl('en-US')).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/ZX5FmOjwGeRVJH-F1htU_5cg_en.svg');
    });
    it('get file url with locale hu', function() {
      expect(asset.getFileUrl('hu-HU')).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/ZX5FmOjwGeRVJH-F1htU_5cg_de.svg');
    });
    it('get image url', function() {
      expect(asset.getImageUrl()).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/ZX5FmOjwGeRVJH-F1htU_5cg_de.svg');
    });
    it('get image url with size', function() {
      expect(asset.getImageUrl(200)).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/ZX5FmOjwGeRVJH-F1htU_5cg_de.svg');
    });
    it('get image url wit size and locale', function() {
      expect(asset.getImageUrl(200, 'de-DE')).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/ZX5FmOjwGeRVJH-F1htU_5cg_de.svg');
    });
    it('get thumb url', function() {
      expect(asset.getImageThumbUrl()).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/ZX5FmOjwGeRVJH-F1htU_5cg_de.svg');
    });
    it('get thumb url with size', function() {
      expect(asset.getImageThumbUrl(100)).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/ZX5FmOjwGeRVJH-F1htU_5cg_de.svg');
    });
    it('get thumb url with size and locale', function() {
      expect(asset.getImageThumbUrl(100, 'de-DE')).to.be.equal('https://cdn2.entrecode.de/files/58b9a1f5/ZX5FmOjwGeRVJH-F1htU_5cg_de.svg');
    });
  });
});

describe('tag/tags', function() {
  var dm;
  beforeEach(function() {
    dm = new DataManager({
      url: baseUrl + '58b9a1f5',
      accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzUxMiJ9.eyJlbWFpbCI6bnVsbCwianRpIjoiM2EzYmQ5MzYtOWFlZS00ZWY0LTg0MjUtNjZhOGViODcyODk4IiwiaWF0IjoxNDQ5MTM2Njg0LCJleHAiOjQ2MDI3MzY2ODQsImlzcyI6ImVjX2RhdGFtYW5hZ2VyX3Nka190ZXN0c18xIiwic3ViIjoiMWNmOWUyOGUtZmE1NC00ZGVhLWJlMTQtZDlkYmNjMGMzYzY5In0.VMA0onkx4fpwBdTL9AQ2bzR4JBziY8UIavrAleIl7wj1Rh1-ZU09i-vze2sObarOZSygx74cO1uRkX37CFYj3Lf45mWPpHj-prJtfnS1xkn4KlfffTuz3VWINCorcZX-OyVeFWSexC6AwEQ9cW8FMEZPDpMLKodiFkhDUt1AIQg'
    });
  });
  afterEach(function() {
    dm = null;
  });
  it('get tags, list multiple items, cloning', function() {
    return dm.tags().then(function(tags) {
      expect(tags).to.be.ok;
      expect(tags).to.be.instanceOf(Array);
      expect(tags.length).to.be.equal(2);
      expect(tags[0].value.tag).to.be.equal('work-memes');
      var clonedTags = DataManager.cloneTags(tags);
      expect(clonedTags).to.be.ok;
      expect(clonedTags).to.be.instanceOf(Array);
      expect(clonedTags.length).to.be.equal(2);
      expect(clonedTags[0].value.tag).to.be.equal('work-memes');
      clonedTags[0].value.tag = 'fex-memes';
      expect(clonedTags[0].value.tag).to.be.equal('fex-memes');
      expect(tags[0].value.tag).to.be.equal('work-memes');
    });
  });
  it('get tags, list single item', function() {
    return dm.tags({
      filter: {
        tag: {
          search: 'meme'
        }
      }
    }).then(function(tags) {
      expect(tags).to.be.ok;
      expect(tags).to.be.instanceOf(Array);
      expect(tags.length).to.be.equal(1);
    });
  });
  it('get single tag', function() {
    return dm.tag('work-memes').then(function(tag) {
      expect(tag).to.be.ok;
      expect(tag).to.be.instanceOf(Object);
      expect(tag).to.have.property('value');
      expect(tag.value).to.have.property('tag', 'work-memes');
      expect(tag.value).to.have.property('count', 2);
    });
  });
  it('get single tag, on list', function() {
    return dm.tag({
      filter: {
        tag: {
          search: 'meme'
        }
      }
    }).then(function(tag) {
      expect(tag).to.be.ok;
      expect(tag).to.be.instanceOf(Object);
      expect(tag.value).to.have.property('tag', 'work-memes');
    });
  });
  it('no tag name', function() {
    return dm.tag().then(function(result) {
      throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
    }, function(err) {
      expect(err).to.be.ok;
      expect(err).to.have.property('message', 'ec_sdk_no_tag_name_provided');
    });
  });
  it('single result on list', function() {
    return dm.tags({
      filter: {
        tag: {
          exact: 'work-memes'
        }
      }
    }).then(function(tags) {
      expect(tags).to.be.ok;
      expect(tags).to.be.instanceOf(Array);
      expect(tags[0]).to.be.instanceOf(Object);
      expect(tags[0]).to.have.property('value');
      expect(tags[0].value).to.have.property('tag', 'work-memes');
      expect(tags[0].value).to.have.property('count', 2);
    });
  });
  it('empty result on list', function() {
    return dm.tags({
      filter: {
        tag: {
          search: 'buh'
        }
      }
    }).then(function(entries) {
      expect(entries).to.be.instanceOf(Array);
      expect(entries.length).to.be.equal(0)
    });
  });
  it('empty result on tag', function() {
    return dm.tag({
      filter: {
        tag: {
          search: 'buh'
        }
      }
    }).then(function(result) {
      throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
    }, function(err) {
      expect(err).to.be.ok;
      expect(err).to.have.property('message', 'ec_sdk_no_match_due_to_filter');
    });
  });
  it('list: get tags, list multiple items', function() {
    return dm.tagList().then(function(list) {
      expect(list).to.be.ok;
      expect(list).to.be.instanceOf(Object);
      expect(list).to.have.property('tags');
      expect(list.tags).to.be.instanceOf(Array);
      expect(list.tags.length).to.be.equal(2);
    });
  });
  it('list: get tags, list single item', function() {
    return dm.tagList({
      filter: {
        tag: {
          search: 'meme'
        }
      }
    }).then(function(list) {
      expect(list).to.be.ok;
      expect(list).to.be.instanceOf(Object);
      expect(list).to.have.property('tags');
      expect(list.tags).to.be.instanceOf(Array);
      expect(list.tags.length).to.be.equal(1);
    });
  });
  it('delete tag', function() {
    return dm.tag('work-memes').then(function(tag) {
      return tag.delete().then(function(deleted) {
        expect(deleted).to.be.true;
      });
    });
  });
  it('put tag', function() {
    return dm.tag('work-memes').then(function(tag) {
      expect(tag).to.be.ok;
      expect(tag).to.have.property('value');
      expect(tag.value).to.have.property('tag', 'work-memes');
      tag.value.tag = 'workmemes';
      return tag.save().then(function(tag) {
        expect(tag).to.be.ok;
        expect(tag).to.have.property('value');
        expect(tag.value).to.have.property('tag', 'workmemes');
      });
    });
  });
  it('put tag, 204', function() {
    return dm.tag('yolo').then(function(tag) {
      tag._traversal = null;
      expect(tag).to.be.ok;
      expect(tag).to.have.property('value');
      expect(tag.value).to.have.property('tag', 'yolo');
      tag.value.tag = 'manlebtnureinmal';
      return tag.save().then(function(saved) {
        expect(saved).to.be.true;
      });
    });
  });
});

describe('filter options', function() {
  var dm;
  beforeEach(function() {
    dm = new DataManager({
      url: baseUrl + '58b9a1f5'
    });
  });
  afterEach(function() {
    dm = null;
  });
  it('get entries, size and page', function() {
    dm.model('to-do-item').entryList({
      size: 2,
      page: 2
    }).then(function(list) {
      expect(list).to.be.ok;
      expect(list).to.be.instanceOf(Object);
      expect(list).to.be.have.property('count', 2);
      expect(list).to.be.have.property('total', 5);
    });
  });
  it('get entries, sort', function() {
    dm.model('to-do-item').entries({
      sort: [
        'title'
      ]
    }).then(function(entries) {
      expect(entries).to.be.ok;
      expect(entries).to.be.instanceOf(Array);
      expect(entries[0]).to.have.property('title', 'Apples')
    });
  });
  it('get entries, filter from', function() {
    dm.model('to-do-item').entries({
      filter: {
        created: {
          from: '2015-12-02T08:00:46.511Z'
        }
      }
    }).then(function(entries) {
      expect(entries).to.be.ok;
      expect(entries).to.be.instanceOf(Array);
      expect(entries.length).to.equal(1);
    });
  });
  it('get entries, filter to', function() {
    dm.model('to-do-item').entries({
      filter: {
        created: {
          to: '2015-12-02T08:00:46.511Z'
        }
      }
    }).then(function(entries) {
      expect(entries).to.be.ok;
      expect(entries).to.be.instanceOf(Array);
      expect(entries.length).to.equal(4);
    });
  });
});

describe('user management', function() {
  describe('anonymous user', function() {
    var dm;
    beforeEach(function() {
      dm = new DataManager({
        url: baseUrl + '58b9a1f5'
      });
    });
    afterEach(function() {
      dm = null;
    });
    it('register', function() {
      expect(dm).to.not.have.property('accessToken');
      return dm.registerAnonymous().then(function(user) {
        expect(user).to.be.ok;
        expect(dm).to.have.property('accessToken')
        .that.is.equal('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzUxMiJ9.eyJlbWFpbCI6bnVsbCwianRpIjoiM2EzYmQ5MzYtOWFlZS00ZWY0LTg0MjUtNjZhOGViODcyODk4IiwiaWF0IjoxNDQ5MTM2Njg0LCJleHAiOjQ2MDI3MzY2ODQsImlzcyI6ImVjX2RhdGFtYW5hZ2VyX3Nka190ZXN0c18xIiwic3ViIjoiMWNmOWUyOGUtZmE1NC00ZGVhLWJlMTQtZDlkYmNjMGMzYzY5In0.VMA0onkx4fpwBdTL9AQ2bzR4JBziY8UIavrAleIl7wj1Rh1-ZU09i-vze2sObarOZSygx74cO1uRkX37CFYj3Lf45mWPpHj-prJtfnS1xkn4KlfffTuz3VWINCorcZX-OyVeFWSexC6AwEQ9cW8FMEZPDpMLKodiFkhDUt1AIQg');
        expect(user).to.have.property('value');
        expect(user.value).to.have.property('accountID', '1cf9e28e-fa54-4dea-be14-d9dbcc0c3c69');
        expect(user.value).to.have.property('exp', '2115-11-09T09:58:04.000Z');
        expect(user.value).to.have.property('iat', '2015-12-03T09:58:04.000Z');
        expect(user.value).to.have.property('jwt', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzUxMiJ9.eyJlbWFpbCI6bnVsbCwianRpIjoiM2EzYmQ5MzYtOWFlZS00ZWY0LTg0MjUtNjZhOGViODcyODk4IiwiaWF0IjoxNDQ5MTM2Njg0LCJleHAiOjQ2MDI3MzY2ODQsImlzcyI6ImVjX2RhdGFtYW5hZ2VyX3Nka190ZXN0c18xIiwic3ViIjoiMWNmOWUyOGUtZmE1NC00ZGVhLWJlMTQtZDlkYmNjMGMzYzY5In0.VMA0onkx4fpwBdTL9AQ2bzR4JBziY8UIavrAleIl7wj1Rh1-ZU09i-vze2sObarOZSygx74cO1uRkX37CFYj3Lf45mWPpHj-prJtfnS1xkn4KlfffTuz3VWINCorcZX-OyVeFWSexC6AwEQ9cW8FMEZPDpMLKodiFkhDUt1AIQg');
      });
    });
    it('register, validUntil', function() {
      expect(dm).to.not.have.property('accessToken');
      return dm.registerAnonymous('2025-11-09T09:58:04.000Z').then(function(user) {
        expect(user).to.be.ok;
        expect(dm).to.have.property('accessToken')
        .that.is.equal('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzUxMiJ9.eyJlbWFpbCI6bnVsbCwianRpIjoiN2JlYzRmMDMtMzg2ZS00OWM2LThjMmYtZjlmNDA0ZWNjYTRiIiwiaWF0IjoxNDQ5MjQwNTEyLCJleHAiOjQ2MDI4NDA1MTIsImlzcyI6ImVjX2RhdGFtYW5hZ2VyX3Nka190ZXN0c18xIiwic3ViIjoiOGVmZTE5MTktMjNhMy00ZmE2LTliZGUtMzlmYmU4NTdjYTUwIn0.inMjpMhImlO6Yy1RSycBOOVOw24Sqy7Ee7qZS9JFBYLIRA1zlvVEP7HPGEZeFnARNejpl_iuEzjLlu4DhYBLdw86IqttdbkSQi2e--RCF_UARr1b4aZnnuZ82cKifdqi_ulIQ7WkTHikOosyjRmI89nr6xJoJhD9iv-2TQ6dNJs');
        expect(user).to.have.property('value');
        expect(user.value).to.have.property('accountID', '8efe1919-23a3-4fa6-9bde-39fbe857ca50');
        expect(user.value).to.have.property('exp', '2025-11-09T09:58:04.000Z');
        expect(user.value).to.have.property('iat', '2015-12-04T14:48:32.000Z');
        expect(user.value).to.have.property('jwt', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzUxMiJ9.eyJlbWFpbCI6bnVsbCwianRpIjoiN2JlYzRmMDMtMzg2ZS00OWM2LThjMmYtZjlmNDA0ZWNjYTRiIiwiaWF0IjoxNDQ5MjQwNTEyLCJleHAiOjQ2MDI4NDA1MTIsImlzcyI6ImVjX2RhdGFtYW5hZ2VyX3Nka190ZXN0c18xIiwic3ViIjoiOGVmZTE5MTktMjNhMy00ZmE2LTliZGUtMzlmYmU4NTdjYTUwIn0.inMjpMhImlO6Yy1RSycBOOVOw24Sqy7Ee7qZS9JFBYLIRA1zlvVEP7HPGEZeFnARNejpl_iuEzjLlu4DhYBLdw86IqttdbkSQi2e--RCF_UARr1b4aZnnuZ82cKifdqi_ulIQ7WkTHikOosyjRmI89nr6xJoJhD9iv-2TQ6dNJs');
      });
    });
    it('model resolve, then register', function() {
      return dm.model('to-do-list').resolve().then(function() {
        return dm.registerAnonymous().then(function(user) {
          expect(user).to.be.ok;
          expect(dm).to.have.property('_user');
          expect(dm).to.have.property('accessToken')
          .that.is.equal('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzUxMiJ9.eyJlbWFpbCI6bnVsbCwianRpIjoiM2EzYmQ5MzYtOWFlZS00ZWY0LTg0MjUtNjZhOGViODcyODk4IiwiaWF0IjoxNDQ5MTM2Njg0LCJleHAiOjQ2MDI3MzY2ODQsImlzcyI6ImVjX2RhdGFtYW5hZ2VyX3Nka190ZXN0c18xIiwic3ViIjoiMWNmOWUyOGUtZmE1NC00ZGVhLWJlMTQtZDlkYmNjMGMzYzY5In0.VMA0onkx4fpwBdTL9AQ2bzR4JBziY8UIavrAleIl7wj1Rh1-ZU09i-vze2sObarOZSygx74cO1uRkX37CFYj3Lf45mWPpHj-prJtfnS1xkn4KlfffTuz3VWINCorcZX-OyVeFWSexC6AwEQ9cW8FMEZPDpMLKodiFkhDUt1AIQg');
        });
      });
    });
    it('logout', function() {
      expect(dm).to.not.have.property('accessToken');
      return dm.registerAnonymous().then(function(user) {
        expect(user).to.be.ok;
        expect(dm).to.have.property('_user');
        expect(dm).to.have.property('accessToken')
        .that.is.equal('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzUxMiJ9.eyJlbWFpbCI6bnVsbCwianRpIjoiM2EzYmQ5MzYtOWFlZS00ZWY0LTg0MjUtNjZhOGViODcyODk4IiwiaWF0IjoxNDQ5MTM2Njg0LCJleHAiOjQ2MDI3MzY2ODQsImlzcyI6ImVjX2RhdGFtYW5hZ2VyX3Nka190ZXN0c18xIiwic3ViIjoiMWNmOWUyOGUtZmE1NC00ZGVhLWJlMTQtZDlkYmNjMGMzYzY5In0.VMA0onkx4fpwBdTL9AQ2bzR4JBziY8UIavrAleIl7wj1Rh1-ZU09i-vze2sObarOZSygx74cO1uRkX37CFYj3Lf45mWPpHj-prJtfnS1xkn4KlfffTuz3VWINCorcZX-OyVeFWSexC6AwEQ9cW8FMEZPDpMLKodiFkhDUt1AIQg');
        return user.logout().then(function() {
          expect(dm).to.have.property('accessToken', undefined);
          expect(dm).to.have.property('_user', undefined);
        });
      });
    });
  });
  describe('get auth links', function() {
    var dm;
    beforeEach(function() {
      dm = new DataManager({
        url: baseUrl + '58b9a1f5'
      });
    });
    afterEach(function() {
      dm = null;
    });
    it('anonymous', function() {
      return dm.getAuthLink('anonymous').then(function(url) {
        expect(url).to.be.equal(baseUrl + '58b9a1f5/_auth/account');
      });
    });
    it('anonymous with validUntil', function() {
      return dm.getAuthLink('anonymous', { validUntil: '2025-11-09T09:58:04.000Z' }).then(function(url) {
        expect(url).to.be.equal(baseUrl + '58b9a1f5/_auth/account?validUntil=2025-11-09T09%3A58%3A04.000Z');
      });
    });
    it('signup', function() {
      return dm.getAuthLink('signup', { clientID: 'testClient' }).then(function(url) {
        expect(url).to.be.equal(baseUrl + '58b9a1f5/_auth/signup?clientID=testClient');
      });
    });
    it('login', function() {
      return dm.getAuthLink('login', { clientID: 'testClient' }).then(function(url) {
        expect(url).to.be.equal(baseUrl + '58b9a1f5/_auth/login?clientID=testClient');
      });
    });
    it('password reset', function() {
      return dm.getAuthLink('password-reset', { clientID: 'testClient', email: 'some@mail.com' }).then(function(url) {
        expect(url).to.be.equal(baseUrl + '58b9a1f5/_auth/password-reset?clientID=testClient&email=some%40mail.com');
      });
    });
    it('email available', function() {
      return dm.getAuthLink('email-available', { email: 'some@mail.com' }).then(function(url) {
        expect(url).to.be.equal(baseUrl + '58b9a1f5/_auth/email?email=some%40mail.com');
      });
    });
    it('public key', function() {
      return dm.getAuthLink('public-key.pem').then(function(url) {
        expect(url).to.be.equal(baseUrl + '58b9a1f5/_auth/public-key.pem');
      });
    });
    it('not available', function() {
      return dm.getAuthLink('not-available').then(function(result) {
        throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
      }).catch(function(err) {
        expect(err).to.be.ok;
      });
    });
    it('clientID from dm', function() {
      dm.clientID = 'testClient';
      return dm.getAuthLink('login').then(function(url) {
        expect(url).to.be.equal(baseUrl + '58b9a1f5/_auth/login?clientID=testClient');
      });
    });
    it('overwrite clientID from dm', function() {
      dm.clientID = 'testDMClient';
      return dm.getAuthLink('login', { clientID: 'testClient' }).then(function(url) {
        expect(url).to.be.equal(baseUrl + '58b9a1f5/_auth/login?clientID=testClient');
      });
    });
  });
  describe('auth helper', function() {
    var dm;
    beforeEach(function() {
      dm = new DataManager({
        url: baseUrl + '58b9a1f5'
      });
    });
    afterEach(function() {
      dm = null;
    });
    it('email available', function() {
      return dm.emailAvailable('available@entrecode.de').then(function(available) {
        expect(available).to.be.true;
      });
    });
    it('email not available', function() {
      return dm.emailAvailable('not-available@entrecode.de').then(function(available) {
        expect(available).to.be.false;
      });
    });
    it('email malformed', function() {
      return dm.emailAvailable('malformed').then(function(result) {
        throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
      }).catch(function(err) {
        expect(err).to.be.ok;
      });
    });
  });
  describe('account and datamanager info', function() {
    var dm;
    beforeEach(function() {
      dm = new DataManager({
        url: baseUrl + '58b9a1f5'
      });
    });
    afterEach(function() {
      dm = null;
    });
    it('account info', function() {
      dm.accessToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzUxMiJ9.eyJlbWFpbCI6bnVsbCwianRpIjoiM2EzYmQ5MzYtOWFlZS00ZWY0LTg0MjUtNjZhOGViODcyODk4IiwiaWF0IjoxNDQ5MTM2Njg0LCJleHAiOjQ2MDI3MzY2ODQsImlzcyI6ImVjX2RhdGFtYW5hZ2VyX3Nka190ZXN0c18xIiwic3ViIjoiMWNmOWUyOGUtZmE1NC00ZGVhLWJlMTQtZDlkYmNjMGMzYzY5In0.VMA0onkx4fpwBdTL9AQ2bzR4JBziY8UIavrAleIl7wj1Rh1-ZU09i-vze2sObarOZSygx74cO1uRkX37CFYj3Lf45mWPpHj-prJtfnS1xkn4KlfffTuz3VWINCorcZX-OyVeFWSexC6AwEQ9cW8FMEZPDpMLKodiFkhDUt1AIQg';
      return dm.account().then(function(account) {
        expect(account).to.be.ok;
        expect(account).to.have.property('accountID', 'c631bba1-a36b-4977-9b42-2c14f51b653c');
        expect(account).to.have.property('pending', false);
        expect(account).to.have.property('hasPassword', false);
        expect(account).to.have.property('roles')
        .that.is.instanceOf(Array);
        expect(account.roles[0]).to.have.property('roleID', '2f705a26-e320-4b58-84e8-b7e37887c938');
        expect(account.roles[0]).to.have.property('name', 'Anonymous Users');
      });
    });
    it('account info failes without login', function() {
      return dm.account().then(function(result) {
        throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
      }).catch(function(err) {
        expect(err).to.be.ok;
        expect(err).to.have.property('message', 'ec_sdk_not_logged_in');
      });
    });
    it('datamanager info', function() {
      return dm.resolve().then(function(datamanager) {
        expect(datamanager).to.be.ok;
        expect(datamanager).to.have.property('metadata')
        .that.is.instanceOf(Object);
        expect(datamanager.metadata).to.have.property('title', 'ec.datamanager-sdk-tests-1');
        expect(datamanager.metadata).to.have.property('description', 'This Data Manager contains test data for the ec.datamanager javascript SDK. (Allow all public rights).');
        expect(datamanager.metadata).to.have.property('locales');
        expect(datamanager.metadata).to.have.property('defaultLocale');
      });
    });
  });
  describe('permissions', function() {
    var dm;
    beforeEach(function() {
      dm = new DataManager({
        url: baseUrl + '58b9a1f5',
        accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzUxMiJ9.eyJlbWFpbCI6bnVsbCwianRpIjoiM2EzYmQ5MzYtOWFlZS00ZWY0LTg0MjUtNjZhOGViODcyODk4IiwiaWF0IjoxNDQ5MTM2Njg0LCJleHAiOjQ2MDI3MzY2ODQsImlzcyI6ImVjX2RhdGFtYW5hZ2VyX3Nka190ZXN0c18xIiwic3ViIjoiMWNmOWUyOGUtZmE1NC00ZGVhLWJlMTQtZDlkYmNjMGMzYzY5In0.VMA0onkx4fpwBdTL9AQ2bzR4JBziY8UIavrAleIl7wj1Rh1-ZU09i-vze2sObarOZSygx74cO1uRkX37CFYj3Lf45mWPpHj-prJtfnS1xkn4KlfffTuz3VWINCorcZX-OyVeFWSexC6AwEQ9cW8FMEZPDpMLKodiFkhDUt1AIQg'
      });
    });
    afterEach(function() {
      dm = null;
    });
    it('permission ok', function() {
      return dm.can('to-do-item:put:title').then(function(allowed) {
        expect(allowed).to.be.equal(true);
      });
    });
    it('permission not ok', function() {
      return dm.can('to-do-item:delete').then(function() {
        throw new Error('Test ' + this.currentTest.title + ' was unexpectedly fulfilled. Result: ' + result);
      }).catch(function(error) {
        expect(error.message).to.be.equal('permission_denied');
      });
    });
  });
  describe('logout', function() {
    var dm;
    beforeEach(function(done) {
      dm = new DataManager({
        url: baseUrl + '58b9a1f5'
      });
      dm.registerAnonymous().then(function(user) {
        return done();
      }).catch(done);
    });
    afterEach(function() {
      dm = null;
    });
    it('removes access token and traversal', function(done) {
      dm.logout();
      expect(dm.accessToken).to.be.null;
      expect(dm._rootTraversal).to.be.null;
      done();
    });
  });
});
