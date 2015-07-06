var Handlebars = require('handlebars')

var log = require('./log')('plan-response-narrative-view')
var ItineraryNarrativeView = require('./itinerary-narrative-view')

var Backbone = window.Backbone
var _ = window._

var narrativeNewTemplate = Handlebars.compile(require('./templates/narrative-new.html'))
var narrativeAdjustTemplate = Handlebars.compile(require('./templates/narrative-adjust.html'))
var narrativeErrorTemplate = Handlebars.compile(require('./templates/narrative-error.html'))

var PlanResponseNarrativeView = Backbone.View.extend({
  initialize: function (options) {
    this.options = options || {}
  },

  render: function () {
    log('rendering model: %s, error: %s', !!this.model, !!this.error)

    if (this.error) {
      return this.$el.html(narrativeErrorTemplate({
        message: this.error
      }))
    }

    if (this.model) {
      if (!this.error) this.$el.html(narrativeAdjustTemplate())

      var itins = this.model.get('itineraries')
      _.each(itins.models, this.processItinerary, this)
    } else {
      this.$el.html(narrativeNewTemplate())
    }
  },

  processItinerary: function (itin, index) {
    var itinView = new ItineraryNarrativeView({
      model: itin,
      planView: this,
      index: index
    })

    itinView.render()
    this.$el.find('.itineraries').append(itinView.el)
  }
})

module.exports = PlanResponseNarrativeView
