var DataManager = require('../index.js'); // in your own project, just use require('ec.datamanager.js')

var dataManager = new DataManager({
  url: 'https://datamanager.entrecode.de/api/f84710b8/',
  accessToken: 'e63dca99-6a56-43a5-8864-1a63ee8565e7'
});

// get entries
dataManager.model('to-do-item').entries()
  .then(function(entries, b) {
    console.log(entries); // success!
  })
  .catch(function(error) {
    console.error(error); // error getting entries
  });
