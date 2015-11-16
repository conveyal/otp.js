var Handlebars = require('handlebars')
var haversine = require('haversine')
var geocoder = require('./geocoder')
require('select2')

var _ = window._

/**
 * Creates a select2 widget for a provided input element with geocoding enabled
 * @param {string} term - 'from' or 'to'
 * @parem {selector} element - jquery selector for the <input> element
 * @param {object} parent - the object that created/owns this widget
 */

module.exports.initializeSelectFor = function (term, element, parent) {
  var placeholder = term === 'from' ? 'Start' : 'End'

  var map = parent.options ? parent.options.map : null

  var select = element.select2({
    placeholder: placeholder + ' Address',
    minimumInputLength: 5,
    allowClear: true,
    selectOnBlur: true,
    createSearchChoice: function (term) {
      if (parent.lastResults.length === 0) {
        var text = term + ' (not found)'
        return {
          id: 'not found',
          text: text
        }
      }
    },
    formatResult: function (object, container) {
      return geocodeItem(object)
    },
    formatSelection: function (object, container) {
      return selectedGeocodeItem({
        text: object.text,
        city: object.city,
        state: object.state,
        id: object.id
      })
    },
    query: function (query) {
      geocoder.suggest(query.term, function (results) {
        parent.skipReverseGeocode = true
        parent.lastResults = results

        query.callback({ results: results })
      }, getLocationOptions(map))
    }
  })

  select.on('select2-selecting', function (evt) {
    evt.preventDefault()

    // if 'place' attribute is defined in 'suggest' query results, we can update form now
    if (_.has(evt.object, 'place')) {
      select.select2('close')
      select.select2('data', evt.object)
      if (typeof parent.changeForm === 'function') parent.changeForm()
    } else if (evt.object.source === 'esri') { // otherwise (i.e. in case of Esri geocoder), a subsequent 'lookup' call is needed
      var opts = getLocationOptions(map)
      opts.magicKey = evt.object.magicKey

      geocoder.EsriGeocoder.lookup(evt.object.text, function (results) {
        if (results && results.length > 0) {
          select.select2('close')
          select.select2('data', results[0])
          if (typeof parent.changeForm === 'function') parent.changeForm()
        }
      }, opts)
    }
  })
  return select
}

// Felper function to construct the Esri geocoder location options (lonlat, distance)

var getLocationOptions = function (map) {
  var options = {}

  if (map) {
    var latlng = map.getCenter()
    options.location = latlng.lng + ',' + latlng.lat

    var bounds = map.getBounds()
    var nw = bounds.getNorthWest()
    var se = bounds.getSouthEast()
    options.distance = haversine(nw.lat, nw.lng, se.lat, se.lng) * 1000
  } else {
    if (window.OTP_config.initLatLng) {
      console.log(window.OTP_config.initLatLng)
      options.location = window.OTP_config.initLatLng[1] + ',' + window.OTP_config.initLatLng[0]
    }
    options.distance = 5000
  }

  return options
}

module.exports.getLocationOptions = getLocationOptions

// Templates for formatting geocoded items in selector

var geocodeItem = Handlebars.compile([
  '<span class="title">{{text}}</span>',
  '<span class="description">{{#if city}}{{city}}, {{/if}}{{state}}</span>'
].join('\n'))

module.exports.geocodeItem = geocodeItem

var selectedGeocodeItem = Handlebars.compile([
  '{{text}}{{#if city}}, {{city}}{{/if}}{{#if state}}, {{state}}{{/if}}'
].join('\n'))

module.exports.selectedGeocodeItem = selectedGeocodeItem
