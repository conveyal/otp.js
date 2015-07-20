var Handlebars = require('handlebars')

var LegNarrativeView = require('./leg-narrative-view')

var itinNarrativeTemplate = Handlebars.compile(require('./templates/narrative-itinerary.html'))

var Backbone = window.Backbone
var _ = window._

var ItineraryNarrativeView = Backbone.View.extend({
  className: 'PlanResponseNarrativeView',

  events: {
    'click .otp-itinHeader': 'headerClicked',
    'mouseenter .otp-itinHeader': 'headerMouseenter',
    'mouseleave .otp-itinHeader': 'headerMouseleave',
    'click .print': 'print'
  },

  initialize: function (options) {
    this.options = options || {}

    _.bindAll(this, 'headerClicked', 'headerMouseenter', 'headerMouseleave')

    this.listenTo(this.model, 'activate', this.expand)
    this.listenTo(this.model, 'deactivate', this.collapse)
  },

  print: function (e) {
    e.preventDefault()
    if (!this.isActive) this.model.trigger('activate')
    if (this.legs) this.legs.forEach(function (leg) { leg.print() })

    setTimeout(function () {
      window.print()
    }, 500)
  },

  render: function () {
    var legs = this.model.get('legs')
    var timeOffset = this.options.planView.model.getTimeOffset()
    var duration = this.options.planView.options.showFullDuration ?
      this.model.getFullDuration(this.options.planView.model.get('request'),
        timeOffset) :
      this.model.get('duration')

    var context = _.clone(this.model.attributes)
    context.index = this.options.index + 1
    context.legs = legs.models
    context.duration = duration
    context.timeOffset = timeOffset
    this.$el.html(itinNarrativeTemplate(context))

    this.legs = []
    _.each(legs.models, this.processLeg, this)

    this.$el.find('.otp-itinBody').hide()
  },

  processLeg: function (leg) {
    var legView = new LegNarrativeView({
      itinView: this,
      model: leg
    })
    legView.render()
    this.legs.push(legView)
    this.$el.find('.otp-itinBody').append(legView.el)
  },

  collapse: function () {
    this.$el.find('.otp-itinBody').slideUp('fast')
    this.$el.removeClass('activated')
  },

  expand: function () {
    this.$el.find('.otp-itinBody').slideDown('fast')
    this.$el.addClass('activated')
  },

  headerClicked: function (e) {
    if (!this.isActive()) {
      this.model.trigger('activate')
    }
  },

  headerMouseenter: function (e) {
    if (!this.isActive()) {
      this.model.trigger('mouseenter')

      // clear the active itinerary while this one is being previewed
      var active = this.options.planView.model.get('itineraries').activeItinerary
      if (active) active.trigger('mouseleave')
    }
  },

  headerMouseleave: function (e) {
    if (!this.isActive()) {
      this.model.trigger('mouseleave')

      // restore the active itinerary
      var active = this.options.planView.model.get('itineraries').activeItinerary
      if (active) active.trigger('mouseenter')
    }
  },

  isActive: function () {
    return this.options.planView.model.get('itineraries').activeItinerary ===
      this.model
  }
})

module.exports = ItineraryNarrativeView
