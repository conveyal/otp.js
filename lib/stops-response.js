var Stops = require('./stops')

var Backbone = window.Backbone
var _ = window._

var StopsResponse = Backbone.Model.extend({
  initialize: function () {
    var rawAttributes = arguments[0]
    var processedAttributes = _.omit(rawAttributes, ['stops'])

    // re-map the stop's 'id' object to 'stopId'; otherwise the backbone collection doesn't properly initialize
    _.each(rawAttributes.stops, function (stop) {
      stop.stopId = stop.id
      delete stop.id
    })

    processedAttributes.stops = new Stops()
    processedAttributes.stops.add(rawAttributes.stops)

    this.set(processedAttributes)
  },

  defaults: {
    request: null,
    stops: []
  }
})

module.exports = StopsResponse
