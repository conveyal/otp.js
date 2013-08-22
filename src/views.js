var _ = require('underscore');
var $ = jQuery = require('jquery-browserify');
var Backbone = require('../lib/backbone');
var Handlebars = require('handlebars');


var OtpPlanResponseNarrativeView = Backbone.View.extend({
 
    render : function() {
    	var itins = this.model.get("itineraries");

    	this.$el.html("Found " + itins.length + " itineraries:");

    	_.each(itins.models, this.processItinerary, this);

        itins.at(0).trigger("activate");
    },

    processItinerary : function(itin, index) {
    	var itinView = new OtpItineraryNarrativeView({
            model: itin,
            planView: this,
            index: index
    	});

    	itinView.render();
    	this.$el.append(itinView.el);

        if(this.options.map) {
            var itinMapView = new OTP.views.OtpItineraryMapView({
                map: this.options.map,
                model : itin,
                planView : this
            });
        }
    },

    newResponse : function(response) {

        // fire a deactivate event on the old active itin, if needed
        if(this.model && this.model.get("itineraries") && this.model.get("itineraries").activeItinerary) {
            this.model.get("itineraries").activeItinerary.trigger("deactivate");
        }

        this.model = response;
        this.render();
    },
});

module.exports.OtpPlanResponseNarrativeView = OtpPlanResponseNarrativeView;


var itinNarrativeTemplate = Handlebars.compile([
	'<div class="otp-itinerary">',
        '<div class="otp-itinHeader">',
    		'Itinerary {{index}}',
        '</div>',
        '<div class="otp-itinBody"></div>',
	'</div>'
].join('\n'));

var OtpItineraryNarrativeView = Backbone.View.extend({
 
    events: {
        "click .otp-itinHeader" : "headerClicked"
    },

    initialize : function() {
        this.listenTo(this.model, "activate", this.expand);
        this.listenTo(this.model, "deactivate", this.collapse);
    },

    render : function() {
        var context = _.clone(this.model.attributes);
        context.index = this.options.index + 1;
        this.$el.html(itinNarrativeTemplate(context));
        
        var legs = this.model.get("legs");
        _.each(legs.models, this.processLeg, this);

        this.$el.find(".otp-itinBody").hide();
    },

    processLeg : function(leg) {
        var legView = new OtpLegNarrativeView({
            model: leg,
        });
        legView.render();
        this.$el.find('.otp-itinBody').append(legView.el);
    },

    collapse : function() {
        this.$el.find(".otp-itinBody").slideUp("fast");
    },

    expand : function() {
        this.$el.find(".otp-itinBody").slideDown("fast");
    },

    headerClicked : function(e) {
        if(!this.$el.find(".otp-itinBody").is(":visible")) {
            this.model.trigger("activate");
        } 
    },

});

module.exports.OtpItineraryNarrativeView = OtpItineraryNarrativeView;


Handlebars.registerHelper('formatTime', function(time) {
    return OTP.utils.formatTime(time);
});

Handlebars.registerHelper('formatDuration', function(duration) {
    return OTP.utils.msToHrMin(duration);
});


/** Leg Templates & View **/

var accessLegTemplate = Handlebars.compile([
    '<div class="otp-leg">',
        '<div class="otp-legHeader">',
            '<b>{{mode}}</b> to {{to.name}}',
        '</div>',
        '<div class="otp-legBody">',
        '</div>',    
    '</div>'
].join('\n'));

var transitLegTemplate = Handlebars.compile([
    '<div class="otp-leg">',
        '<div class="otp-legHeader">',
            '<b>{{mode}}</b> to {{to.name}}',
        '</div>',
        '<div class="otp-legBody">',
            '<div class="otp-transitLeg-leftCol">{{formatTime startTime}}</div>',
            '<div class="otp-transitLeg-endpointDesc"><b>Depart</b>: {{from.name}}</div>',
            '<div class="otp-transitLeg-endpointDescSub">Stop #{{from.stopId.id}}</div>',
            '<div class="otp-transitLeg-buffer"></div>',
            '<div class="otp-transitLeg-elapsedDesc"><i>Time in transit: {{formatDuration duration}}</i></div>',
            '<div class="otp-transitLeg-buffer"></div>',
            '<div class="otp-transitLeg-leftCol">{{formatTime endTime}}</div>',
            '<div class="otp-transitLeg-endpointDesc"><b>Arrive:</b>{{to.name}}</div>',
        '</div>',    
    '</div>'
].join('\n'));

