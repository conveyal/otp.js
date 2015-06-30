var Itinerary = require('./itinerary')

var Backbone = window.Backbone

var Itineraries = Backbone.Collection.extend({
  model: Itinerary,

  initialize: function () {
    var self = this

    // for any itin added to this collection..
    this.on('add', function (itin) {
      self.handleActivate(itin)
    })
  },

  handleActivate: function (itin) {
    var self = this
    this.listenTo(itin, 'activate', function () {
      if (self.activeItinerary && itin !== self.activeItinerary) {
        self.activeItinerary.trigger('deactivate')
      }

      self.activeItinerary = itin
    })
  }
})

module.exports = Itineraries
