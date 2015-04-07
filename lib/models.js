'use strict';

var fetch = window.fetch;
var log = require('./log')('models');
var qs = require('querystring');
var utils = require('./utils');

var OTPURL = window.OTP_config.otpApi + window.OTP_config.routerId;

var PlanRequest = module.exports.PlanRequest = Backbone.Model.extend({

  initialize: function(opts) {
    var self = this;
    this.on('change', function() {
      self.request();
    });
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

  request: function() {
    if (!this.attributes.fromPlace) {
      this.trigger('failure', 'Click the map or enter an address to select a start location');
    } else if (!this.attributes.toPlace) {
      this.trigger('failure', 'Click the map or enter an address to select an end location');
    } else {
      log('requesting plan %s', this.urlRoot + this.toQueryString());
      this.trigger('requesting', this);

      var m = this;

      $.ajax(this.urlRoot, {
          dataType: 'json',
          data: utils.filterParams(this.attributes)
        })
        .done(function(data) {
          log('processing results');
          if (data.error) {
            m.trigger('failure',
              'No transit trips found within 5 miles of your search, try adjusting your start or end locations. Only major metropolitan areas are currently covered. Please check back for expanded data coverage.'
            );
          } else if (data && data.plan) {
            if (data.plan.from && data.plan.to) {
              if (data.plan.itineraries && data.plan.itineraries.length > 0) {
                m.trigger('success', m.processRequest(data.plan));
              } else {
                m.trigger('failure',
                  'No transit trips found within 5 miles of your search, try adjusting your start or end locations. Only major metropolitan areas are currently covered. Please check back for expanded data coverage.'
                );
              }
            } else {
              m.trigger('failure',
                'Problem finding results for those locations. Please enter a valid start and end location.');
            }
          } else {
            m.trigger('failure',
              'Problem finding results for those locations. Please enter a valid start and end location.');
          }
        })
        .fail(function(xhr, status) {
          log('error: %s', status);
          m.trigger('failure', "Unable to plan trip.");
        });
    }
  },

  processRequest: function(plan) {
    var itins = new Itineraries(plan.itineraries);

    // For each itin
    itins.each(function(itin) {
      itins.handleActivate(itin);
    });

    return new PlanResponse({
      request: this,
      from: new ItineraryStop(plan.from),
      to: new ItineraryStop(plan.to),
      date: plan.date,
      itineraries: itins
    });
  },

  getFromLatLng: function() {
    if (!this.get('fromPlace'))
      return null;

    var llStr = this.get('fromPlace').split('::')[0].split(',');
    return [parseFloat(llStr[0]), parseFloat(llStr[1])];
  },

  getToLatLng: function() {
    if (!this.get('toPlace'))
      return null;

    var llStr = this.get('toPlace').split('::')[0].split(',');
    return [parseFloat(llStr[0]), parseFloat(llStr[1])];
  },

  toQueryString: function() {
    return '?' + qs.stringify(utils.filterParams(this.attributes));
  },

  fromQueryString: function(queryString) {
    this.set(qs.parse(queryString));
  }
});

var PlanResponse = module.exports.PlanResponse = Backbone.Model.extend({
  defaults: {
    request: null,
    to: null,
    from: null,
    date: null,
    itineraries: []
  },

  getTimeOffset: function() {
    var queryDate = moment(this.get('request').get('date') + ' ' + this.get('request').get('time'), 'MM-DD-YYYY h:mm a');
    var responseDate = moment(this.get('date'));
    var offset = (queryDate - responseDate) / 3600000;
    return offset;
  }
});

var Itinerary = module.exports.Itinerary = Backbone.Model.extend({
  initialize: function(opts) {
    this.set('legs', new ItineraryLegs(this.get('legs')));
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

  getBoundsArray: function() {
    var legs = this.get('legs');
    var start = legs.at(0).get('from');
    var end = legs.at(legs.length - 1).get('to');
    return [
      [Math.min(start.lat, end.lat), Math.min(start.lon, end.lon)],
      [Math.max(start.lat, end.lat), Math.max(start.lon, end.lon)]
    ];
  },

  /* returns the 'full' duration of a trip, including the duration of the
   * trip itself plus any time between the trip and the requested departure/
   * arrival time. Requires the request model as a parameter.
   */

  getFullDuration: function(request, offset) {
    var queryDateTime = moment(request.get('date') + ' ' + request.get(
      'time'), 'MM-DD-YYYY h:mma');
    var startTime = moment(this.get('startTime')),
      endTime = moment(this.get('endTime'));

    if (offset) {
      startTime = startTime.add('hours', offset);
      endTime = endTime.add('hours', offset);
    }

    if (request.get('arriveBy') === 'true' || request.get('arriveBy') ===
      true) {
      return queryDateTime - startTime;
    }
    return endTime - queryDateTime;
  }

});

var Itineraries = module.exports.Itineraries = Backbone.Collection.extend({
  model: Itinerary,

  initialize: function() {
    var self = this;

    // for any itin added to this collection..
    this.on('add', function(itin) {
      self.handleActivate(itin);
    });
  },

  handleActivate: function(itin) {
    var self = this;
    this.listenTo(itin, 'activate', function() {
      if (self.activeItinerary && itin !== self.activeItinerary)
        self.activeItinerary.trigger('deactivate');

      self.activeItinerary = itin;
    });
  }
});

var ItineraryLeg = module.exports.ItineraryLeg = Backbone.Model.extend({
  initialize: function() {
    this.set('steps', new ItineraryWalkSteps(this.get('steps')));
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

  isTransit: function(mode) {
    mode = mode || this.get('mode');
    return mode === 'TRANSIT' || mode === 'SUBWAY' || mode === 'FERRY' || mode === 'RAIL' ||
      mode === 'BUS' || mode === 'TRAM' || mode === 'GONDOLA' || mode ===
      'TRAINISH' || mode === 'BUSISH';
  },

  isWalk: function(mode) {
    mode = mode || this.get('mode');
    return mode === 'WALK';
  },

  isBicycle: function(mode) {
    mode = mode || this.get('mode');
    return mode === 'BICYCLE';
  },

  isCar: function(mode) {
    mode = mode || this.get('mode');
    return mode === 'CAR';
  },

  getMapColor: function(mode) {
    mode = mode || this.get('mode');
    if (mode === 'WALK') return '#444';
    if (mode === 'BICYCLE') return '#0073e5';
    if (mode === 'SUBWAY') return '#f00';
    if (mode === 'RAIL') return '#b00';
    if (mode === 'BUS') return '#080';
    if (mode === 'TRAM') return '#800';
    if (mode === 'FERRY') return '#008';
    if (mode === 'CAR') return '#444';
    return '#aaa';
  },

  getStopTimes: function(callback) {
    console.log(this.toJSON());
  },

  getSurroundingStopTimes: function(callback) {
    var from = this.get('from');
    var serviceDate = this.get('serviceDate');
    var qs = OTPURL + '/index/stops/' + from.stopId + '/stoptimes/' + serviceDate;
    $.get(qs, callback);
  }
});

var ItineraryLegs = module.exports.ItineraryLegs = Backbone.Collection.extend({
  model: ItineraryLeg
});

var ItineraryStop = module.exports.ItineraryStop = Backbone.Model.extend({
  defaults: {
    name: null,
    stopId: null,
    agencyId: null,
    stopCode: null,
    lat: null,
    lon: null,
    arrival: null,
    departure: null
  }
});

var ItineraryWalkStep = module.exports.ItineraryWalkStep = Backbone.Model.extend({
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
});

var ItineraryWalkSteps = module.exports.ItineraryWalkSteps = Backbone.Collection.extend({
  model: ItineraryWalkStep
});
