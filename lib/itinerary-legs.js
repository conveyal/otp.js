var ItineraryLeg = require('./itinerary-leg')

var Backbone = require('backbone')

var ItineraryLegs = Backbone.Collection.extend({
  model: ItineraryLeg
})

module.exports = ItineraryLegs
