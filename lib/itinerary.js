var ItineraryLegs = require('./itinerary-legs')
var utils = require('./utils')

var Backbone = window.Backbone
var moment = window.moment

var Itinerary = Backbone.Model.extend({
  initialize: function (opts) {
    this.set('legs', this.processLegs())
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

  processLegs: function () {
    var processedLegs = []
    for (var i = 0; i < this.get('legs').length; i++) {
      var leg = this.get('legs')[i]

      // convert the encoded poly line to a latlng array
      leg.geomPoints = utils.decodePolyline(leg.legGeometry.points)

      // check for interlined-leg merge case (enabled via flag in config.js)
      if (i > 0) var prevLeg = this.get('legs')[i - 1]
      if (window.OTP_config.mergeInterlinedRouteLegs && leg.interlineWithPreviousLeg && prevLeg &&
        prevLeg.agencyId === leg.agencyId && prevLeg.routeId === leg.routeId) {
        // merge this leg with the previous leg
        leg.startTime = prevLeg.startTime
        leg.duration = (leg.endTime - leg.startTime) / 1000
        leg.distance += prevLeg.distance
        leg.from = prevLeg.from
        leg.headsign = prevLeg.headsign
        leg.geomPoints = prevLeg.geomPoints.concat(leg.geomPoints)

        // remove prevLeg from the processed legs array
        processedLegs.pop()
      }

      processedLegs.push(leg)
    }

    return new ItineraryLegs(processedLegs)
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
