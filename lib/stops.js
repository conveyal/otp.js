var Stop = require('./stop')

var Backbone = window.Backbone

var Stops = Backbone.Collection.extend({
  model: Stop
})

module.exports = Stops
