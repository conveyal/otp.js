var Backbone = window.Backbone

var Stop = Backbone.Model.extend({
  initialize: function () {},

  defaults: {
    stopId: null,
    name: null,
    lon: null,
    lat: null,
    // Only availible if non null Stop code
    code: null,
    // Parent station if non null
    cluster: null,
    // Distance to the stop when requested from a location based query
    dist: null
  }
})

module.exports = Stop
