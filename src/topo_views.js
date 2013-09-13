var _ = require('underscore');
var $ = jQuery = require('jquery-browserify');
var Backbone = require('../lib/backbone');
var Raphael = require('raphael');

var getElevation = function(elevCoord) {
    return elevCoord.second * 3.28084;
}

var OtpItineraryTopoView = Backbone.View.extend({
 
    initialize : function() {
        _.bindAll(this, "refresh");
        this.refresh();
        
        this.$el.resize(this.refresh);

        this.$el.mousemove(function(evt) {
            // todo: draw marker on map corresponding to mouseover location
        });

        this.$el.click(function() {
            // todo: recenter map to clicked location
        });

        this.listenTo(this.model, "activate", this.render);
    },

    render : function() {
        this.$el.empty();
        this.$el.append(this._graph);
    },

    refresh : function() {
        this.$el.css({
            width: "100%",
            height: "100%"
        });
        var w = this.$el.width(), h = this.$el.height();
        if(w === 0 || h === 0 || (w === this._renderedW && h === this._renderedH)) return;
        var legs = this.model.get('legs');

        var elevInterval = 100;
        var axisWidth = 30;
        var graphHeight = h, graphWidth = w - axisWidth;

        
        this._graph = $("<div>");
        var paper = Raphael(this._graph[0], w, h);

        // initial pass through legs to calculate total distance covered, elevation range
        var totalWalkBikeDist = 0, minElev = 999999, maxElev = -999999;
        _.each(legs.models, function(leg) {
            if(leg.isWalk() || leg.isBicycle()) {
                totalWalkBikeDist += leg.get("distance");
                _.each(leg.get("steps").models, function(step, index) {
                    _.each(step.get("elevation"), function(elev, index) {
                        //console.log(elev.second);
                        minElev = Math.min(minElev, getElevation(elev));
                        maxElev = Math.max(maxElev, getElevation(elev));
                    }, this);
                }, this);
            }
        }, this);

        // expand the min/max elevation range to align with interval multiples 
        minElev = elevInterval * Math.floor(minElev / elevInterval);
        maxElev = elevInterval * Math.ceil(maxElev / elevInterval);

        for(var e = minElev; e <= maxElev; e += elevInterval) {
            //console.log(e);
            var y = graphHeight - (e - minElev) / (maxElev - minElev) * graphHeight;
            if(e > minElev && e < maxElev) {
                paper.rect(0, y, w, 1).attr({ "fill": "#bbb", "stroke" : null });
            }
            if(e < maxElev) y -= 15;
            
            /*paper.text(25, y-2, ""+e).attr({
                fill: 'black',
                'font-size' : '12px',
                'font-weight' : 'bold',
                'text-anchor' : 'end'
            });*/

            $("<div>").html(e+"'").css({
                position : 'absolute',
                top : y,
                left : 0,
                width: 25,
                'text-align': 'right'
            }).appendTo(this._graph[0]);
            
        }

        var walkBikeDist = 0;
        var lastT = 0;
        _.each(legs.models, function(leg, index) {
            if(leg.isWalk() || leg.isBicycle()) {
                var legDistance = leg.get("distance");
                var legDistanceCovered = 0;
                //var pathStr = null;
                var graphArray = [];
                _.each(leg.get("steps").models, function(step, index) {
                    var stepDistance = step.get('distance');
                    var elevArray = step.get("elevation");
                    elevArray.sort(function(a,b) {
                        if(a.first < b.first) return -1;
                        if(a.first > b.first) return 1;
                        return 0;
                    });
                    _.each(elevArray, function(elev, index) {
                        //var d = legDistanceCovered + elev.first;
                        var first = elev.first;
                        var second = getElevation(elev);

                        // if x-coord exceeds step distance, truncate at step distance, interpolating y
                        if(first > stepDistance) {
                            if(index > 0) {
                                var prevElevCoord = elevArray[index-1];
                                var dx = first - prevElevCoord.first;
                                var dy = second - getElevation(prevElevCoord);

                                var pct = (stepDistance - prevElevCoord.first) / dx;

                                first =  stepDistance;
                                second = getElevation(prevElevCoord) + pct * dy;
                            }
                            else return;
                        }

                        var x = axisWidth + ((walkBikeDist + (legDistanceCovered + first)) / totalWalkBikeDist) * graphWidth;
                        var y = (1 - (second - minElev) / (maxElev - minElev)) * graphHeight;
                        
                        graphArray.push([x, y]);
                    }, this);
                    legDistanceCovered += step.get("distance");
                }, this);

                if(graphArray.length > 0) {
                    var pathStr = "";
                    _.each(graphArray, function(coord, index) {
                        if(index === 0) pathStr += "M" + coord[0] + " " + coord[1];
                        else pathStr += " L" + coord[0] + " " + coord[1];
                    });

                    var fillStr = pathStr + " L" + graphArray[graphArray.length-1][0] + " " + graphHeight;
                    fillStr += " L" + graphArray[0][0] + " " + graphHeight;
                    path = paper.path(fillStr);
                    path.attr({
                        fill: "#aaa",
                        stroke: null,
                        opacity: .5
                    });

                    var path = paper.path(pathStr);
                    path.attr({
                        stroke: "#888",
                        "stroke-width" : 3
                    });

                }
                
                walkBikeDist += legDistance;
                var t = walkBikeDist / totalWalkBikeDist;
                if(t < 1) {
                    paper.rect(axisWidth +  Math.round(t * graphWidth), 0, 1, graphHeight).attr({ "fill": "#000", "stroke" : null });
                }

                lastT = t;
            }
        }, this);

        this._renderedH = h;
        this._renderedW = w;

        if(this.options.planView.model.get("itineraries").activeItinerary === this.model) {
            this.render();
        }
    }
});

module.exports.OtpItineraryTopoView = OtpItineraryTopoView;


var LeafletTopoGraphControl = L.Control.extend({
    
    options: {
        collapsed: true,
        position: 'bottomright',
        autoZIndex: true
    },

    initialize: function (options) {
        L.setOptions(this, options);
    },
    
    onAdd: function (map) {
        this._map = map;

        var className = 'leaflet-control-topo';
        var container = this._container = L.DomUtil.create('div', className);
        L.DomUtil.addClass(this._container, 'leaflet-control-topo-collapsed');

        this._graphContainer = $("<div>").addClass("leaflet-control-topo-graph").appendTo(this._container);        
        this._graphDiv = $("<div>").appendTo(this._graphContainer);

        var link = this._layersLink = L.DomUtil.create('div', className + '-toggle', container);
        L.DomEvent.on(link, 'click', this._toggle, this);
        
        return this._container;
    },

    getGraphElement : function() {
        return this._graphDiv;
    },

    _toggle : function() {
        if(this._expanded) this._collapse();
        else this._expand();
    },

    _expand : function() {
        L.DomUtil.addClass(this._container, 'leaflet-control-topo-expanded');
        this._graphDiv.trigger($.Event('resize'));
        this._expanded = true;
    },

    _collapse : function() {
        this._container.className = this._container.className.replace(' leaflet-control-topo-expanded', '');
        this._expanded = false;
    },

});

module.exports.LeafletTopoGraphControl = LeafletTopoGraphControl;
