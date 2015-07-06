var ItineraryMapView = require('./itinerary-map-view')
var ItineraryTopoView = require('./itinerary-topo-view')
var log = require('./log')('plan-response-view')
var PlanResponseNarrativeView = require('./plan-response-narrative-view')

var Backbone = window.Backbone
var _ = window._

module.exports = Backbone.View.extend({
  initialize: function (options) {
    this.options = options || {}
    if (typeof this.options.autoResize === 'undefined') {
      this.options.autoResize = true
    }

    this.render()
  },

  render: function () {
    if (this.options.narrative) {
      this.narrativeView = new PlanResponseNarrativeView({
        el: this.options.narrative,
        model: this.model,
        autoResize: this.options.autoResize,
        metric: this.options.metric,
        showFullDuration: this.options.showFullDuration
      })
      this.narrativeView.error = this.error
      this.narrativeView.render()
    }

    if (this.model) {
      this.model.getTimeOffset()
      var itins = this.model.get('itineraries')

      if (_.size(itins) > 0) {
        _.each(itins.models, this.processItinerary, this)

        itins.at(0).trigger('activate')
      }
    }
  },

  processItinerary: function (itin, index) {
    if (this.options.map) {
      var mapViewOptions = {
        map: this.options.map,
        model: itin,
        planView: this,
        metric: this.options.metric
      }
      if (this.options.legColor) {
        mapViewOptions.legColor = this.options.legColor
      }

      new ItineraryMapView(mapViewOptions) // eslint-disable-line no-new
    }

    if (this.options.topo) {
      new ItineraryTopoView({ // eslint-disable-line no-new
        map: this.options.map,
        el: this.options.topo,
        model: itin,
        planView: this
      })
    }
  },

  newResponse: function (error, response) {
    log('new response')

    this.deactivateOldItinerary()
    this.error = error
    this.model = response
    this.render()
  },

  deactivateOldItinerary: function () {
    if (this.model && this.model.get('itineraries')) {
      log('deactivating itineraries')
      this.model.get('itineraries').each(function (i) {
        i.trigger('deactivate')
      })
    }
  }
})
