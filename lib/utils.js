'use strict';

var filterParams = function(data) {

  // filter empty attributes from request
  var omitList = _.map(_.pairs(data), function(pair) {
    if (pair[1] === undefined)
      return pair[0];
  });

  return _.omit(data, omitList);
};

module.exports.filterParams = filterParams;

var decodePolyline = function(polyline) {

  var currentPosition = 0;

  var currentLat = 0;
  var currentLng = 0;

  var dataLength = polyline.length;

  var polylineLatLngs = [];

  while (currentPosition < dataLength) {

    var shift = 0;
    var result = 0;

    var byte;

    do {
      byte = polyline.charCodeAt(currentPosition++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    var deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    currentLat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = polyline.charCodeAt(currentPosition++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    var deltLng = ((result & 1) ? ~(result >> 1) : (result >> 1));

    currentLng += deltLng;

    polylineLatLngs.push(new L.LatLng(currentLat * 0.00001, currentLng * 0.00001));
  }

  return polylineLatLngs;
};

module.exports.decodePolyline = decodePolyline;

var formatTime = function(time, format, offsetHrs) {
  format = format || 'h:mma';
  var m = moment(time);
  if (offsetHrs) m = m.add('hours', offsetHrs);
  return m.format(format);
};

module.exports.formatTime = formatTime;

var secToHrMin = function(sec) {
  var hrs = Math.floor(sec / 3600);
  var mins = Math.floor(sec / 60) % 60;

  // TODO: localization
  var str = (hrs > 0 ? (hrs + " hr, ") : "") + mins + " min";

  return str;
};

module.exports.secToHrMin = secToHrMin;

var msToHrMin = function(ms) {
  var hrs = Math.floor(ms / 3600000);
  var mins = Math.floor(ms / 60000) % 60;

  // TODO: localization
  var str = (hrs > 0 ? (hrs + ' hr, ') : '') + mins + ' min';

  return str;
};

module.exports.msToHrMin = msToHrMin;

var distanceStringImperial = function(m) {
  var ft = m * 3.28084;
  if (ft < 528) return Math.round(ft) + ' feet';
  return Math.round(ft / 528) / 10 + ' miles';
};

var distanceStringMetric = function(m) {
  var km = m / 1000;
  if (km > 100) {
    //100 km => 999999999 km
    km = km.toFixed(0);
    return km + ' km';
  } else if (km > 1) {
    //1.1 km => 99.9 km
    km = km.toFixed(1);
    return km + ' km';
  } else {
    //1m => 999m
    m = m.toFixed(0);
    return m + ' m';
  }
};

var distanceString = function(m, metric) {
  return (metric === true) ? distanceStringMetric(m) : distanceStringImperial(
    m);
};

module.exports.distanceString = distanceString;
