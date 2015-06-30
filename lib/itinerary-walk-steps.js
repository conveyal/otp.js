var ItineraryWalkStep = require('./itinerary-walk-step')

var Backbone = window.Backbone

var ItineraryWalkSteps = Backbone.Collection.extend({
  model: ItineraryWalkStep
})

module.exports = ItineraryWalkSteps
