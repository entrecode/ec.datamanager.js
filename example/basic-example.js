'use strict';

/* This file is an example node.js script that uses the SDK. */

var DataManager = require('../index.js'); // in your own project, just use require('ec.datamanager.js')

// Constructor
var dataManager = new DataManager({
  url: 'https://datamanager.entrecode.de/api/f84710b8/'
  //,  accessToken: 'e63dca99-6a56-43a5-8864-1a63ee8565e7' // if accessToken is omitted, a POST to the users model is
  // done and a new token is retrieved and used
});

// simple list of models
dataManager.modelList()
  .then(function(modelList) {
    console.log('list of models:')
    console.log(modelList) // models
  }, function(error) { // you don't need to use catch(…)
    console.error(error); // error deleting entry
  });

// get entries
dataManager.model('to-do-item').entries() // optionally, you can send request options as parameter for entries()
  .then(function(entries) {
    console.log(entries); // success!
  })
  .catch(function(error) {
    console.error(error); // error getting entries
  });

var myOwnEntryID;
// create new entry
dataManager.model('to-do-item').createEntry({
  'todo-text': 'should be done',
  done: false
})
  .then(function(entry) {
    myOwnEntryID = entry.value.id;
  })
  // get single entry by id
  .then(function() {
    dataManager.model('to-do-item').entry(myOwnEntryID)
      // alter and save (put) entry
      .then(function(entry) {
        entry.value.done = false;
        return entry.save();
      }).then(function() {
        console.log('saved');
      }, function(error) {
        console.error(error); // error updating entry
      });
  });

// Assets API
var dataManager2 = new DataManager({
  url: 'https://datamanager.angus.entrecode.de/api/6bdcbeb3/'
  //,  accessToken: 'e63dca99-6a56-43a5-8864-1a63ee8565e7' // if accessToken is omitted, a POST to the users model is
  // done and a new token is retrieved and used
});

dataManager2.getFileURL('a3b04329-1a6c-4557-b23f-48b9f85cb54d')
  .then(function(url) {
    console.log('file URL:', url);
  });

dataManager2.getImageURL('a3b04329-1a6c-4557-b23f-48b9f85cb54d')
  .then(function(url) {
    console.log('image URL:', url);
  });

dataManager2.getImageThumbURL('a3b04329-1a6c-4557-b23f-48b9f85cb54d')
  .then(function(url) {
    console.log('thumb URL:', url);
  });

var dm = new DataManager({
  url: 'https://datamanager.angus.entrecode.de/api/c024f209/'
});

dm.assets().then(function(assets) {
  console.log(assets); // Array of promises.
  assets[0].then(function(asset) {
    console.log(asset);
  });
});

// for node usage (for browser usage see createAssetExample.html)
dm.createAsset('./file.jpg').then(function(assets) {
  assets[0].then(function(asset) {
    console.log(asset);
    return asset.delete(); // and now delete again
  });
}).then(function() {
  console.log('Deleted.');
}).catch(function(err) {
  console.log(err);
});