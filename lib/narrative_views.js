var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;
var Handlebars = require('handlebars');
var moment = require('moment');

var utils = require('./utils');

//var Handlebars = require('handlebars');

var narrativeNewTemplate = Handlebars.compile([
    '<div class="messageWell well">',
        '<p class="text-info">',
            '<strong>To plan a trip:</strong> select a start and end location by clicking the map, or by entering an address above.',
        '</p>',
    '</div>',
    '<div class="itineraries"></div>'
].join('\n'));

var narrativeAdjustTemplate = Handlebars.compile([
    '<div class="messageWell well">',
        '<p class="text-info">',
            'Drag start and end location pins on the map or use the form above to adjust trip settings.',
        '</p>',
    '</div>',
    '<div class="itineraries"></div>'
].join('\n'));

var OtpPlanResponseNarrativeView = Backbone.View.extend({
 
    initialize : function(options) {
        this.options = options || {};
    }, 

    render : function() {
    	

        if(this.model) {
            this.$el.html(narrativeAdjustTemplate());

            var itins = this.model.get("itineraries");
    	   _.each(itins.models, this.processItinerary, this);

            if(this.options.autoResize) {
                var itineraries = this.$el.find('.itineraries');
                itineraries.height($(window).height() - ($('#request').height() + $('#messageWell').height() + 80));
                $(window).resize(function() { 
                    itineraries.height($(window).height() - ($('#request').height() + $('#messageWell').height() + 80));
                });
            }
        }
        else
            this.$el.html(narrativeNewTemplate());
    },

    processItinerary : function(itin, index) {
    	var itinView = new OtpItineraryNarrativeView({
            model: itin,
            planView: this,
            index: index
    	});

    	itinView.render();
    	this.$el.find('.itineraries').append(itinView.el);
    },

});

module.exports.OtpPlanResponseNarrativeView = OtpPlanResponseNarrativeView;


var itinNarrativeTemplate = Handlebars.compile([
	'<div class="well">',
        '<div class="otp-itinHeader">',
    		'<span style="float:right;">{{formatDuration duration}}</span>Option {{index}}: {{#each legs}}<nobr><div class="otp-legMode-icon otp-legMode-icon-{{ attributes.mode }}"></div>{{#if attributes.routeShortName }}{{attributes.routeShortName}}{{/if}}<div class="otp-legMode-icon otp-legMode-icon-arrow-right"></div></nobr>{{/each}}',
            '<br/><span>{{formatTime startTime timeOffset}} - {{formatTime endTime timeOffset}}</span>',
        '</div>',
        '<div class="otp-itinBody"></div>',
	'</div>'
].join('\n'));

