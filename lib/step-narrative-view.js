var Handlebars = require('handlebars')

var utils = require('./utils')
var locale = require('./localization')

var Backbone = window.Backbone
var _ = window._

var stepTemplate = Handlebars.compile(require('./templates/step.html'))

var StepNarrativeView = Backbone.View.extend({
  events: {
    'click .otp-legStep-row': 'rowClicked',
    'mouseenter .otp-legStep-row': 'rowMouseenter',
    'mouseleave .otp-legStep-row': 'rowMouseleave'
  },

  initialize: function (options) {
    this.options = options || {}
  },

  print: function () {
    // this.rowClicked()
  },

  render: function () {
    var context = _.clone(this.model.attributes)
    var relDir = this.model.get('relativeDirection')

    // set a flag if this is the first step of the leg
    context.isFirst = (this.options.index === 0)

    // handle the special case of roundabout / traffic circle steps
    if (relDir === 'CIRCLE_COUNTERCLOCKWISE' || relDir ===
      'CIRCLE_CLOCKWISE') {
      context.isRoundabout = true
      context.roundaboutDirection = (relDir === 'CIRCLE_CLOCKWISE') ?
        'clockwise' : 'counterclockwise' // TODO: i18n
    }

    // Adds localized absolute/relative direction and ordinal exits
    context = locale.localizeStep(context)

    // format the leg distance
    var metric = this.options.legView.options.itinView.options.planView.options
      .metric
    var distStr = utils.distanceString(this.model.get('distance'), metric)
    context.distanceValue = distStr.split(' ')[0]
    context.distanceUnit = distStr.split(' ')[1]

    this.$el.html(stepTemplate(context))
  },

  rowClicked: function (e) {
    this.model.trigger('click')
  },

  rowMouseenter: function (e) {
    this.model.trigger('mouseenter')
  },

  rowMouseleave: function (e) {
    this.model.trigger('mouseleave')
  }
})

module.exports = StepNarrativeView
