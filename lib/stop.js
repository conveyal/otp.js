var Backbone = window.Backbone

var Stop = Backbone.Model.extend({
  initialize: function () {},

  defaults: {
    stopId: null,
    direction: null,
    locationType: null,
    parentStation: null,
    stopName: null,
    stopLon: null,
    stopLat: null,
    stopDesc: null,
    stopCode: null,
    stopUrl: null,
    wheelchairBoarding: null,
    zoneId: null,
    routes: []
  }
})

module.exports = Stop
