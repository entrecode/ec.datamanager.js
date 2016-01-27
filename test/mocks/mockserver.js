/**
 * Express webserver which uses the same files for mocked responses as nock uses for node.js mocking.
 * I know this is not an ideal solution but it will work for now.
 * Maybe we can use https://github.com/mmalecki/hock someday.
 */


'use strict';

var bodyParser = require('body-parser')
  , express    = require('express')
  , fs         = require('fs')
  , path       = require('path')
  , walk       = require('walk')
  , _          = require('lodash')
  ;

var port = 54815;

var app = express();
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Expose-Headers', 'Allow');
  if (req.get('Access-Control-Request-Headers')) {
    res.header('Access-Control-Allow-Headers', req.get('Access-Control-Request-Headers'));
  }
  next();
});
app.use(bodyParser.json());

app.all('/*', function(req, res, next) {
  if (req.method.toLowerCase() === 'options') {
    return res.status(200).send('GET, PUT, POST, DELETE').end();
  }
  var filePath = path.resolve(__dirname, req.path.slice(1));
  var walker   = walk.walk(filePath);
  var stop     = false;
  walker.on('file', function(root, fileStat, nextFile) {
    if (stop) {
      return nextFile();
    }
    if (fileStat.name.indexOf(req.method.toLowerCase()) === -1) {
      return nextFile();
    }
    fs.readFile(path.resolve(root, fileStat.name), function(err, data) {
      if (err) {
        return nextFile();
      }
      var file = JSON.parse(data);
      if (!_.isEqual(file.qs, req.query)) {
        return nextFile();
      }
      file.req = JSON.parse(JSON.stringify(file.req)
      .split('https://datamanager.entrecode.de').join('http://localhost:54815/datamanager')
      .split('https://appserver.entrecode.de').join('http://localhost:54815/appserver')
      .split('https://accounts.entrecode.de').join('http://localhost:54815/accounts'));
      if (!_.isEqual(file.req, req.body)) {
        return nextFile();
      }
      stop     = true;
      file.res = JSON.parse(JSON.stringify(file.res)
      .split('https://datamanager.entrecode.de').join('http://localhost:54815/datamanager')
      .split('https://appserver.entrecode.de').join('http://localhost:54815/appserver')
      .split('https://accounts.entrecode.de').join('http://localhost:54815/accounts'));
      res.status(fileStat.name.split('.')[1]).send(file.res);
      return nextFile();
    });
  });
  walker.on('end', function() {
    if (res.hasOwnProperty('statusCode')) {
      return res.end();
    } else {
      return next(new Error('No mock found for ' + req.originalUrl + ' body ' + JSON.stringify(req.body) + ' with method ' + req.method));
    }
  });
  walker.on('error', function(root, nodeStatsArray, next) {
    nodeStatsArray.forEach(function(n) {
      console.error('walker error ' + n.name);
      console.error(n.error.message || (n.error.code + ": " + n.error.path));
    });
    next();
  });
});

app.listen(port, function() {
  console.info('Testserver started an listening on port ' + port);
});

module.exports = app;
