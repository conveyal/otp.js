require('leaflet.label');
var Handlebars = require('handlebars');

var utils = require('./utils');

/** Map Views **/

var legFromBubbleTemplate = Handlebars.compile(require('./leg-from-bubble.html'));

module.exports.OtpItineraryMapView = Backbone.View.extend({

  initialize: function(options) {
    this.options = options || {};

    this.attachedToMap = false;
    this.pathLayer = new L.LayerGroup();
    this.pathMarkerLayer = new L.LayerGroup();
    this.highlightLayer = new L.LayerGroup();

    this.listenTo(this.model, 'activate', function() {
      this.preview = false;
      this.render();
      //this.options.map.fitBounds(this.model.getBoundsArray())
    });

    this.listenTo(this.model, 'deactivate', this.clearLayers);

    this.listenTo(this.model, 'mouseenter', function() {
      this.preview = true;
      this.render();
    });
    this.listenTo(this.model, 'mouseleave', this.clearLayers);

    this.model.get('legs').each(function(leg) {

      this.listenTo(leg, 'mouseenter', _.bind(function() {
        this.view.highlightLeg = this.leg;
        this.view.render();
      }, {
        view: this,
        leg: leg
      }));

      this.listenTo(leg, 'mouseleave', _.bind(function() {
        this.view.highlightLeg = null;
        this.view.render();
      }, {
        view: this,
        leg: leg
      }));

      this.listenTo(leg, 'fromclick', _.bind(function() {
        this.view.options.map.panTo([this.leg.get('from').lat, this.leg
          .get('from').lon
        ]);
      }, {
        view: this,
        leg: leg
      }));

      this.listenTo(leg, 'toclick', _.bind(function() {
        this.view.options.map.panTo([this.leg.get('to').lat, this.leg.get(
          'to').lon]);
      }, {
        view: this,
        leg: leg
      }));

      var steps = leg.get('steps');
      if (!steps) return;

      steps.each(function(step) {
        this.listenTo(step, 'click', _.bind(function() {
          this.view.options.map.panTo([this.step.get('lat'), this.step
            .get('lon')
          ]);
        }, {
          view: this,
          step: step
        }));

        this.listenTo(step, 'mouseenter', _.bind(function() {
          //var popup = L.popup()
          //.setLatLng([this.step.get('lat'), this.step.get('lon')])
          //.setContent(this.step.get('streetName'))
          //.openOn(this.view.options.map);
        }, {
          view: this,
          step: step
        }));

        this.listenTo(step, 'mouseleave', _.bind(function() {
          this.view.options.map.closePopup();
        }, {
          view: this,
          step: step
        }));

      });
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

    var mapBounds = new L.LatLngBounds();
    var popupContent, minutes;

    for (var i = 0; i < this.model.get('legs').length; i++) {
      var leg = this.model.get('legs').at(i);

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

      mapBounds.extend(polyline.getBounds());

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
    }

    this.options.map.fitBounds(mapBounds);
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
    this.pathLayer.clearLayers();
    this.pathMarkerLayer.clearLayers();
    this.highlightLayer.clearLayers();
  }
});

var mapContextMenuTemplate = Handlebars.compile(require(
  './map-context-menu.html'));

module.exports.OtpRequestMapView = Backbone.View.extend({

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
    if (!this.attachedToMap) this.attachToMap();
    this.clearLayers();

    if (this.model.getFromLatLng()) {
      this.startMarker = new L.Marker(this.model.getFromLatLng(), {
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

    if (this.model.getToLatLng()) {
      this.endMarker = new L.Marker(this.model.getToLatLng(), {
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

// views for the stops overlay

module.exports.OtpStopsRequestMapView = Backbone.View.extend({

  initialize: function(options) {
    _.bindAll(this, 'mapViewChanged');
    this.options = options || {};

    if (!this.options.minimumZoom) this.options.minimumZoom = 15;

    this.options.map.on('viewreset dragend', this.mapViewChanged);
  },

  mapViewChanged: function(e) {
    if (this.options.map.getZoom() < this.options.minimumZoom) return;

    var data = {
      leftUpLat: this.options.map.getBounds().getNorth(),
      leftUpLon: this.options.map.getBounds().getWest(),
      rightDownLat: this.options.map.getBounds().getSouth(),
      rightDownLon: this.options.map.getBounds().getEast()
    };

    this.model.set(data);
  }
});

module.exports.OtpStopsResponseMapView = Backbone.View.extend({

  initialize: function(options) {
    _.bindAll(this, 'mapViewChanged');
    this.options = options || {};

    this.markerLayer = new L.LayerGroup();
    this.options.map.addLayer(this.markerLayer);
    this.options.map.on('viewreset dragend', this.mapViewChanged);
  },

  render: function() {
    this.markerLayer.clearLayers();
    _.each(this.model.get('stops').models, function(stop) {
      var stopMarker = new L.CircleMarker([stop.get('stopLat'), stop.get(
        'stopLon')], {
        color: '#666',
        stroke: 2,
        radius: 4,
        fillColor: '#eee',
        opacity: 1.0,
        fillOpacity: 1.0
      });
      stopMarker.bindLabel(stop.get('stopName'));

      this.markerLayer.addLayer(stopMarker);

    }, this);

  },

  newResponse: function(response) {
    this.model = response;
    this.render();
  },

  mapViewChanged: function(e) {
    this.markerLayer.clearLayers();
  }
});
