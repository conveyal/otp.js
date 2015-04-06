require('leaflet.label');
var Handlebars = require('handlebars');

var log = require('./log')('map-views');
var utils = require('./utils');

/** Map Views **/

var legFromBubbleTemplate = Handlebars.compile(require('./leg-from-bubble.html'));
var mapContextMenuTemplate = Handlebars.compile(require('./map-context-menu.html'));

module.exports.ItineraryMapView = Backbone.View.extend({

  initialize: function(options) {
    var self = this;

    this.options = options || {};

    this.attachedToMap = false;
    this.pathLayer = new L.LayerGroup();
    this.pathMarkerLayer = new L.LayerGroup();
    this.highlightLayer = new L.LayerGroup();

    this.listenTo(this.model, 'activate', function() {
      self.preview = false;
      self.render();
    });

    this.listenTo(this.model, 'mouseenter', function() {
      self.preview = true;
      self.render();
    });

    this.listenTo(this.model, 'deactivate', function() {
      self.clearLayers();
    });

    this.model.get('legs').each(function(leg) {
      self.initializeLeg(leg);
    });
  },

  initializeLeg: function(leg) {
    var self = this;

    this.listenTo(leg, 'mouseenter', function() {
      self.highlightLeg = leg;
      self.render();
    });

    this.listenTo(leg, 'mouseleave', function() {
      self.highlightLeg = null;
      self.render();
    });

    this.listenTo(leg, 'fromclick', function() {
      var from = leg.get('from');
      self.view.options.map.panTo([from.lat, from.lon]);
    });

    this.listenTo(leg, 'toclick', function() {
      var to = leg.get('to');
      self.view.options.map.panTo([to.lat, to.lon]);
    });

    var steps = leg.get('steps');
    if (!steps || !steps.length) return;

    steps.forEach(function(step) {
      self.initializeStep(step);
    });
  },

  initializeStep: function(step) {
    var self = this;
    this.listenTo(step, 'click', function() {
      self.view.options.map.panTo([step.get('lat'), step.get('lon')]);
    });

    this.listenTo(step, 'mouseleave', function() {
      self.view.options.map.closePopup();
    });
  },

  attachToMap: function() {
    this.options.map.addLayer(this.highlightLayer);
    this.options.map.addLayer(this.pathLayer);
    this.options.map.addLayer(this.pathMarkerLayer);
    this.attachedToMap = true;
  },

  detachFromMap: function() {
    this.options.map.removeLayer(this.highlightLayer);
    this.options.map.removeLayer(this.pathLayer);
    this.options.map.removeLayer(this.pathMarkerLayer);
    this.attachedToMap = false;
  },

  render: function() {
    if (!this.attachedToMap) this.attachToMap();
    this.clearLayers();

    this.mapBounds = new L.LatLngBounds();

    var self = this;
    this.model.get('legs').forEach(function(leg) {
      self.renderLeg(leg);
    });

    this.options.map.fitBounds(this.mapBounds);
  },

  renderLeg: function(leg) {
    var popupContent, minutes;
    var points = utils.decodePolyline(leg.get('legGeometry').points);
    var weight = 8;

    // draw highlight, if applicable
    if (this.highlightLeg === leg) {
      var highlight = new L.Polyline(points);
      highlight.setStyle({
        color: '#ffff00',
        weight: weight * 2,
        opacity: this.preview ? 0.75 : 0.75
      });
      this.highlightLayer.addLayer(highlight);
    }

    // draw the polyline
    var polyline = new L.Polyline(points);
    polyline.setStyle({
      color: this.options.legColor || leg.getMapColor(),
      weight: weight,
      opacity: this.preview ? 0.75 : 0.75
    });
    this.pathLayer.addLayer(polyline);
    polyline.leg = leg;

    this.mapBounds.extend(polyline.getBounds());

    if (leg.isWalk() || leg.isBicycle()) {
      popupContent = '<div class="otp-legMode-icon otp-legMode-icon-' + leg
        .get('mode') +
        '"></div> <div class="otp-legMode-icon otp-legMode-icon-arrow-right"></div> ' +
        leg.get('to').name;

      popupContent += '<br/>';

      minutes = leg.get('duration') / 60;
      popupContent += Math.round(minutes) + ' mins ';

      var distance = utils.distanceString(leg.get('distance'), this.options
        .metric);
      popupContent += distance;

      polyline.bindLabel(popupContent);

      for (var step in leg.get('steps').models) {
        this.pathMarkerLayer.addLayer(this.getStepBubbleMarker(leg, leg.get(
          'steps').models[step]));
      }
    } else if (leg.isTransit()) {
      popupContent = '<div class="otp-legMode-icon otp-legMode-icon-' + leg
        .get('mode') + '"></div> ';

      if (leg.get('routeShortName'))
        popupContent += leg.get('routeShortName');

      if (leg.get('routeLongName')) {
        if (popupContent !== '')
          popupContent += ' ';

        popupContent += leg.get('routeLongName') + '<br/> ';
      }

      popupContent +=
        ' <div class="otp-legMode-icon otp-legMode-icon-arrow-right"></div> ' +
        leg.get('to').name;

      minutes = leg.get('duration') / 60;
      popupContent += ' (' + Math.round(minutes) + ' mins)';

      polyline.bindLabel(popupContent);
    }

    var marker = this.getLegFromBubbleMarker(leg, this.highlightLeg === leg);
    this.pathMarkerLayer.addLayer(marker);
  },

  getStepBubbleMarker: function(leg, step) {

    var marker = new L.CircleMarker([step.get('lat'), step.get('lon')], {
      color: '#666',
      stroke: 3,
      radius: 5,
      fillColor: '#aaa',
      opacity: 1.0,
      fillOpacity: 1.0
    });

    if (step.get('relativeDirection')) {

      var popupContent =
        '<span class="otp-legStepLabel-icon otp-legStep-icon-' + step.get(
          'relativeDirection') + '"></span>' +
        ' <div class="otp-legMode-icon otp-legMode-icon-' + leg.get('mode') +
        '"></div> ' + step.get('streetName');

      popupContent += ' (';

      var distance = utils.distanceString(step.get('distance'), this.options.metric);

      popupContent += distance + ' )';

      marker.bindLabel(popupContent);
    }

    return marker;
  },

  getLegFromBubbleMarker: function(leg, highlight) {
    var popupContent =
      '<div class="otp-legMode-icon otp-legMode-icon-arrow-right"></div>  <div class="otp-legMode-icon otp-legMode-icon-' +
      leg.get('mode') + '"></div> ';

    if (leg.get('routeShortName'))
      popupContent += leg.get('routeShortName');

    if (leg.get('routeLongName')) {
      if (popupContent !== '')
        popupContent += ' ';

      popupContent += leg.get('routeLongName');
    }

    popupContent += ' ' + utils.formatTime(leg.get('startTime'), null, this.options
      .planView.model.getTimeOffset()) + ' ';

    var marker = new L.CircleMarker([leg.get('from').lat, leg.get('from').lon], {
      color: '#000',
      stroke: 10,
      radius: 5,
      fillColor: '#fff',
      opacity: 1.0,
      fillOpacity: 1.0
    });

    marker.bindLabel(popupContent);

    return marker;
  },

  getLegBubbleAnchor: function(quadrant) {
    if (quadrant === 'nw') return [32, 44];
    if (quadrant === 'ne') return [0, 44];
    if (quadrant === 'sw') return [32, 0];
    if (quadrant === 'se') return [0, 0];
  },

  clearLayers: function() {
    log('clearing itinerary layers');

    this.pathLayer.clearLayers();
    this.pathMarkerLayer.clearLayers();
    this.highlightLayer.clearLayers();
  }
});

