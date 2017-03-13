'use strict';

var halfred = require('halfred');
var locale = require('locale');
var util = require('./util');

var Asset = function(asset, dm) {
  this.value = asset;
  this._dm = dm;
};

Asset.prototype.save = function() {
  var asset = this;
  return Promise.resolve()
  .then(function() {
    return asset._dm._getTraversal();
  })
  .then(function(traversal) {
    delete asset.value._curies;
    delete asset.value._curiesMap;
    delete asset.value._resolvedCuriesMap;
    delete asset.value._validation;
    delete asset.value._original;
    delete asset.value._embedded;
    return util.putP(
      traversal.continue().newRequest()
      .follow('ec:api/assets')
      .withTemplateParameters({
        assetID: asset.value.assetID
      }).withRequestOptions(asset._dm._requestOptions({
        'Content-Type': 'application/json'
      })),
      asset.value
    );
  })
  .then(function(res) {
    return util.checkResponse(res[0]);
  })
  .then(function(res) {
    if (res.statusCode === 204) {
      return Promise.resolve(true);
    }
    asset.value = halfred.parse(JSON.parse(res.body));
    return Promise.resolve(asset);
  })
  .catch(util.errorHandler);
};

Asset.prototype.delete = function() {
  var asset = this;
  return Promise.resolve()
  .then(function() {
    return asset._dm._getTraversal();
  })
  .then(function(traversal) {
    return util.deleteP(
      traversal.continue().newRequest()
      .follow('ec:api/assets')
      .withTemplateParameters({
        assetID: asset.value.assetID
      })
      .withRequestOptions(asset._dm._requestOptions())
    );
  })
  .then(function(res) {
    return util.checkResponse(res[0]);
  })
  .then(function() {
    return Promise.resolve(true);
  })
  .catch(util.errorHandler);
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
  var asset = JSON.parse(JSON.stringify(this.value));

  if (requestedLocale) {
    var supportedLocales = new locale.Locales(compact(uniq(asset.files.map(function(elem) {
      return elem.locale;
    }))));
    var bestLocale = (new locale.Locales(requestedLocale)).best(supportedLocales).toString();
    bestLocale = /^([^\.]+)/.exec(bestLocale)[1]; //remove charset
    var filesWithLocale = asset.files.filter(function(file) {
      return file.locale === bestLocale;
    });
    if (filesWithLocale && filesWithLocale.length > 0) {
      asset.files = filesWithLocale;
    }
  }
  if (!image && !thumb && asset.type !== 'image') { // for getFileUrl pic fist file and return - not for images
    return asset.files[0].url;
  }
  var first = asset.files[0];
  asset.files = remove(asset.files, function(file) { // remove image files we have no resolution for (image/svg+xml; fix for CMS-1091)
    return file.resolution === null;
  });
  if (asset.files.length === 0) { // if no file is left pick first of original data
    return first.url;
  }
  asset.files.sort(function(left, right) { // sort by size descending
    var leftMax = Math.max(left.resolution.height, left.resolution.width);
    var rightMax = Math.max(right.resolution.height, right.resolution.width);
    if (leftMax < rightMax) {
      return 1;
    } else if (leftMax > rightMax) {
      return -1;
    } else {
      return 0;
    }
  });
  var imageFiles = asset.files.filter(function(file) {
    if (thumb) {
      return file.url.indexOf('_thumb') !== -1; // is thumbnail
    } else {
      return file.url.indexOf('_thumb') === -1; // is not a thumbnail
    }
  });
  if (!imageFiles || imageFiles.length === 0) {
    imageFiles = asset.files;
  }
  var largest = imageFiles[0];
  if (size) {
    imageFiles = imageFiles.filter(function(file) { // remove all image resolutions that are too small
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

Asset.prototype.getOriginal = function () {
  var asset = JSON.parse(JSON.stringify(this.value));

  if (asset.type !== 'image') {
    return undefined;
  }

  asset.files = remove(asset.files, function (file) { // remove image files we have no resolution for (image/svg+xml; fix for CMS-1091)
    return file.resolution === null;
  });
  if (asset.files.length === 0) {
    return undefined;
  }
  asset.files.sort(function (left, right) { // sort by size descending
    var leftMax = Math.max(left.resolution.height, left.resolution.width);
    var rightMax = Math.max(right.resolution.height, right.resolution.width);
    if (leftMax < rightMax) {
      return 1;
    } else if (leftMax > rightMax) {
      return -1;
    } else {
      return 0;
    }
  });

  return asset.files[0];
};

function uniq(arr) {
  var u = {}, a = [];
  for (var i = 0, l = arr.length; i < l; ++i) {
    if (Object.prototype.hasOwnProperty.call(u, arr[i])) {
      continue;
    }
    a.push(arr[i]);
    u[arr[i]] = 1;
  }
  return a;
}

function compact(arr) {
  var a = [];
  for (var i = 0; i < arr.length; i++) {
    if (arr[i]) {
      a.push(arr[i]);
    }
  }
  return a;
}

function remove(arr, func) {
  var a = [];
  for (var i = 0; i < arr.length; i++) {
    if (!func.call(this, arr[i])) {
      a.push(arr[i]);
    }
  }
  return a;
}

module.exports = Asset;
