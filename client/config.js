window.OTP_config = {
  initLatLng: [45.52, -122.681944],

  osmMapKey: 'your-mapbox-osm-key',
  aerialMapKey: 'your-mapbox-aerial-key',

  // mapzenApiKey: "your-key", // your Mapzen Search API key
  // geocoderSearchRadius : 25, // search radius in km for mapzen geocoder from initLatLng (defaults to 50 if not specified)

  otpApi: 'http://localhost:8001/otp/routers/',

  // geocoders to use:
  geocoders: [ 'edsi' ], // possible choices: esri, otp, nominatim, mapzen, mapbox
  reverseGeocoder: 'esri', // possible choices: esri, nominatim, mapzen, mapbox
  reverseGeocode: true,

  // geocoder api endpoints
  nominatimApi: 'https://nominatim.openstreetmap.org/',
  esriApi: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/',
  mapzenApi: 'https://search.mapzen.com/v1/'
}
