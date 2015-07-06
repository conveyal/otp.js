var StopsResponse = require('./stops-response')
var utils = require('./utils')

var Backbone = window.Backbone
var $ = window.$

var StopsInRectangleRequest = Backbone.Model.extend({
  initialize: function (opts) {
    var self = this
    this.on('change', function () {
      self.request()
    })
  },

  defaults: {
    routerId: null,
    maxLat: null,
    maxLon: null,
    minLat: null,
    minLon: null,
  },

  request: function () {
    var m = this

    // don't make incomplete requests
    if (!this.attributes.maxLat || !this.attributes.maxLon || !this.attributes.minLat || !this.attributes.minLon) {
      return false
    }

    $.ajax(this.urlRoot, {
      data: utils.filterParams(this.attributes)
    })
      .done(function (data) {
        m.trigger('success', m.processRequest(data))
      })
      .fail(function (data) {
        m.trigger('failure', data)
      })
  },

  processRequest: function (data) {
    var response = new StopsResponse(data)
    response.set('request', this)
    return response
  }
})

module.exports = StopsInRectangleRequest