module.exports.RequestMapView = Backbone.View.extend({

  initialize: function(options) {
    _.bindAll(this, 'markerMove', 'mapClick');
    this.options = options || {};

    this.model.on('change', this.render, this);

    var view = this;
    this.options.map.on('click', function(evt) {
      view.mapClick(evt.latlng);
    });

    this.options.map.on('contextmenu', _.bind(function(evt) {
      var mouseEvent = evt.originalEvent;
      mouseEvent.preventDefault();
      if (mouseEvent.which === 3) {

        if (!this.contextMenu) {
          this.contextMenu = $(mapContextMenuTemplate()).appendTo('body');
        }

        this.contextMenu.find('.setStartLocation').click(_.bind(function() {
          this.model.set({
            fromPlace: evt.latlng.lat + ',' + evt.latlng.lng
          });
        }, this));

        this.contextMenu.find('.setEndLocation').click(_.bind(function() {
          this.model.set({
            toPlace: evt.latlng.lat + ',' + evt.latlng.lng
          });
        }, this));

        this.contextMenu.show()
          .css({
            top: mouseEvent.pageY + 'px',
            left: mouseEvent.pageX + 'px'
          });
      }
      return false;
    }, this));

    $(document).bind('click', _.bind(function(event) {
      if (this.contextMenu) this.contextMenu.hide();
    }, this));

    this.attachedToMap = false;

    this.markerLayer = new L.LayerGroup();
  },

  attachToMap: function() {
    this.options.map.addLayer(this.markerLayer);
    this.attachedToMap = true;
  },

  detachFromMap: function() {
    this.options.map.removeLayer(this.markerLayer);
    this.attachedToMap = false;
  },

  render: function() {
    log('rendering request map view');

    if (!this.attachedToMap) this.attachToMap();
    this.clearLayers();

    var from = this.model.getFromLatLng();
    var to = this.model.getToLatLng();

    if (from || to) {
      if (from) {
        this.startMarker = new L.Marker(from, {
          icon: new L.DivIcon({
            className: 'otp-startFlagIcon',
            iconSize: null,
            iconAnchor: null,
          }),
          draggable: true
        });
        this.startMarker.bindLabel('<strong>Start</strong>');
        this.startMarker.on('dragend', $.proxy(function() {
          this.markerMove(this.startMarker.getLatLng(), null);
        }, this));
        this.markerLayer.addLayer(this.startMarker);
      }

      if (to) {
        this.endMarker = new L.Marker(to, {
          icon: new L.DivIcon({
            className: 'otp-endFlagIcon',
            iconSize: null,
            iconAnchor: null,
          }),
          draggable: true
        });
        this.endMarker.bindLabel('<strong>End</strong>');
        this.endMarker.on('dragend', $.proxy(function() {
          this.markerMove(null, this.endMarker.getLatLng());
        }, this));
        this.markerLayer.addLayer(this.endMarker);
      }
    }
  },

  mapClick: function(latlng) {

    if (!this.model.attributes.fromPlace)
      this.model.set({
        fromPlace: latlng.lat + ',' + latlng.lng
      });
    else if (!this.model.attributes.toPlace)
      this.model.set({
        toPlace: latlng.lat + ',' + latlng.lng
      });

  },

  markerMove: function(start, end) {

    if (start) {
      this.model.set({
        fromPlace: start.lat + ',' + start.lng
      });
    }

    if (end) {
      this.model.set({
        toPlace: end.lat + ',' + end.lng
      });
    }
  },

  clearLayers: function() {
    this.markerLayer.clearLayers();
  }
});
