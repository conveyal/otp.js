var Backbone = window.Backbone
var _ = window._

var rfCommon = require('./request-form-common')

/**
 * View to help embed a simple otp.js search form on a third party website. View
 * should ne created with 'el' set to the element containing the form and the
 * option 'urlBase' for the base URL the otp.js client should redirect to
 */

var RequestFormWidgetView = Backbone.View.extend({
  events: {
    'click .otp-search-button': 'search'
  },

  initialize: function (options) {
    this.urlBase = options.urlBase

    // append a trailing '/' if needed
    if (this.urlBase && this.urlBase.indexOf('/', this.urlBase.length - 1) === -1) {
      this.urlBase += '/'
    }

    this.render()
  },

  render: function () {
    var fromPlaceInput = this.$el.find('.otp-from-place')
    if (fromPlaceInput.length) {
      this.selectFrom = rfCommon.initializeSelectFor('from', fromPlaceInput, this)
    }

    var toPlaceInput = this.$el.find('.otp-to-place')
    if (toPlaceInput.length) {
      this.selectTo = rfCommon.initializeSelectFor('to', toPlaceInput, this)
    }

    this.timePicker = this.$el.find('.otp-time-picker')
    if (this.timePicker.length) {
      this.timePicker.datetimepicker({
        pick12HourFormat: true,
        pickSeconds: false,
        pickDate: false
      })
      this.timePicker.data('DateTimePicker').setDate(new Date())
    }

    this.datePicker = this.$el.find('.otp-date-picker')
    if (this.datePicker.length) {
      this.datePicker.datetimepicker({
        pickTime: false
      })
      this.datePicker.data('DateTimePicker').setDate(new Date())
    }
  },

  search: function () {
    var queryParams = {}

    if (this.selectFrom) {
      var fromData = this.selectFrom.select2('data')
      if (_.has(fromData, 'place')) queryParams.fromPlace = fromData.place
    }

    if (this.selectTo) {
      var toData = this.selectTo.select2('data')
      if (_.has(toData, 'place')) queryParams.toPlace = toData.place
    }

    if (this.datePicker.length) {
      queryParams['date'] = this.datePicker.find('input').val()
    }

    if (this.timePicker.length) {
      queryParams['time'] = this.timePicker.find('input').val()
    }

    var arriveBy = this.$el.find('.otp-arrive-by')
    if (arriveBy.length) {
      queryParams['arriveBy'] = arriveBy.val()
    }

    if (queryParams.fromPlace && queryParams.toPlace) {
      var urlArgs = _.map(queryParams, function (val, key) {
        return key + '=' + encodeURIComponent(val)
      }).join('&')

      var url = (this.urlBase || '') + '#plan?' + urlArgs
      window.location = url
    }
  }
})

module.exports = RequestFormWidgetView
