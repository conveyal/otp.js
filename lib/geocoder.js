var $ = window.$

var maxSuggestResults = 10

// init the search location in the format expected by the ESRI geocoder, if avaiable
if(window.OTP_config.initLatLng && window.OTP_config.initLatLng.length === 2) {
  var esriLocation = window.OTP_config.initLatLng[1] + ',' + window.OTP_config.initLatLng[0]
}

var EsriGeocoder = {
  reverse: function (place, callback) {
    // esri takes lon/lat
    var parts = place.split(',')
    var lonlat = parts[1] + ',' + parts[0]

    $.ajax({
      url: window.OTP_config.esriApi + 'reverseGeocode',
      data: {
        location: lonlat,
        f: 'json'
      },
      type: 'GET',
      dataType: 'jsonp',
      error: callback,
      success: function (res) {
        if (!res.address) {
          return callback('No address found for ' + lonlat, {
            text: 'No address found for location',
            place: place
          })
        }

        var address = res.address
        var location = res.location
        callback(null, {
          address: address.Address,
          city: address.City,
          state: address.Region,
          place: location.y + ',' + location.x
        })
      }
    })
  },

  lookup: function (query, callback, opts) {
    if (!query.length) return callback()

    var params = {
      countryCode: 'USA',
      f: 'json',
      singleLine: query
    }
    if(esriLocation) params.location = esriLocation

    if(opts && opts.magicKey) params.magicKey = opts.magicKey

    $.ajax({
      url: window.OTP_config.esriApi + 'findAddressCandidates',
      type: 'GET',
      data: params,
      dataType: 'jsonp',
      error: callback,
      success: function (res) {
        var data = []
        for (var itemPos in res.candidates.slice(0, 10)) {
          var item = {
            text: res.candidates[itemPos].address,
            place: res.candidates[itemPos].location.y + ',' + res.candidates[itemPos].location.x,
            source: 'esri'
          }

          data.push(item)
        }
        callback(data)
      }
    })
  },

  suggest: function (query, callback, opts) {
    if (!query.length) return callback()

    var params = {
      countryCode: 'USA',
      f: 'json',
      text: query
    }
    if(esriLocation) params.location = esriLocation

    $.ajax({
      url: window.OTP_config.esriApi + 'suggest',
      type: 'GET',
      data: params,
      dataType: 'jsonp',
      error: callback,
      success: function (res) {
        var data = []
        for (var itemPos in res.suggestions.slice(0, maxSuggestResults)) {
          var item = {
            text: res.suggestions[itemPos].text,
            magicKey: res.suggestions[itemPos].magicKey,
            id: itemPos + 1,
            source: 'esri'
          }

          data.push(item)
        }

        callback(data)
      }
    })
  }
}

/* OTP's Built-in Lucene Geocoder for resolving stops */

var OtpBuiltInGeocoder = {

  lookup: function (query, callback, opts) {
    if (!query.length) return callback()

    $.ajax({
      url: window.OTP_config.otpApi + (window.OTP_config.routerId || 'default') + '/geocode',
      data: {
        query: query,
        corners: false, // don't look up intersections for now
        autocomplete: opts && opts.autocomplete === true
      },
      type: 'GET',
      dataType: 'json',

      error: function () {
        callback()
      },
      success: function (res) {
        var data = []
        for (var item in res.slice(0, maxSuggestResults)) {
          var itemData = {
            id: res[item].id,
            text: res[item].description,
            place: res[item].lat + ',' + res[item].lng,
            source: 'otp'
          }
          data.push(itemData)
        }
        callback(data)
      }
    })
  },

  suggest: function (query, callback) {
    OtpBuiltInGeocoder.lookup(query, callback, { autocomplete : true })
  }
}

/* Geocoding function that splits suggest query between multiple other geocoders */

// Array of geocoder ids to lookup. Defaults to 'esri' only, can be overriddin in config
var geocoders = window.OTP_config.geocoders || ['esri']

// Lookup mapping geocoder id to object
var geocoderLookup = {
  esri : EsriGeocoder,
  otp : OtpBuiltInGeocoder
}

var MultiGeocoder = {
  suggest: function (query, callback, opts) {
    var queriesComplete = 0;

    var maxResultsPerGeocoder = Math.floor(maxSuggestResults / geocoders.length)

    var resultsMap = {} // maps geocoder id to result set of suggest query

    // iterate through geocoders, firing suggest queries for each
    for(var i=0; i < geocoders.length; i++) {
      var geocoder = geocoders[i]
      geocoderLookup[geocoder].suggest(query, (function(results) {
        resultsMap[this.geocoder] = results.slice(0, maxResultsPerGeocoder)
        queriesComplete++;

        if(queriesComplete === geocoders.length) { // we're done; invoke callback with combined results
          var combinedResults = []
          for(var j=0; j < geocoders.length; j++) {
            combinedResults = combinedResults.concat(resultsMap[geocoders[j]])
          }
          callback(combinedResults)
        }
      }).bind({
        geocoder : geocoder
      }), opts)
    }
  }
}


module.exports = {
  EsriGeocoder: EsriGeocoder,
  OtpBuiltInGeocoder: OtpBuiltInGeocoder,
  lookup: EsriGeocoder.lookup,
  reverse: EsriGeocoder.reverse,
  suggest: MultiGeocoder.suggest
}
