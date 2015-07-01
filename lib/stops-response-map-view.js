var Backbone = window.Backbone
var L = window.L
var _ = window._

var StopsResponseMapView = Backbone.View.extend({
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

module.exports = StopsResponseMapView
