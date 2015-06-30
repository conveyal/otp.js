var Backbone = window.Backbone

var ItineraryStop = Backbone.Model.extend({
  defaults: {
    name: null,
    stopId: null,
    agencyId: null,
    stopCode: null,
    lat: null,
    lon: null,
    arrival: null,
    departure: null
  }
})

module.exports = ItineraryStop
