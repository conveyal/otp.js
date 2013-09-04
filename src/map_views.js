var _ = require('underscore');
var $ = jQuery = require('jquery-browserify');
var Backbone = require('../lib/backbone');
var Handlebars = require('handlebars');

/** Map Views **/

var legFromBubbleTemplate = Handlebars.compile([
    '<div class="otp-legBubble-icon-topRow-{{orientation}}">',
        '<div class="otp-legBubble-arrow-right" style="float: left; margin-left:4px;"></div>',
        '<div style="width: 16px; height: 16px; margin-left: 12px;">',
            '<div class="otp-modeIcon-{{mode}}" style="margin: auto auto;"></div>',
            '<div class="otp-routeShortName">{{routeShortName}}</div>',
        '</div>',
    '</div>',
    '{{{formatTime from.departure format="h:mm"}}}'
].join('\n'));

module.exports.OtpItineraryMapView = Backbone.View.extend({
 
    initialize : function() {
        this.attachedToMap = false;
        this.pathLayer = new L.LayerGroup();
        this.pathMarkerLayer = new L.LayerGroup();
        this.highlightLayer = new L.LayerGroup();

        this.listenTo(this.model, "activate", function() {
            this.preview = false;
            this.render();
            this.options.map.fitBounds(this.model.getBoundsArray())
        });
        this.listenTo(this.model, "deactivate", this.clearLayers);

        this.listenTo(this.model, "mouseenter", function() {
            this.preview = true;
            this.render();
        });
        this.listenTo(this.model, "mouseleave", this.clearLayers);

        for(var l=0; l < this.model.get('legs').length; l++) {
           var leg = this.model.get('legs').at(l);

            this.listenTo(leg, "mouseenter", _.bind(function() {
                this.view.highlightLeg = this.leg;
                this.view.render();
            }, {view: this, leg : leg}));

            this.listenTo(leg, "mouseleave", _.bind(function() {
                this.view.highlightLeg = null;
                this.view.render();
            }, {view: this, leg : leg}));

            this.listenTo(leg, "fromclick", _.bind(function() {
                this.view.options.map.panTo([this.leg.get("from").lat, this.leg.get("from").lon]);
            }, {view: this, leg : leg}));

            this.listenTo(leg, "toclick", _.bind(function() {
                this.view.options.map.panTo([this.leg.get("to").lat, this.leg.get("to").lon]);
            }, {view: this, leg : leg}));

            var steps = leg.get('steps');
            if(!steps) continue;
            for(var s=0; s < steps.length; s++) {
                var step = steps.at(s);

                this.listenTo(step, "click", _.bind(function() {
                    this.view.options.map.panTo([this.step.get('lat'), this.step.get('lon')]);
                }, {view: this, step : step}));
    
                this.listenTo(step, "mouseenter", _.bind(function() {
                    var popup = L.popup()
                    .setLatLng([this.step.get('lat'), this.step.get('lon')])
                    .setContent(this.step.get('streetName'))
                    .openOn(this.view.options.map);
                }, {view: this, step : step}));

                this.listenTo(step, "mouseleave", _.bind(function() {
                    this.view.options.map.closePopup();
                }, {view: this, step : step}));

            }
        }
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

            var points = OTP.utils.decodePolyline(leg.get('legGeometry').points);
            var weight = 8;

            // draw highlight, if applicable
            if(this.highlightLeg === leg) {
                var highlight = new L.Polyline(points);
                highlight.setStyle({
                    color : "#ffff00",
                    weight: weight * 2,
                    opacity: this.preview ? 0.2 : 0.5
                });
                this.highlightLayer.addLayer(highlight);
            }

            // draw the polyline
            var polyline = new L.Polyline(points);
            polyline.setStyle({
                color : leg.getMapColor(),
                weight: weight,
                opacity: this.preview ? 0.2 : 0.5
            });
            this.pathLayer.addLayer(polyline);
            polyline.leg = leg;

            var popupContent = '';

            if(leg.get('routeShortName'))
                popupContent += leg.get('routeShortName');

            if(leg.get('routeLongName'))
                if(popupContent != '')
                    popupContent += ': ';

                popupContent += leg.get('routeLongName');

            polyline.bindPopup(popupContent);
            
            if(leg.isTransit() && !this.preview) {
                this.pathMarkerLayer.addLayer(this.getLegFromBubbleMarker(leg, this.highlightLeg === leg));
            }
        }
    },

    getLegFromBubbleMarker : function(leg, highlight) {
        var quadrant = (leg.get('from').lat < leg.get('to').lat ? 's' : 'n') + (leg.get('from').lon < leg.get('to').lon ? 'w' : 'e');        highlight = highlight || false;
        
        var context = _.clone(leg.attributes);
        context.orientation = quadrant[0];

        return new L.Marker(
            [leg.get('from').lat, leg.get('from').lon], {
                icon: new L.DivIcon({
                    className: 'otp-legBubble-icon otp-legBubble-icon-' + quadrant + (highlight ? "-highlight" : ""),
                    iconSize: [32,44],
                    iconAnchor: this.getLegBubbleAnchor(quadrant),
                    html: legFromBubbleTemplate(context) 
                })
            }
        );
    },

    getLegBubbleAnchor : function(quadrant) {
        if(quadrant === 'nw') return [32,44];
        if(quadrant === 'ne') return [0,44];
        if(quadrant === 'sw') return [32,0];
        if(quadrant === 'se') return [0,0];
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
