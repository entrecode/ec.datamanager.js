'use strict';

var isNodeJS, DataManager, serverRoot;
if (typeof process !== 'undefined') {
  // We are in node. Require modules.
  isNodeJS = true;
  var chai           = require('chai') // main testing lib
    , chaiAsPromised = require('chai-as-promised')
    , sinon          = require('sinon') // for spies
    , sinonChai      = require('sinon-chai') // chai assertions for sinon spies
    , expect         = chai.expect
    ;

  chai.use(chaiAsPromised);
  chai.use(sinonChai);

  serverRoot = '';

} else {
  isNodeJS = false;
  // We are in the browser. Karma already knows chai etc.

  serverRoot = 'http://localhost:54815/api/datamanager';

}

describe('basic check of testing library', function() {
  it('assert that JavaScript is still a little crazy', function() {
    expect([] + []).to.equal('');
  });
});

var dataManager, api;
describe('DataManager SDK', function() {
  if (isNodeJS) { // Backend only
    before(function() {
      api = require('../lib/api.js'); // API connector to spy at
      DataManager = require('../lib/DataManager.js'); // DM Class

      sinon.spy(api, 'get'); // registers a spy for api.get(…)
      sinon.spy(api, 'put'); // registers a spy for api.put(…)
      sinon.spy(api, 'post'); // registers a spy for api.post(…)
      sinon.spy(api, 'delete'); // registers a spy for api.delete(…)
    });
  }
  describe('datamanager constructor', function() {
    it('returns DataManager instance', function(done) {
      var instance = new DataManager({
        url: 'https://datamanager.entrecode.de/beef123',
        accessToken: 'test'
      });
      expect(instance).to.be.instanceOf(DataManager);
      expect(instance).to.have.property('url', 'https://datamanager.entrecode.de/beef123/');
      expect(instance).to.have.property('accessToken', 'test');
      done();
    });
    it('interpolates URL from given id', function(done) {
      var instance = new DataManager({
        id: 'beefabc',
        accessToken: 'test'
      });
      expect(instance).to.have.property('url', 'https://datamanager.entrecode.de/api/beefabc/');
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
    it('fails if illegal url is given', function(done) {
      expect(function() {
        new DataManager({
          url: 'https://anything.entrecode.de',
          accessToken: 'test'
        })
      }).to.throw(Error);
      done();
    });
    it('fails if illegal id is given', function(done) {
      expect(function() {
        new DataManager({
          id: 'noBeef',
          accessToken: 'test'
        })
      }).to.throw(Error);
      done();
    });
    it('DEPRECATED: retrieves accessToken if not sent', function(done) {
      done();
      /*
       var instance = new DataManager({
       url: serverRoot + '/api/f84710b8/'
       });
       expect(instance).to.have.property('accessToken');
       return
       expect(instance.accessToken).to.eventually.match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
       */
    });
    it('DEPRECATED: readOnly mode of data manager has no accessToken', function(done) {
      done();
      /*
       var instance = new DataManager({
       url: serverRoot + '/api/f84710b8/',
       readonly: true
       });
       expect(instance).to.have.property('readonly', true);
       */
    });
    if (isNodeJS) {
      it('DEPRECATED: waits until accessToken is retrieved for further calls', function(done) {
        done();
        /*
         dataManager = new DataManager({
         url: serverRoot + '/api/f84710b8'
         });
         dataManager.model('to-do-item').entries().then(function() {
         process.nextTick(function() {
         expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: 'Bearer 044d843f-80db-433e-bc25-6a132823a80f'});
         done();
         });
         }, done);
         */
      });
    }
  });

  describe('model/entry functions', function() {
    beforeEach(function() {
      dataManager = new DataManager({
        url: serverRoot + '/api/f84710b8/',
        accessToken: 'test'
      });
    });
    describe('list models', function() {
      if (isNodeJS) {
        it('api called with correct arguments', function(done) {
          dataManager.modelList().then(function() {
            process.nextTick(function() {
              expect(api.get).to.have.been.calledWith('/api/f84710b8/', {Authorization: "Bearer test"});
              done();
            });
          }, done)
        });
      }
      it('api responds correctly', function() { // check that correct result is output (from mock)
        return expect(dataManager.modelList())
          .to.eventually.have.all.keys('to-do-item');
      });
      if (isNodeJS) {
        it('empty model list should be empty array', function(done) {
          var dm = new DataManager({
            url: serverRoot + '/api/beefbeef/',
            accessToken: 'test'
          });
          dm.modelList().then(function(modelList) {
            process.nextTick(function() {
              expect(modelList).to.exist;
              expect(modelList).to.be.empty;
              done();
            });
          });
        });
      }
    });
    describe('get schema', function() {
      describe('default (get)', function() {
        if (isNodeJS) {
          it('api called with correct arguments', function(done) {
            dataManager.model('to-do-item').getSchema().then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/api/schema/f84710b8/to-do-item');
                done();
              });
            }, done);
          });
        }
        it('api responds correctly', function() { // check that correct result is output (from mock)
          return expect(dataManager.model('to-do-item').getSchema())
            .to.eventually.have.property('id', 'https://datamanager.entrecode.de/api/schema/f84710b8/to-do-item');
        });
      });
      describe('post', function() {
        if (isNodeJS) {
          it('api called with correct arguments', function(done) {
            dataManager.model('to-do-item').getSchema('post').then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/api/schema/f84710b8/to-do-item', {}, {template: 'post'});
                done();
              });
            }, done);
          });
        }
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
      if (isNodeJS) {
        it('api called with correct arguments', function(done) { // check that API connector is correctly called
          dataManager.model('to-do-item').entries().then(function() {
            process.nextTick(function() {
              expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer test"});
              done();
            });
          }, done);
        });
        it('api called with correct arguments entryList', function(done) { // check that API connector is correctly called
          dataManager.model('to-do-item').entryList().then(function(res) {
            process.nextTick(function() {
              expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer test"});
              done();
            });
          }, done);
        });
        it('api called with correct arguments levels support', function(done) {
          dataManager.model('to-do-item').entryList({levels: 2}).then(function(res) {
            process.nextTick(function() {
              expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer test"}, {_levels: 2});
              done();
            });
          }, done);
        });
        it('api called with correct arguments levels support entryList', function(done) {
          dataManager.model('to-do-item').entryList({levels: 2}).then(function(res) {
            process.nextTick(function() {
              expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer test"}, {_levels: 2});
              done();
            });
          }, done);
        });
      }
      it('api responds correctly', function() { // check that correct result is output (from mock)
        return expect(dataManager.model('to-do-item').entries())
          .to.eventually.have.deep.property('0.value.id', 'm1yUQlm2');
      });
      it('api responds correctly entryList', function() { // check that correct result is output (from mock)
        return expect(dataManager.model('to-do-item').entryList())
          .to.eventually.have.deep.property('entries.0.value.id', 'm1yUQlm2');
      });
      it('fail if model not found', function() {
        return expect(dataManager.model('not-found').entries())
          .to.be.rejected;
      });
      it('fail if model not found', function() {
        return expect(dataManager.model('not-found').entryList())
          .to.be.rejected;
      });
      if (isNodeJS) {
        it('model with no entries', function(done) {
          dataManager.model('empty-model').entries().then(function(entries) {
            process.nextTick(function() {
              expect(entries).to.be.empty;
              done();
            });
          });
        })
        it('model with no entries entryList', function(done) {
          dataManager.model('empty-model').entryList().then(function(entries) {
            process.nextTick(function() {
              expect(entries.entries).to.be.empty;
              done();
            });
          });
        });
        describe('with options', function() {
          it('size and page', function(done) {
            dataManager.model('to-do-item').entries({
              size: 5,
              page: 3
            }).then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer test"}, {
                  size: 5,
                  page: 3
                });
                done();
              });
            }, done);
          });
          it('size and page', function(done) {
            dataManager.model('to-do-item').entryList({
              size: 5,
              page: 3
            }).then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer test"}, {
                  size: 5,
                  page: 3
                });
                done();
              });
            }, done);
          });
          it('sort', function(done) {
            dataManager.model('to-do-item').entries({
              sort: [
                'propertyAsc',
                '-propertyDesc',
                '+propertyExplAsc'
              ]
            }).then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer test"}, {sort: 'propertyAsc,-propertyDesc,+propertyExplAsc'});
                done();
              });
            }, done);
          });
          it('sort', function(done) {
            dataManager.model('to-do-item').entryList({
              sort: [
                'propertyAsc',
                '-propertyDesc',
                '+propertyExplAsc'
              ]
            }).then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer test"}, {sort: 'propertyAsc,-propertyDesc,+propertyExplAsc'});
                done();
              });
            }, done);
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
            }).then(function() {
              process.nextTick(function() {
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
            }, done);
          });
          it('filter', function(done) {
            dataManager.model('to-do-item').entryList({
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
            }).then(function() {
              process.nextTick(function() {
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
            }, done);
          });
        });
      }
    });
    describe('get entry', function() {
      if (isNodeJS) {
        it('api called with correct arguments', function(done) { // check that API connector is correctly called
          dataManager.model('to-do-item').entry('my7fmeXh').then(function() {
            process.nextTick(function() {
              expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer test"}, {id: 'my7fmeXh'});
              done();
            });
          }, done);
        });
        it('api called with correct arguments with levels', function(done) { // check that API connector is correctly called
          dataManager.model('to-do-item').entry({id: 'my7fmeXh', levels: 2}).then(function() {
            process.nextTick(function() {
              expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer test"}, {
                id: 'my7fmeXh',
                _levels: 2
              });
              done();
            });
          }, done);
        });
      }
      it('api responds correctly', function() { // check that correct result is output (from mock)
        return expect(dataManager.model('to-do-item').entry('my7fmeXh'))
          .to.eventually.have.deep.property('value.id', 'my7fmeXh');
      });
      it('fail if model not found', function() {
        return expect(dataManager.model('not-found').entry('noentry'))
          .to.be.rejected;
      });
      it('fail if entry not found', function() {
        return expect(dataManager.model('to-do-item').entry('noentry'))
          .to.be.rejected;
      });
    });
    describe('save entry', function() {
      if (isNodeJS) {
        it('api called with correct arguments', function(done) { // check that API connector is correctly called
          var theEntry;
          dataManager.model('to-do-item').entry('my7fmeXh').then(function(entry) {
            theEntry = entry;
            return entry.save();
          }).then(function(entry) {
            process.nextTick(function() {
              expect(api.put).to.have.been.calledWith('/api/f84710b8/to-do-item?id=my7fmeXh', {Authorization: "Bearer test"}, null, theEntry.value);
              done();
            });
          }, done);
        });
      }
    });
    describe('create entry', function() {
      var object = {'todo-text': 'my new item', done: false};
      if (isNodeJS) {
        it('api called with correct arguments', function(done) { // check that API connector is correctly called
          dataManager.model('to-do-item').createEntry(object).then(function() {
            process.nextTick(function() {
              expect(api.post).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer test"}, {}, object);
              done();
            });
          }, done);
        });
      }
      it('api responds correctly', function() { // check that correct result is output (from mock)
        return expect(dataManager.model('to-do-item').createEntry(object))
          .to.eventually.have.deep.property('value.todo-text', 'my new item');
      });
    });
    if (isNodeJS) {
      describe('delete entry', function() {
        it('after getting entry', function(done) { // check that API connector is correctly called
          dataManager.model('to-do-item').entry('my7fmeXh').then(function(entry) {
            return entry.delete();
          }).then(function() {
            process.nextTick(function() {
              expect(api.delete).to.have.been.calledWith('/api/f84710b8/to-do-item?id=my7fmeXh', {Authorization: "Bearer test"});
              done();
            });
          }, done);
        });
        it('directly', function(done) { // check that API connector is correctly called
          dataManager.model('to-do-item').deleteEntry('my7fmeXh');
          expect(api.delete).to.have.been.calledWith('/api/f84710b8/to-do-item?id=my7fmeXh', {Authorization: "Bearer test"});
          done();
        });
      });
    }
    describe('register new anonymous user', function() {
      if (isNodeJS) {
        it('api called with correct arguments', function(done) { // check that API connector is correctly called
          dataManager.register().then(function() {
            process.nextTick(function() {
              expect(api.post).to.have.been.calledWith('/api/f84710b8/_auth/account');
              done();
            });
          }, done);
        });
        it('api responds correctly', function() { // check that correct result is output (from mock)
          return expect(dataManager.register())
            .to.eventually.have.deep.property('jwt');
        });
        it('rejects when dm with no anonymous users', function() { // check that correct result is output (from mock)
          var dm = new DataManager({
            url: serverRoot + '/api/beefbeef/'
          });
          return expect(dm.register())
            .to.eventually.have.been.rejected;
        });
      }
    });
    describe('get and set data manager token', function() {
      it('reading out token', function(done) {
        var token = dataManager.accessToken;
        expect(token).to.equal('test');
        done();
      });
      if (isNodeJS) {
        it('setting token', function(done) {
          dataManager.accessToken = 'newToken';
          dataManager.model('to-do-item').entry('my7fmeXh').then(function() {
            process.nextTick(function() {
              expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer newToken"}, {id: 'my7fmeXh'});
              done();
            });
          }, done);
        });
        it('getting new token and saving it', function(done) {
          return dataManager.register().then(function(user) {
            dataManager.accessToken = user.jwt;
            dataManager.model('to-do-item').entry('my7fmeXh').then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/api/f84710b8/to-do-item', {Authorization: "Bearer " + dataManager.accessToken}, {id: 'my7fmeXh'});
                done();
              });
            }, done);
          });
        });
      }
    });
    if (isNodeJS) {
      describe('dataManager.user() shorthand', function() {
        it('api called with correct arguments', function(done) { // check that API connector is correctly called
          dataManager.user('my7fmeXh').then(function(user) {
            return user.save();
          }).then(function() {
            process.nextTick(function() {
              expect(api.put).to.have.been.calledWith('/api/f84710b8/user?id=my7fmeXh', {Authorization: "Bearer test"});
              done();
            });
          }, done);
        });
      });
    }
  });

  if (isNodeJS) {
    describe('asset helper functions', function() {
      beforeEach(function() {
        dataManager = new DataManager({
          url: serverRoot + '/api/f84710b8/',
          accessToken: 'test'
        });
      });
      describe('getFileURL()', function() {
        it('api called with correct arguments', function(done) { // check that API connector is correctly called
          dataManager.getFileURL('asset-file-redirect')
            .then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/files/asset-file-redirect/url');
                done();
              });
            }, done);
        });
        it('locale parameter', function(done) { // check that API connector is correctly called
          dataManager.getFileURL('asset-file-redirect', 'hu-HU')
            .then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/files/asset-file-redirect/url', {'Accept-Language': 'hu-HU'});
                done();
              });
            }, done);
        });
      });
      describe('getImageURL()', function() {
        it('api called with correct arguments', function(done) { // check that API connector is correctly called
          dataManager.getImageURL('asset-file-redirect')
            .then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/files/asset-file-redirect/url');
                done();
              });
            }, done);
        });
        it('locale parameter', function(done) { // check that API connector is correctly called
          dataManager.getImageURL('asset-file-redirect', null, 'hu-HU')
            .then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/files/asset-file-redirect/url', {'Accept-Language': 'hu-HU'});
                done();
              });
            }, done);
        });
        it('size parameter', function(done) { // check that API connector is correctly called
          dataManager.getImageURL('asset-file-redirect', 500)
            .then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/files/asset-file-redirect/url', null, {size: 500});
                done();
              });
            }, done);
        });
      });
      describe('getImageThumbURL()', function() {
        it('api called with correct arguments', function(done) { // check that API connector is correctly called
          dataManager.getImageThumbURL('asset-file-redirect')
            .then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/files/asset-file-redirect/url', null, {
                  size: 400,
                  thumb: true
                });
                done();
              });
            }, done);
        });
        it('locale parameter', function(done) { // check that API connector is correctly called
          dataManager.getImageThumbURL('asset-file-redirect', null, 'hu-HU')
            .then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/files/asset-file-redirect/url', {'Accept-Language': 'hu-HU'}, {
                  size: 400,
                  thumb: true
                });
                done();
              });
            }, done);
        });
        it('size parameter', function(done) { // check that API connector is correctly called
          dataManager.getImageThumbURL('asset-file-redirect', 200)
            .then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/files/asset-file-redirect/url', null, {
                  size: 200,
                  thumb: true
                });
                done();
              });
            }, done);
        });
        it('normalize size parameter to 400', function(done) { // check that API connector is correctly called
          dataManager.getImageThumbURL('asset-file-redirect', 256)
            .then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/files/asset-file-redirect/url', null, {
                  size: 400,
                  thumb: true
                });
                done();
              });
            }, done);
        });
        it('normalize size parameter to 200', function(done) { // check that API connector is correctly called
          dataManager.getImageThumbURL('asset-file-redirect', 128)
            .then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/files/asset-file-redirect/url', null, {
                  size: 200,
                  thumb: true
                });
                done();
              });
            }, done);
        });
        it('normalize size parameter to 100', function(done) { // check that API connector is correctly called
          dataManager.getImageThumbURL('asset-file-redirect', 64)
            .then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/files/asset-file-redirect/url', null, {
                  size: 100,
                  thumb: true
                });
                done();
              });
            }, done);
        });
        it('normalize size parameter to 50', function(done) { // check that API connector is correctly called
          dataManager.getImageThumbURL('asset-file-redirect', 32)
            .then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/files/asset-file-redirect/url', null, {
                  size: 50,
                  thumb: true
                });
                done();
              });
            }, done);
        });
        it('upper limit for size parameter', function(done) { // check that API connector is correctly called
          dataManager.getImageThumbURL('asset-file-redirect', 512)
            .then(function() {
              process.nextTick(function() {
                expect(api.get).to.have.been.calledWith('/files/asset-file-redirect/url', null, {
                  size: 400,
                  thumb: true
                });
                done();
              });
            }, done);
        });
      });
    });
  }

  describe('public assets', function() {
    beforeEach(function() {
      dataManager = new DataManager({
        url: serverRoot + '/api/f84710b8/',
        accessToken: 'test'
      });
    });
    describe('get assets', function() {
      if (isNodeJS) {
        it('api called with correct arguments', function(done) {
          dataManager.assets().then(function() {
            process.nextTick(function() {
              expect(api.get).to.have.been.calledWith('/asset/f84710b8', {Authorization: "Bearer test"});
              done();
            }, done);
          })
        });
        it('empty asset list', function(done) {
          var dm = new DataManager({
            url: serverRoot + '/api/beefbeef/',
            accessToken: 'test'
          });
          dm.assets().then(function(assets) {
            process.nextTick(function() {
              expect(assets).to.be.empty;
              done();
            }, done);
          });
        });
        it('api called with correct arguments assetList', function(done) {
          dataManager.assetList().then(function() {
            process.nextTick(function() {
              expect(api.get).to.have.been.calledWith('/asset/f84710b8', {Authorization: "Bearer test"});
              done();
            }, done);
          })
        });
        it('empty asset list assetList', function(done) {
          var dm = new DataManager({
            url: serverRoot + '/api/beefbeef/',
            accessToken: 'test'
          });
          dm.assetList().then(function(assets) {
            process.nextTick(function() {
              expect(assets.assets).to.be.empty;
              done();
            }, done);
          });
        });
      }
      it('api response correctly', function() {
        return expect(dataManager.assets())
          .to.eventually.have.deep.property('0.value.assetID', '317d248b-92c5-4ed8-aec5-cfd2bdae5e55');
      });
      it('api response correctly assetList', function() {
        return expect(dataManager.assetList())
          .to.eventually.have.deep.property('assets.0.value.assetID', '317d248b-92c5-4ed8-aec5-cfd2bdae5e55');
      });
    });
    describe('get asset', function() {
      if (isNodeJS) {
        it('api called with correct arguments', function(done) {
          dataManager.asset('317d248b-92c5-4ed8-aec5-cfd2bdae5e55').then(function(asset) {
            process.nextTick(function() {
              expect(api.get).to.have.been.calledWith('/asset/f84710b8', {Authorization: "Bearer test"}, {assetID: '317d248b-92c5-4ed8-aec5-cfd2bdae5e55'});
              done();
            });
          });
        });
      }
      it('api response correctly', function() {
        return expect(dataManager.asset('317d248b-92c5-4ed8-aec5-cfd2bdae5e55'))
          .to.eventually.have.deep.property('value.assetID', '317d248b-92c5-4ed8-aec5-cfd2bdae5e55');
      });
      it('asset not found', function() {
        return expect(dataManager.asset('noasset'))
          .to.be.rejected;
      });
    });
    describe('create asset', function() {
      if (isNodeJS) {
        it.skip('create asset with path', function(done) {
          dataManager.createAsset('./file.jpg').then(function(asset) {
            expect(asset).to.have.deep.property('value.assetID');
            done();
          }).catch(function(err) {
            if (err) {
              return done(err);
            }
          });
        });
      }
    });
    /*
     describe.skip('put assets', function() {
     // TODO
     });
     */
    describe.skip('delete()', function() { //TODO WTAF
      it('api called with correct arguments', function(done) {
        dataManager.asset('317d248b-92c5-4ed8-aec5-cfd2bdae5e55').then(function(asset) {
          return asset.delete();
        }).then(function() {
          process.nextTick(function() {
            expect(api.delete).to.have.been.calledWith('/asset/f84710b8?assetID=317d248b-92c5-4ed8-aec5-cfd2bdae5e55', {Authorization: "Bearer test"});
            done();
          });
        }, done);
      });
    });
  });

  describe('public tags', function() {
    beforeEach(function() {
      dataManager = new DataManager({
        url: serverRoot + '/api/f84710b8/',
        accessToken: 'test'
      });
    });
    describe('get tags', function() {
      if (isNodeJS) {
        it('api called with correct arguments', function(done) {
          dataManager.tags().then(function(tags) {
            process.nextTick(function() {
              expect(api.get).to.have.been.calledWith('/tag/f84710b8', {Authorization: "Bearer test"});
              done();
            });
          })
        });
        it('empty tag list', function(done) {
          var dm = new DataManager({
            url: serverRoot + '/api/beefbeef/',
            accessToken: 'test'
          });
          dm.tags().then(function(tags) {
            process.nextTick(function() {
              expect(tags).to.be.empty;
              done();
            }, done);
          });
        });
      }
      it('api response correctly', function(done) {
        expect(dataManager.tags()).to.eventually.have.deep.property('0.value.tag', 'tag1');
        done();
      });
    });
    describe('get tag', function() {
      if (isNodeJS) {
        it('api called with correct arguments', function(done) {
          dataManager.tag('tag1').then(function(tag) {
            process.nextTick(function() {
              expect(api.get).to.have.been.calledWith('/tag/f84710b8', {Authorization: "Bearer test"}, {tag: 'tag1'});
              done();
            });
          });
        });
      }
      it('api response correctly', function(done) {
        expect(dataManager.tag('tag1')).to.eventually.have.deep.property('value.tag', 'tag1');
        done();
      });
      it('tag not found', function() {
        return expect(dataManager.tag('notfound')).to.be.rejected;
      });
    });
    describe('edit tag', function() {
      if (isNodeJS) {
        it('api called with correct arguments', function(done) {
          dataManager.tags().then(function(tags) {
            return tags[0].save();
          }).then(function(tag) {
            process.nextTick(function() {
              expect(api.put).to.have.been.calledWith('/tag/f84710b8?tag=tag1', {Authorization: "Bearer test"});
              done();
            });
          });
        });
      }
    });
    describe('delete tag', function() {
      if (isNodeJS) {
        it('api called with correct arguments', function(done) {
          dataManager.tag('tag1').then(function(tag) {
            return tag.delete();
          }).then(function() {
            process.nextTick(function() {
              expect(api.delete).to.have.been.calledWith('/tag/f84710b8?tag=tag1', {Authorization: "Bearer test"});
              done();
            });
          });
        });
      }
    });
  });

  describe('replaceLastOccurrence', function() {
    it('replaces correctly', function(done) {
      var result = dataManager.__helpers.replaceLastOccurrence('abcabcabc', 'ab', 'x');
      expect(result).to.equal('abcabcxc');
      done();
    });
    it('does not replace if not found', function(done) {
      var result = dataManager.__helpers.replaceLastOccurrence('abcabcabc', 'x', 'y');
      expect(result).to.equal('abcabcabc');
      done();
    });
  });

});
