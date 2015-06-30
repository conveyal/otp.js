var ItineraryLeg = require('./itinerary-leg')

var Backbone = window.Backbone

var ItineraryLegs = Backbone.Collection.extend({
  model: ItineraryLeg
})

module.exports = ItineraryLegs
