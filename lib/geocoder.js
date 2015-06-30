var $ = window.$

var EsriGeocoder = {
  reverse: function (place, callback) {
    // esri takes lon/lat
    var parts = place.split(',')
    var lonlat = parts[1] + ',' + parts[0]

    $.ajax({
      url: window.OTP_config.esriApi + 'reverseGeocode?location=' +
        encodeURIComponent(lonlat) + '&f=json',
      type: 'GET',
      dataType: 'jsonp',
      error: callback,
      success: function (res) {
        if (!res.address) {
          return callback('No address found for ' + lonlat, {
            text: 'No address found for location',
            id: place
          })
        }

        var address = res.address
        var location = res.location
        callback(null, {
          address: address.Address,
          city: address.City,
          state: address.Region,
          id: location.y + ',' + location.x
        })
      }
    })
  },

  lookup: function (query, callback) {
    if (!query.length) return callback()

    $.ajax({
      url: window.OTP_config.esriApi + 'suggest?text=' + encodeURIComponent(
          query) + '&outFields=City,Region&f=json&location=',
      type: 'GET',
      dataType: 'jsonp',
      error: callback,
      success: function (res) {
        var data = []
        for (var itemPos in res.locations.slice(0, 10)) {
          var item = {
            text: res.locations[itemPos].name.split(',')[0],
            id: itemPos + 1
          }

          data.push(item)
        }

        callback(data)
      }
    })
  }

}

var SimplecoderGeocoder = {
  lookup: function (query, callback) {
    if (!query.length) return callback()

    $.ajax({
      url: '',
      type: 'GET',
      dataType: 'jsonp',

      error: function () {
        callback()
      },
      success: function (res) {
        var data = []
        for (var item in res.slice(0, 10)) {
          var itemData = {}
          itemData.id = res[item].lat + ',' + res[item].lon
          itemData.text = res[item].address
          data.push(itemData)
        }

        callback(data)
      }

    })
  },

  reverse: function (place, error, success) {
    $.ajax({
      url: window.OTP_config.simplecoderApi + '/r/' + encodeURIComponent(
          place),
      type: 'GET',
      error: function () {
        error()
      },
      success: function (res) {
        res.latlon = res.lat + ',' + res.lon
      }
    })
  }
}

module.exports = {
  EsriGeocoder: EsriGeocoder,
  lookup: EsriGeocoder.lookup,
  reverse: EsriGeocoder.reverse,
  SimplecoderGeocoder: SimplecoderGeocoder
}
