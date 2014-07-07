var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;
var Handlebars = require('handlebars');


var OtpPlanResponseView = Backbone.View.extend({

    initialize: function (options) {
        this.options = options || {};
        if(typeof this.options.autoResize == 'undefined') this.options.autoResize = true;

        this.render();
    },
 
    render : function() {

        if(this.options.narrative) {
            this.narrativeView = new OTP.narrative_views.OtpPlanResponseNarrativeView({
                el: this.options.narrative,
                model: this.model,
                autoResize: this.options.autoResize,
                metric: this.options.metric,
                showFullDuration: this.options.showFullDuration
            });
            this.narrativeView.render();
        }

        if(this.model) {
            this.model.getTimeOffset();
        	var itins = this.model.get("itineraries");

            if(_.size(itins) > 0) {
            	_.each(itins.models, this.processItinerary, this);

                itins.at(0).trigger("activate");
            }
        }
    },

    processItinerary : function(itin, index) {
    	
        if(this.options.map) {
            var mapViewOptions = {
                map: this.options.map,
                model : itin,
                planView : this,
                metric: this.options.metric
            };
            if(this.options.legColor) mapViewOptions.legColor = this.options.legColor;
            var itinMapView = new OTP.map_views.OtpItineraryMapView(mapViewOptions);
        }
        if(this.options.topo) {
            var itinTopoView = new OTP.topo_views.OtpItineraryTopoView({
                map: this.options.map,
                el: this.options.topo,
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

module.exports.OtpPlanResponseView = OtpPlanResponseView;

