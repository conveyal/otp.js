var Backbone = window.Backbone
var moment = window.moment

var PlanResponse = Backbone.Model.extend({
  defaults: {
    request: null,
    to: null,
    from: null,
    date: null,
    itineraries: []
  },

  getTimeOffset: function () {
    var queryDate = moment(this.get('request').get('date') + ' ' + this.get('request').get('time'), 'MM-DD-YYYY h:mm a')
    var responseDate = moment(this.get('date'))
    var offset = (queryDate - responseDate) / 3600000
    return offset
  }
})

module.exports = PlanResponse
