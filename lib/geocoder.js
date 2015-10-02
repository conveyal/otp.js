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

/* OSM's nominatim geocoder */

var NominatimGeocoder = {
  reverse: function (place, callback) {
    var latlon = place.split(',')

    $.ajax({
      url: window.OTP_config.nominatimApi + 'reverse',
      data: {
        lat: latlon[0],
        lon: latlon[1],
        format: 'json'
      },
      type: 'GET',
      dataType: 'jsonp',
      jsonp: 'json_callback',
      error: callback,
      success: function (res) {
        if (!res.address.road) {
          return callback('No address found for ' + latlon[1] + ',' + latlon[0], {
            text: 'No address found for location',
            place: place
          })
        }

        var address = res.address
        var location = res.location
        callback(null, {
          address: address.road,
          city: address.city,
          state: address.state,
          place: res.lon + ',' + res.lat
        })
      }
    })
  },

  lookup: function (query, callback) {
    if (!query.length) return callback()

    var params = {
      countrycodes: 'us',
      format: 'json',
      q: query,
    }

    $.ajax({
      url: window.OTP_config.nominatimApi + 'search',
      type: 'GET',
      data: params,
      dataType: 'jsonp',
      jsonp: 'json_callback',
      error: callback,
      success: function (res) {
        var data = []
        for (var itemPos in res.slice(0, maxSuggestResults)) {
          var item = {
            id: itemPos + 1,
            text: res[itemPos].display_name,
            place: res[itemPos].lat + ',' + res[itemPos].lon,
            source: 'nominatim'
          }

          data.push(item)
        }

        callback(data)
      }
    })
  },

  suggest: function (query, callback) {
    NominatimGeocoder.lookup(query, callback)
  }
}

/* Mapzen's pelias geocoder */

var PeliasGeocoder = {
  reverse: function (place, callback) {
    var latlon = place.split(',')

    var params = {
      lat: latlon[0],
      lon: latlon[1],
    }

    $.ajax({
      url: window.OTP_config.peliasApi + '/reverse',
      type: 'GET',
      data: params,
      dataType: 'json',
      error: callback,
      success: function (res) {
        if (res.features.length <= 0) {
          return callback('No address found for ' + latlon[1] + ',' + latlon[0], {
            text: 'No address found for location',
            place: place
          })
        }
        var lonlat = res.features[0].geometry.coordinates
        callback(null, {
          address: res.features[0].properties.text,
          // city: address.city,
          // state: address.state,
          place: lonlat[1] + ',' + lonlat[0]
        })
      }
    })
  },

  lookup: function (query, callback) {
    if (!query.length) return callback()

    var params = {
      input: query,
      size: maxSuggestResults,
    }

    if(window.OTP_config.initLatLng && window.OTP_config.initLatLng.length === 2) {
      params.lat = window.OTP_config.initLatLng[0]
      params.lon = window.OTP_config.initLatLng[1]
    }

    $.ajax({
      url: window.OTP_config.peliasApi + '/search',
      type: 'GET',
      data: params,
      dataType: 'json',
      error: callback,
      success: function (res) {
        var data = []
        for (var itemPos in res.features.slice(0, maxSuggestResults)) {
          var resultItem = res.features[itemPos]
          var lonlat = resultItem.geometry.coordinates
          var item = {
            id: parseInt(itemPos) + 1,
            text: resultItem.properties.text,
            place: lonlat[1] + ',' + lonlat[0],
            source: 'pelias'
          }

          data.push(item)
        }

        callback(data)
      }
    })
  },

  suggest: function (query, callback) {
    if (!query.length) return callback()

    if(window.OTP_config.initLatLng && window.OTP_config.initLatLng.length === 2) {
        var params = {
          input: query,
          size: maxSuggestResults,
          lat: window.OTP_config.initLatLng[0],
          lon: window.OTP_config.initLatLng[1]
        }

      $.ajax({
        url: window.OTP_config.peliasApi + '/suggest',
        type: 'GET',
        data: params,
        dataType: 'json',
        error: callback,
        success: function (res) {
          var data = []
          for (var itemPos in res.features.slice(0, maxSuggestResults)) {
            var resultItem = res.features[itemPos]
            var lonlat = resultItem.geometry.coordinates
            var item = {
              id: parseInt(itemPos) + 1,
              text: resultItem.properties.text,
              place: lonlat[1] + ',' + lonlat[0],
              source: 'pelias'
            }

            data.push(item)
          }

          callback(data)
        }
      })
    } else {
      PeliasGeocoder.lookup(query, callback)
    }
  }
}

