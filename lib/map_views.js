require('leaflet.label')

var Backbone = window.Backbone
var L = window.L
var _ = window._

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
