var Geocoder = {
  reverse: function(place, error, success) {
    return EsriGeocoder.reverse(place, error, success);
  },

  lookup: function(query, callback, select) {
    return EsriGeocoder.lookup(query, callback, select);
  }
};

module.exports.Geocoder = Geocoder;

var EsriGeocoder = {

  reverse: function(place, error, success) {

    // esri takes lon/lat
    var parts = place.split(',');
    var lonlat = parts[1] + ',' + parts[0];

    $.ajax({
      url: window.OTP_config.esriApi + 'reverseGeocode?location=' +
        encodeURIComponent(lonlat) + '&f=pjson',
      type: 'GET',
      dataType: 'jsonp',
      error: function() {
        error();
      },
      success: function(res) {

        var data = {
          address: res.address.Address,
          city: res.address.City,
          state: res.address.Region,
          latlon: place
        };

        success(data);
      }
    });
  },

  lookup: function(query, callback, select) {

    if (!query.length) return callback();

    $.ajax({
      url: window.OTP_config.esriApi + 'suggest?text=' + encodeURIComponent(
        query) + '&outFields=City,Region&f=pjson&location=',
      type: 'GET',
      dataType: 'jsonp',

      error: function() {
        callback();
      },
      success: function(res) {
        var data = [];
        for (var itemPos in res.locations.slice(0, 10)) {

          var item = {
            text: res.locations[itemPos].name.split(',')[0],
            //city : res.locations[itemPos].feature.attributes.City,
            //state : res.locations[itemPos].feature.attributes.Region,
            id: itemPos + 1 //res.locations[itemPos].feature.geometry.y + ',' + res.locations[itemPos].feature.geometry.x
          };

          data.push(item);
        }

        callback(data);
      }
    });
  }

};

module.exports.EsriGeocoder = EsriGeocoder;

var SimplecoderGeocoder = {

  lookup: function(query, callback) {

    if (!query.length) return callback();

    $.ajax({
      url: '',
      type: 'GET',
      dataType: 'jsonp',

      error: function() {
        callback();
      },
      success: function(res) {
        var data = [];
        for (var item in res.slice(0, 10)) {
          var itemData = {};
          itemData.id = res[item].lat + ',' + res[item].lon;
          itemData.text = res[item].address;
          data.push(itemData);
        }

        callback(data);
      }

    });
  },

  reverse: function(place, error, success) {
    $.ajax({
      url: window.OTP_config.simplecoderApi + '/r/' + encodeURIComponent(
        place),
      type: 'GET',
      error: function() {
        error();
      },
      success: function(res) {
        res.latlon = res.lat + ',' + res.lon;
      }
    });
  }

};

module.exports.SimplecoderGeocoder = SimplecoderGeocoder;
