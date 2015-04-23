'use strict';

/* This file is an example node.js script that uses the SDK. */


var DataManager = require('../index.js'); // in your own project, just use require('ec.datamanager.js')

var dataManager = new DataManager({
  url: 'https://datamanager.entrecode.de/api/f84710b8/',
  accessToken: 'e63dca99-6a56-43a5-8864-1a63ee8565e7'
});

// get entries
dataManager.model('to-do-item').entries()
  .then(function(entries) {
    console.log(entries); // success!
  })
  .catch(function(error) {
    console.error(error); // error getting entries
  });


dataManager.model('to-do-item').entry('m1yUQlm2')
  .then(function(entry) {
    entry.value.done = false;
    return entry.save();
  }).then(function(succ) {
    console.log('saved');
  }, function(error) {
    console.error(error); // error updating entry
  });


dataManager.modelList()
  .then(function(modelList) {
    console.log('list of models:')
    console.log(modelList) // array of model id strings
  }, function(error) { // you don't need to use catch(…)
    console.error(error); // error deleting entry
  });
