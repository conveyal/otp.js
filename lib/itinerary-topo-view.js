var utils = require('./utils')

var Backbone = window.Backbone
var L = window.L
var Raphael = window.Raphael
var _ = window._
var $ = window.$

function getElevation (elevCoord) {
  return elevCoord.second * 3.28084
}

var ItineraryTopoView = Backbone.View.extend({
  initialize: function (options) {
    this.options = options || {}
    _.bindAll(this, 'refresh', 'mousemove', 'mouseleave', 'click')
    this.refresh()

    this.$el.resize(this.refresh)

    this.listenTo(this.model, 'activate', this.render)
    this.listenTo(this.model, 'deactivate', this.clear)
  },

  render: function () {
    this.$el.empty()
    this.$el.append(this._graph)
  },

  refresh: function () {
    this.$el.css({
      width: '100%',
      height: '100%'
    })
    var w = this.$el.width()
    var h = this.$el.height()
    if (w === 0 || h === 0 || (w === this._renderedW && h === this._renderedH)) {
      return
    }
    var legs = this.model.get('legs')

    var elevInterval = 100
    var axisWidth = 30
    var graphHeight = h
    var graphWidth = w - axisWidth

    this._graph = $('<div>')

    // apply mouse listeners for map interactivity, if map reference provided
    if (this.options.map) {
      this._graph.mousemove(this.mousemove)
        .mouseleave(this.mouseleave)
        .click(this.click)
    }

    var paper = Raphael(this._graph[0], w, h)

    // initial pass through legs to calculate total distance covered, elevation range
    var totalWalkBikeDist = 0
    var minElev = 999999
    var maxElev = -999999
    _.each(legs.models, function (leg) {
      if (leg.isWalk() || leg.isBicycle()) {
        totalWalkBikeDist += leg.get('distance')
        _.each(leg.get('steps').models, function (step, index) {
          _.each(step.get('elevation'), function (elev, index) {
            // console.log(elev.second)
            minElev = Math.min(minElev, getElevation(elev))
            maxElev = Math.max(maxElev, getElevation(elev))
          }, this)
        }, this)
      }
    }, this)

    // expand the min/max elevation range to align with interval multiples
    minElev = elevInterval * Math.floor(minElev / elevInterval)
    maxElev = elevInterval * Math.ceil(maxElev / elevInterval)

    for (var e = minElev; e <= maxElev; e += elevInterval) {
      // console.log(e)
      var y = graphHeight - (e - minElev) / (maxElev - minElev) *
        graphHeight
      if (e > minElev && e < maxElev) {
        paper.rect(0, y, w, 1).attr({
          'fill': '#bbb',
          'stroke': null
        })
      }
      if (e < maxElev) y -= 15

      $('<div>').html(e + "'").css({
        position: 'absolute',
        top: y,
        left: 0,
        width: 25,
        'text-align': 'right'
      }).appendTo(this._graph[0])

    }

    var walkBikeDist = 0

    this._legXCoords = [axisWidth]
    this._legLatLngs = []
    this._legDistances = []

    _.each(legs.models, function (leg, index) {
      if (leg.isWalk() || leg.isBicycle()) {
        var legDistance = leg.get('distance')
        var legDistanceCovered = 0
        var graphArray = []

        var latLngs = utils.decodePolyline(leg.get('legGeometry').points)
        this._legLatLngs.push(latLngs)

        var legDistDeg = 0
        for (var i = 0; i < latLngs.length - 1; i++) {
          var from = latLngs[i]
          var to = latLngs[i + 1]
          legDistDeg += Math.sqrt(Math.pow(to.lat - from.lat, 2) + Math.pow(to.lng - from.lng, 2))
        }
        this._legDistances.push(legDistDeg)

        _.each(leg.get('steps').models, function (step, index) {
          var stepDistance = step.get('distance')

          var elevArray

          // check for old style strings -- covert to array of pairs
          if (_.isArray(step.get('elevation'))) {
            elevArray = step.get('elevation')
          } else {
            var pairs = _([])
            elevArray = _.reduce(step.get('elevation').split(','),
              function (m, v) {
                if (m.last() && m.last().size() === 1) {
                  var p = m.last()
                  p.push(v)
                  m[m.length] = p
                } else {
                  m.push(_([v]))
                }

                return m
              }, pairs)
          }

          elevArray.sort(function (a, b) {
            if (a.first < b.first) return -1
            if (a.first > b.first) return 1
            return 0
          })
          _.each(elevArray, function (elev, index) {
            // var d = legDistanceCovered + elev.first
            var first = elev.first
            var second = getElevation(elev)

            // if x-coord exceeds step distance, truncate at step distance, interpolating y
            if (first > stepDistance) {
              if (index > 0) {
                var prevElevCoord = elevArray[index - 1]
                var dx = first - prevElevCoord.first
                var dy = second - getElevation(prevElevCoord)

                var pct = (stepDistance - prevElevCoord.first) / dx

                first = stepDistance
                second = getElevation(prevElevCoord) + pct * dy
              } else return
            }

            var x = axisWidth + ((walkBikeDist + (legDistanceCovered +
              first)) / totalWalkBikeDist) * graphWidth
            var y = (1 - (second - minElev) / (maxElev - minElev)) *
              graphHeight

            graphArray.push([x, y])
          }, this)
          legDistanceCovered += step.get('distance')
        }, this)

        if (graphArray.length > 0) {
          var pathStr = ''
          _.each(graphArray, function (coord, index) {
            if (index === 0) pathStr += 'M' + coord[0] + ' ' + coord[1]
            else pathStr += ' L' + coord[0] + ' ' + coord[1]
          })

          var fillStr = pathStr + ' L' + graphArray[graphArray.length - 1][0] + ' ' + graphHeight
          fillStr += ' L' + graphArray[0][0] + ' ' + graphHeight
          path = paper.path(fillStr)
          path.attr({
            fill: '#aaa',
            stroke: null,
            opacity: 0.5
          })

          var path = paper.path(pathStr)
          path.attr({
            stroke: '#888',
            'stroke-width': 3
          })

        }

        walkBikeDist += legDistance
        var t = walkBikeDist / totalWalkBikeDist
        if (t < 1) {
          var x = axisWidth + Math.round(t * graphWidth)
          paper.rect(x, 0, 1, graphHeight).attr({
            'fill': '#aaa',
            'stroke': null
          })
          this._legXCoords.push(x)
        }
      }
    }, this)

    this._legXCoords.push(axisWidth + graphWidth)

    this._renderedH = h
    this._renderedW = w

    if (this.options.planView.model.get('itineraries').activeItinerary ===
      this.model) {
      this.render()
    }
  },

  mousemove: function (evt) {
    if (!this._legXCoords || !this.options.map) return
    var x = evt.offsetX

    if (x === undefined) { // Firefox
      x = evt.pageX - this._graph.offset().left
    }

    for (var i = 0; i < this._legXCoords.length - 1; i++) {
      if (x >= this._legXCoords[i] && x < this._legXCoords[i + 1]) {
        // create/update the vertical cursor in the topo graph:
        if (!this._xCursor) {
          this._xCursor = $('<div/>').css({
            position: 'absolute',
            left: x,
            top: 0,
            height: this._graph.height(),
            width: 1,
            background: 'black'
          }).appendTo(this._graph)
        } else {
          this._xCursor.css({
            left: x
          })
        }

        // create/update the map marker
        var t = (x - this._legXCoords[i]) / (this._legXCoords[i + 1] - this
            ._legXCoords[i])
        var d = t * this._legDistances[i]
        var ll = this.pointAlongPath(this._legLatLngs[i], d)
        if (!this._marker) {
          this._marker = new L.Marker(ll, {
            icon: new L.DivIcon({
              className: 'otp-crosshairIcon',
              iconSize: null,
              iconAnchor: null
            })
          }).addTo(this.options.map)
        } else {
          this._marker.setLatLng(ll)
        }
        this._lastLatLng = ll
      }
    }
  },

  mouseleave: function (evt) {
    if (this._xCursor) {
      this._xCursor.remove()
      this._xCursor = null
    }
    if (this._marker && this.options.map) {
      this.options.map.removeLayer(this._marker)
      this._marker = this._lastLatLng = null
    }
  },

  click: function (evt) {
    if (this._lastLatLng && this.options.map) {
      this.options.map.panTo(this._lastLatLng)
    }
  },

  pointAlongPath: function (latLngs, d) {
    if (d <= 0) return latLngs[0]
    for (var i = 0; i < latLngs.length - 1; i++) {
      var from = latLngs[i]
      var to = latLngs[i + 1]
      var segLen = Math.sqrt(Math.pow(to.lat - from.lat, 2) + Math.pow(to.lng -
          from.lng, 2))
      if (d <= segLen) { // this segment contains the point at distance d
        var lat = latLngs[i].lat + (d / segLen * (latLngs[i + 1].lat -
          latLngs[i].lat))
        var lng = latLngs[i].lng + (d / segLen * (latLngs[i + 1].lng -
          latLngs[i].lng))
        return new L.LatLng(lat, lng)
      }
      d -= segLen
    }

    return latLngs[latLngs.length - 1]
  }
})

module.exports = ItineraryTopoView
