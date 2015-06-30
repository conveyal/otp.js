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
    agency: null,
    leftUpLat: null,
    leftUpLon: null,
    rightDownLat: null,
    rightDownLon: null,
    extended: false
  },

  request: function () {
    var m = this

    // don't make incomplete requests
    if (!this.attributes.leftUpLat || !this.attributes.leftUpLon || !this.attributes.rightDownLat || !this.attributes.rightDownLon) {
      return false
    }

    $.ajax(this.urlRoot, {
      dataType: 'jsonp',
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
