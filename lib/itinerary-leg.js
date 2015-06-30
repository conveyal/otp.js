var ItineraryWalkSteps = require('./itinerary-walk-steps')

var Backbone = window.Backbone
var $ = window.$

var OTPURL = window.OTP_config.otpApi + window.OTP_config.routerId

var ItineraryLeg = Backbone.Model.extend({
  initialize: function () {
    this.set('steps', new ItineraryWalkSteps(this.get('steps')))
  },

  defaults: {
    mode: null,
    route: null,
    agencyName: null,
    agencyUrl: null,
    agencyTimeZoneOffset: null,
    routeColor: null,
    routeType: null,
    routeId: null,
    routeTextColor: null,
    interlineWithPreviousLeg: null,
    tripShortName: null,
    headsign: null,
    agencyId: null,
    tripId: null,
    routeShortName: null,
    routeLongName: null,
    boardRule: null,
    alightRule: null,
    rentedBike: null,

    startTime: null,
    endTime: null,
    distance: null,

    toStop: null,
    fromStop: null,

    legGeometry: null,

    intermediateStops: [],

    steps: [],

    notes: [],

    alerts: []
  },

  isTransit: function (mode) {
    mode = mode || this.get('mode')
    return mode === 'TRANSIT' || mode === 'SUBWAY' || mode === 'FERRY' || mode === 'RAIL' ||
      mode === 'BUS' || mode === 'TRAM' || mode === 'GONDOLA' || mode ===
      'TRAINISH' || mode === 'BUSISH'
  },

  isWalk: function (mode) {
    mode = mode || this.get('mode')
    return mode === 'WALK'
  },

  isBicycle: function (mode) {
    mode = mode || this.get('mode')
    return mode === 'BICYCLE'
  },

  isCar: function (mode) {
    mode = mode || this.get('mode')
    return mode === 'CAR'
  },

  getMapColor: function (mode) {
    mode = mode || this.get('mode')
    if (mode === 'WALK') return '#444'
    if (mode === 'BICYCLE') return '#0073e5'
    if (mode === 'SUBWAY') return '#f00'
    if (mode === 'RAIL') return '#b00'
    if (mode === 'BUS') return '#080'
    if (mode === 'TRAM') return '#800'
    if (mode === 'FERRY') return '#008'
    if (mode === 'CAR') return '#444'
    return '#aaa'
  },

  getStopTimes: function (callback) {
    console.log(this.toJSON())
  },

  getSurroundingStopTimes: function (callback) {
    var from = this.get('from')
    var serviceDate = this.get('serviceDate')
    var qs = OTPURL + '/index/stops/' + from.stopId + '/stoptimes/' + serviceDate
    $.get(qs, callback)
  }
})

module.exports = ItineraryLeg
