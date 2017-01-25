[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage][coveralls-image]][coveralls-url] [![Dependency Status][daviddm-image]][daviddm-url]
# ec.datamanager.js

JavaScript SDK for [ec.datamanager](https://doc.entrecode.de/en/latest/data_manager/). By entrecode.

Simply use the generated APIs of the ec.datamanager with JavaScript. Supports usage in frontend (web) and backend (Node.js).

The SDK is fully promise-based. Since version `0.6.0` the SDK is fully [HAL](https://tools.ietf.org/html/draft-kelly-json-hal-07) based and uses [traverson](https://github.com/basti1302/traverson), [traverson-hal](https://github.com/basti1302/traverson-hal), and [halfred](https://github.com/basti1302/halfred).

## Contents

* [Installation](#installation)
* [Usage](#usage)
* [Errors](#errors)
* [Documentation](#documentation)
* [Tests and Coverage](#tests-and-coverage)
* [Build](#build)
* [Changelog](#changelog)

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
Loading the module in node.js:

```js
var DataManager = require('ec.datamanager');
```

Loading the minified module in the Browser:

```js
<script src="bower_components/ec.datamanager.js/build/datamanager.min.js"></script>
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

Initialization without token:

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

Initialization with `clientID` for user management:

```js
var dataManager = new DataManager({
  id: 'beefbeef',
  clientID: 'myAwesomeClient'
});
```

Initialization with `errorHandler`:

```js
var dataManager = new DataManager({
  id: 'beefbeef',
  errorHandler: function(error){
    console.log(error);
  }
});
```

### DataManager
#### Resolve
Retrieves information about the connected Data Manager. Like title, id, …

```js
dataManager.resolve()
.then(function(dm) {
  console.log(dm.metadata.title);
  // Note: dataManager === dm
}, errorHandler);
```

#### Permission Check
To check if the currently instantiated Data Manager has a specific right you can use `can(…)`.

```js
dataManager.can('myModel:put:title')
.then(function(ok) {
  // the SDK is able to perform this action.
}, errorHandler);

dataManager.can('myModel:delete')
.then(okHandler)
.catch(function(err) {
  console.log(err.message); // permission_denied
});
```

#### Enable Cache

```js
dataManager.enableCache('myModel', DataManager.DB_NODEJS)…
// OR
dataManager.enableCache({
  myModel: 3600,
  'my-model-with-dash': 600000
}, DataManager.DB_CORDOVA)
// OR
dataManager.enableCache([
  'myModel',
  'myOtherModel'
], DataManager.DB_BROWSER, 3600)
.then(function(models){
  console.log(models); // Array of LokiJS collections
  models[0].find({ lokiJS: 'doesThis' });
}, errorHandler);
```

*If you use caching, you should not have the fields `$loki` and `meta` in your Model.*

#### Clear Cache
 
```js
dataManager.clearCache('myModel')… // only myModel gets cleared
// OR
dataManager.clearCache([           // all in the array
  'myModel',
  'myOtherModel'
]…
// OR
dataManager.clearCache()			// all models
.then(function(){
  // cache is cleared and disabled
})
.catch(errorHandler)
```

### Model
#### Model List
Retrieves all models of a Data Manager:

```js
dataManager.modelList()
.then(function(modelList) {
  console.log(modelList) // object with models, titles are property names.
  console.log(modelList.myModel.metadata.titleField) // the title field of the model.
  modelList.myModel.entries()…
}, errorHandler);
```

#### Model Resolve
When creating a model directly it will not have the metadata ready. You can retrieve the metadata with `resolve()`.

```js
dataManager.model('myModel').resolve()
.then(function(model){
  console.log(model.metadata.titleField);
  model.entries()…
}, errorHandler);
```

#### Model enable cache

```js
dataManager.model('myModel').enableCache(DataManager.DB_NODEJS, 3600)
.then(function(lokiJSCollection){
  lokiJSCollection.find({ lokiJS: 'doesThis' });
}, errorHandler);
```

#### Model clear cache

```js
dataManager.model('myModel').clearCache()
.then(function() {
  // cache cleared and disabled
}, errorHandler);
```

#### Get JSON Schema
JSON schemas exist for models. To get one call `getSchema()`.

```js
dataManager.model('myModel').getSchema() // will load 'GET' schema
.then(function(myModelSchema) {
  console.log(myModelSchema)
}, errorHandler);

// For PUT or POST schema:
dataManager.model('myModel').getSchema('put'|'post')
.then(…);
```

### Entries
#### Get EntryList
*`size: 0` will return ALL entries*

```js
dataManager.model('myModel').entryList({size: 100, sort: ['property', '-date']})
.then(function(res) {
  console.log(res.entries); // success! array of Entries
  console.log(res.count); // no. of received entries
  console.log(res.total); // total no. of available entries (accesss with pagination)
  if(res.hasOwnProperty('next'){
    res.next().then(…);
  }
  if(res.hasOwnProperty('prev'){
    res.prev().then(…);
  }
  if(res.hasOwnProperty('first'){
    res.first().then(…);
  }
}, errorHandler);
```

#### Get EntryList with cacheType
also works on `entry(…)` and `entries(…)`

```js
dataManager.model('myModel').entryList({ cacheType: 'default' })
.then(function(list){
  console.log(list.entries); // refreshed data when cache was stale, cached data otherwise
}, errorHandler);
…
dataManager.model('myModel').entryList()
.then(function(list){
  console.log(list.entries); // same as cacheType: 'default'
}, errorHandler);
…
dataManager.model('myModel').entryList({ cacheType: 'refresh' })
.then(function(list){
  console.log(list.entries); // contains refreshed entries
}, errorHandler);
…
// the following type only works on entryList, is handled like default on entry/entries
dataManager.model('myModel').entryList({ cacheType: 'stale' })
.then(function(list){
  console.log(list.entries); // contains cache data, even stale
  list.refreshedData().then(function(list){
    console.log(list.entries); // contains refreshed data
  }, errorHandler);
}, errorHandler);

```

#### Get Entries
*`size: 0` will return ALL entries*

```js
dataManager.model('myModel').entries({size: 0, sort: ['property' , '-date']})
.then(function(entries) {
  console.log(entries); // success! array of Entries
  var clonedEntries = DataManager.cloneEntries(entries); // clones entry objects.
}, errorHandler);
```

#### Get Entry

```js
dataManager.model('myModel').entry('my7fmeXh')
.then(function(entry) {
  console.log(entry); // success! an Entry
}, errorHandler);

// OR for nested entries

dataManager.model('myModel').entry('my7fmeXh', 2) // since 0.6.0 no longer object
.then(function(entry) {
  console.log(entry); // success! an Entry
  var clonedEntry = entry.clone(); // clones entry object.
}, errorHandler);
```

#### Get nested Entry
Just like get entry but nested entries will be resolved as proper datamanager SDK objects.

```js
dataManager.model('myModel').nestedEntry('my7fmeXh', 2}) // since 0.6.0 no longer object
.then(function(entry) {
  console.log(entry); // success! an Entry
  entry.value.nestedEntry.delete().then(console.log)); // this will work now.
}, errorHandler);
```

#### Create Entry

```js
dataManager.model('myModel').createEntry({
  some: 'property',
  other: {
    proper: 'T\'s'
  }
})
.then(function(entry){
  console.log(entry.value._id); // the created entry
}, errorHanlder);
```

#### Delete Entry
The `delete()` function is an instance method of `Entry`. Just return `entry.delete()` in your entry promise handler:

```js
dataManager.model('myModel').entry('f328af3')
.then(function(entry) {
  return entry.delete();
})
.then(function() {
  console.log('deleted'); // success!
})
.catch(errorHandler);
```

#### Update Entry
Works similar to `delete()`:

```js
dataManager.model('myModel').entry('f328af3')
.then(function(entry) {
  // first set the new values
  entry.value.key1 = 'new value for key1';
  entry.value.key2 = 2;
  // then save
  return entry.save();
})
.then(function(savedEntry){
  console.log(entry.value.key1); // prints 'new value for key1'
})
.catch(errorHandler);
```

#### Get Title of Entry
Returns the title of any nested entry in the entry.

Example:

```js
dataManager.model('myModel').entry('f328af3', '2')
.then(function(entry) {
  console.log(entry.getTitle('child')); // prints the title of the child 'child'
  // is String for entry
  // is Array of String for entries
}, errorHandler);
```

#### Get Model Name of Entry
Returns the model title of any nested entry in the entry.

Example:

```js
dataManager.model('myModel').entry('f328af3', '2')
.then(function(entry) {
  console.log(entry.getModelTitle('child')); // prints the model title of the child 'child'
}, errorHandler);
```

### Users in the SDK
#### Register Anonymous User.

```js
// register anonymous user.
dataManager.registerAnonymous()
.then(function(user) {
  // token was already added to dataManager instance.
  console.log(user.value.jwt); // token of the user. please save for later.
  console.log(user.value.accountID); // acocuntID of the user
  …
  dataManager.model('myModel')… // this will be using the logged in anonymous user.
  …
  user.logout()… // this will clear the accessToken and reset the sdk instance.
  user.isAnonymous(); // this will be true for anonymous users. false otherwise.
  user.isAnon(); // this will be true for anonymous users. false otherwise.
}, errorHandler);
```

The `accessToken` is a property of the DataManager instance:

```js
dataManager.accessToken; // the currently used token for user authentication
```

#### Logout aka. clear accessToken and reset sdk.

```js
…
// dataManager has a accessToken.
dataManager.logout();
// accessToken has been cleared and internal API connection was reset.
…
```

#### Email Available
You can check for email availability before you regiser a user:

```js
dataManager.emailAvailable('some@mail.com').then(function(available){
  if(available){
    console.log('The email is available');
  } else {
    console.log('The email is NOT available');
  }
}, errorHandler);
```

#### Get Authorizaton Links
In order to receive prefilled urls for all other account management relations you can use `getAuthLink()`.

```js
dataManager.getAuthLink('anonymous', {clientID: 'myAwesomeClientID'})
.then(function(url){
  request.post(url).end(function(err, res){ // your own post request to register a anonymous user.
    …
    // token will not be set in datamanager. but can be manually:
    dataManager.accessToken = res.body.jwt;
  });
  
}, errorHandler);
```

This function provides you with all links found in the root API response with the relation `<dataManagerShortID>:_auth/<linkName>`. Most of them require `clientID` either set in the DataManager instance or directly as shown above. Others require additional properties (e.g. `password-reset`: requires `clientID` and `email`).

Applicable link names are:

* `anonymous`
* `signup`
* `login`
* `password-reset`
* `email-available`
* `public-key.pem`

Additional documentation for user management in Data Manager APIs can be found in the Data Manager documentation itself.

##### Get Account
Get information about the logged in account.

```js
dataManager.account()
.then(function(account) {
  console.log(account.accountID);
}, errorHandler);
```

### Asset File Helper
The SDK can help you getting asset files, and image assets in the right sizes. All file Helper can receive a `locale` property as last parameter if you want to request a specific locale (not the choosen one from Data Manager).

#### Note On Static Helper
The following functions are also provided as static functions in `DataManager`. E.g. you can call `DataManager.getFileUrl(assetID).then(…);` without connecting to a DataManager. This only works for assets in `https://datamanager.entrecode.de` DataManagers (not in Staging).

#### File Helper

```js
dataManager.getFileUrl('46092f02-7441-4759-b6ff-8f3831d3da4b')
.then(function(url) {
  console.log(url)
), errorHandler);
```

#### Image Helper

```js
dataManager.getImageUrl('46092f02-7441-4759-b6ff-8f3831d3da4b', 500)
.then(function(url) {
  console.log(url)
), errorHandler);
```

`getImageURL` expects a pixel value. The largest edge of the returned image will be at least this value pixels in size, if available.

#### Thumbnail Helper

```js
dataManager.getImageThumbUrl('46092f02-7441-4759-b6ff-8f3831d3da4b', 100)
.then(function(url) {
    console.log(url)
), errorHandler);
```

The returned image will be a square-cropped variant with (in this example) at least 100 pixels (pixel value can be set as with `getImageURL`). Available sizes are 50, 100, 200 and 400 px. Other values will be mapped to next bigger one.

### Assets
#### Get AssetList

```js
dataManager.assetList()
.then(function(res) {
  console.log(res.assets); // array with assets
  console.log(res.count);
  console.log(res.total);
}, errorHandler);
```

#### Get Assets

```js
dataManager.assets()
.then(function(assets) {
  console.log(assets); // array with assets
  var clonedAssets = DataManager.cloneAssets(assets); // clones assets objects.
}, errorHandler);
```

#### Get Asset

```js
dataManager.asset('46092f02-7441-4759-b6ff-8f3831d3da4b')
.then(function(asset) {
  console.log(asset); // the Asset
  var clonedAsset = DataManager.cloneAsset(asset); // clones asset objects.
}, errorHandler);
```

#### Create Asset(s)

```js
dataManager.createAsset(formData)
.then(function(assets){
  console.log(assets); // array with Get Asset Promises
  return assets[0]; // this is a Promise!
})
.then(function(asset){
  console.log(asset); // the created Asset.
})
.catch(errorHandler);
```

For node.js acceptable inputs are:

* A path string to a local file (`path/to/file`)
* An array of path strings (`['path/to/file1', 'path/to/file2']`)

For browsers acceptable inputs are:

* [FormData](https://developer.mozilla.org/docs/web/api/formdata)

	Example: 

	```js
	$('form').submit(function (e) {
	  e.preventDefault();
	  var data;
	  data = new FormData();
	  data.append('file', $('#file')[0].files[0]);
	  
	  var dataManager = new DataManager({
	    id: 'c024f209'
	  });
	  dataManager.register();
	  dataManager.createAsset(data).then(function(assets){
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

#### Edit Asset
```js
dataManager.asset('46092f02-7441-4759-b6ff-8f3831d3da4b')
.then(function(asset){
  asset.value.title = 'new title';
  return asset.save();
})
.then(function(savedAsset){
  console.log('success!'); // successfully saved asset
})
.catch(errorHandler);
```

#### Delete Asset
```js
dataManager.asset('46092f02-7441-4759-b6ff-8f3831d3da4b')
.then(function(asset){
  return asset.delete();
})
.then(function(){
  console.log('success!'); // successfully deleted asset
})
.catch(errorHandler);
```

#### Asset File Helper

```js
var url = asset.getFileUrl(); // original file
```

#### Asset Image Helper

```js
var url = asset.getImageUrl(500) // size 500 image files
```

`getImageUrl` expects a pixel value. The largest edge of the returned image will be at least this value pixels in size, if available.

#### Asset Thumbnail Helper

```js
var url = asset.getImageThumbUrl(100); // size 100 thumb files
```

The returned image will be a square-cropped variant with (in this example) at least 100 pixels (pixel value can be set as with `getImageUrl`). Available sizes are 50, 100, 200 and 400 px. Other values will be mapped to next bigger one.


### Tags
#### Get TagList
```js
dataManager.tagList()
.then(function(res){
  console.log(res.tags); // array of tags
  console.log(res.count);
  console.log(res.total);
}, errorHandler);
```

#### Get Tags
```js
dataManager.tags()
.then(function(tags){
  console.log(tags); // array of tags
  var clonedTags = DataManager.cloneTags(tags); // clones tags objects.
}, errorHanlder);
```

#### Get Tag 
```js
dataManager.tag('tag1')
.then(function(tag){
  console.log(tag); // tag
  var clonedTag = DataManager.cloneTag(tag); // clones tag objects.
}).catch(function(error){
  console.log(error); // error getting tag
});
```

#### Edit Tag
```js
dataManager.tag('tag1')
.then(function(tag){
  tag.value.tag = 'newTag';
  return tag.save();
})
.then(function(savedTag){
  console.log('success!'); // successfully saved tag
})
.catch(errorHandler);
```

#### Delete Tag
```js
dataManager.tag('tag1')
.then(function(tag){
  return tag.delete();
})
.then(function(){
  console.log('success!'); // successfully deleted tag
})
.catch(errorHandler);
```

## Errors
* `ec_sdk_no_url_or_id_set` You did not specify a id or url in DataManager constructor.
* `ec_sdk_invalid_url` The url (or url generated from id) was malformed.
* `ec_sdk_model_not_found` When you tried to `model(…).resolve()` a model which is not available in the Data Manager.
* `ec_sdk_invalid_method_for_schema` You specified the wrong method for `model(…).getSchema(<method>)`. Only `get`, `put`, and `post` are allowed.
* `ec_sdk_not_logged_in` Your tried to resolve the account info without being logged in.

## Documentation

### class DataManager

#### Constructor

`new DataManager(options)`
returns new DataManager Object


`options` contains following keys: `url`, `accessToken`,`id`, `errorHandler` and `clientID`. All are optional, but either `url` or `id` have to be set. Depending on the Data Manager Settings you will not be able to modify entries etc. when no accessToken is spcified.

Examples:

```js
// initializing dataManager with existing token
var dataManager = new DataManager({
  url: 'https://datamanager.entrecode.de/api/abcdef',
  accessToken: '8c3b7b55-531f-4a03-b584-09fdef59cb0c'
});

// Initialization without token
var dataManager = new DataManager({
  url: 'https://datamanager.entrecode.de/api/abcdef'
  errorHandler: function(error) {
    handleError(error);
  }
});

// Alternative
var dataManager = new DataManager({
  id: 'abcdef',
  clientID: 'myAwesomeClientID'
});
```

#### DataManager Static Methods
##### `getFileURL(assetID, [locale])`

returns a file url. Optionally, a specific `locale` can be requested.
The promise is getting rejected if no file is found.

##### `getImageURL(assetID, [size, locale])`

returns an image file. `size` is optional and states the size in pixels the largest edge should have at least.

Note that the image may still be smaller if the original image is smaller than `size`. If `size` is omitted, the largest size (i.e. the original image) is returned. Optionally, a specific `locale` can be requested. The promise is getting rejected if no file is found. The following sizes are being returned: 256, 512, 1024, 2048, 4096.

Example: The source image has a largest edge of 3000 pixels. `getImageURL(id, 1000)` will return the 1024px version. `getImageURL(id, 4096)` will return the original file with 3000 pixels.

##### `getImageThumbURL(assetID, size[, locale])`

returns an image thumbnail (square cropped). `size` is required and states the size in pixels the thumbnail square edge should have at least.

Note that the image may still be smaller if the original image is smaller than `size`. Optionally, a specific `locale` can be requested. The promise is getting rejected if no file is found. The following sizes are being returned: 50, 100, 200, 400

##### `cloneEntries(entries)`, `cloneAssets(assets)`, `cloneTags(tags)`

returns a cloned copy of `entries`, `assets`, or `tags`.

##### `cloneEntry(entry)` *deprecated*, `cloneAsset(asset)`, `cloneTag(tag)`

returns a cloned copy of the `entrie`, `asset`, or `tag`.


#### DataManager Instance Methods
##### `enableCache(stringOrArrayofObject[, lokiJsEnv[, maxCacheAge]])`
enables caching for the given models. Either one model title (`String`) or multiple model titles (`Array`) or multiple model titles(`key`) with custom maxCacheAge(`value`) (`Object`). returns a Promise which resolves to a array of LokiJS collections.

*If you use caching, you should not have the fields '$loki' and 'meta' in your Model.*

##### `clearCache(stringOrArray)`
disables and cleares the cache for the given models. Either one model title (`String`) or multiple model titles (`Array`).
return a Promise which resovles after successfully clearing cache.

##### `asset(identifier)`
returns an Asset object as Promise. `identifier` (String) is required.

##### `model(identifier)`
returns a Model object. `identifier` (String) is required.

##### `modelList()`
returns available Models as Promise.

##### `assets()`
returns available Assets as Promise.

##### `assetList()`
returns available Assets as Promise. Promise will resolve a list object containing the properties `assets`, `count`, and `total`.

##### `createAsset(formData|filePath|arrayOfFilePaths)`
creates a new Asset. Returns an Array of Promsises to retrieve the created Assets.

##### `getFileURL(assetID, [locale])`
returns a file url. Optionally, a specific `locale` can be requested.
The promise is getting rejected if no file is found.

##### `getImageURL(assetID, [size, locale])`
returns an image file. `size` is optional and states the size in pixels the largest edge should have at least.

Note that the image may still be smaller if the original image is smaller than `size`. If `size` is omitted, the largest size (i.e. the original image) is returned. Optionally, a specific `locale` can be requested. The promise is getting rejected if no file is found. The following sizes are being returned: 256, 512, 1024, 2048, 4096.

Example: The source image has a largest edge of 3000 pixels. `getImageURL(id, 1000)` will return the 1024px version. `getImageURL(id, 4096)` will return the original file with 3000 pixels.

##### `getImageThumbURL(assetID, size[, locale])`
returns an image thumbnail (square cropped). `size` is required and states the size in pixels the thumbnail square edge should have at least.

Note that the image may still be smaller if the original image is smaller than `size`. Optionally, a specific `locale` can be requested. The promise is getting rejected if no file is found. The following sizes are being returned: 50, 100, 200, 400

##### `registerAnonymous()`
For creating a new anonymous user account. Returns user object with jwt token and accountID. The token is also assigned to DataManager and used with subsequent requests.

Example:

```js
dataManager.registerAnonymous()
.then(function(user) {
   console.log(user.value.jwt); // token to save and send with next startup
})
.catch(function(error) {
   console.error(error);
});
```
##### `logout()`
Syncronous method for clearing the `accessToken` of the SDK and resetting the internal API connection.

##### `getAuthLink(linkName)`
returns an auth link as Promise.

Please see user guide above for details.

##### `emailAvailable(email)`
return an email availability check as Promise.

##### `can(permission)`
Checks if the currently connected Data Manager is able to perform `permission`. Permission format is something like `<model>:<method>:<field>`. Additional documentation can be found in generated documentation of the Data Manager.

#### DataManager Instance Properties
* `accessToken` Access Token for user, or `null`/`undefined` if not set.
* `id` ShortID of the connected Data Manager.
* `url` The url of the connected Data Manager.
* `clientID` ClientID which will be used to generate authLinks, or `null`/`undefined` if not set.
* `errorHandler` The global errorHandler for all erorrs which can occur.
* `DB_NODEJS` LokiJS env for node.
* `DB_CORDOVA` LokiJS env for cordova.
* `DB_BROWSER` LokiJS env for browsers.

### Model object
#### Connecting a Model
```js
var myModel = dataManager.model('myModel');
```
returns Model Object which is a promise.

#### Model Instance Methods
##### `enableCache([lokiJsEnv [, maxCacheAge])`
enables caching for the connected model with `maxCacheAge` (in ms). Returns a Promise which resolves to a LokiJS collection.

##### `clearCache()`
disables and cleares the cache for the model.
return a Promise which resovles after successfully clearing cache.

##### `entries(options)`/`entryList(options)`
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
- `cacheType` - selected cachedType (default: `default`)
	- `default` - refreshes data when stale, cached otherwise
	- `refresh` - refreshes data every time
	- `stale` - resolves promise directly with stale data. add `refreshedData` (`Promise`) to result which can be used to refresh the data asyncronously. This only works on `entryList`.


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
  count: 5,
  next: /* Promise Factory */,
  prev: /* Promise Factory */,
  first: /* Promise Factory */
}
```

##### `entry(id [, levels])`
returns a Entry object as Promise. Levels property can be used to request nested entries.

##### `nestedEntry(id [, levels])`
returns a Entry object as Promise. Levels property can be used to request nested entries. Resolved nested elementes are proper SDK objects with all functions like `save()` and `delete()`.

##### `createEntry(object)`
create a new entry. Returns the Entry.

##### `deleteEntry(id)`
return a Promise for deleting an entry.

##### `getSchema([method])`
retrieve JSON Schema. `method` is `get` by default. Other possible values: `put`, `post`.

##### `resolve()`
return a resolved model as Promise.

Can be used when creating a model object without calling `modelList()` to resolve model metadata.

#### Model Instance Properties
* `id` The model id
* `title` The model title. Same as `id`.
* `metadata` Contains `titleField` and other model metadata.

### Entry Object
#### Entry properties

* `values` The properties of the Entry are available at `entry.values`.

#### Entry Instance Methods

##### save()
saves the entry. Promise.

Example:

```js
// update entry
dataManager.model('myModel').entry('f328af3')
.then(function(entry) {
  entry.values.key1 = 'new value for key1';
  entry.values.key2 = 2;
  return entry.save()
})
.then(function(savedEntry){
  console.log(entry.values.key1 = 'new value for key1';
});
```

##### delete()
deletes the entry. Promise.

Example:

```js
// update entry
dataManager.model('myModel').entry('f328af3')
.then(function(entry) {
  return entry.save()
})
.then(function(){
  console.log('deleted');
});
```
##### getTitle(String)
gets the title of any child entry identified by `String`. Will return `String` for single types and `Array<String>` for multiple types.

Example:

```js
dataManager.model('myModel').entry('f328af3', '2')
.then(function(entry) {
  console.log(entry.getTitle('child')); // prints the title of the child 'child'
  // is String for entry
  // is Array of String for entries
}, errorHandler);
```

##### getModelTitle(String)
gets the model title of any child entry identified by `String`.

Example:

```js
dataManager.model('myModel').entry('f328af3', '2')
.then(function(entry) {
  console.log(entry.getModelTitle('child')); // prints the model title of the child 'child'
}, errorHandler);
```

##### clone()
clones an entry.

Example:

```js
dataManager.model('myModel').entry('f328af3', '2')
.then(function(entry) {
  var newEntry = entry.clone();

  assert(newEntry !== entry);
  assert(newEntry.value._id === entry.value._id);
  assert(newEntry.value.field1 === entry.value.field1);
  assert(newEntry.value.field2 === entry.value.field2);
  // …
}, errorHandler);
```

### Asset object
#### Connecting an Asset
```js
var myAsset = dataManager.asset('8c3b7b55-531f-4a03-b584-09fdef59cb0c');
```
returns Asset as a Promise.

#### Asset properties
* `value` The properties of the Asset are available at `asset.value`.

#### Asset Instance Methods
##### save()
saves a changed Asset. Promise.

Example:

```js
dataManager.asset('8c3b7b55-531f-4a03-b584-09fdef59cb0c')
.then(function(asset){
  asset.value.title = 'New Title';
  return asset.save();
})
.then(function(savedAsset){
  console.log(savedAsset.value.title; // prints 'New Title';
});
```

##### delete()
deletes the asset. Promise.

Example:

```js
dataManager.asset('8c3b7b55-531f-4a03-b584-09fdef59cb0c')
.then(function(asset) {
  return asset.delete();
})
.then(function(){
  console.log('Deleted');
});
```

##### getFileUrl
syncronously returns a file url. Optionally, a specific `locale` can be requested.

##### getImageUrl
syncronously returns an image file. `size` is optional and states the size in pixels the largest edge should have at least.

Note that the image may still be smaller if the original image is smaller than `size`. If `size` is omitted, the largest size (i.e. the original image) is returned. Optionally, a specific `locale` can be requested. The following sizes are being returned: 256, 512, 1024, 2048, 4096.

Example: The source image has a largest edge of 3000 pixels. `getImageURL(id, 1000)` will return the 1024px version. `getImageURL(id, 4096)` will return the original file with 3000 pixels.

##### getImageThumbUrl
syncronously returns an image thumbnail (square cropped). `size` is required and states the size in pixels the thumbnail square edge should have at least.

Note that the image may still be smaller if the original image is smaller than `size`. Optionally, a specific `locale` can be requested. The following sizes are being returned: 50, 100, 200, 400


### Tag Object
#### Connecting a Tag
```js
var myTag = dataManager.tag('myTag');
```
returns Tag as a Promise.

#### Tag Properties
* `value` The properties of the Tag are available at `tag.value`. Typically `tag` and `count`.

#### Tag Instance Methods
##### save()
saves a changed Tag. Promise

```js
dataManager.tag('myTag')
.then(function(tag) {
  tag.value.tag = 'newTagName';
  return tag.save();
})
.then(function(savedTag) {
  console.log(savedTag.value.tag); // prints 'newTagName'
});
```

##### delete()
deletes the Tag. Promise.

Example:

```js
dataManager.tag('myTag')
.then(function(tag) {
  return tag.delete();
})
.then(function(){
  console.log('Deleted');
});
```

## Tests and Coverage

Before running tests, you need to `npm install` the dev dependency modules. For frontend tests `phantomjs 2.0` has to be installed globally.

Running backend Tests with mocha (called with npm):

```sh
npm test
```

Alternative, using [grunt](http://gruntjs.com/):

```sh
grunt test           # tests backend and frontend
grunt test-backend   # only backend
grunt test-frontend  # only frontent
```

Running backend tests with coverage:

```sh
grunt coverage
```

Running frontend Tests with karma:

```sh
grunt test-frontend
```

The task will run a mocked server at port 54815. Make sure it is available.

Installing phantomjs 2.0 with homebrew

```sh
brew install phantomjs
```

## Build

Should not be necessary. A new build for frontend usage (minified) can be triggered with

```sh
grunt build
```

(`npm install` is needed before for installing dev dependency modules)

[npm-image]: https://badge.fury.io/js/ec.datamanager.svg
[npm-url]: https://www.npmjs.com/package/ec.datamanager
[travis-image]: https://travis-ci.org/entrecode/ec.datamanager.js.svg
[travis-url]: https://travis-ci.org/entrecode/ec.datamanager.js
[coveralls-image]: https://coveralls.io/repos/entrecode/ec.datamanager.js/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/entrecode/ec.datamanager.js?branch=master
[daviddm-image]: https://david-dm.org/entrecode/ec.datamanager.js.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/entrecode/ec.datamanager.js
