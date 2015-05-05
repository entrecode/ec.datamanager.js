# ec.datamanager.js

JavaScript SDK for [ec.datamanager](https://entrecode.de/datamanager). By entrecode.

Simply use the generated APIs of the ec.datamanager with JavaScript. Supports usage in frontend (web) and backend (Node.js).

The SDK is fully promise-based.

## Installation

With [npm](http://npmjs.org) (for backend or frontend usage):

```
npm install git+ssh://git@stash.entrecode.de:7999/cms/ec.datamanager.js.git
```

With [bower](http://bower.io/) (for frontend usage in the Browser):

```
bower install git+ssh://git@stash.entrecode.de:7999/cms/ec.datamanager.js.git
```

## Usage

Also see `./example/basic-example.js` for a running usage example.


Loading the module in node.js:

```
var DataManager = require('ec.datamanager.js');

```

Loading the minified module in the Browser:

```
<script src="bower_components/ec.datamanager.js/build/datamanager.js"></script>
```
(if you did not install using bower, the first part of the path may be different)

### Initialization

You need to connect to your Data Manager API using the `DataManager(options)` constructor.

Initializing dataManager with existing token:

```
var dataManager = new DataManager({
    url: 'https://datamanager.entrecode.de/api/abcdef',
    accessToken: '8c3b7b55-531f-4a03-b584-09fdef59cb0c'
});
```

Initialization without token (will be generated):

```
var dataManager = new DataManager({
    url: 'https://datamanager.entrecode.de/api/abcdef'
});
```

Alternative:

```
var dataManager = new DataManager({
    id: 'abcdef'
});
```

### Get Entries

```
dataManager.model('myModel').entries({size: 100, sort: ['property' , '-date'])
.then(function(entries) {
   console.log(entries); // success!
})
.catch(function(error) {
   console.error(error); // error getting entries
});
```
You can also use `entry(entryID)` for a single Entry, identified by its id.

### Create Entry

```
dataManager.model('myModel').createEntry({})
.fail(function(error) {
   console.error(error); // error creating entry
});
```

### Delete Entry
The `delete()` function is an instance method of `Entry`. Just return `entry.delete()` in your entry promise handler:

```
dataManager.model('myModel').entry('f328af3') // entry('f328af3') is shorthand for entries({id: 'f328af3'})
.then(function(entry) {
   return entry.delete();
})
.then(function() {
   console.log('deleted'); // success!
})
.catch(function(error) {
   console.error(error); // error deleting entry
});
```

### Update Entry
Works similar to `delete()`:

```
dataManager.model('myModel').entry('f328af3')
.then(function(entry) {
   entry.key1 = 'new value for key1';
   entry.key2 = 2;
   return entry.save();
})
.fail(function(error) {
   console.error(error); // error updating entry
});
```

### Model List
Retrieves all models of a Data Manager:

```
dataManager.modelList()
.then(function(modelList) {
   console.log(modelList) // object with model id properties
}, function(error) { // you don't need to use catch(…)
   console.error(error); // error
});
```

### Get JSON Schema

```
dataManager.model('myModel').getSchema()
.then(function(myModelSchema) {
   console.log(myModelSchema)
})
.catch(function(error) {
   console.error(error); // error deleting entry
});

// For PUT or POST schema:
dataManager.model('myModel').getSchema('PUT')
.then(…)
```

### User Management

```
// post user (automatically called if no token is sent with dataManager initialization)
dataManager.register()
.then(function(token) {
   console.log(token); // token to save and send with next startup
})
.catch(function(error) {
   console.error(error); // error deleting entry
});
```

The `accessToken` is a property of the DataManager instance:

```
dataManager.accessToken; // returns currently saved token for user authentication
```

Full example for updating a user entry:

```
dataManager.user('a78fb8') // dataManager.user(id) is shorthand for dataManager.model('user').entry(id) 
.then(function(user) {
   user.email = 'new@adress.com';
   return user.save();
})
.fail(function(error) {
   console.error(error); // error updating entry
});
```

### Assets
The SDK can help you getting asset files, and image assets in the right sizes.

```
dataManager.asset('46092f02-7441-4759-b6ff-8f3831d3da4b').getFileURL()
.then(function(url) {
    console.log(url)
), function(error) {
    console.error(error); // error getting asset file
}
```

For image Assets, the following helper is available:

```
dataManager.asset('46092f02-7441-4759-b6ff-8f3831d3da4b').getImageURL(500)
.then(function(url) {
    console.log(url)
), function(error) {
    console.error(error); // error getting asset file
}
```

`getImageURL` expects a pixel value. The largest edge of the returned image will be at least this value pixels in size, if available.

You can also request a thumbnail:

```
dataManager.asset('46092f02-7441-4759-b6ff-8f3831d3da4b').getImageThumbURL(100)
.then(function(url) {
    console.log(url)
), function(error) {
    console.error(error); // error getting asset file
}
```
The returned image will be a square-cropped variant with (in this example) at least 100 pixels (pixel value can be set as with `getImageURL`). Available sizes are 50, 100, 200 and 400 px.


# Documentation

## class DataManager

### Constructor

`new DataManager(options)`
returns new DataManager Object


`options` contains following keys: `url`, `accessToken`, `id`. All are optional, but either `url` or `id` have to be set. When omitting `accessToken`, a new token will be requested, saved and used.


Example:

```
// initializing dataManager with existing token
var dataManager = new DataManager({
    url: 'https://datamanager.entrecode.de/api/abcdef',
    accessToken: '8c3b7b55-531f-4a03-b584-09fdef59cb0c'
});

// Initialization without token (will be generated)
var dataManager = new DataManager({
    url: 'https://datamanager.entrecode.de/api/abcdef'
});

// Alternative
var dataManager = new DataManager({
    id: 'abcdef'
});
```

### DataManager Instance Methods

#### `asset(identifier)`

returns an Asset object as Promise. `identifier` (String) is required.

#### `model(identifier)`

returns a Model object as Promise. `identifier` (String) is required.


#### `modelList()`
returns available Models as object.

Example:

```
// list models
dataManager.modelList()
.then(function(modelList) {
   console.log(modelList) // object with model id properties
}, function(error) { // you don't need to use catch(…)
   console.error(error); // error deleting entry
});
```

#### `register()`
POSTs to `user` model for creating a new anonymous user account. Returns `token` to be used with DataManager initialization. The token is also assigned to DataManager and used with subsequent requests.

Example:

```
// post user (automatically called if no token is sent with dataManager initialization)
dataManager.register()
.then(function(token) {
   console.log(token); // token to save and send with next startup
})
.catch(function(error) {
   console.error(error); // error deleting entry
});
```

### DataManager Instance Properties

`accessToken` - Access Token for user, or `null` if not set

## Asset object

### Connecting an Asset

```
var myAsset = asset('8c3b7b55-531f-4a03-b584-09fdef59cb0c');
```
returns Asset Object which is a promise.

### Asset Instance Methods

#### getFileURL([locale])

returns a file. Optionally, a specific `locale` can be requested.
The promise is getting rejected if no file is found.

#### getImageURL([size, locale])

returns an image file. `size` is optional and states the size in pixels the largest edge should have at least.
Note that the image may still be smaller if the original image is smaller than `size`. If `size` is omitted, the largest size (i.e. the original image) is returned.
Optionally, a specific `locale` can be requested.
The promise is getting rejected if no file is found.
The following sizes are being returned: 256, 512, 1024, 2048, 4096
Example: The source image has a largest edge of 3000 pixels. `getImageURL(1000)` will return the 1024px version. `getImageURL(4096)` will return the original file with 3000 pixels.

#### getImageThumbURL(size[, locale])

returns an image thumbnail (square cropped). `size` is required and states the size in pixels the thumbnail square edge should have at least.
Note that the image may still be smaller if the original image is smaller than `size`.
Optionally, a specific `locale` can be requested.
The promise is getting rejected if no file is found.
The following sizes are being returned: 50, 100, 200, 400


## Model object

### Connecting a Model

```
var myModel = dataManager.model('myModel');
```
returns Model Object which is a promise.

### Model Instance Methods

#### entries(options)

returns JSON Array of Entries (async).
The request can be configured using `options`.
Valid keys are:

- `size` – number of entries to get (default: 10)
- `page` – which page of entries to get when there are more than `size` (default: 1)
- `sort` – sort by a different than the default property. Syntax: `{direction}{property}[,…]` where `direction` defaults to `+` (ascending order) and can be set to `-` (descending order) and `property` is the property to sort after. Can even be multiple properties (Array).
- `filter` – for filtering after properties. Always an object with properties as key. The keys can have the following possible values:
    - `exact`: exact filter. Value is the value to match exactly
    - `search`: search filter. Value is the value to include
    - `from`: Range filter: value is the value to have as lower end (≥)
    - `to`: Range filter: value is the value to have as upper end (≤) 
    - `any`: Multiple-exact-match filter. Value is an Array containing allowed values (OR)
    - `all`: Multiple-exact-match filter. Value is an Array containing required values (AND)

Example:

```
// get entries
dataManager.model('myModel').entries({size: 100, sort: ['property' , '-date'])
.then(function(entries) {
   console.log(entries); // success!
})
.catch(function(error) {
   console.error(error); // error getting entries
});

```

#### entry(id)

shorthand for entries({id: …})

#### createEntry(object)

create a new entry. Returns the Entry.

#### getSchema([method])

retrieve JSON Schema. `method` is 'GET' by default. Other possible values: 'PUT', 'POST'.

### Model Instance Properties

`id` - The model id

## Entry Object

### Entry Instance Methods

#### save()
saves the entry

Example:

```
// update entry
dataManager.model('myModel').entry('f328af3')
.then(function(entry) {
   entry.key1 = 'new value for key1';
   entry.key2 = 2;
   return entry.save()
});
```
Note that `save()` also returns a promise.

# Tests & Coverage

Running backend Tests with mocha:

```
mocha
```

Alternative, using [grunt](http://gruntjs.com/):

```
grunt test-backend
```

Running backend tests with coverage:

```
istanbul cover _mocha -- -R spec
```

Alternative, using [grunt](http://gruntjs.com/):

```
grunt run:coverage
```

Test coverage is 100%.


Running frontend Tests with karma:

```
grunt test-frontend
```

The task will run a mocked server at port 7472. Make sure it is available.

# Build

Should not be necessary. A new build for frontend usage (minified) can be triggered with

```
grunt build
```

