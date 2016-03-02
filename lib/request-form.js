var Handlebars = require('handlebars')

var BikeTriangleControl = require('./bike-triangle-control')
var geocoder = require('./geocoder')
var log = require('./log')('request-form')
var rfCommon = require('./request-form-common')

var Backbone = window.Backbone
var moment = window.moment
var $ = window.$
var _ = window._

var requestFormTemplate = Handlebars.compile(require('./templates/request-form.html'))

var defaultModes = [ 'TRANSIT,WALK', 'TRAINISH,WALK', 'BUS,WALK', 'WALK', 'BICYCLE', 'TRANSIT,BICYCLE' ]

var RequestView = Backbone.View.extend({
  events: {
    'change .apiParam': 'changeForm',
    'click .reverse-direction': 'reverseDirection',
    'click .search-button': 'changeForm',
    'change #mode': 'updateModeControls',
    'click .toggleSettings': 'toggleSettings',
    'click .first': 'first',
    'click .previous': 'previous',
    'click .next': 'next',
    'click .last': 'last'
  },

  first: function () {
    this.model.set({
      arriveBy: false,
      time: '12:01 am'
    })
  },

  previous: function () {
    var active = this.itineraries.activeItinerary
    var endTime = moment(active.get('endTime'))
    var date = endTime.add(this.timeOffset, 'hours').subtract(1, 'minute')

    this.model.set({
      arriveBy: true,
      date: date.format('MM-DD-YYYY'),
      time: date.format('hh:mm a')
    })
  },

  next: function () {
    var active = this.itineraries.activeItinerary
    var startTime = moment(active.get('startTime'))
    var date = startTime.add(this.timeOffset, 'hours').add(1, 'minute')

    this.model.set({
      arriveBy: false,
      date: date.format('MM-DD-YYYY'),
      time: date.format('hh:mm a')
    })
  },

  last: function () {
    this.model.set({
      arriveBy: false,
      time: '11:59 pm'
    })
  },

  setNextPreviousLastHidden: function (hidden) {
    if (hidden) {
      this.$('.nextPreviousLast').addClass('hidden')
    } else {
      this.$('.nextPreviousLast').removeClass('hidden')
    }
  },

  initialize: function (options) {
    this.options = options || {}
    _.bindAll(this, 'changeForm')

    var view = this

    this.updatingForm = false

    this.geocodeItem = Handlebars.compile([
      '<span class="title">{{text}}</span>',
      '<span class="description">{{#if city}}{{city}}, {{/if}}{{state}}</span>'
    ].join('\n'))

    this.selectedGeocodeItem = Handlebars.compile([
      '{{text}}{{#if city}}, {{city}}{{/if}}{{#if state}}, {{state}}{{/if}}'
    ].join('\n'))

    this.listenTo(this.model, 'change', function (data) {
      log('updating form with model changes')

      if (_.has(data.changed, 'fromPlace') && data.attributes.fromPlace && view.selectFrom && !this.skipReverseGeocode) {
        view.updateReverseGeocoder('From', data.attributes.fromPlace, view.selectFrom)
      }
      if (_.has(data.changed, 'toPlace') && data.attributes.toPlace && view.selectTo && !this.skipReverseGeocode) {
        view.updateReverseGeocoder('To', data.attributes.toPlace, view.selectTo)
      }
      this.skipReverseGeocode = false

      if (data.attributes.arriveBy !== undefined) {
        view.$('#arriveBy').val(data.attributes.arriveBy + '')
      }

      if (data.attributes.mode) view.$('#mode').val(data.attributes.mode)
      if (data.attributes.maxWalkDistance) view.$('#maxWalkDistance').val(data.attributes.maxWalkDistance)
      if (data.attributes.optimize) view.$('#optimize').val(data.attributes.optimize)

      if (data.attributes.date) {
        var date = moment(data.attributes.date, 'MM-DD-YYYY').toDate()
        view.datepicker.setDate(date)
      }

      if (data.attributes.time) {
        var time = moment(data.attributes.time, 'hh:mm a').toDate()
        view.timepicker.setDate(time)
      }

      if (data.attributes.wheelchairAccessible) {
        view.$('#wheelchairAccessible').prop('checked', true)
      }

      view.updateModeControls()
    })

    this.listenTo(this.model, 'requesting', function () {
      view.deactivateSearchButton()
      view.setNextPreviousLastHidden(true)
    })

    this.listenTo(this.model, 'success', function (response) {
      view.activateSearchButton()
      view.setNextPreviousLastHidden(false)
      view.timeOffset = response.getTimeOffset()
      view.itineraries = response.get('itineraries')
    })

    this.listenTo(this.model, 'failure', function () {
      view.activateSearchButton()
      view.setNextPreviousLastHidden(true)
    })
  },

  updateReverseGeocoder: function (field, latlon, select) {
    log('updating %s with %s', field, latlon)
    var view = this

    if (window.OTP_config.reverseGeocode) {
      view.updatingForm = true
      geocoder.reverse(latlon, function (err, results) {
        if (err) {
          select.select2('data', [])
          select.select2('data', {
            text: field + ' marker location',
            place: latlon
          })
        } else {
          select.select2('data', null)
          results.text = field + ' ' + results.address
          select.select2('data', results)
        }
        view.updatingForm = false
      })
    } else {
      // this isn't great but appears to be neccesary as selectize triggers a change event even when programatically updated
      view.updatingForm = true

      var item = {
        text: field + ' marker location',
        place: latlon
      }

      select.select2('data', item)

      view.updatingForm = false
    }
  },

  render: function () {
    log('rendering request form view')
    var view = this
    view.updatingForm = true

    var html = requestFormTemplate({
      metric: this.options.metric || false,
      modes: window.OTP_config.modes || defaultModes
    })

    this.lastResults = []

    this.$el.html(html)

    this.$('#hideSettings').hide()
    this.$('#hidableSettings').hide()
    this.$('#date').datetimepicker({
      pickTime: false
    })

    this.datepicker = this.$('#date').data('DateTimePicker')
    this.datepicker.setDate(new Date())
    this.$('#date').on('dp.change', function () {
      view.changeForm()
    })

    this.$('#time').datetimepicker({
      pick12HourFormat: true,
      pickSeconds: false,
      pickDate: false
    })

    this.timepicker = this.$('#time').data('DateTimePicker')
    this.timepicker.setDate(new Date())
    this.$('#time').on('dp.change', function () {
      view.changeForm()
    })

    var data = {
      date: this.$('#date input').val(),
      time: this.$('#time input').val(),
      maxWalkDistance: 8046
    }

    this.model.set(data)

    this.bikeTriangle = new BikeTriangleControl({
      model: this.model,
      el: this.$('#bikeTriangle')
    })

    this.selectFrom = rfCommon.initializeSelectFor('from', this.$('#fromPlace'), this)
    this.selectTo = rfCommon.initializeSelectFor('to', this.$('#toPlace'), this)

    this.updateModeControls()

    view.updatingForm = false
  },

  changeForm: function (evt) {
    // skip duplicate change events caused by selectize form inputs
    if (this.updatingForm) return

    this.updatingForm = true

    var maxDistance = $('#mode').val().indexOf('WALK') !== -1
      ? $('#maxWalkDistance').val()
      : $('#maxBikeDistance').val()

    var data = {
      date: this.$('#date input').val(),
      time: this.$('#time input').val(),
      arriveBy: this.$('#arriveBy').val(),
      maxWalkDistance: maxDistance,
      optimize: this.$('#optimize').val(),
      mode: this.$('#mode').val(),
      wheelchairAccessible: this.$('#wheelchairAccessible').prop('checked')
    }

    // skip if either to/from fields are unset
    var fromData = this.$('#fromPlace').select2('data')
    data.fromPlace = _.has(fromData, 'place') ? fromData.place : false

    var toData = this.$('#toPlace').select2('data')
    data.toPlace = _.has(toData, 'place') ? toData.place : false

    var mode = $('#mode').val()
    if (mode.indexOf('BICYCLE') !== -1) {
      data.triangleSafetyFactor = $('#').val()
      data.triangleSlopeFactor = $('#').val()
      data.triangleTimeFactor = $('#').val()
    } else {
      this.model.unset('triangleSafetyFactor', {
        silent: true
      })
      this.model.unset('triangleSlopeFactor', {
        silent: true
      })
      this.model.unset('triangleTimeFactor', {
        silent: true
      })
    }

    this.model.set(data)
    this.updatingForm = false
  },

  deactivateSearchButton: function () {
    log('deactivating search button')

    this.$('.search-button').addClass('hidden')
    this.$('.searching-button').removeClass('hidden')
  },

  activateSearchButton: function () {
    log('activating search button')

    this.$('.search-button').removeClass('hidden')
    this.$('.searching-button').addClass('hidden')
  },

  updateModeControls: function () {
    var mode = this.$('#mode').val()
    if (!mode) {
      this.$('#mode').val('TRANSIT,WALK')
      mode = 'TRANSIT,WALK'
    }

    // disabling maxWalkControl as we switch to soft walk dist limiting
    this.$el.find('.maxWalkControl').hide()

    if (mode.indexOf('BICYCLE') !== -1 && mode.indexOf('TRANSIT') !== -1) {
      this.$el.find('.maxBikeControl').show()
    } else {
      this.$el.find('.maxBikeControl').hide()
    }

    if (mode.indexOf('TRANSIT') !== -1 && mode.indexOf('BICYCLE') === -1) {
      this.$el.find('.optimizeControl').show()
    } else {
      this.$el.find('.optimizeControl').hide()
    }

    if (mode.indexOf('BICYCLE') !== -1) {
      this.$el.find('.bikeTriangleControl').show()
    } else {
      this.$el.find('.bikeTriangleControl').hide()
    }
  },

  toggleSettings: function () {
    if ($('#hidableSettings').is(':visible')) {
      $('#hidableSettings').slideUp('fast', function () {
        $('#itineraries').height($(window).height() - ($('#request').height() +
          $('#messageWell').height() + 80))
      })
      $('#showSettings').show()
      $('#hideSettings').hide()
      this.bikeTriangle.disable()
    } else {
      $('#hidableSettings').slideDown('fast', function () {
        $('#itineraries').height($(window).height() - ($('#request').height() +
          $('#messageWell').height() + 80))
      })
      $('#showSettings').hide()
      $('#hideSettings').show()
      if (!this.bikeTriangle.rendered) {
        this.bikeTriangle.render()
      }
      this.bikeTriangle.enable()
    }
  },

  reverse: function (place, error, success) {
    // esri takes lon/lat
    var parts = place.split(',')
    var lonlat = parts[1] + ',' + parts[0]

    $.ajax({
      url: window.OTP_config.esriApi + 'reverseGeocode?location=' +
        encodeURIComponent(lonlat) + '&f=pjson',
      type: 'GET',
      dataType: 'jsonp',
      error: function () {
        error()
      },
      success: function (res) {
        var data = {
          address: res.address.Address,
          city: res.address.City,
          state: res.address.Region,
          latlon: place
        }

        success(data)
      }
    })
  },

  reverseDirection: function (e) {
    e.preventDefault()
    this.model.set({
      toPlace: this.model.get('fromPlace'),
      fromPlace: this.model.get('toPlace')
    })
  }
})

// Expose RequestView

module.exports = RequestView
