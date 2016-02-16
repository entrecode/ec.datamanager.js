'use strict';

var halfred = require('halfred');
var locale = require('locale');
var _ = require('lodash');

var util = require('./util');

var Asset = function(asset, dm, traversal) {
  this.value = asset;
  this._dm = dm;
  this._traversal = traversal;
};

Asset.prototype.save = function() {
  var asset = this;
  return new Promise(function(resolve, reject) {
    asset._dm._getTraversal().then(function(traversal) {
      delete asset.value._curies;
      delete asset.value._curiesMap;
      delete asset.value._resolvedCuriesMap;
      delete asset.value._validation;
      delete asset.value._original;
      delete asset.value._embedded;
      traversal.continue().newRequest()
      .follow('ec:api/assets')
      .withTemplateParameters({
        assetID: asset.value.assetID
      }).withRequestOptions(util.requestOptions({
        'Content-Type': 'application/json'
      }))
      .put(asset.value, function(err, res, traversal) {
        util.checkResponse(err, res).then(function(res) {
          if (res.statusCode === 204) {
            return resolve(true);
          }
          asset.value = halfred.parse(JSON.parse(res.body));
          asset._traversal = traversal;
          return resolve(asset);
        }).catch(reject);
      });
    }).catch(reject);
  });
};

Asset.prototype.delete = function() {
  var asset = this;
  return new Promise(function(resolve, reject) {
    asset._dm._getTraversal().then(function(traversal) {
      traversal.continue().newRequest()
      .follow('ec:api/assets')
      .withTemplateParameters({
        assetID: asset.value.assetID
      })
      .withRequestOptions(util.requestOptions())
      .delete(function(err, res) {
        util.checkResponse(err, res).then(function() {
          return resolve(true);
        }).catch(reject);
      });
    });
  });
};

Asset.prototype.getFileUrl = function(locale) {
  return this._negotiate(false, false, null, locale);
};
Asset.prototype.getImageUrl = function(size, locale) {
  if (this.value.type !== 'image') {
    throw new Error('ec.datamanager.js getImageUrl only works on image assets');
  }
  return this._negotiate(true, false, size, locale);
};
Asset.prototype.getImageThumbUrl = function(size, locale) {
  if (this.value.type !== 'image') {
    throw new Error('ec.datamanager.js getImageThumbUrl only works on image assets');
  }
  return this._negotiate(true, true, size, locale);
};

Asset.prototype._negotiate = function(image, thumb, size, requestedLocale) {
  var asset = _.cloneDeep(this.value);

  if (requestedLocale) {
    var supportedLocales = new locale.Locales(_.chain(asset.files).map('locale').uniq().compact().value());
    var bestLocale = (new locale.Locales(requestedLocale)).best(supportedLocales).toString();
    bestLocale = /^([^\.]+)/.exec(bestLocale)[1]; //remove charset
    var filesWithLocale = _.filter(asset.files, function(file) {
      return file.locale === bestLocale;
    });
    if (filesWithLocale && filesWithLocale.length > 0) {
      asset.files = filesWithLocale;
    }
  }
  if (!image && !thumb && asset.type !== 'image') { // for getFileUrl pic fist file and return - not for images
    return asset.files[0].url;
  }
  var allFiles = _.cloneDeep(asset.files);
  _.remove(asset.files, function(file) { // remove image files we have no resolution for (image/svg+xml; fix for CMS-1091)
    return file.resolution === null;
  });
  if (asset.files.length === 0) { // if no file is left pick first of original data
    return allFiles[0].url;
  }
  asset.files = _.sortBy(asset.files, function(file) { // sort by size descending
    return -1 * Math.max(file.resolution.height, file.resolution.width);
  });
  var imageFiles = _.filter(asset.files, function(file) {
    if (thumb) {
      return file.url.indexOf('_thumb') !== -1; // is thumbnail
    } else {
      return file.url.indexOf('_thumb') === -1; // is not a thumbnail
    }
  });
  var largest = imageFiles[0];
  if (size) {
    imageFiles = _.filter(imageFiles, function(file) { // remove all image resolutions that are too small
      return file.resolution.height >= size || file.resolution.width >= size;
    });
    imageFiles = imageFiles.slice(-1); // choose smallest image of all that are greater than size parameter
  }

  if (imageFiles.length > 0) { // if all is good, we have an image now
    return imageFiles[0].url;
  } else {
    // if the requested size is larger than the original image, we take the largest possible one
    return largest.url;
  }
};

module.exports = Asset;