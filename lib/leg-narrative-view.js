var Handlebars = require('handlebars')

var StepNarrativeView = require('./step-narrative-view')

var Backbone = window.Backbone
var _ = window._

var accessLegTemplate = Handlebars.compile(require('./templates/access-leg.html'))
var transitLegTemplate = Handlebars.compile(require('./templates/transit-leg.html'))
var genericLegTemplate = Handlebars.compile(require('./templates/generic-leg.html'))

var LegNarrativeView = Backbone.View.extend({
  events: {
    'click .otp-legHeader': 'headerClicked',
    'mouseenter .otp-legHeader': 'headerMouseenter',
    'mouseleave .otp-legHeader': 'headerMouseleave',
    'click .otp-from': 'fromClicked',
    'click .otp-to': 'toClicked',
    'click .showTimes': 'showTimes'
  },

  initialize: function (options) {
    this.options = options || {}
  },

  render: function () {
    if (this.model.isWalk() || this.model.isBicycle() || this.model.isCar()) {
      this.$el.html(accessLegTemplate(this.model.attributes))

      this.steps = []
      _.each(this.model.get('steps').models, this.processStep, this)
    } else if (this.model.isTransit()) {
      var context = _.clone(this.model.attributes)
      context.timeOffset = this.options.itinView.options.planView.model.getTimeOffset()
      context.agencyLogoUrl = window.OTP_config.brandingUrl + encodeURIComponent(context.agencyId) + '/logo.png'
      this.$el.html(transitLegTemplate(context))
    } else {
      this.$el.html(genericLegTemplate(this.model.attributes))
    }

    if (!this.model.isTransit()) this.$el.find('.otp-legBody').hide()
  },

  print: function () {
    this.$el.find('.otp-legBody').slideDown()
    if (this.steps) this.steps.forEach(function (step) { step.print() })
  },

  processStep: function (step, index) {
    var stepView = new StepNarrativeView({
      legView: this,
      model: step,
      index: index
    })
    stepView.render()
    this.steps.push(stepView)
    this.$el.find('.otp-legBody').append(stepView.el)
  },

  headerClicked: function (e) {
    var body = this.$el.find('.otp-legBody')
    if (body.is(':visible')) body.slideUp('fast')
    else body.slideDown('fast')
  },

  headerMouseenter: function (e) {
    this.model.trigger('mouseenter')
  },

  headerMouseleave: function (e) {
    this.model.trigger('mouseleave')
  },

  fromClicked: function (e) {
    this.model.trigger('fromclick')
  },

  toClicked: function (e) {
    this.model.trigger('toclick')
  },

  showTimes: function (e) {
    e.preventDefault()
    this.model.getSurroundingStopTimes(function (err, times) {
      console.log(err, times)
      this.$('.OTPLeg-times').html('7:00pm<br>8:00pm<br>11:55pm')
    })
  }
})

module.exports = LegNarrativeView
