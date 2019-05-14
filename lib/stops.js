var Stop = require('./stop')

var Backbone = require('backbone')

var Stops = Backbone.Collection.extend({
  model: Stop
})

module.exports = Stops