var genericLegTemplate = Handlebars.compile([
    '<div class="otp-leg">',
        '<div class="otp-legHeader">',
            '<b>{{mode}}</b> to {{to.name}}',
        '</div>',
    '</div>'
].join('\n'));


var OtpLegNarrativeView = Backbone.View.extend({
 
    events: {
        "click .otp-legHeader" : "headerClicked"
    },

    render : function() {
        if(this.model.isWalk() || this.model.isBicycle() || this.model.isCar()) {
            //var context = _.clone(this.model.attributes);
            //context.steps = _.pluck(this.model.get('steps').models, 'attributes');
            this.$el.html(accessLegTemplate(this.model.attributes));
            _.each(this.model.get('steps').models, this.processStep, this);
        }
        else if(this.model.isTransit()) {
            this.$el.html(transitLegTemplate(this.model.attributes));        
        }
        else {
            this.$el.html(genericLegTemplate(this.model.attributes));        
        }

        if(!this.model.isTransit()) this.$el.find('.otp-legBody').hide();
    },

    processStep : function(step, index) {
        var stepView = new OtpStepNarrativeView({
            model: step,
            index: index,
        });
        stepView.render();
        this.$el.find('.otp-legBody').append(stepView.el);
    },

    headerClicked : function(e) {
        var body = this.$el.find(".otp-legBody");
        if(body.is(":visible")) body.slideUp("fast");
        else body.slideDown("fast");
    }

}); module.exports.OtpLegNarrativeView = OtpLegNarrativeView;


/** Step (Walk/Bike/Drive) Template & View **/

// can this be handled by i18n framework?
Handlebars.registerHelper('ordinal', function(n) {
    if(n > 10 && n < 14) return n+"th";
    switch(n % 10) {
        case 1: return n+"st";
        case 2: return n+"nd";
        case 3: return n+"rd";
    }
    return n+"th";
});

var stepTemplate = Handlebars.compile([
    '<div class="otp-legStep-row">',
        '<div class="otp-legStep-icon otp-legStep-icon-{{relativeDirection}}"></div>',
        '<div class="otp-legStep-dist">',
            '<span style="font-weight:bold; font-size: 1.2em;">{{distanceValue}}</span><br>{{distanceUnit}}',
        '</div>',
        '<div class="otp-legStep-text">',
            '{{#if isRoundabout}}',
            	'Take roundabout {{relativeDirection}} to {{ordinal exit}} exit on {{streetName}}',
            '{{else}}',
	            '{{#if isFirst}}',
	            	'Start on <b>{{streetName}}</b> heading {{absoluteDirection}}',
            	'{{else}}',
		            '{{#if stayOn}}',
	            		'<b>{{relativeDirection}}</b> to continue on <b>{{streetName}}</b>',
	            	'{{else}}',
	            		'<b>{{relativeDirection}}</b> on to <b>{{streetName}}</b>',	            		
		            '{{/if}}',
	            '{{/if}}',
            '{{/if}}',
        '</div>',
        '<div style="clear:both;"></div>',
    '</div>',
].join('\n'));

var OtpStepNarrativeView = Backbone.View.extend({
 
    events: {
    },

    render : function() {
    	var context = _.clone(this.model.attributes);
    	var relDir = this.model.get('relativeDirection');

        // set a flag if this is the first step of the leg
        context.isFirst = (this.options.index === 0);
    	
        // handle the special case of roundabout / traffic circle steps
    	if(relDir === "CIRCLE_COUNTERCLOCKWISE" || relDir === "CIRCLE_CLOCKWISE") {
	    	context.isRoundabout = true;
	    	context.roundaboutDirection = (relDir === "CIRCLE_CLOCKWISE") ? "clockwise" : "counterclockwise"; // TODO: i18n
    	}

        // format the leg distance
        var distStr = OTP.utils.distanceString(this.model.get('distance'));
        context.distanceValue = distStr.split(" ")[0];
        context.distanceUnit = distStr.split(" ")[1];

        this.$el.html(stepTemplate(context));
    },

}); module.exports.OtpStepNarrativeView = OtpStepNarrativeView;