var OtpItineraryNarrativeView = Backbone.View.extend({
 
    events: {
        "click .otp-itinHeader" : "headerClicked",
        "mouseenter .otp-itinHeader" : "headerMouseenter",
        "mouseleave .otp-itinHeader" : "headerMouseleave",
    },

    initialize : function(options) {
        this.options = options || {};

        _.bindAll(this, "headerClicked", "headerMouseenter", "headerMouseleave");

        this.listenTo(this.model, "activate", this.expand);
        this.listenTo(this.model, "deactivate", this.collapse);
    },

    render : function() {
        var legs = this.model.get("legs");
        var duration = this.model.get("duration");

        var context = _.clone(this.model.attributes);
        context.index = this.options.index + 1;
        context.legs = legs.models;
        context.duration = duration;
        context.timeOffset = this.options.planView.model.getTimeOffset();
        this.$el.html(itinNarrativeTemplate(context));
        
        _.each(legs.models, this.processLeg, this);

        this.$el.find(".otp-itinBody").hide();
    },

    processLeg : function(leg) {
        var legView = new OtpLegNarrativeView({
            itinView: this,
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
        if(!this.isActive()) {
            this.model.trigger("activate");
        } 
    },

    headerMouseenter : function(e) {
        if(!this.isActive()) {
            this.model.trigger("mouseenter");
        }
    },

    headerMouseleave : function(e) {
        if(!this.isActive()) {
            this.model.trigger("mouseleave");
        }
    },

    isActive : function() {
        return this.options.planView.model.get("itineraries").activeItinerary === this.model;
    }

});

module.exports.OtpItineraryNarrativeView = OtpItineraryNarrativeView;


Handlebars.registerHelper('formatTime', function(time, offset, options) {
    if(time)
        return utils.formatTime(time, options.hash['format'], offset);
    else
        return '';
});

Handlebars.registerHelper('formatDuration', function(duration) {
    if(duration)
        return utils.msToHrMin(duration); 
    else
        return '';
});


/** Leg Templates & View **/

var accessLegTemplate = Handlebars.compile([
    '<div class="otp-leg">',
        '<div class="otp-legHeader">',
            '<span style="float:right;">{{formatDuration duration}}</span><b><div class="otp-legMode-icon otp-legMode-icon-{{ mode }}"></div></b> to {{to.name}}',
        '</div>',
        '<div class="otp-legBody">',
        '</div>',    
    '</div>'
].join('\n'));

var transitLegTemplate = Handlebars.compile([
    '<div class="otp-leg">',
        '<div class="otp-legHeader">',
            '<b><div class="otp-legMode-icon otp-legMode-icon-{{ mode }}"></div> {{routeShortName}}</b> {{routeLongName}} to {{to.name}}',
        '</div>',
        '<div class="otp-legBody">',
            '<div class="otp-transitLeg-leftCol">{{formatTime startTime timeOffset}}</div>',
            '<div class="otp-transitLeg-endpointDesc otp-from"><b>Depart</b>: {{from.name}}</div>',
            '<div class="otp-transitLeg-endpointDescSub">Stop #{{from.stopId.id}}</div>',
            '<div class="otp-transitLeg-buffer"></div>',
            '<div class="otp-transitLeg-elapsedDesc"><i>Time in transit: {{formatDuration duration}}</i></div>',
            '<div class="otp-transitLeg-buffer"></div>',
            '<div class="otp-transitLeg-leftCol">{{formatTime endTime timeOffset}}</div>',
            '<div class="otp-transitLeg-endpointDesc otp-to"><b>Arrive</b>: {{to.name}}</div>',
        '</div>',    
    '</div>'
].join('\n'));

var genericLegTemplate = Handlebars.compile([
    '<div class="otp-leg">',
        '<div class="otp-legHeader">',
            '<span style="float:right;">{{formatDuration duration}}</span><b><div class="otp-legMode-icon otp-legMode-icon-{{ mode }}"></div></b> to {{to.name}}',
        '</div>',
    '</div>'
].join('\n'));


var OtpLegNarrativeView = Backbone.View.extend({
 
    events: {
        "click .otp-legHeader" : "headerClicked",
        "mouseenter .otp-legHeader" : "headerMouseenter",
        "mouseleave .otp-legHeader" : "headerMouseleave",        
        "click .otp-from" : "fromClicked",
        "click .otp-to" : "toClicked",
    },

    initialize : function(options) {
        this.options = options || {};
    }, 
    
    render : function() {
        if(this.model.isWalk() || this.model.isBicycle() || this.model.isCar()) {
            //var context = _.clone(this.model.attributes);
            //context.steps = _.pluck(this.model.get('steps').models, 'attributes');
            this.$el.html(accessLegTemplate(this.model.attributes));
            _.each(this.model.get('steps').models, this.processStep, this);
        }
        else if(this.model.isTransit()) {
            var context = _.clone(this.model.attributes);
            context.timeOffset = this.options.itinView.options.planView.model.getTimeOffset();
            this.$el.html(transitLegTemplate(context));        
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
    },

    headerMouseenter : function(e) {
        this.model.trigger("mouseenter");
    },

    headerMouseleave : function(e) {
        this.model.trigger("mouseleave");
    },

    fromClicked : function(e) {
        this.model.trigger("fromclick");
    },

    toClicked : function(e) {
        this.model.trigger("toclick");
    },

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
        "click .otp-legStep-row" : "rowClicked",
        "mouseenter .otp-legStep-row" : "rowMouseenter",
        "mouseleave .otp-legStep-row" : "rowMouseleave",   
    },
    
    initialize : function(options) {
        this.options = options || {};
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
        var distStr = utils.distanceString(this.model.get('distance'));
        context.distanceValue = distStr.split(" ")[0];
        context.distanceUnit = distStr.split(" ")[1];

        this.$el.html(stepTemplate(context));
    },

    rowClicked : function(e) {
        this.model.trigger("click");
    },

    rowMouseenter : function(e) {
        this.model.trigger("mouseenter");
    },

    rowMouseleave : function(e) {
        this.model.trigger("mouseleave");
    },

}); module.exports.OtpStepNarrativeView = OtpStepNarrativeView;
