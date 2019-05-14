var ItineraryWalkStep = require('./itinerary-walk-step')

var Backbone = require('backbone')

var ItineraryWalkSteps = Backbone.Collection.extend({
  model: ItineraryWalkStep
})

module.exports = ItineraryWalkSteps
