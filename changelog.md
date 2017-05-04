# Changelog
## 0.12.4
- best file functions in Entry

## 0.12.3
- export sub types in typings

## 0.12.2
- typings update

## 0.12.1
- typings update

## 0.12.0
- dependency updates
- page indication in entryList
- bugfix in filter optinons handling


## 0.11.11
- support for new _fields querystring on entries api

## 0.11.10
- got original file for all assets not only images

## 0.11.9
- get original file from asset CMS-2684

## 0.11.8
- handle FormData properly on createAsset

## 0.11.7
- tags and title property on createAsset

## 0.11.6
- damn you browser build

## 0.11.5
- fix for typings
- Promise polyfill only when Promise is undefined

## 0.11.3 - 0.11.4
- typescript typings

## 0.11.2
- forgot the browser build

## 0.11.1
- fixed nested object with creator set (CMS-2510)

## 0.11.0
- several patches
- version number for 0.11.x of appcms

## 0.10.4
- fix when calling dm.account() with loggend in ec-user.

## 0.10.3
- fix for user/account inconsistency (CMS-2381)
- fix for missing auth link (CMS-2386)
- `user.isAnon()`/`user.isAnonymous()` added
- fix for wrong nested handling of last level (CMS-2404)

## 0.10.2
- make entries from a cached model saveable without error

## 0.10.1
- better handling of certain server errors

## 0.10.0
- optimized clone entry functions
- deprecated DataManager.cloneEntry() in favor of entry.clone()
- dependency update

## 0.9.8
- new build
- fixed version in bower.json

## 0.9.7
- fixed a bug where entryList's `next`, `prev` and `first` functions did work only once

## 0.9.6
- make clone of options object when creating pagination promise factories in entryList

## 0.9.5
- adds new browserify build 

## 0.9.4
- improved nested handling on entry save

## 0.9.3
- improved logout and cache clear

## 0.9.2
- fixed another bug in `next`, `prev`, and `first`

## 0.9.1
- fixed bug introduced by `next`, `prev`, and `first` CMS-2194

## 0.9.0
- use active promise for refreshing data when using cache CMS-2120.
- adds pagination links to `entryList` (`next`, `prev`, `first`) CMS-2076.

## 0.8.1
- fixed rare cases when cache metadata is invalid

## 0.8.0
- cache entries with [LokiJS](http://lokijs.org/)
- cache functionality has to be enable per model basis with `enableCache(…)`
- IMPORTANT: if cache is enabled ALL entries of the model will be loaded
- adds clone functions for assets, tags, and entries
- adds getModelTitle(…) to Entry CMS-2069

## 0.7.9
- fixed some rare cases where nested entries are broken

## 0.7.8
-fixed some bugs with those nested entries (CMS-2129)

## 0.7.7
- fixed bug when saving nested entries (CMS-2127)

## 0.7.6
- fix for creating a sdk with `{url: null, id: 'beefbeef'}` (CMS-2029)

## 0.7.5
- fix for asset file helper and gif (speak: gif) files (CMS-2022)

## 0.7.4
- removes lodash dependency
- shiro-trie version without lodash dependency

## 0.7.3
- fixed bug when using modelList and new model caching

## 0.7.2
- fixed bug when handling accessTokens

## 0.7.1
- day one bugfixes :)

## 0.7.0
- removed usage of `…/options` relation. using templated links directly. requires datamanager 0.7.0+
- adds syncronous file helper on Assets
- adds support for public permission checks
- adds logout function for deleting and resetting a datamanager sdk instance
- adds global error callback to datamanager object
- nested elements are proper resources with `nestedEntry`
- some refactoring
- bugfixes

## 0.6.3
- fixed error when adding new values to previously created entry when model gets additional fields. thx felix...

## 0.6.2
- fixed bestFile routes in instantiated sdks

## 0.6.1
- bugfixes
- single result functions will resolve with first element from lists

## 0.6.0
- major refactor of SDK.
- SDK propperly uses [HAL](https://tools.ietf.org/html/draft-kelly-json-hal-07) now.
- Added `clientID` to constructor.
- Added static Asset Helper Functions.
- Added `metadata` to model objects.
- Added `resolve` Promise to model object for directly connected models.
- Added `tagList` similar to `entryList` and `assetList`.
- Create Asset now handles arrays of file paths in node.
- BREAKING: `register` now  called `registerAnonymous`.
- Added auth link convinence function.
- Added email available Promise.
- Added `getTitle` to entry object for nested entries.
- Asset save implemented.
- New object User (WIP)
- `value` objects are [halfred](https://github.com/basti1302/halfred) objects.
- Frontend tests use phantomjs 2.0 (needs to be installed globally by system; switch to other browser in `test/karma.conf.js` if not available).
- removed dependency for weird ec.appcms-mock module
- Adds Data Manager resolve method.
- Adds Account resolve method.
- `entry(…)` with filter resulting in list response will return the first one
- I am sure I forgot something here…

## 0.5.3
- modelList updated

## 0.5.2
- fixed bug when datamanager has no anonymous users activated CMS-1694

## 0.5.1
- fixed 204 no content response on create entry
- fixed bug when post/put without token

## 0.5.0
- added support for new authentication/authorization with anonymous users. Use [dm.register(…)](#user-management).
- removed readonly flag. Data Manager use new user logic now which is not applicable to readonly. See [Data Manager doc](https://doc.entrecode.de/en/latest/data_manager/#user-management) for details.

## 0.4.6
- nested entry support with `entry({id: '<id>', levels: 2})…`

## 0.4.5
- nested entries with `level` filter property

## 0.4.4
- fixes a bug when uploading Assets

## 0.4.3
- Dependency update

## 0.4.2
- removes lodash from dependencies
- fixed some issues in the docs

## 0.4.1
- adds titleField and hexColor to model prototype

## 0.4.0
- handle single resources in public api properly
- use embedded resources instead of link relations for modelList

## 0.3.4
- add error parser for response middlewares CMS-1187

## 0.3.3
- use new file url for asset helpers

## 0.3.2
- adds `entryList` and `assetList` with count and total properties.

## 0.3.1
- empty lists responde with empty array instead of plain body
- documentation improved

## 0.3.0
- added public tag api
- fix bug: entry save will return entry, not string

## 0.2.9
- rebuild

## 0.2.8
- switched to new getImage(Thumb)URL api

## 0.2.7
- bugfixes for readonly mode

## 0.2.6
- added browserify and uglify as local packages to avoid dependencies to globally installed packages
- fixed bug in getAssets methods - should return promises now

## 0.2.5
- use new bestFile API with /url parameter for asset helper functions

## 0.2.4
- bugfixes

## 0.2.3
- added public asset api
- moved asset helper functions into DataManager object
	- instead of `dataManager.asset(id).get[File|Image|ImageThumb]URL();`
	- use `dataManager.get[File|Image|ImageThumb]URL(id);`

## 0.2.2
- added readonly flag to disable automatic obtaining of access token
- bugfix: usage in the browser now works as expected (no `require('DataManager');` needed)

## 0.2.1
- bugfix release

## 0.2.0
- initial public release
