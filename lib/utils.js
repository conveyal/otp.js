'use strict'

var locale = require('./localization')

var L = window.L
var moment = window.moment

module.exports.filterParams = function filterParams (data) {
  var filtered = {}
  for (var k in data) {
    var val = data[k]
    if (val !== null && val !== undefined) filtered[k] = val
  }
  return filtered
}

function decodePolyline (polyline) {
  var currentPosition = 0

  var currentLat = 0
  var currentLng = 0

  var dataLength = polyline.length

  var polylineLatLngs = []

  while (currentPosition < dataLength) {
    var shift = 0
    var result = 0

    var byte

    do {
      byte = polyline.charCodeAt(currentPosition++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

      var deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1))
      currentLat += deltaLat

      shift = 0
      result = 0

      do {
        byte = polyline.charCodeAt(currentPosition++) - 63
        result |= (byte & 0x1f) << shift
        shift += 5
      } while (byte >= 0x20)

        var deltLng = ((result & 1) ? ~(result >> 1) : (result >> 1))

        currentLng += deltLng

        polylineLatLngs.push(new L.LatLng(currentLat * 0.00001, currentLng * 0.00001))
      }

      return polylineLatLngs
    }

    module.exports.decodePolyline = decodePolyline

    var formatTime = function (time, format, offsetHrs) {
      // LT is locale default hour:time
      format = format || 'LT'
      var m = moment(time)
      if (offsetHrs) m = m.add('hours', offsetHrs)
      // Is locale format with locale aware day month and LT It is set based on
      // selected language
      if (!today(m)) format = locale.locale_format
      return m.format(format)
    }

    function today (m) {
      var n = moment()
      return n.date() === m.date() && n.month() === m.month() && n.year() === m.year()
    }

    module.exports.formatTime = formatTime

    var secToHrMin = function (sec) {
      var duration = moment.duration(sec, 'seconds')
      // This returns localized human time durations 1 minut one hour, 5 minutes
      // etc.
      return duration.humanize()
    }

    module.exports.secToHrMin = secToHrMin

    var msToHrMin = function (ms) {
      var hrs = Math.floor(ms / 3600000)
      var mins = Math.floor(ms / 60000) % 60

      var str

      // TODO: localization
      if (hrs === 0 && mins < 1) {
        str = '<1 min'
      } else {
        str = (hrs > 0 ? (hrs + ' hr, ') : '') + mins + ' min'
      }

      return str
    }

    module.exports.msToHrMin = msToHrMin

    var distanceStringImperial = function (m) {
      var ft = m * 3.28084
      if (ft < 528) return Math.round(ft) + ' feet'
      return Math.round(ft / 528) / 10 + ' miles'
    }

    var distanceStringMetric = function (m) {
      var km = m / 1000
      if (km > 100) {
        // 100 km => 999999999 km
        km = km.toFixed(0)
        return km + ' km'
      } else if (km > 1) {
        // 1.1 km => 99.9 km
        km = km.toFixed(1)
        return km + ' km'
      } else {
        // 1m => 999m
        m = m.toFixed(0)
        return m + ' m'
      }
    }

    var distanceString = function (m, metric) {
      return (metric === true) ? distanceStringMetric(m) : distanceStringImperial(m)
    }

    module.exports.distanceString = distanceString
