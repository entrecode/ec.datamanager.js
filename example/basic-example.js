var DataManager = require('../index.js'); // in your own project, just use require('ec.datamanager.js')
var q     = require('q');
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


var entry = dataManager.model('to-do-item').entry('m1yUQlm2')
    .then(function(entry) {
    entry.done = false;
    return entry;
  /*  var promise =  q.defer();//(entry);
    promise.save = function() {
      console.log('saving');
    };
    return promise;*/
  });
/*
  entry.save()
  .then(function(succ) {
    console.log('saved');
  })
  .fail(function(error) {
    console.error(error); // error updating entry
  });
*/

