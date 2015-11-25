'use strict';

var isNode = typeof process !== 'undefined';

if (isNode) { // require only in node, frontend knows things. ;)
  var chai                    = require('chai') // main testing lib
    , expect                  = chai.expect
    , traverson               = require('traverson')
    , TraversonJsonHalAdapter = require('traverson-hal')

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