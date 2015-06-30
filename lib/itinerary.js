var ItineraryLegs = require('./itinerary-legs')

var Backbone = window.Backbone
var moment = window.moment

var Itinerary = Backbone.Model.extend({
  initialize: function (opts) {
    this.set('legs', new ItineraryLegs(this.get('legs')))
  },

  defaults: {
    duration: null,
    startTime: null,
    endTime: null,
    walkTime: null,
    transitTime: null,
    elevationLost: null,
    locationLon: null,
    elevationGained: null,
    transfers: null,
    fare: [],
    legs: []
  },

  /* returns [[south, west], [north, east]] */

  getBoundsArray: function () {
    var legs = this.get('legs')
    var start = legs.at(0).get('from')
    var end = legs.at(legs.length - 1).get('to')
    return [
      [Math.min(start.lat, end.lat), Math.min(start.lon, end.lon)],
      [Math.max(start.lat, end.lat), Math.max(start.lon, end.lon)]
    ]
  },

  /* returns the 'full' duration of a trip, including the duration of the
   * trip itself plus any time between the trip and the requested departure/
   * arrival time. Requires the request model as a parameter.
   */

  getFullDuration: function (request, offset) {
    var queryDateTime = moment(request.get('date') + ' ' + request.get('time'), 'MM-DD-YYYY h:mma')
    var startTime = moment(this.get('startTime'))
    var endTime = moment(this.get('endTime'))

    if (offset) {
      startTime = startTime.add('hours', offset)
      endTime = endTime.add('hours', offset)
    }

    if (request.get('arriveBy') === 'true' || request.get('arriveBy') ===
      true) {
      return queryDateTime - startTime
    }
    return endTime - queryDateTime
  }

})

module.exports = Itinerary
