var L = window.L
var $ = window.$

var LeafletTopoGraphControl = L.Control.extend({
  options: {
    collapsed: true,
    position: 'bottomright',
    autoZIndex: true
  },

  initialize: function (options) {
    L.setOptions(this, options)
  },

  onAdd: function (map) {
    this._map = map

    var className = 'leaflet-control-topo'
    var container = this._container = L.DomUtil.create('div', className)
    L.DomUtil.addClass(this._container, 'leaflet-control-topo-collapsed')

    this._graphContainer = $('<div>').addClass('leaflet-control-topo-graph')
      .appendTo(this._container)
    this._graphDiv = $('<div>').appendTo(this._graphContainer)

    var link = this._layersLink = L.DomUtil.create('div', className +
      '-toggle', container)
    L.DomEvent.on(link, 'click', this._toggle, this)

    return this._container
  },

  getGraphElement: function () {
    return this._graphDiv
  },

  _toggle: function () {
    if (this._expanded) this._collapse()
    else this._expand()
  },

  _expand: function () {
    L.DomUtil.addClass(this._container, 'leaflet-control-topo-expanded')
    $(this._container).width($(this._map._container).width() * 0.8)
    this._graphDiv.trigger($.Event('resize'))
    this._expanded = true
  },

  _collapse: function () {
    this._container.className = this._container.className.replace(
      ' leaflet-control-topo-expanded', '')
    $(this._container).width('36px')
    this._expanded = false
  }
})

module.exports = LeafletTopoGraphControl
