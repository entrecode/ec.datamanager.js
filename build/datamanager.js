!function(a){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=a();else if("function"==typeof define&&define.amd)define([],a);else{var b;b="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,b.DataManager=a()}}(function(){var a;return function b(a,c,d){function e(g,h){if(!c[g]){if(!a[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);var j=new Error("Cannot find module '"+g+"'");throw j.code="MODULE_NOT_FOUND",j}var k=c[g]={exports:{}};a[g][0].call(k.exports,function(b){var c=a[g][1][b];return e(c?c:b)},k,k.exports,b,a,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(a,b,c){function d(){k=!1,h.length?j=h.concat(j):l=-1,j.length&&e()}function e(){if(!k){var a=setTimeout(d);k=!0;for(var b=j.length;b;){for(h=j,j=[];++l<b;)h[l].run();l=-1,b=j.length}h=null,k=!1,clearTimeout(a)}}function f(a,b){this.fun=a,this.array=b}function g(){}var h,i=b.exports={},j=[],k=!1,l=-1;i.nextTick=function(a){var b=new Array(arguments.length-1);if(arguments.length>1)for(var c=1;c<arguments.length;c++)b[c-1]=arguments[c];j.push(new f(a,b)),1!==j.length||k||setTimeout(e,0)},f.prototype.run=function(){this.fun.apply(null,this.array)},i.title="browser",i.browser=!0,i.env={},i.argv=[],i.version="",i.versions={},i.on=g,i.addListener=g,i.once=g,i.off=g,i.removeListener=g,i.removeAllListeners=g,i.emit=g,i.binding=function(a){throw new Error("process.binding is not supported")},i.cwd=function(){return"/"},i.chdir=function(a){throw new Error("process.chdir is not supported")},i.umask=function(){return 0}},{}],2:[function(a,b,c){"use strict";function d(a){return new Promise(function(b,c){a.readonly||"object"!=typeof a.accessToken?b(a):a.accessToken.then(function(c){a.accessToken=c,b(a)},c)})}function e(a){var b={};if(a&&a.hasOwnProperty("size")&&(b.size=a.size),a&&a.hasOwnProperty("page")&&(b.page=a.page),a&&a.hasOwnProperty("sort")&&Array.isArray(a.sort)&&(b.sort=a.sort.join(",")),a&&a.hasOwnProperty("filter"))for(var c in a.filter)if(a.filter.hasOwnProperty(c)){var d=a.filter[c];d.hasOwnProperty("exact")&&(b[c]=d.exact),d.hasOwnProperty("search")&&(b[c+"~"]=d.search),d.hasOwnProperty("from")&&(b[c+"From"]=d.from),d.hasOwnProperty("to")&&(b[c+"To"]=d.to),d.hasOwnProperty("any")&&Array.isArray(d.any)&&(b[c]=d.any.join(",")),d.hasOwnProperty("all")&&Array.isArray(d.all)&&(b[c]=d.all.join("+"))}return b}function f(a,b,c){var d=a.lastIndexOf(b);return d>=0&&d+b.length<=a.length&&(a=a.substring(0,d)+c+a.substring(d+b.length)),a}var g=a("./api.js"),h=a("superagent");a("es6-promise").polyfill();var i=function(a){if(!a||!a.hasOwnProperty("url")&&!a.hasOwnProperty("id"))throw new Error("DataManager constructor requires an options object with either 'url'  or 'id' set.");if(a.hasOwnProperty("url")?this.url=a.url:(this.id=a.id,this.url="https://datamanager.entrecode.de/api/"+this.id),"/"!==this.url.slice(-1)&&(this.url+="/"),this.id||(this.id=this.url.split("/").reverse()[1]),this.assetUrl=this.url.replace("/api/"+this.id+"/","/asset/"+this.id),this.tagUrl=this.url.replace("/api/"+this.id+"/","/tag/"+this.id),!/^[a-f0-9]+$/i.test(this.id))throw new Error("Invalid URL");a.hasOwnProperty("accessToken")?(this.accessToken=a.accessToken,this.readonly=!1):a.hasOwnProperty("readonly")&&a.readonly?(this.accessToken=null,this.readonly=!0):(this.accessToken=this.register().then(function(a){return a.value.temporaryToken}),this.readonly=!1)};i.prototype.getFileURL=function(a,b){var c=this.url.replace("api/"+this.id+"/","files/"+a);c+="/url";var d=b?{"Accept-Language":b}:null;return g.get(c,d,{},function(a){return a=JSON.parse(a),a.url})},i.prototype.getImageURL=function(a,b,c){var d=this.url.replace("api/"+this.id+"/","files/"+a);d+="/url";var e=c?{"Accept-Language":c}:null;return g.get(d,e,{size:b},function(a){return a=JSON.parse(a),a.url})},i.prototype.getImageThumbURL=function(a,b,c){var d=this.url.replace("api/"+this.id+"/","files/"+a);d+="/url",b=b&&50>=b?50:b&&100>=b?100:b&&200>=b?200:400;var e=c?{"Accept-Language":c}:null;return g.get(d,e,{size:b,thumb:!0},function(a){return a=JSON.parse(a),a.url})},i.prototype.modelList=function(){return d(this).then(function(a){var b="Bearer "+a.accessToken;return g.get(a.url,{Authorization:b},{},function(b){var c=JSON.parse(b),d=new RegExp("^"+a.id+":(.+$)"),e={};for(var f in c._embedded)if(c._embedded.hasOwnProperty(f)){var g=d.exec(f)[1],h=c._embedded[f];e[g]=a.model(g,h.titleField,h.hexColor)}return e})})},i.prototype.model=function(a,b,c){var h=this,i=h.url+a,k=h.id;return{id:a,titleField:b||"id",hexColor:c||"#ffffff",createEntry:function(b){return d(h).then(function(c){return g.post(i,{Authorization:"Bearer "+c.accessToken},{},b,function(b){var d=JSON.parse(b);return d.hasOwnProperty("status")&&d.hasOwnProperty("code")&&d.hasOwnProperty("title")?d:d.hasOwnProperty("_embedded")&&d._embedded.hasOwnProperty(k+":"+a)?new j(d._embedded[k+":"+a],"Bearer "+c.accessToken,k,a):d.hasOwnProperty("count")||d.hasOwnProperty("total")?d:new j(d,"Bearer "+c.accessToken,k,a)})})},deleteEntry:function(a){return d(h).then(function(b){return g["delete"](i,{Authorization:"Bearer "+b.accessToken},{id:a})})},entries:function(b){return d(h).then(function(c){return g.get(i,{Authorization:"Bearer "+c.accessToken},e(b),function(b){var d=JSON.parse(b);if(d.hasOwnProperty("status")&&d.hasOwnProperty("code")&&d.hasOwnProperty("title"))return d;if(d.hasOwnProperty("_embedded")&&d._embedded.hasOwnProperty(k+":"+a)){Array.isArray(d._embedded[k+":"+a])||(d._embedded[k+":"+a]=[d._embedded[k+":"+a]]);var e=[];for(var f in d._embedded[k+":"+a])d._embedded[k+":"+a].hasOwnProperty(f)&&e.push(new j(d._embedded[k+":"+a][f],"Bearer "+c.accessToken,k,a));return e}return[]})})},entryList:function(b){return g.get(i,{Authorization:"Bearer "+h.accessToken},e(b),function(b){var c=JSON.parse(b);if(c.hasOwnProperty("status")&&c.hasOwnProperty("code")&&c.hasOwnProperty("title"))return c;if(c.hasOwnProperty("_embedded")&&c._embedded.hasOwnProperty(k+":"+a)){Array.isArray(c._embedded[k+":"+a])||(c._embedded[k+":"+a]=[c._embedded[k+":"+a]]);var d=[];for(var e in c._embedded[k+":"+a])c._embedded[k+":"+a].hasOwnProperty(e)&&d.push(new j(c._embedded[k+":"+a][e],"Bearer "+h.accessToken,k,a));return{entries:d,count:c.count,total:c.total}}return{entries:[],count:0,total:0}})},entry:function(b){return d(h).then(function(c){return g.get(i,{Authorization:"Bearer "+c.accessToken},{id:b},function(b){var d=JSON.parse(b);return d.hasOwnProperty("status")&&d.hasOwnProperty("code")&&d.hasOwnProperty("title")?d:d.hasOwnProperty("_embedded")&&d._embedded.hasOwnProperty(k+":"+a)?new j(d._embedded[k+":"+a],"Bearer "+c.accessToken,k,a):d.hasOwnProperty("count")||d.hasOwnProperty("total")?d:new j(d,"Bearer "+c.accessToken,k,a)})})},getSchema:function(a){if(a||(a="get"),a.toLowerCase(),-1===["get","put","post"].indexOf(a))throw new Error("invalid value for method. Allowed values: get, put, post");return g.get(f(i,"/api","/api/schema"),{},{template:a},JSON.parse)}}},i.prototype.user=function(a){return this.model("user").entry(a)},i.prototype.register=function(){return this.model("user").createEntry({"private":!0})},i.prototype.assets=function(a){return d(this).then(function(b){var c="Bearer "+b.accessToken;return g.get(b.assetUrl,{Authorization:c},e(a),function(a){var b=JSON.parse(a);if(b.hasOwnProperty("status")&&b.hasOwnProperty("code")&&b.hasOwnProperty("title"))return b;if(b.hasOwnProperty("_embedded")&&b._embedded.hasOwnProperty("ec:api/asset")){Array.isArray(b._embedded["ec:api/asset"])||(b._embedded["ec:api/asset"]=[b._embedded["ec:api/asset"]]);var d=[];for(var e in b._embedded["ec:api/asset"])b._embedded["ec:api/asset"].hasOwnProperty(e)&&d.push(new k(b._embedded["ec:api/asset"][e],c));return d}return[]})})},i.prototype.assetList=function(a){return d(this).then(function(b){var c="Bearer "+b.accessToken;return g.get(b.assetUrl,{Authorization:c},e(a),function(a){var b=JSON.parse(a);if(b.hasOwnProperty("status")&&b.hasOwnProperty("code")&&b.hasOwnProperty("title"))return b;if(b.hasOwnProperty("_embedded")&&b._embedded.hasOwnProperty("ec:api/asset")){Array.isArray(b._embedded["ec:api/asset"])||(b._embedded["ec:api/asset"]=[b._embedded["ec:api/asset"]]);var d=[];for(var e in b._embedded["ec:api/asset"])b._embedded["ec:api/asset"].hasOwnProperty(e)&&d.push(new k(b._embedded["ec:api/asset"][e],c));return{assets:d,count:b.count,total:b.total}}return{assets:[],count:0,total:0}})})},i.prototype.asset=function(a){return d(this).then(function(b){return g.get(b.assetUrl,{Authorization:"Bearer "+b.accessToken},{assetID:a},function(a){var c=JSON.parse(a);return c.hasOwnProperty("status")&&c.hasOwnProperty("code")&&c.hasOwnProperty("title")?c:new k(c,"Bearer "+b.accessToken)})})},i.prototype.createAsset=function(a){return d(this).then(function(b){return"string"==typeof a?new Promise(function(c,d){h("POST",b.assetUrl).set("Authorization","Bearer "+b.accessToken).attach("file",a).end(function(a,e){if(a)return d(a);if(e.status>=200&&e.status<300){if(e.body.hasOwnProperty("_links")&&e.body._links.hasOwnProperty("ec:asset")){Array.isArray(e.body._links["ec:asset"])||(e.body._links["ec:asset"]=[e.body._links["ec:asset"]]);var f=/^.*\?assetID=([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12})$/,g=[];for(var h in body._links["ec:asset"])if(body._links["ec:asset"].hasOwnProperty(h)){var i=f.exec(body._links["ec:asset"][h].href)[1];g.push(b.asset(i))}return c(g)}return c(e.body)}return d(e.body)})}):"object"==typeof a?g.post(b.assetUrl,{Authorization:"Bearer "+b.accessToken},{},a,function(a){var c=JSON.parse(a);if(c.hasOwnProperty("status")&&c.hasOwnProperty("code")&&c.hasOwnProperty("title"))return c;if(c.hasOwnProperty("_links")&&c._links.hasOwnProperty("ec:asset")){Array.isArray(c._links["ec:asset"])||(c._links["ec:asset"]=[c._links["ec:asset"]]);var d=/^.*\?assetID=([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12})$/,e=[];for(var f in c._links["ec:asset"])if(c._links["ec:asset"].hasOwnProperty(f)){var g=d.exec(c._links["ec:asset"][f].href)[1];e.push(b.asset(g))}return e}}):void 0})},i.prototype.tags=function(a){return d(this).then(function(b){var c="Bearer "+b.accessToken;return g.get(b.tagUrl,{Authorization:c},e(a),function(a){var b=JSON.parse(a);if(b.hasOwnProperty("status")&&b.hasOwnProperty("code")&&b.hasOwnProperty("title"))return b;if(b.hasOwnProperty("_embedded")&&b._embedded.hasOwnProperty("ec:api/tag")){Array.isArray(b._embedded["ec:api/tag"])||(b._embedded["ec:api/tag"]=[b._embedded["ec:api/tag"]]);var d=[];for(var e in b._embedded["ec:api/tag"])b._embedded["ec:api/tag"].hasOwnProperty(e)&&d.push(new l(b._embedded["ec:api/tag"][e],c));return d}return[]})})},i.prototype.tag=function(a){return d(this).then(function(b){return g.get(b.tagUrl,{Authorization:"Bearer "+b.accessToken},{tag:a},function(a){var c=JSON.parse(a);return c.hasOwnProperty("status")&&c.hasOwnProperty("code")&&c.hasOwnProperty("title")?c:new l(c,"Bearer "+b.accessToken)})})},b.exports=i;var j=function(a,b,c,d){this.value=a,this.authHeaderValue=b,this.save=function(){return g.put(this.value._links.self.href,{Authorization:this.authHeaderValue},null,this.value,function(a){var e=JSON.parse(a);return e.hasOwnProperty("status")&&e.hasOwnProperty("code")&&e.hasOwnProperty("title")?e:e.hasOwnProperty("_embedded")&&e._embedded.hasOwnProperty(c+":"+d)?new j(e._embedded[c+":"+d],b,c,d):e.hasOwnProperty("count")||e.hasOwnProperty("total")?e:new j(e,b,c,d)})},this["delete"]=function(){return g["delete"](this.value._links.self.href,{Authorization:this.authHeaderValue})}},k=function(a,b){this.value=a,this.authHeaderValue=b,this.save=function(){return g.put(this.value._links.self.href,{Authorization:this.authHeaderValue},null,this.value,function(a){var c=JSON.parse(a);return c.hasOwnProperty("status")&&c.hasOwnProperty("code")&&c.hasOwnProperty("title")?c:new k(c,b)})},this["delete"]=function(){return g["delete"](this.value._links.self.href,{Authorization:this.authHeaderValue})}},l=function(a,b){this.value=a,this.authHeaderValue=b,this.save=function(){return g.put(this.value._links.self.href,{Authorization:this.authHeaderValue},null,this.value,function(a){var c=JSON.parse(a);return c.hasOwnProperty("status")&&c.hasOwnProperty("code")&&c.hasOwnProperty("title")?c:new l(c,b)})},this["delete"]=function(){return g["delete"](this.value._links.self.href,{Authorization:this.authHeaderValue})}};i.prototype.__helpers={replaceLastOccurrence:f}},{"./api.js":3,"es6-promise":18,superagent:19}],3:[function(a,b,c){"use strict";function d(a,b,c,d,f,g){return g||(g=function(a){return a}),e({url:b,method:a,headers:c,params:d,data:f,transformResponse:[g]})}var e=a("axios");e.interceptors.response.use(function(a){return a.data},function(a){return Promise.reject(a)});var f={call:d,get:function(a,b,c,d){return this.call("get",a,b,c,null,d)},put:function(a,b,c,d,e){return this.call("put",a,b,c,d,e)},post:function(a,b,c,d,e){return this.call("post",a,b,c,d,e)},"delete":function(a,b,c,d){return this.call("delete",a,b,c,null,d)}};b.exports=f},{axios:4}],4:[function(a,b,c){b.exports=a("./lib/axios")},{"./lib/axios":6}],5:[function(a,b,c){"use strict";var d=a("./../defaults"),e=a("./../utils"),f=a("./../helpers/buildUrl"),g=a("./../helpers/cookies"),h=a("./../helpers/parseHeaders"),i=a("./../helpers/transformData"),j=a("./../helpers/urlIsSameOrigin");b.exports=function(a,b,c){var k=i(c.data,c.headers,c.transformRequest),l=e.merge(d.headers.common,d.headers[c.method]||{},c.headers||{});e.isFormData(k)&&delete l["Content-Type"];var m=new(XMLHttpRequest||ActiveXObject)("Microsoft.XMLHTTP");m.open(c.method.toUpperCase(),f(c.url,c.params),!0),m.onreadystatechange=function(){if(m&&4===m.readyState){var d=h(m.getAllResponseHeaders()),e=-1!==["text",""].indexOf(c.responseType||"")?m.responseText:m.response,f={data:i(e,d,c.transformResponse),status:m.status,statusText:m.statusText,headers:d,config:c};(m.status>=200&&m.status<300?a:b)(f),m=null}};var n=j(c.url)?g.read(c.xsrfCookieName||d.xsrfCookieName):void 0;if(n&&(l[c.xsrfHeaderName||d.xsrfHeaderName]=n),e.forEach(l,function(a,b){k||"content-type"!==b.toLowerCase()?m.setRequestHeader(b,a):delete l[b]}),c.withCredentials&&(m.withCredentials=!0),c.responseType)try{m.responseType=c.responseType}catch(o){if("json"!==m.responseType)throw o}e.isArrayBuffer(k)&&(k=new DataView(k)),m.send(k)}},{"./../defaults":9,"./../helpers/buildUrl":10,"./../helpers/cookies":11,"./../helpers/parseHeaders":13,"./../helpers/transformData":15,"./../helpers/urlIsSameOrigin":16,"./../utils":17}],6:[function(a,b,c){"use strict";var d=a("./defaults"),e=a("./utils"),f=a("./helpers/deprecatedMethod"),g=a("./core/dispatchRequest"),h=a("./core/InterceptorManager");!function(){var b=a("es6-promise");b&&"function"==typeof b.polyfill&&b.polyfill()}();var i=b.exports=function j(a){a=e.merge({method:"get",headers:{},transformRequest:d.transformRequest,transformResponse:d.transformResponse},a),a.withCredentials=a.withCredentials||d.withCredentials;var b=[g,void 0],c=Promise.resolve(a);for(j.interceptors.request.forEach(function(a){b.unshift(a.fulfilled,a.rejected)}),j.interceptors.response.forEach(function(a){b.push(a.fulfilled,a.rejected)});b.length;)c=c.then(b.shift(),b.shift());return c.success=function(a){return f("success","then","https://github.com/mzabriskie/axios/blob/master/README.md#response-api"),c.then(function(b){a(b.data,b.status,b.headers,b.config)}),c},c.error=function(a){return f("error","catch","https://github.com/mzabriskie/axios/blob/master/README.md#response-api"),c.then(null,function(b){a(b.data,b.status,b.headers,b.config)}),c},c};i.defaults=d,i.all=function(a){return Promise.all(a)},i.spread=a("./helpers/spread"),i.interceptors={request:new h,response:new h},function(){function a(){e.forEach(arguments,function(a){i[a]=function(b,c){return i(e.merge(c||{},{method:a,url:b}))}})}function b(){e.forEach(arguments,function(a){i[a]=function(b,c,d){return i(e.merge(d||{},{method:a,url:b,data:c}))}})}a("delete","get","head"),b("post","put","patch")}()},{"./core/InterceptorManager":7,"./core/dispatchRequest":8,"./defaults":9,"./helpers/deprecatedMethod":12,"./helpers/spread":14,"./utils":17,"es6-promise":18}],7:[function(a,b,c){"use strict";function d(){this.handlers=[]}var e=a("./../utils");d.prototype.use=function(a,b){return this.handlers.push({fulfilled:a,rejected:b}),this.handlers.length-1},d.prototype.eject=function(a){this.handlers[a]&&(this.handlers[a]=null)},d.prototype.forEach=function(a){e.forEach(this.handlers,function(b){null!==b&&a(b)})},b.exports=d},{"./../utils":17}],8:[function(a,b,c){(function(c){"use strict";b.exports=function(b){return new Promise(function(d,e){try{"undefined"!=typeof window?a("../adapters/xhr")(d,e,b):"undefined"!=typeof c&&a("../adapters/http")(d,e,b)}catch(f){e(f)}})}}).call(this,a("_process"))},{"../adapters/http":5,"../adapters/xhr":5,_process:1}],9:[function(a,b,c){"use strict";var d=a("./utils"),e=/^\)\]\}',?\n/,f={"Content-Type":"application/x-www-form-urlencoded"};b.exports={transformRequest:[function(a,b){return d.isFormData(a)?a:d.isArrayBuffer(a)?a:d.isArrayBufferView(a)?a.buffer:!d.isObject(a)||d.isFile(a)||d.isBlob(a)?a:(!d.isUndefined(b)&&d.isUndefined(b["Content-Type"])&&(b["Content-Type"]="application/json;charset=utf-8"),JSON.stringify(a))}],transformResponse:[function(a){if("string"==typeof a){a=a.replace(e,"");try{a=JSON.parse(a)}catch(b){}}return a}],headers:{common:{Accept:"application/json, text/plain, */*"},patch:d.merge(f),post:d.merge(f),put:d.merge(f)},xsrfCookieName:"XSRF-TOKEN",xsrfHeaderName:"X-XSRF-TOKEN"}},{"./utils":17}],10:[function(a,b,c){"use strict";function d(a){return encodeURIComponent(a).replace(/%40/gi,"@").replace(/%3A/gi,":").replace(/%24/g,"$").replace(/%2C/gi,",").replace(/%20/g,"+")}var e=a("./../utils");b.exports=function(a,b){if(!b)return a;var c=[];return e.forEach(b,function(a,b){null!==a&&"undefined"!=typeof a&&(e.isArray(a)||(a=[a]),e.forEach(a,function(a){e.isDate(a)?a=a.toISOString():e.isObject(a)&&(a=JSON.stringify(a)),c.push(d(b)+"="+d(a))}))}),c.length>0&&(a+=(-1===a.indexOf("?")?"?":"&")+c.join("&")),a}},{"./../utils":17}],11:[function(a,b,c){"use strict";var d=a("./../utils");b.exports={write:function(a,b,c,e,f,g){var h=[];h.push(a+"="+encodeURIComponent(b)),d.isNumber(c)&&h.push("expires="+new Date(c).toGMTString()),d.isString(e)&&h.push("path="+e),d.isString(f)&&h.push("domain="+f),g===!0&&h.push("secure"),document.cookie=h.join("; ")},read:function(a){var b=document.cookie.match(new RegExp("(^|;\\s*)("+a+")=([^;]*)"));return b?decodeURIComponent(b[3]):null},remove:function(a){this.write(a,"",Date.now()-864e5)}}},{"./../utils":17}],12:[function(a,b,c){"use strict";b.exports=function(a,b,c){try{console.warn("DEPRECATED method `"+a+"`."+(b?" Use `"+b+"` instead.":"")+" This method will be removed in a future release."),c&&console.warn("For more information about usage see "+c)}catch(d){}}},{}],13:[function(a,b,c){"use strict";var d=a("./../utils");b.exports=function(a){var b,c,e,f={};return a?(d.forEach(a.split("\n"),function(a){e=a.indexOf(":"),b=d.trim(a.substr(0,e)).toLowerCase(),c=d.trim(a.substr(e+1)),b&&(f[b]=f[b]?f[b]+", "+c:c)}),f):f}},{"./../utils":17}],14:[function(a,b,c){"use strict";b.exports=function(a){return function(b){a.apply(null,b)}}},{}],15:[function(a,b,c){"use strict";var d=a("./../utils");b.exports=function(a,b,c){return d.forEach(c,function(c){a=c(a,b)}),a}},{"./../utils":17}],16:[function(a,b,c){"use strict";function d(a){var b=a;return g&&(h.setAttribute("href",b),b=h.href),h.setAttribute("href",b),{href:h.href,protocol:h.protocol?h.protocol.replace(/:$/,""):"",host:h.host,search:h.search?h.search.replace(/^\?/,""):"",hash:h.hash?h.hash.replace(/^#/,""):"",hostname:h.hostname,port:h.port,pathname:"/"===h.pathname.charAt(0)?h.pathname:"/"+h.pathname}}var e,f=a("./../utils"),g=/(msie|trident)/i.test(navigator.userAgent),h=document.createElement("a");e=d(window.location.href),b.exports=function(a){var b=f.isString(a)?d(a):a;return b.protocol===e.protocol&&b.host===e.host}},{"./../utils":17}],17:[function(a,b,c){"use strict";function d(a){return"[object Array]"===r.call(a)}function e(a){return"[object ArrayBuffer]"===r.call(a)}function f(a){return"[object FormData]"===r.call(a)}function g(a){return"undefined"!=typeof ArrayBuffer&&ArrayBuffer.isView?ArrayBuffer.isView(a):a&&a.buffer&&a.buffer instanceof ArrayBuffer}function h(a){return"string"==typeof a}function i(a){return"number"==typeof a}function j(a){return"undefined"==typeof a}function k(a){return null!==a&&"object"==typeof a}function l(a){return"[object Date]"===r.call(a)}function m(a){return"[object File]"===r.call(a)}function n(a){return"[object Blob]"===r.call(a)}function o(a){return a.replace(/^\s*/,"").replace(/\s*$/,"")}function p(a,b){if(null!==a&&"undefined"!=typeof a){var c=d(a)||"object"==typeof a&&!isNaN(a.length);if("object"==typeof a||c||(a=[a]),c)for(var e=0,f=a.length;f>e;e++)b.call(null,a[e],e,a);else for(var g in a)a.hasOwnProperty(g)&&b.call(null,a[g],g,a)}}function q(){var a={};return p(arguments,function(b){p(b,function(b,c){a[c]=b})}),a}var r=Object.prototype.toString;b.exports={isArray:d,isArrayBuffer:e,isFormData:f,isArrayBufferView:g,isString:h,isNumber:i,isObject:k,isUndefined:j,isDate:l,isFile:m,isBlob:n,forEach:p,merge:q,trim:o}},{}],18:[function(b,c,d){(function(d,e){(function(){"use strict";function f(a){return"function"==typeof a||"object"==typeof a&&null!==a}function g(a){return"function"==typeof a}function h(a){return"object"==typeof a&&null!==a}function i(a){U=a}function j(a){Y=a}function k(){var a=d.nextTick,b=d.versions.node.match(/^(?:(\d+)\.)?(?:(\d+)\.)?(\*|\d+)$/);return Array.isArray(b)&&"0"===b[1]&&"10"===b[2]&&(a=setImmediate),function(){a(p)}}function l(){return function(){T(p)}}function m(){var a=0,b=new _(p),c=document.createTextNode("");return b.observe(c,{characterData:!0}),function(){c.data=a=++a%2}}function n(){var a=new MessageChannel;return a.port1.onmessage=p,function(){a.port2.postMessage(0)}}function o(){return function(){setTimeout(p,1)}}function p(){for(var a=0;X>a;a+=2){var b=ca[a],c=ca[a+1];b(c),ca[a]=void 0,ca[a+1]=void 0}X=0}function q(){try{var a=b,c=a("vertx");return T=c.runOnLoop||c.runOnContext,l()}catch(d){return o()}}function r(){}function s(){return new TypeError("You cannot resolve a promise with itself")}function t(){return new TypeError("A promises callback cannot return that same promise.")}function u(a){try{return a.then}catch(b){return ga.error=b,ga}}function v(a,b,c,d){try{a.call(b,c,d)}catch(e){return e}}function w(a,b,c){Y(function(a){var d=!1,e=v(c,b,function(c){d||(d=!0,b!==c?z(a,c):B(a,c))},function(b){d||(d=!0,C(a,b))},"Settle: "+(a._label||" unknown promise"));!d&&e&&(d=!0,C(a,e))},a)}function x(a,b){b._state===ea?B(a,b._result):b._state===fa?C(a,b._result):D(b,void 0,function(b){z(a,b)},function(b){C(a,b)})}function y(a,b){if(b.constructor===a.constructor)x(a,b);else{var c=u(b);c===ga?C(a,ga.error):void 0===c?B(a,b):g(c)?w(a,b,c):B(a,b)}}function z(a,b){a===b?C(a,s()):f(b)?y(a,b):B(a,b)}function A(a){a._onerror&&a._onerror(a._result),E(a)}function B(a,b){a._state===da&&(a._result=b,a._state=ea,0!==a._subscribers.length&&Y(E,a))}function C(a,b){a._state===da&&(a._state=fa,a._result=b,Y(A,a))}function D(a,b,c,d){var e=a._subscribers,f=e.length;a._onerror=null,e[f]=b,e[f+ea]=c,e[f+fa]=d,0===f&&a._state&&Y(E,a)}function E(a){var b=a._subscribers,c=a._state;if(0!==b.length){for(var d,e,f=a._result,g=0;g<b.length;g+=3)d=b[g],e=b[g+c],d?H(c,d,e,f):e(f);a._subscribers.length=0}}function F(){this.error=null}function G(a,b){try{return a(b)}catch(c){return ha.error=c,ha}}function H(a,b,c,d){var e,f,h,i,j=g(c);if(j){if(e=G(c,d),e===ha?(i=!0,f=e.error,e=null):h=!0,b===e)return void C(b,t())}else e=d,h=!0;b._state!==da||(j&&h?z(b,e):i?C(b,f):a===ea?B(b,e):a===fa&&C(b,e))}function I(a,b){try{b(function(b){z(a,b)},function(b){C(a,b)})}catch(c){C(a,c)}}function J(a,b){var c=this;c._instanceConstructor=a,c.promise=new a(r),c._validateInput(b)?(c._input=b,c.length=b.length,c._remaining=b.length,c._init(),0===c.length?B(c.promise,c._result):(c.length=c.length||0,c._enumerate(),0===c._remaining&&B(c.promise,c._result))):C(c.promise,c._validationError())}function K(a){return new ia(this,a).promise}function L(a){function b(a){z(e,a)}function c(a){C(e,a)}var d=this,e=new d(r);if(!W(a))return C(e,new TypeError("You must pass an array to race.")),e;for(var f=a.length,g=0;e._state===da&&f>g;g++)D(d.resolve(a[g]),void 0,b,c);return e}function M(a){var b=this;if(a&&"object"==typeof a&&a.constructor===b)return a;var c=new b(r);return z(c,a),c}function N(a){var b=this,c=new b(r);return C(c,a),c}function O(){throw new TypeError("You must pass a resolver function as the first argument to the promise constructor")}function P(){throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.")}function Q(a){this._id=na++,this._state=void 0,this._result=void 0,this._subscribers=[],r!==a&&(g(a)||O(),this instanceof Q||P(),I(this,a))}function R(){var a;if("undefined"!=typeof e)a=e;else if("undefined"!=typeof self)a=self;else try{a=Function("return this")()}catch(b){throw new Error("polyfill failed because global object is unavailable in this environment")}var c=a.Promise;(!c||"[object Promise]"!==Object.prototype.toString.call(c.resolve())||c.cast)&&(a.Promise=oa)}var S;S=Array.isArray?Array.isArray:function(a){return"[object Array]"===Object.prototype.toString.call(a)};var T,U,V,W=S,X=0,Y=({}.toString,function(a,b){ca[X]=a,ca[X+1]=b,X+=2,2===X&&(U?U(p):V())}),Z="undefined"!=typeof window?window:void 0,$=Z||{},_=$.MutationObserver||$.WebKitMutationObserver,aa="undefined"!=typeof d&&"[object process]"==={}.toString.call(d),ba="undefined"!=typeof Uint8ClampedArray&&"undefined"!=typeof importScripts&&"undefined"!=typeof MessageChannel,ca=new Array(1e3);V=aa?k():_?m():ba?n():void 0===Z&&"function"==typeof b?q():o();var da=void 0,ea=1,fa=2,ga=new F,ha=new F;J.prototype._validateInput=function(a){return W(a)},J.prototype._validationError=function(){return new Error("Array Methods must be provided an Array")},J.prototype._init=function(){this._result=new Array(this.length)};var ia=J;J.prototype._enumerate=function(){for(var a=this,b=a.length,c=a.promise,d=a._input,e=0;c._state===da&&b>e;e++)a._eachEntry(d[e],e)},J.prototype._eachEntry=function(a,b){var c=this,d=c._instanceConstructor;h(a)?a.constructor===d&&a._state!==da?(a._onerror=null,c._settledAt(a._state,b,a._result)):c._willSettleAt(d.resolve(a),b):(c._remaining--,c._result[b]=a)},J.prototype._settledAt=function(a,b,c){var d=this,e=d.promise;e._state===da&&(d._remaining--,a===fa?C(e,c):d._result[b]=c),0===d._remaining&&B(e,d._result)},J.prototype._willSettleAt=function(a,b){var c=this;D(a,void 0,function(a){c._settledAt(ea,b,a)},function(a){c._settledAt(fa,b,a)})};var ja=K,ka=L,la=M,ma=N,na=0,oa=Q;Q.all=ja,Q.race=ka,Q.resolve=la,Q.reject=ma,Q._setScheduler=i,Q._setAsap=j,Q._asap=Y,Q.prototype={constructor:Q,then:function(a,b){var c=this,d=c._state;if(d===ea&&!a||d===fa&&!b)return this;var e=new this.constructor(r),f=c._result;if(d){var g=arguments[d-1];Y(function(){H(d,e,g,f)})}else D(c,e,a,b);return e},"catch":function(a){return this.then(null,a)}};var pa=R,qa={Promise:oa,polyfill:pa};"function"==typeof a&&a.amd?a(function(){return qa}):"undefined"!=typeof c&&c.exports?c.exports=qa:"undefined"!=typeof this&&(this.ES6Promise=qa),pa()}).call(this)}).call(this,b("_process"),"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{_process:1}],19:[function(a,b,c){function d(){}function e(a){var b={}.toString.call(a);switch(b){case"[object File]":case"[object Blob]":case"[object FormData]":return!0;default:return!1}}function f(a){return a===Object(a)}function g(a){if(!f(a))return a;var b=[];for(var c in a)null!=a[c]&&b.push(encodeURIComponent(c)+"="+encodeURIComponent(a[c]));return b.join("&")}function h(a){for(var b,c,d={},e=a.split("&"),f=0,g=e.length;g>f;++f)c=e[f],b=c.split("="),d[decodeURIComponent(b[0])]=decodeURIComponent(b[1]);return d}function i(a){var b,c,d,e,f=a.split(/\r?\n/),g={};f.pop();for(var h=0,i=f.length;i>h;++h)c=f[h],b=c.indexOf(":"),d=c.slice(0,b).toLowerCase(),e=r(c.slice(b+1)),g[d]=e;return g}function j(a){return a.split(/ *; */).shift()}function k(a){return p(a.split(/ *; */),function(a,b){var c=b.split(/ *= */),d=c.shift(),e=c.shift();return d&&e&&(a[d]=e),a},{})}function l(a,b){b=b||{},this.req=a,this.xhr=this.req.xhr,this.text="HEAD"!=this.req.method&&(""===this.xhr.responseType||"text"===this.xhr.responseType)||"undefined"==typeof this.xhr.responseType?this.xhr.responseText:null,this.statusText=this.req.xhr.statusText,this.setStatusProperties(this.xhr.status),this.header=this.headers=i(this.xhr.getAllResponseHeaders()),this.header["content-type"]=this.xhr.getResponseHeader("content-type"),this.setHeaderProperties(this.header),this.body="HEAD"!=this.req.method?this.parseBody(this.text?this.text:this.xhr.response):null}function m(a,b){var c=this;o.call(this),this._query=this._query||[],this.method=a,this.url=b,this.header={},this._header={},this.on("end",function(){var a=null,b=null;try{b=new l(c)}catch(d){return a=new Error("Parser is unable to parse the response"),a.parse=!0,a.original=d,c.callback(a)}if(c.emit("response",b),a)return c.callback(a,b);if(b.status>=200&&b.status<300)return c.callback(a,b);var e=new Error(b.statusText||"Unsuccessful HTTP response");e.original=a,e.response=b,e.status=b.status,c.callback(e,b)})}function n(a,b){return"function"==typeof b?new m("GET",a).end(b):1==arguments.length?new m("GET",a):new m(a,b)}var o=a("emitter"),p=a("reduce"),q="undefined"==typeof window?this||self:window;n.getXHR=function(){if(!(!q.XMLHttpRequest||q.location&&"file:"==q.location.protocol&&q.ActiveXObject))return new XMLHttpRequest;try{return new ActiveXObject("Microsoft.XMLHTTP")}catch(a){}try{return new ActiveXObject("Msxml2.XMLHTTP.6.0")}catch(a){}try{return new ActiveXObject("Msxml2.XMLHTTP.3.0")}catch(a){}try{return new ActiveXObject("Msxml2.XMLHTTP")}catch(a){}return!1};var r="".trim?function(a){return a.trim()}:function(a){return a.replace(/(^\s*|\s*$)/g,"")};n.serializeObject=g,n.parseString=h,n.types={html:"text/html",json:"application/json",xml:"application/xml",urlencoded:"application/x-www-form-urlencoded",form:"application/x-www-form-urlencoded","form-data":"application/x-www-form-urlencoded"},n.serialize={"application/x-www-form-urlencoded":g,"application/json":JSON.stringify},n.parse={"application/x-www-form-urlencoded":h,"application/json":JSON.parse},l.prototype.get=function(a){return this.header[a.toLowerCase()]},l.prototype.setHeaderProperties=function(a){var b=this.header["content-type"]||"";this.type=j(b);var c=k(b);for(var d in c)this[d]=c[d]},l.prototype.parseBody=function(a){var b=n.parse[this.type];return b&&a&&(a.length||a instanceof Object)?b(a):null},l.prototype.setStatusProperties=function(a){1223===a&&(a=204);var b=a/100|0;this.status=a,this.statusType=b,this.info=1==b,this.ok=2==b,this.clientError=4==b,this.serverError=5==b,this.error=4==b||5==b?this.toError():!1,this.accepted=202==a,this.noContent=204==a,this.badRequest=400==a,this.unauthorized=401==a,this.notAcceptable=406==a,this.notFound=404==a,this.forbidden=403==a},l.prototype.toError=function(){var a=this.req,b=a.method,c=a.url,d="cannot "+b+" "+c+" ("+this.status+")",e=new Error(d);return e.status=this.status,e.method=b,e.url=c,e},n.Response=l,o(m.prototype),m.prototype.use=function(a){return a(this),this},m.prototype.timeout=function(a){return this._timeout=a,this},m.prototype.clearTimeout=function(){return this._timeout=0,clearTimeout(this._timer),this},m.prototype.abort=function(){return this.aborted?void 0:(this.aborted=!0,this.xhr.abort(),this.clearTimeout(),this.emit("abort"),
this)},m.prototype.set=function(a,b){if(f(a)){for(var c in a)this.set(c,a[c]);return this}return this._header[a.toLowerCase()]=b,this.header[a]=b,this},m.prototype.unset=function(a){return delete this._header[a.toLowerCase()],delete this.header[a],this},m.prototype.getHeader=function(a){return this._header[a.toLowerCase()]},m.prototype.type=function(a){return this.set("Content-Type",n.types[a]||a),this},m.prototype.accept=function(a){return this.set("Accept",n.types[a]||a),this},m.prototype.auth=function(a,b){var c=btoa(a+":"+b);return this.set("Authorization","Basic "+c),this},m.prototype.query=function(a){return"string"!=typeof a&&(a=g(a)),a&&this._query.push(a),this},m.prototype.field=function(a,b){return this._formData||(this._formData=new q.FormData),this._formData.append(a,b),this},m.prototype.attach=function(a,b,c){return this._formData||(this._formData=new q.FormData),this._formData.append(a,b,c),this},m.prototype.send=function(a){var b=f(a),c=this.getHeader("Content-Type");if(b&&f(this._data))for(var d in a)this._data[d]=a[d];else"string"==typeof a?(c||this.type("form"),c=this.getHeader("Content-Type"),"application/x-www-form-urlencoded"==c?this._data=this._data?this._data+"&"+a:a:this._data=(this._data||"")+a):this._data=a;return!b||e(a)?this:(c||this.type("json"),this)},m.prototype.callback=function(a,b){var c=this._callback;this.clearTimeout(),c(a,b)},m.prototype.crossDomainError=function(){var a=new Error("Origin is not allowed by Access-Control-Allow-Origin");a.crossDomain=!0,this.callback(a)},m.prototype.timeoutError=function(){var a=this._timeout,b=new Error("timeout of "+a+"ms exceeded");b.timeout=a,this.callback(b)},m.prototype.withCredentials=function(){return this._withCredentials=!0,this},m.prototype.end=function(a){var b=this,c=this.xhr=n.getXHR(),f=this._query.join("&"),g=this._timeout,h=this._formData||this._data;this._callback=a||d,c.onreadystatechange=function(){if(4==c.readyState){var a;try{a=c.status}catch(d){a=0}if(0==a){if(b.timedout)return b.timeoutError();if(b.aborted)return;return b.crossDomainError()}b.emit("end")}};var i=function(a){a.total>0&&(a.percent=a.loaded/a.total*100),b.emit("progress",a)};this.hasListeners("progress")&&(c.onprogress=i);try{c.upload&&this.hasListeners("progress")&&(c.upload.onprogress=i)}catch(j){}if(g&&!this._timer&&(this._timer=setTimeout(function(){b.timedout=!0,b.abort()},g)),f&&(f=n.serializeObject(f),this.url+=~this.url.indexOf("?")?"&"+f:"?"+f),c.open(this.method,this.url,!0),this._withCredentials&&(c.withCredentials=!0),"GET"!=this.method&&"HEAD"!=this.method&&"string"!=typeof h&&!e(h)){var k=this.getHeader("Content-Type"),l=n.serialize[k?k.split(";")[0]:""];l&&(h=l(h))}for(var m in this.header)null!=this.header[m]&&c.setRequestHeader(m,this.header[m]);return this.emit("request",this),c.send(h),this},m.prototype.then=function(a,b){return this.end(function(c,d){c?b(c):a(d)})},n.Request=m,n.get=function(a,b,c){var d=n("GET",a);return"function"==typeof b&&(c=b,b=null),b&&d.query(b),c&&d.end(c),d},n.head=function(a,b,c){var d=n("HEAD",a);return"function"==typeof b&&(c=b,b=null),b&&d.send(b),c&&d.end(c),d},n.del=function(a,b){var c=n("DELETE",a);return b&&c.end(b),c},n.patch=function(a,b,c){var d=n("PATCH",a);return"function"==typeof b&&(c=b,b=null),b&&d.send(b),c&&d.end(c),d},n.post=function(a,b,c){var d=n("POST",a);return"function"==typeof b&&(c=b,b=null),b&&d.send(b),c&&d.end(c),d},n.put=function(a,b,c){var d=n("PUT",a);return"function"==typeof b&&(c=b,b=null),b&&d.send(b),c&&d.end(c),d},b.exports=n},{emitter:20,reduce:21}],20:[function(a,b,c){function d(a){return a?e(a):void 0}function e(a){for(var b in d.prototype)a[b]=d.prototype[b];return a}b.exports=d,d.prototype.on=d.prototype.addEventListener=function(a,b){return this._callbacks=this._callbacks||{},(this._callbacks[a]=this._callbacks[a]||[]).push(b),this},d.prototype.once=function(a,b){function c(){d.off(a,c),b.apply(this,arguments)}var d=this;return this._callbacks=this._callbacks||{},c.fn=b,this.on(a,c),this},d.prototype.off=d.prototype.removeListener=d.prototype.removeAllListeners=d.prototype.removeEventListener=function(a,b){if(this._callbacks=this._callbacks||{},0==arguments.length)return this._callbacks={},this;var c=this._callbacks[a];if(!c)return this;if(1==arguments.length)return delete this._callbacks[a],this;for(var d,e=0;e<c.length;e++)if(d=c[e],d===b||d.fn===b){c.splice(e,1);break}return this},d.prototype.emit=function(a){this._callbacks=this._callbacks||{};var b=[].slice.call(arguments,1),c=this._callbacks[a];if(c){c=c.slice(0);for(var d=0,e=c.length;e>d;++d)c[d].apply(this,b)}return this},d.prototype.listeners=function(a){return this._callbacks=this._callbacks||{},this._callbacks[a]||[]},d.prototype.hasListeners=function(a){return!!this.listeners(a).length}},{}],21:[function(a,b,c){b.exports=function(a,b,c){for(var d=0,e=a.length,f=3==arguments.length?c:a[d++];e>d;)f=b.call(null,f,a[d],++d,a);return f}},{}],"ec.datamanager.js":[function(a,b,c){"use strict";b.exports=a("./lib/DataManager")},{"./lib/DataManager":2}]},{},[])("ec.datamanager.js")});