/** Map View **/

module.exports.OtpItineraryMapView = Backbone.View.extend({
 
    initialize : function() {
        this.attachedToMap = false;
        this.pathLayer = new L.LayerGroup();
        this.pathMarkerLayer = new L.LayerGroup();
        this.highlightLayer = new L.LayerGroup();

        this.listenTo(this.model, "activate", this.render);
        this.listenTo(this.model, "deactivate", this.clearLayers);
    },

    attachToMap : function() {
        this.options.map.addLayer(this.highlightLayer);
        this.options.map.addLayer(this.pathLayer);
        this.options.map.addLayer(this.pathMarkerLayer);
        this.attachedToMap = true;
    },

    detachFromMap : function() {
        this.options.map.removeLayer(this.highlightLayer);
        this.options.map.removeLayer(this.pathLayer);
        this.options.map.removeLayer(this.pathMarkerLayer);
        this.attachedToMap = false;
    },

    render : function() {
               
        if(!this.attachedToMap) this.attachToMap();
        this.clearLayers();

        //console.log(itin.itinData);
        for(var i=0; i < this.model.get('legs').length; i++) {
            var leg = this.model.get('legs').at(i);

            // draw the polyline
            var polyline = new L.Polyline(OTP.utils.decodePolyline(leg.get('legGeometry').points));
            var weight = 8;
            polyline.setStyle({ color : leg.getMapColor(), weight: weight});
            this.pathLayer.addLayer(polyline);
            polyline.leg = leg;
            polyline.bindPopup("(" + leg.get('routeShortName') + ") " + leg.get('routeLongName'));
            
            /*if(leg.isTransit()) {
                this.drawStartBubble(leg, false);
            }*/

        }
        
        this.options.map.fitBounds(this.model.getBoundsArray());
    },

    clearLayers : function() {
        this.pathLayer.clearLayers();
        this.pathMarkerLayer.clearLayers();        
        this.highlightLayer.clearLayers();        
    }
});


/*var StartFlagIcon = L.Icon.extend({
    options: {
        iconUrl: 'images/marker-flag-start-shadowed.png',
        shadowUrl: null,
        iconSize: new L.Point(48, 49),
        iconAnchor: new L.Point(46, 42),
        popupAnchor: new L.Point(0, -16)
    }
});*/


module.exports.OtpRequestMapView = Backbone.View.extend({
 
    initialize : function() {
        this.attachedToMap = false;

        this.markerLayer = new L.LayerGroup();
    },

    attachToMap : function() {
        this.options.map.addLayer(this.markerLayer);
        this.attachedToMap = true;
    },

    detachFromMap : function() {
        this.options.map.removeLayer(this.markerLayer);
        this.attachedToMap = false;
    },

    render : function() {
        if(!this.attachedToMap) this.attachToMap();
        this.clearLayers();

        this.startMarker = new L.Marker(this.model.getFromLatLng(), {
            icon: new L.DivIcon({
                className : 'otp-startFlagIcon',
                iconSize: null,
                iconAnchor: null,
            }),
            draggable: true
        });
        this.startMarker.bindPopup('<strong>Start</strong>');
        this.startMarker.on('dragend', $.proxy(function() {
            this.model.set({
                fromPlace: [ 
                    this.startMarker.getLatLng().lat,
                    this.startMarker.getLatLng().lng
                ].join(',')
            });
            this.model.request();
        }, this));
        this.markerLayer.addLayer(this.startMarker);

        this.endMarker = new L.Marker(this.model.getToLatLng(), {
            icon: new L.DivIcon({
                className : 'otp-endFlagIcon',
                iconSize: null,
                iconAnchor: null,
            }),
            draggable: true
        });
        this.endMarker.bindPopup('<strong>End</strong>');
        this.endMarker.on('dragend', $.proxy(function() {
            this.model.set({
                toPlace: [ 
                    this.endMarker.getLatLng().lat,
                    this.endMarker.getLatLng().lng
                ].join(',')
            });
            this.model.request();
        }, this));
        this.markerLayer.addLayer(this.endMarker);

    },

    clearLayers : function() {
        this.markerLayer.clearLayers();
    }
});
