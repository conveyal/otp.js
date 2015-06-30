var Backbone = window.Backbone

var ItineraryWalkStep = Backbone.Model.extend({
  defaults: {
    distance: null,
    relativeDirection: null,
    absoluteDirection: null,
    streetName: null,
    exit: null,
    stayOn: null,
    bogusName: null,
    lon: null,
    lat: null
  }
})

module.exports = ItineraryWalkStep