/* Mapbox's geocoder */

var MapboxGeocoder = {
  reverse: function (place, callback) {
    var latlon = place.split(',')

    if (typeof window.OTP_config.mapboxAccessToken === "undefined") {
      console.log("WARNING: You haven't set a mapbox access token!")
      return callback()
    }

    var params = {
      access_token: window.OTP_config.mapboxAccessToken,
    }

    $.ajax({
      url: '//api.mapbox.com/v4/geocode/mapbox.places/' + encodeURIComponent(query) + '.json',
      type: 'GET',
      data: params,
      dataType: 'json',
      error: callback,
      success: function (res) {
        if (res.features.length <= 0) {
          return callback('No address found for ' + latlon[1] + ',' + latlon[0], {
            text: 'No address found for location',
            place: place
          })
        }
        var lonlat = res.features[0].geometry.coordinates
        callback(null, {
          address: res.features[0].place_name,
          // city: address.city,
          // state: address.state,
          place: lonlat[1] + ',' + lonlat[0]
        })
      }
    })
  },

  lookup: function (query, callback) {
    if (!query.length) return callback()

    if (typeof window.OTP_config.mapboxAccessToken === "undefined") {
      console.log("WARNING: You haven't set a mapbox access token!")
      return callback()
    }

    var params = {
      access_token: window.OTP_config.mapboxAccessToken,
    }

    /* Mapbox also takes in lon/lat */
    if(initialLocation) params.proximity = initialLocation

    $.ajax({
      url: '//api.mapbox.com/v4/geocode/mapbox.places/' + encodeURIComponent(query) + '.json',
      type: 'GET',
      data: params,
      dataType: 'json',
      error: callback,
      success: function (res) {
        var data = []
        for (var itemPos in res.features.slice(0, maxSuggestResults)) {
          var resultItem = res.features[itemPos]
          var lonlat = resultItem.geometry.coordinates
          var item = {
            id: parseInt(itemPos) + 1,
            text: resultItem.place_name,
            place: lonlat[1] + ',' + lonlat[0],
            source: 'mapbox'
          }

          data.push(item)
        }

        callback(data)
      }
    })
  },

  suggest: function (query, callback) {
    MapboxGeocoder.lookup(query, callback)
  }
}

/* Geocoding function that splits suggest query between multiple other geocoders */

// Array of geocoder ids to lookup. Defaults to 'esri' only, can be overriddin in config
var geocoders = window.OTP_config.geocoders || ['esri']

// Lookup mapping geocoder id to object
var geocoderLookup = {
  esri : EsriGeocoder,
  otp : OtpBuiltInGeocoder,
  nominatim : NominatimGeocoder,
  pelias : PeliasGeocoder,
  mapbox : MapboxGeocoder,
}

var MultiGeocoder = {
  reverse: function (place, callback) {
    if (typeof window.OTP_config.reverseGeocoder === "undefined") {
      EsriGeocoder.reverse(place, callback)
    } else {
      geocoderLookup[window.OTP_config.reverseGeocoder].reverse(place, callback)
    }
  },

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
  lookup: EsriGeocoder.lookup,
  reverse: MultiGeocoder.reverse,
  suggest: MultiGeocoder.suggest
}
