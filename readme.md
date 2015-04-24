# ec.datamanager.js

JavaScript SDK for [ec.datamanager](https://entrecode.de/datamanager). By entrecode.

Simply use the generated APIs of the ec.datamanager with JavaScript. Supports usage in frontend (web) and backend (Node.js).

The SDK is fully promise-based.

## Installation

In node.js with [npm](http://npmjs.org):

```
npm install ec.datamanager
```

## Usage

Also see `./example/basic-example.js` for a running usage example.


Loading the module in node.js:

```
var DataManager = require('ec.datamanager.js');

```

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

```
istanbul cover _mocha -- -R spec
```

Test coverage is 100%.