[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage][coveralls-image]][coveralls-url] [![Dependency Status][daviddm-image]][daviddm-url]
# ec.datamanager.js

JavaScript SDK for [ec.datamanager](https://entrecode.de/datamanager). By entrecode.

Simply use the generated APIs of the ec.datamanager with JavaScript. Supports usage in frontend (web) and backend (Node.js).

The SDK is fully promise-based.

## Installation

With [npm](http://npmjs.org) (for backend or frontend usage):

```sh
npm install ec.datamanager
```

With [bower](http://bower.io/) (for frontend usage in the Browser):

```sh
bower install ec.datamanager
```

The bower module only includes the minified build (and no tests etc.).

## Usage

Also see `./example/basic-example.js` for a running usage example.


Loading the module in node.js:

```js
var DataManager = require('ec.datamanager');

```

Loading the minified module in the Browser:

```js
<script src="bower_components/ec.datamanager.js/build/datamanager.js"></script>
```

`DataManager` is then globally available.

(if you did not install using bower, the first part of the path may be different)

### Initialization

You need to connect to your Data Manager API using the `DataManager(options)` constructor.

Initializing dataManager with existing token:

```js
var dataManager = new DataManager({
    url: 'https://datamanager.entrecode.de/api/abcdef',
    accessToken: '8c3b7b55-531f-4a03-b584-09fdef59cb0c'
});
```

Initialization without token (will be generated):

```js
var dataManager = new DataManager({
    url: 'https://datamanager.entrecode.de/api/abcdef'
});
```

Alternative:

```js
var dataManager = new DataManager({
    id: 'abcdef12'
});
```
### Get EntryList

```js
dataManager.model('myModel').entryList({size: 100, sort: ['property', '-date']})
.then(function(res) {
   console.log(res.entries); // success! array of Entries
   console.log(res.count);
   console.log(res.total);
})
.catch(function(error) {
   console.error(error); // error getting entries
});
```

*`size: 0` will return ALL entries*


### Get Entries

```js
dataManager.model('myModel').entries({size: 100, sort: ['property' , '-date'])
.then(function(entries) {
   console.log(entries); // success! array of Entries
})
.catch(function(error) {
   console.error(error); // error getting entries
});
```
You can also use `entry(entryID)` for a single Entry, identified by its id. *`size: 0` will return ALL entries*

### Create Entry

```js
dataManager.model('myModel').createEntry({})
.catch(function(error) {
   console.error(error); // error creating entry
});
```

### Delete Entry
The `delete()` function is an instance method of `Entry`. Just return `entry.delete()` in your entry promise handler:

```js
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

```js
dataManager.model('myModel').entry('f328af3')
.then(function(entry) {
   entry.key1 = 'new value for key1';
   entry.key2 = 2;
   return entry.save();
})
.catch(function(error) {
   console.error(error); // error updating entry
});
```

### Model List
Retrieves all models of a Data Manager:

```js
dataManager.modelList()
.then(function(modelList) {
   console.log(modelList) // object with model id properties
}, function(error) { // you don't need to use catch(…)
   console.error(error); // error
});
```

### Get JSON Schema

```js
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

```js
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

```js
dataManager.accessToken; // returns currently saved token for user authentication
```

Full example for updating a user entry:

```js
dataManager.user('a78fb8') // dataManager.user(id) is shorthand for dataManager.model('user').entry(id) 
.then(function(user) {
   user.email = 'new@adress.com';
   return user.save();
})
.catch(function(error) {
   console.error(error); // error updating entry
});
```

### Asset File Helper
The SDK can help you getting asset files, and image assets in the right sizes.

```js
dataManager.getFileURL('46092f02-7441-4759-b6ff-8f3831d3da4b')
.then(function(url) {
    console.log(url)
), function(error) {
    console.error(error); // error getting asset file
}
```

For image Assets, the following helper is available:

```js
dataManager.getImageURL('46092f02-7441-4759-b6ff-8f3831d3da4b', 500)
.then(function(url) {
    console.log(url)
), function(error) {
    console.error(error); // error getting asset file
}
```

`getImageURL` expects a pixel value. The largest edge of the returned image will be at least this value pixels in size, if available.

You can also request a thumbnail:

```js
dataManager.getImageThumbURL('46092f02-7441-4759-b6ff-8f3831d3da4b', 100)
.then(function(url) {
    console.log(url)
), function(error) {
    console.error(error); // error getting asset file
}
```
The returned image will be a square-cropped variant with (in this example) at least 100 pixels (pixel value can be set as with `getImageURL`). Available sizes are 50, 100, 200 and 400 px.

### Get AssetList

```js
dataManager.assetList()
.then(function(res) {
  console.log(res.assets); // array with assets
  console.log(res.count);
  console.log(res.total);
})
.catch(function(error){
  console.error(error); // error getting asset list
});
```

### Get Assets

```js
dataManager.assets()
.then(function(assets) {
  console.log(assets); // array with assets
})
.catch(function(error){
  console.error(error); // error getting asset list
});
```

### Get Asset

```js
dataManager.asset('46092f02-7441-4759-b6ff-8f3831d3da4b')
.then(function(asset) {
  console.log(assets); // the Asset
})
.catch(function(error){
  console.error(error); // error getting Asset list
});
```

### Create Asset

```js
dataManager.createAsset(formData)
.then(function(assets){
  console.log(assets); // array with Get Asset promises
  return assets[0];
})
.then(function(asset){
  console.log(asset); // the created Asset.
})
.catch(function(error){
  console.error(error); // error creating Asset
});
```

For node.js acceptable inputs are:

* A path string to a local file (`path/to/file`)
* Currently only path is supported. Others are planned.

For browsers acceptable inputs are:

* [FormData](https://developer.mozilla.org/de/docs/Web/API/FormData)

	Example: 

	```js
	$( 'form' ).submit(function ( e ) {
	  e.preventDefault();
	  var data;
	  data = new FormData();
	  data.append( 'file', $( '#file' )[0].files[0] );
	  
	  var dataManager = new DataManager({
	    url: 'https://datamanager.angus.entrecode.de/api/c024f209/'
	  });
	  dataManager.createAsset(data).then(function(assets){
	    console.log(assets);
	    return assets[0];
	  }).then(function(asset){
        console.log(asset); // the created Asset.
      })
      .catch(function(err){
	    console.log(err);
	  });

	  e.preventDefault();
	});
	```

### Edit Asset
```js
dataManager.asset('46092f02-7441-4759-b6ff-8f3831d3da4b')
.then(function(asset){
  asset.value.title = 'new title';
  return asset.save();
}).then(function(savedAsset){
  console.log('success!'); // successfully saved asset
}).catch(function(error){
  console.log(error); // error modifying asset
});
```

### Delete Asset
```js
dataManager.asset('46092f02-7441-4759-b6ff-8f3831d3da4b')
.then(function(asset){
  return asset.delete();
}).then(function(){
  console.log('success!'); // successfully deleted asset
}).catch(function(error){
  console.log(error); // error deleting asset
});
```

### Get Tags
```js
dataManager.tags()
.then(function(tags){
  console.log(tags); // array of tags
}).catch(function(error){
  console.log(error); // error getting tags
});
```

### Get Tag 
```js
dataManager.tag('tag1')
.then(function(tag){
  console.log(tag); // tag
}).catch(function(error){
  console.log(error); // error getting tag
});
```

### Edit Tag
```js
dataManager.tag('tag1')
.then(function(tag){
  tag.value.tag = 'newTag';
  return tag.save();
}).then(function(savedTag){
  console.log('success!'); // successfully saved tag
}).catch(function(error){
  console.log(error); // error modifying tag
});
```

### Delete Tag
```js
dataManager.tag('tag1')
.then(function(tag){
  return tag.delete();
}).then(function(){
  console.log('success!'); // successfully deleted tag
}).catch(function(error){
  console.log(error); // error deleted tag
});
```

# Documentation

## class DataManager

### Constructor

`new DataManager(options)`
returns new DataManager Object


`options` contains following keys: `url`, `accessToken`, `id`, `readonly`. All are optional, but either `url` or `id` have to be set. When omitting `accessToken`, a new token will be requested, saved and used. If you set `readonly` to `true`, no token will be received. Depending on the Data Manager Settings you will then not be able to modify entries.


Example:

```js
// initializing dataManager with existing token
var dataManager = new DataManager({
    url: 'https://datamanager.entrecode.de/api/abcdef',
    accessToken: '8c3b7b55-531f-4a03-b584-09fdef59cb0c'
});

// Initialization without token (will be generated)
var dataManager = new DataManager({
    url: 'https://datamanager.entrecode.de/api/abcdef'
});

// Initialization without token in read only mode (no token will be created)
var dataManager = new DataManager({
    url: 'https://datamanager.entrecode.de/api/abcdef',
    readonly: true
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

```js
// list models
dataManager.modelList()
.then(function(modelList) {
   console.log(modelList) // object with model id properties
}, function(error) { // you don't need to use catch(…)
   console.error(error); // error deleting entry
});
```

#### `assets()`
returns available Assets as array of Promises.

Example:

```js
dataManager.assets().then(function(assets) {
  console.log(assets); // Array of promises.
  assets[0].then(function(asset) {
    console.log(asset); // Resolved promise of first asset
  });
});
```

#### `register()`
POSTs to `user` model for creating a new anonymous user account. Returns `token` to be used with DataManager initialization. The token is also assigned to DataManager and used with subsequent requests.

Example:

```js
// post user (automatically called if no token is sent with dataManager initialization)
dataManager.register()
.then(function(token) {
   console.log(token); // token to save and send with next startup
})
.catch(function(error) {
   console.error(error); // error deleting entry
});
```

#### Asset Helper Methods

#### `getFileURL(assetID, [locale])`

returns a file. Optionally, a specific `locale` can be requested.
The promise is getting rejected if no file is found.

#### `getImageURL(assetID, [size, locale])`

returns an image file. `size` is optional and states the size in pixels the largest edge should have at least.
Note that the image may still be smaller if the original image is smaller than `size`. If `size` is omitted, the largest size (i.e. the original image) is returned.
Optionally, a specific `locale` can be requested.
The promise is getting rejected if no file is found.
The following sizes are being returned: 256, 512, 1024, 2048, 4096
Example: The source image has a largest edge of 3000 pixels. `getImageURL(id, 1000)` will return the 1024px version. `getImageURL(id, 4096)` will return the original file with 3000 pixels.

#### `getImageThumbURL(assetID, size[, locale])`

returns an image thumbnail (square cropped). `size` is required and states the size in pixels the thumbnail square edge should have at least.
Note that the image may still be smaller if the original image is smaller than `size`.
Optionally, a specific `locale` can be requested.
The promise is getting rejected if no file is found.
The following sizes are being returned: 50, 100, 200, 400

#### `createAsset(formData|filePath)`

creates a new Asset. Returns an Array of Promsises to retrieve the created Assets.


### DataManager Instance Properties

`accessToken` - Access Token for user, or `null` if not set

## Asset object

### Connecting an Asset

```js
var myAsset = asset('8c3b7b55-531f-4a03-b584-09fdef59cb0c');
```
returns Asset Object which is a promise.

### Asset properties

#### value
The properties of the Asset are available at asset.value.

### Asset Instance Methods

#### save()
*TBD*

#### delete()
deletes the asset

Example:

```js
dataManager.entry('8c3b7b55-531f-4a03-b584-09fdef59cb0c')
.then(function(asset) {
   return asset.delete();
});
```
Note that `delete()` also returns a promise.

## Model object

### Connecting a Model

```js
var myModel = dataManager.model('myModel');
```
returns Model Object which is a promise.

### Model Instance Methods

#### entries(options)/entryList(options)

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

```js
// get entries
dataManager.model('myModel').entries({size: 100, sort: ['property' , '-date'])
.then(function(entries) {
   console.log(entries); // success!
})
.catch(function(error) {
   console.error(error); // error getting entries
});
```

 `entries()` will return an array of entries. `entryList()` will return an object with the following structure:

```js
{
  entries: [
    /* array of entries */
  ],
  total: 10,
  count: 5
}
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

### Entry properties

#### values
The properties of the Entry are available at entry.values.

### Entry Instance Methods

#### save()
saves the entry

Example:

```js
// update entry
dataManager.model('myModel').entry('f328af3')
.then(function(entry) {
   entry.values.key1 = 'new value for key1';
   entry.values.key2 = 2;
   return entry.save()
});
```
Note that `save()` also returns a promise.

# Tests & Coverage

Before running tests, you need to `npm install` the dev dependency modules.

Running backend Tests with mocha:

```sh
mocha
```

Alternative, using [grunt](http://gruntjs.com/):

```sh
grunt test-backend
```

Running backend tests with coverage:

```sh
istanbul cover _mocha -- -R spec
```

Alternative, using [grunt](http://gruntjs.com/):

```sh
grunt run:coverage
```

Test coverage is 100%.


Running frontend Tests with karma:

```sh
grunt test-frontend
```

The task will run a mocked server at port 54815. Make sure it is available.

# Build

Should not be necessary. A new build for frontend usage (minified) can be triggered with

```sh
grunt build
```

(`npm install` is needed before for installing dev dependency modules)


# Changelog

### 0.4.2
- removes lodash from dependencies
- fixed some issues in the docs

### 0.4.1
- adds titleField and hexColor to model prototype

### 0.4.0
- handle single resources in public api properly
- use embedded resources instead of link relations for modelList

### 0.3.4
- add error parser for response middlewares CMS-1187

### 0.3.3
- use new file url for asset helpers

### 0.3.2
- adds `entryList` and `assetList` with count and total properties.

### 0.3.1
- empty lists responde with empty array instead of plain body
- documentation improved

### 0.3.0
- added public tag api
- fix bug: entry save will return entry, not string

### 0.2.9
- rebuild

### 0.2.8
- switched to new getImage(Thumb)URL api

### 0.2.7
- bugfixes for readonly mode

### 0.2.6
- added browserify and uglify as local packages to avoid dependencies to globally installed packages
- fixed bug in getAssets methods - should return promises now

### 0.2.5
- use new bestFile API with /url parameter for asset helper functions

### 0.2.4
- bugfixes

### 0.2.3
- added public asset api
- moved asset helper functions into DataManager object
	- instead of `dataManager.asset(id).get[File|Image|ImageThumb]URL();`
	- use `dataManager.get[File|Image|ImageThumb]URL(id);`

### 0.2.2
- added readonly flag to disable automatic obtaining of access token
- bugfix: usage in the browser now works as expected (no `require('DataManager');` needed)

### 0.2.1
- bugfix release

### 0.2.0
- initial public release

[npm-image]: https://badge.fury.io/js/ec.datamanager.svg
[npm-url]: https://www.npmjs.com/package/ec.datamanager
[travis-image]: https://travis-ci.org/entrecode/ec.datamanager.js.svg
[travis-url]: https://travis-ci.org/entrecode/ec.datamanager.js
[coveralls-image]: https://coveralls.io/repos/entrecode/ec.datamanager.js/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/entrecode/ec.datamanager.js?branch=master
[daviddm-image]: https://david-dm.org/entrecode/ec.datamanager.js.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/entrecode/ec.datamanager.js
