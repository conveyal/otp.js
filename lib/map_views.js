require('leaflet.label')

var Handlebars = require('handlebars')

var log = require('./log')('map-views')

var $ = window.$
var Backbone = window.Backbone
var L = window.L
var _ = window._

/** Map Views **/

var mapContextMenuTemplate = Handlebars.compile(require('./map-context-menu.html'))

module.exports.RequestMapView = Backbone.View.extend({
  initialize: function (options) {
    _.bindAll(this, 'markerMove', 'mapClick')
    this.options = options || {}

    this.model.on('change', this.render, this)

    var view = this
    this.options.map.on('click', function (evt) {
      view.mapClick(evt.latlng)
    })

    this.options.map.on('contextmenu', _.bind(function (evt) {
      var mouseEvent = evt.originalEvent
      mouseEvent.preventDefault()
      if (mouseEvent.which === 3) {
        if (!this.contextMenu) {
          this.contextMenu = $(mapContextMenuTemplate()).appendTo('body')
        }

        this.contextMenu.find('.setStartLocation').click(_.bind(function () {
          this.model.set({
            fromPlace: evt.latlng.lat + ',' + evt.latlng.lng
          })
        }, this))

        this.contextMenu.find('.setEndLocation').click(_.bind(function () {
          this.model.set({
            toPlace: evt.latlng.lat + ',' + evt.latlng.lng
          })
        }, this))

        this.contextMenu.show()
          .css({
            top: mouseEvent.pageY + 'px',
            left: mouseEvent.pageX + 'px'
          })
      }
      return false
    }, this))

    $(document).bind('click', _.bind(function (event) {
      if (this.contextMenu) this.contextMenu.hide()
    }, this))

    this.attachedToMap = false

    this.markerLayer = new L.LayerGroup()
  },

  attachToMap: function () {
    this.options.map.addLayer(this.markerLayer)
    this.attachedToMap = true
  },

  detachFromMap: function () {
    this.options.map.removeLayer(this.markerLayer)
    this.attachedToMap = false
  },

  render: function () {
    log('rendering request map view')

    if (!this.attachedToMap) this.attachToMap()
    this.clearLayers()

    var from = this.model.getFromLatLng()
    var to = this.model.getToLatLng()

    if (from || to) {
      if (from) {
        this.startMarker = new L.Marker(from, {
          icon: new L.DivIcon({
            className: 'otp-startFlagIcon',
            iconSize: null,
            iconAnchor: null
          }),
          draggable: true
        })
        this.startMarker.bindLabel('<strong>Start</strong>')
        this.startMarker.on('dragend', $.proxy(function () {
          this.markerMove(this.startMarker.getLatLng(), null)
        }, this))
        this.markerLayer.addLayer(this.startMarker)
      }

      if (to) {
        this.endMarker = new L.Marker(to, {
          icon: new L.DivIcon({
            className: 'otp-endFlagIcon',
            iconSize: null,
            iconAnchor: null
          }),
          draggable: true
        })
        this.endMarker.bindLabel('<strong>End</strong>')
        this.endMarker.on('dragend', $.proxy(function () {
          this.markerMove(null, this.endMarker.getLatLng())
        }, this))
        this.markerLayer.addLayer(this.endMarker)
      }
    }
  },

  mapClick: function (latlng) {
    if (!this.model.attributes.fromPlace) {
      this.model.set({
        fromPlace: latlng.lat + ',' + latlng.lng
      })
    } else if (!this.model.attributes.toPlace) {
      this.model.set({
        toPlace: latlng.lat + ',' + latlng.lng
      })
    }
  },

  markerMove: function (start, end) {
    if (start) {
      this.model.set({
        fromPlace: start.lat + ',' + start.lng
      })
    }

    if (end) {
      this.model.set({
        toPlace: end.lat + ',' + end.lng
      })
    }
  },

  clearLayers: function () {
    this.markerLayer.clearLayers()
  }
})

// views for the stops overlay

module.exports.StopsRequestMapView = Backbone.View.extend({
  initialize: function (options) {
    _.bindAll(this, 'mapViewChanged')
    this.options = options || {}

    if (!this.options.minimumZoom) this.options.minimumZoom = 15

    this.options.map.on('viewreset dragend', this.mapViewChanged)
  },

  mapViewChanged: function (e) {
    if (this.options.map.getZoom() < this.options.minimumZoom) return

    var data = {
      leftUpLat: this.options.map.getBounds().getNorth(),
      leftUpLon: this.options.map.getBounds().getWest(),
      rightDownLat: this.options.map.getBounds().getSouth(),
      rightDownLon: this.options.map.getBounds().getEast()
    }

    this.model.set(data)
  }
})

module.exports.StopsResponseMapView = Backbone.View.extend({
  initialize: function (options) {
    _.bindAll(this, 'mapViewChanged')
    this.options = options || {}

    this.markerLayer = new L.LayerGroup()
    this.options.map.addLayer(this.markerLayer)
    this.options.map.on('viewreset dragend', this.mapViewChanged)
  },

  render: function () {
    this.markerLayer.clearLayers()
    _.each(this.model.get('stops').models, function (stop) {
      var stopMarker = new L.CircleMarker([stop.get('stopLat'), stop.get(
        'stopLon')], {
        color: '#666',
        stroke: 2,
        radius: 4,
        fillColor: '#eee',
        opacity: 1.0,
        fillOpacity: 1.0
      })
      stopMarker.bindLabel(stop.get('stopName'))

      this.markerLayer.addLayer(stopMarker)

    }, this)

  },

  newResponse: function (response) {
    this.model = response
    this.render()
  },

  mapViewChanged: function (e) {
    this.markerLayer.clearLayers()
  }
})
