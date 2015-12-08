'use strict';

var isNode = typeof process !== 'undefined';

if (isNode) {
  var nock = require('nock')
    , walk = require('walk')
    , path = require('path')
    , fs   = require('fs')
    , _    = require('lodash')
    ;

  before(function(done) { // global before hook: swap axios for axios mock
    var dmMock = nock('https://datamanager.entrecode.de');
    var baseDM = path.resolve(__dirname, 'datamanager');
    var walker = walk.walk(baseDM);
    walker.on('file', function(root, fileStat, next) {
      if (fileStat.name.charAt(0) === '.') {
        return next();
      }
      var reqPath = root.replace(baseDM, '');
      var fileElems = fileStat.name.split('.');
      fs.readFile(path.resolve(root, fileStat.name), function(err, data) {
        if (err) {
          console.warn('Could not read file ' + root + '/' + fileStat.name);
          return next();
        }
        var file = JSON.parse(data);

        if (!_.isEmpty(file.req)) {
          dmMock = dmMock[fileElems[0]](reqPath, file.req).times(1000).query(file.qs).reply(fileElems[1], file.res);
        } else {
          dmMock = dmMock[fileElems[0]](reqPath).times(1000).query(file.qs).reply(fileElems[1], file.res);
        }

        return next();
      });
    });
    walker.on('end', function() {
      return done();
    });
  });
  after(function(done) {
    nock.restore();
    return done();
  });
}