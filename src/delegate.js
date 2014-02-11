var bowser = require('bowser').browser;

var base = "http://datadesk.github.io/geojson.io";

if (bowser.android || bowser.iphone || bowser.ipad || bowser.touchpad) {
    var hash = window.location.hash;
    window.location.href = base + '/mobile.html' + hash;
}

if (bowser.msie && parseFloat(bowser.version) < 10) {
    window.location.href = base + '/unsupported.html';
}
