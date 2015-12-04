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
      return DataManager.getFileUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 'de_DE').then(function(url) {
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
        console.log(err);
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
      DataManager.getImageUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 200, 'de_DE').then(function(url) {
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
      return DataManager.getImageThumbUrl('4920f5ac-eab9-400b-8e41-5a202488b249', 100, 'de_DE').then(function(url) {
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
}

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
  it('get entries, list multiple item', function() {
    return dm.model('to-do-item').entries().then(function(entries) {
      expect(entries).to.be.ok;
      expect(entries).to.be.instanceOf(Array);
      expect(entries.length).to.be.at.least(4);
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
    return dm.model('to-do-list').entry({id: '4JMjeO737e', levels: 2}).then(function(entry) {
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
    return dm.model('to-do-list').entry({_id: '4JMjeO737e', levels: 2}).then(function(entry) {
      expect(entry).to.be.ok;
      expect(entry).to.be.instanceOf(Object);
      expect(entry).to.have.property('value');
      expect(entry.value).to.have.property('_id', '4JMjeO737e');
      expect(entry.value).to.have.property('list-items')
        .that.is.instanceOf(Array);
      expect(entry.value['list-items'][0]).to.have.property('_id', '4JGrCvm27e');
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
  it('get assets, list multiple item', function() {
    return dm.assets().then(function(assets) {
      expect(assets).to.be.ok;
      expect(assets).to.be.instanceOf(Array);
      expect(assets.length).to.be.equal(3);
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
  it('create asset', function() {

  });
  it('create asset fail', function() {

  });
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
});

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
      dm.registerAnonymous().then(function(user) {
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
