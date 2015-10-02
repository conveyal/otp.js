window.OTP_config = {
  initLatLng: [38.880148, -77.105933],

  osmMapKey: 'conveyal.ikck6888', // temporary -- do not use in production, provide your own
  aerialMapKey: 'conveyal.map-a3mk3jug', // unset

  // mapboxAccessToken: 'Change this to your mapbox public token (starts with pk) if you want to use the mapbox geocoder',

  otpApi: 'http://192.168.59.103:8080/otp/routers/',

  // geocoders to use:
  geocoders: [ 'mapbox' ], // possible choices: esri, otp, nominatim, pelias, mapbox
  reverseGeocoder: 'esri', // possible choices: esri, nominatim, pelias, mapbox
  reverseGeocode: true,

  // geocoder api endpoints
  nominatimApi: 'https://nominatim.openstreetmap.org/',
  esriApi: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/',
  peliasApi: 'https://pelias.mapzen.com/',
}
