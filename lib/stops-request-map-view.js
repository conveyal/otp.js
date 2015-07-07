var Backbone = window.Backbone
var _ = window._

var StopsRequestMapView = Backbone.View.extend({
  initialize: function (options) {
    _.bindAll(this, 'mapViewChanged')
    this.options = options || {}

    if (!this.options.minimumZoom) this.options.minimumZoom = 15

    this.options.map.on('viewreset dragend', this.mapViewChanged)
  },

  mapViewChanged: function (e) {
    if (this.options.map.getZoom() < this.options.minimumZoom) return

    var data = {
      maxLat: this.options.map.getBounds().getNorth(),
      minLon: this.options.map.getBounds().getWest(),
      minLat: this.options.map.getBounds().getSouth(),
      maxLon: this.options.map.getBounds().getEast()
    }

    this.model.set(data)
  }
})

module.exports = StopsRequestMapView
