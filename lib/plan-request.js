var qs = require('querystring')

var Itineraries = require('./itineraries')
var ItineraryStop = require('./itinerary-stop')
var log = require('./log')('plan-request')
var PlanResponse = require('./plan-response')
var utils = require('./utils')

var Backbone = window.Backbone
var $ = window.$

var PlanRequest = Backbone.Model.extend({
  initialize: function (opts) {
    var self = this
    if (window.OTP_config.routerDefaults) {
      for (var key in window.OTP_config.routerDefaults) {
        this.set(key, window.OTP_config.routerDefaults[key])
      }
    }
    this.on('change', function () {
      self.request()
    })
  },

  defaults: {
    fromPlace: null,
    toPlace: null,
    intermediatePlaces: null,
    intermediatePlacesOrdered: null,
    date: null,
    time: null,
    routerId: null,
    arriveBy: null,
    wheelchair: null,
    maxWalkDistance: 8046,
    walkSpeed: null,
    bikeSpeed: null,
    triangleSafetyFactor: null,
    triangleSlopeFactor: null,
    triangleTimeFactor: null,
    optimize: null,
    mode: 'TRANSIT,WALK',
    minTransferTime: null,
    preferredRoutes: null,
    preferredAgencies: null,
    unpreferredRoutes: null,
    unpreferredAgencies: null,
    showIntermediateStops: null,
    bannedRoutes: null,
    bannedAgencies: null,
    bannedTrips: null,
    transferPenalty: null,
    maxTransfers: null,
    numItineraries: 3,
    wheelchairAccessible: false
  },

  request: function () {
    if (!this.attributes.fromPlace) {
      this.trigger('failure', 'Click the map or enter an address to select a start location')
    } else if (!this.attributes.toPlace) {
      this.trigger('failure', 'Click the map or enter an address to select an end location')
    } else {
      log('requesting plan %s', this.urlRoot + this.toQueryString())
      this.trigger('requesting', this)

      var m = this

      $.ajax(this.urlRoot, {
        dataType: 'json',
        data: utils.filterParams(this.attributes)
      })
        .done(function (data) {
          log('processing results')
          if (data.error) {
            m.trigger('failure',
              'No transit trips found within 5 miles of your search, try adjusting your start or end locations. Only major metropolitan areas are currently covered. Please check back for expanded data coverage.'
            )
          } else if (data && data.plan) {
            if (data.plan.from && data.plan.to) {
              if (data.plan.itineraries && data.plan.itineraries.length > 0) {
                m.trigger('success', m.processRequest(data.plan))
              } else {
                m.trigger('failure',
                  'No transit trips found within 5 miles of your search, try adjusting your start or end locations. Only major metropolitan areas are currently covered. Please check back for expanded data coverage.'
                )
              }
            } else {
              m.trigger('failure',
                'Problem finding results for those locations. Please enter a valid start and end location.')
            }
          } else {
            m.trigger('failure',
              'Problem finding results for those locations. Please enter a valid start and end location.')
          }
        })
        .fail(function (xhr, status) {
          log('error: %s', status)
          m.trigger('failure', 'Unable to plan trip.')
        })
    }
  },

  processRequest: function (plan) {
    var itins = new Itineraries(plan.itineraries)

    // For each itin
    itins.each(function (itin) {
      itins.handleActivate(itin)
    })

    return new PlanResponse({
      request: this,
      from: new ItineraryStop(plan.from),
      to: new ItineraryStop(plan.to),
      date: plan.date,
      itineraries: itins
    })
  },

  getFromLatLng: function () {
    if (!this.get('fromPlace')) {
      return null
    }

    var llStr = this.get('fromPlace').split('::')[0].split(',')
    return [parseFloat(llStr[0]), parseFloat(llStr[1])]
  },

  getToLatLng: function () {
    if (!this.get('toPlace')) {
      return null
    }

    var llStr = this.get('toPlace').split('::')[0].split(',')
    return [parseFloat(llStr[0]), parseFloat(llStr[1])]
  },

  toQueryString: function () {
    return '?' + qs.stringify(utils.filterParams(this.attributes))
  },

  fromQueryString: function (queryString) {
    this.set(qs.parse(queryString))
  }
})

module.exports = PlanRequest
