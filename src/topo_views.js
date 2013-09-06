var _ = require('underscore');
var $ = jQuery = require('jquery-browserify');
var Backbone = require('../lib/backbone');


module.exports.OtpTopoView = Backbone.View.extend({
 
    initialize : function() {
    },

    render : function() {
        this.$el.css({
            background: "cyan",
            width: "100%",
            height: "100%"
        });
        this.$el.html("test");
        this.options.container.setView(this);
    },
});

module.exports.LeafletTopoGraphControl = L.Control.extend({
    
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
    
        var link = this._layersLink = L.DomUtil.create('div', className + '-toggle', container);
        L.DomEvent.on(link, 'click', this._toggle, this);
        
        this._update();
        console.log("added topo graph to map");    
        return this._container;
    },

    setView : function(view) {
        this._activeView = view;
        if(this._expanded) this._attachView();
    },

    _update: function () {
    },

    _toggle : function() {
        if(this._expanded) this._collapse();
        else this._expand();
    },

    _expand : function() {
        L.DomUtil.addClass(this._container, 'leaflet-control-topo-expanded');
        this._graphContainer = L.DomUtil.create('div', 'leaflet-control-topo-graph', this._container);
        this._attachView();
        this._expanded = true;
    },

    _collapse : function() {
        this._container.className = this._container.className.replace(' leaflet-control-topo-expanded', '');
        this._expanded = false;
    },

    _attachView : function() {
        this._activeView.$el.appendTo(this._graphContainer);
    }

});