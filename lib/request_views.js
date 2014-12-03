var Handlebars = require('handlebars');
var haversine = require('haversine');
var select2 = require('select2');

var BikeView = require('./bike_views');
var geocoder = require('./geocoder');

var requestFormTemplate = Handlebars.compile(require('./request-form.html'));

var RequestFormView = module.exports = Backbone.View.extend({

  events: {
    'change .apiParam': 'changeForm',
    'change #mode': 'updateModeControls',
    'click .toggleSettings': 'toggleSettings'
  },

  initialize: function(options) {
    this.options = options || {};
    _.bindAll(this, 'changeForm');

    var view = this;

    this.updatingForm = false;

    this.geocodeItem = Handlebars.compile([
      '<span class="title">{{text}}</span>',
      '{{#if city}}<span class="description">{{city}}, {{state}}</span>{{/if}}'
    ].join('\n'));

    this.selectedGeocodeItem = Handlebars.compile([
      '{{text}}{{#if city}}, {{city}}, {{state}}{{/if}}'
    ].join('\n'));

    this.model.on('change', function(data) {

      if (_.has(data.changed, 'fromPlace') && data.attributes.fromPlace && view.selectFrom) {
        view.updateReverseGeocoder('From', data.attributes.fromPlace, view.selectFrom);
      }

      if (_.has(data.changed, 'toPlace') && data.attributes.toPlace && view.selectTo) {
        view.updateReverseGeocoder('To', data.attributes.toPlace, view.selectTo);
      }

      view.$('#arriveBy').val(data.attributes.arriveBy);
      view.$('#mode').val(data.attributes.mode);
      view.$('#maxWalkDistance').val(data.attributes.maxWalkDistance);
      view.$('#optimize').val(data.attributes.optimize);

      var date = moment(data.attributes.date, 'MM-DD-YYYY').toDate();
      view.datepicker.setDate(date);

      var time = moment(data.attributes.time, 'hh:mm a').toDate();
      view.timepicker.setDate(time);

      view.updateModeControls();
    });
  },

  updateReverseGeocoder: function(field, latlon, select) {
    var view = this;

    if (window.OTP_config.reverseGeocode) {
      geocoder.reverse(latlon, function(err, results) {
        view.updatingForm = true;
        if (err) {
          select.select2('data', []);
        } else {
          select.select2('data', null);
          results.text = field + ' ' + results.address;
          select.select2('data', results);
        }
        view.updatingForm = false;
      });
    } else {

      // this isn't great but appears to be neccesary as selectize triggers a change event even when programatically updated
      view.updatingForm = true;

      var item = {
        text: field + ' marker location',
        id: latlon
      };

      select.select2('data', item);

      view.updatingForm = false;

    }
  },

  render: function() {

    var view = this;

    var html = requestFormTemplate({
      metric: this.options.metric || false
    });

    this.lastResults = [];

    this.$el.html(html);

    this.$('#showSettings').hide();

    view.updatingForm = true;

    this.$('#date').datetimepicker({
      pickTime: false
    });

    this.datepicker = this.$('#date').data('DateTimePicker');
    this.datepicker.setDate(new Date());
    this.$('#date').on('dp.change', function() {
      view.changeForm();
    });

    this.$('#time').datetimepicker({
      pick12HourFormat: true,
      pickSeconds: false,
      pickDate: false
    });

    this.timepicker = this.$('#time').data('DateTimePicker');
    this.timepicker.setDate(new Date());
    this.$('#time').on('dp.change', function() {
      view.changeForm();
    });

    this.bikeTriangle = new BikeView({
      model: this.model,
      el: this.$('#bikeTriangle')
    });

    this.selectFrom = this.initializeSelectFor('from');
    this.selectTo = this.initializeSelectFor('to');

    view.updatingForm = false;

    this.changeForm();
    this.updateModeControls();
  },

  changeForm: function(evt) {

    // skip duplicate change events caused by selectize form inputs
    if (this.updatingForm)
      return;

    var maxDistance = $('#mode').val().indexOf('WALK') != -1 ?
      $('#maxWalkDistance').val() : $('#maxBikeDistance').val();

    var data = {
      fromPlace: this.$('#fromPlace').select2('val'),
      toPlace: this.$('#toPlace').select2('val'),
      date: this.$('#date input').val(),
      time: this.$('#time input').val(),
      arriveBy: this.$('#arriveBy').val(),
      maxWalkDistance: maxDistance,
      optimize: this.$('#optimize').val(),
      mode: this.$('#mode').val()
    };

    // skip if either to/from fields are unset
    if (this.$('#fromPlace').select2('val') == 'not found')
      data.fromPlace = false;
    if (this.$('#toPlace').select2('val') == 'not found')
      data.toPlace = false;

    var mode = $('#mode').val();
    if (mode.indexOf('BICYCLE') != -1) {
      data.triangleSafetyFactor = $('#').val();
      data.triangleSlopeFactor = $('#').val();
      data.triangleTimeFactor = $('#').val();
    } else {
      this.model.unset('triangleSafetyFactor', {
        silent: true
      });
      this.model.unset('triangleSlopeFactor', {
        silent: true
      });
      this.model.unset('triangleTimeFactor', {
        silent: true
      });
    }

    this.model.set(data);
  },

  updateModeControls: function() {
    var mode = $('#mode').val();

    if (mode.indexOf('WALK') != -1 && mode.indexOf('TRANSIT') != -1) this.$el
      .find('.maxWalkControl').show();
    else this.$el.find('.maxWalkControl').hide();

    if (mode.indexOf('BICYCLE') != -1 && mode.indexOf('TRANSIT') != -1) this
      .$el.find('.maxBikeControl').show();
    else this.$el.find('.maxBikeControl').hide();

    if (mode.indexOf('TRANSIT') != -1 && mode.indexOf('BICYCLE') == -1)
      this.$el.find('.optimizeControl').show();
    else
      this.$el.find('.optimizeControl').hide();

    if (mode.indexOf('BICYCLE') != -1) this.$el.find('.bikeTriangleControl')
      .show();
    else this.$el.find('.bikeTriangleControl').hide();
  },

  toggleSettings: function() {

    if ($('#hidableSettings').is(':visible')) {
      $('#hidableSettings').slideUp('fast', function() {
        $('#itineraries').height($(window).height() - ($('#request').height() +
          $('#messageWell').height() + 80));
      });
      $('#showSettings').show();
      $('#hideSettings').hide();
    } else {
      $('#hidableSettings').slideDown('fast', function() {
        $('#itineraries').height($(window).height() - ($('#request').height() +
          $('#messageWell').height() + 80));
      });
      $('#showSettings').hide();
      $('#hideSettings').show();
    }

  },

  reverse: function(place, error, success) {

    // esri takes lon/lat
    var parts = place.split(',');
    var lonlat = parts[1] + ',' + parts[0];

    $.ajax({
      url: window.OTP_config.esriApi + 'reverseGeocode?location=' +
        encodeURIComponent(lonlat) + '&f=pjson',
      type: 'GET',
      dataType: 'jsonp',
      error: function() {
        error();
      },
      success: function(res) {

        var data = {
          address: res.address.Address,
          city: res.address.City,
          state: res.address.Region,
          latlon: place
        };

        success(data);
      }
    });
  },

  initializeSelectFor: function(term) {
    var $id = '#' + term + 'Place';
    var placeholder = term === 'from' ? 'Start' : 'End';
    var url = window.OTP_config.esriApi + 'findAddressCandidates';
    var view = this;

    return this.$($id).select2({
      placeholder: placeholder + ' Address',
      minimumInputLength: 4,
      allowClear: true,
      selectOnBlur: true,
      createSearchChoice: function(term) {
        if (view.lastResults.length === 0) {
          var text = term + ' (not found)';
          return {
            id: 'not found',
            text: text
          };
        }
      },
      formatResult: function(object, container) {
        var item = view.geocodeItem(object);
        return item;
      },
      formatSelection: function(object, container) {
        var item = view.selectedGeocodeItem(object);
        return item;
      },
      ajax: {
        url: url,
        dataType: 'json',
        quietMillis: 20,
        data: function(term, page) {
          view.lastResults = [];

          var query = {
            f: 'json',
            distance: 5000, // 5km
            singleLine: term,
            outFields: 'City,Region',
            location: '-73.7562271,42.6525795', // TODO: Should be from config
            maxLocations: 5
          };

          if (view.options.map) {
            var latlng = view.options.map.getCenter();
            query.location = latlng.lng + ',' + latlng.lat;

            var bounds = view.options.map.getBounds();
            var nw = bounds.getNorthWest();
            var se = bounds.getSouthEast();
            query.distance = haversine(nw.lat, nw.lng, se.lat, se.lng) * 1000;
          }

          return query;
        },
        results: function(res, page) {
          var results = [];
          if (res.candidates) {
            for (var i in res.candidates) {
              var candidate = res.candidates[i];
              var location = candidate.location;

              results.push({
                text: candidate.address.split(',')[0],
                city: candidate.attributes.City,
                state: candidate.attributes.Region,
                id: location.y + ',' + location.x
              });
            }
          }

          view.skipReverseGeocode = true;
          view.lastResults = results;

          if (results.length > 0) {
            view.$($id).select2('data', Object.assign({}, results[0], {
              text: term + ' ' + results[0].text
            }));
            view.changeForm();
          }

          return {
            results: results
          };
        }
      }
    });
  }
});