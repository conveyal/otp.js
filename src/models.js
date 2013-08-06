'use strict';

var _ = require('underscore');
var $ = jQuery = require('jquery-browserify');
var Backbone = require('backbone');


module.exports.OtpPlanRequest = Backbone.Model.extend({ 

      initialize: function(opts) {

        _.bindAll(this, 'request', 'processRequest');
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

      }
});


module.exports.OtpPlanResponse = Backbone.Model.extend({ 

      initialize: function(opts){

        // need this or need to move init code to constructor?
        this.unset('plan');

        var rawAttributes = arguments[0]['plan'];
        var processedAttributes = _.omit(rawAttributes, ['itineraries', 'to', 'from']);
        
        processedAttributes.to = new OTP.models.OtpItineraryStop(rawAttributes['to']);
        processedAttributes.from = new OTP.models.OtpItineraryStop(rawAttributes['from']);

        processedAttributes.itineraries = new OTP.models.OtpItineraries();
        processedAttributes.itineraries.add(rawAttributes['itineraries']);

        this.set(processedAttributes);
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
      }


  });

module.exports.OtpItineraries = Backbone.Collection.extend({ 
      
      type: 'OtpItineraries',
      model: module.exports.OtpItinerary
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
      }

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
