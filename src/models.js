'use strict';

var _ = require('underscore');
var $ = jQuery = require('jquery-browserify');
var Backbone = require('../lib/backbone');


module.exports.OtpPlanRequest = Backbone.Model.extend({ 

      initialize: function(opts) {

        _.bindAll(this, 'request', 'processRequest');

        this.on('change', this.request);

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
        maxWalkDistance: null,
        walkSpeed: null,  
        bikeSpeed: null,
        triangleSafetyFactor: null,
        triangleSlopeFactor: null,
        triangleTimeFactor: null,
        optimize: null,
        mode: null,
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
        maxTransfers: null
      },

      

      request: function() {

        var m = this;

        // don't make complete requests
        if(!this.attributes.fromPlace || !this.attributes.toPlace)
          return false;

        $.ajax(this.urlRoot, {dataType: 'jsonp', data: OTP.utils.filterParams(this.attributes)})
          .done(function(data) {
            m.trigger('success', m.processRequest(data));
          })
          .fail(function(data){
            m.trigger('failure', data);
          });
      },

      processRequest: function(data) {

        var response = new OTP.models.OtpPlanResponse(data);

        response.set('request', this);

        return response;

      },

      getFromLatLng: function() {
          if(!this.get('fromPlace'))
            return null;

          var llStr = this.get('fromPlace').split('::')[0].split(',');
          return [ parseFloat(llStr[0]), parseFloat(llStr[1]) ];
      },

      getToLatLng: function() {
          if(!this.get('toPlace'))
            return null;
          
          var llStr = this.get('toPlace').split('::')[0].split(',');
          return [ parseFloat(llStr[0]), parseFloat(llStr[1]) ];
      }
});


module.exports.OtpPlanResponse = Backbone.Model.extend({ 

      initialize: function(opts){

        // need this or need to move init code to constructor?
        this.unset('plan');

        var rawAttributes = arguments[0]['plan'];
        
        if(rawAttributes) {

          var processedAttributes = _.omit(rawAttributes, ['itineraries', 'to', 'from']);
        
          processedAttributes.to = new OTP.models.OtpItineraryStop(rawAttributes['to']);
          processedAttributes.from = new OTP.models.OtpItineraryStop(rawAttributes['from']);

          processedAttributes.itineraries = new OTP.models.OtpItineraries();
          processedAttributes.itineraries.add(rawAttributes['itineraries']);
          //processedAttributes.itineraries.initListeners();

          this.set(processedAttributes);

        }

      },

      defaults: {  
        request: null,
        to: null,
        from: null,
        date: null,
        itineraries: []
      }

});


module.exports.OtpItinerary = Backbone.Model.extend({ 

      initialize: function(opts){

        var rawAttributes = arguments[0];
        var processedAttributes = _.omit(rawAttributes, ['legs']);
        
        processedAttributes.legs = new OTP.models.OtpItineraryLegs();
        processedAttributes.legs.add(rawAttributes['legs']);

        this.set(processedAttributes);

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
    
      getBoundsArray : function() {
          var legs = this.get('legs');
          var start = legs.at(0).get('from');
          var end = legs.at(legs.length-1).get('to');
          return [[Math.min(start.lat, end.lat), Math.min(start.lon, end.lon)],
                  [Math.max(start.lat, end.lat), Math.max(start.lon, end.lon)]];
      },


  });

module.exports.OtpItineraries = Backbone.Collection.extend({ 
      
      type: 'OtpItineraries',
      model: module.exports.OtpItinerary,

      initialize : function() {
        // for any itin added to this collection..
        this.on("add", function(itin) {
          // ..wire its "activate" event to trigger a "deactivate" on the collection's previously active itin (if any exists)
          this.listenTo(itin, "activate", function() {
            if(this.activeItinerary) this.activeItinerary.trigger("deactivate");
            // ..and set the collection's active itin to the newly activated one
            this.activeItinerary = itin;
          })
        });
      },

  });

 
module.exports.OtpItineraryLeg = Backbone.Model.extend({

      initialize: function(){

        var rawAttributes = arguments[0];
        var processedAttributes = _.omit(rawAttributes, ['steps']);
        
        processedAttributes.steps = new OTP.models.OtpItineraryWalkSteps();
        processedAttributes.steps.add(rawAttributes['steps']);

        this.set(processedAttributes);

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

      isTransit : function(mode) {
        mode = mode || this.get('mode');
        return mode === "TRANSIT" || mode === "SUBWAY" || mode === "RAIL" || mode === "BUS" || mode === "TRAM" || mode === "GONDOLA" || mode === "TRAINISH" || mode === "BUSISH";
      },

      isWalk : function(mode) {
        mode = mode || this.get('mode');
        return mode === "WALK";
      },

      isBicycle : function(mode) {
        mode = mode || this.get('mode');
        return mode === "BICYCLE";
      },

      isCar : function(mode) {
        mode = mode || this.get('mode');
        return mode === "CAR";
      },

      getMapColor : function(mode) {
        mode = mode || this.get('mode');
        if(mode === "WALK") return '#444';
        if(mode === "BICYCLE") return '#0073e5';
        if(mode === "SUBWAY") return '#f00';
        if(mode === "RAIL") return '#b00';
        if(mode === "BUS") return '#080';
        if(mode === "TRAM") return '#800';
        if(mode === "CAR") return '#444';
        return '#aaa';
      },

  });

  module.exports.OtpItineraryLegs = Backbone.Collection.extend({ 
      
      type: 'OtpItineraryLegs',
      model: module.exports.OtpItineraryLeg
  });


  module.exports.OtpItineraryStop = Backbone.Model.extend({ 

    initialize: function(){
      
    },

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

  module.exports.OtpItineraryWalkStep = Backbone.Model.extend({ 

      initialize: function(){
        
      },

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

  module.exports.OtpItineraryWalkSteps = Backbone.Collection.extend({ 
      
      type: 'OtpItineraryWalkSteps',
      model: module.exports.OtpItineraryWalkStep
  });

// to do: alert model
// to do fare model
