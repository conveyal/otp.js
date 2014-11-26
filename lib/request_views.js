var _ = require('underscore');
var Backbone = require('backbone');
var DateTimePicker = require('datetimepicker');
var moment = require('moment');
var Handlebars = require('handlebars');
var select2 = require('select2');

var BikeView = require('./bike_views');

var requestFormTemplate = Handlebars.compile(require('./request-form.html'));

var OtpRequestFormView = Backbone.View.extend({

    events: {
        'change .apiParam'      : 'changeForm',
        'change #mode'          : 'updateModeControls',
        'click .toggleSettings' : 'toggleSettings'
    },

    initialize : function(options) {
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

            var reverseLookup = window.OTP_config.reverseGeocode;

            if(_.has(data.changed, 'fromPlace') && data.attributes.fromPlace &&  view.selectFrom) {
                view.updateReverseGeocoder('From',  data.attributes.fromPlace, view.selectTo);

            }

            if(_.has(data.changed, 'toPlace') && data.attributes.toPlace && view.selectTo) {
                 view.updateReverseGeocoder('To',  data.attributes.toPlace, view.selectTo);

            }

            if(_.has(data.changed, 'toPlace') && data.attributes.toPlace && view.selectTo) {
                 view.updateReverseGeocoder('To',  data.attributes.toPlace, view.selectTo);

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

    updateReverseGeocoder: function (field, latlon, select) {

        var reverseLookup = window.OTP_config.reverseGeocode;

        var view = this;


        if(reverseLookup) {

            var error = function() {
                view.updatingForm = true;

                select.select2('data', []);

                view.updatingForm = false;

            };

            var success = function(response) {
                view.updatingForm = true;
                select.select2('data', null);
                response.text =  field + ' ' + response.address;
                select.select2('data', response);
                view.updatingForm = false;

            };

            reverseLookup(latlon, error, success);
        }
        else {

            // this isn't great but appears to be neccesary as selectize triggers a change event even when programatically updated
            view.updatingForm = true;

            var item = {
                            text: field + ' marker location',
                            id : latlon
            };

            select.select2('data', item);

            view.updatingForm = false;

        }
    },

    render : function() {

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
        this.$('#date').on('changeDate', this.changeForm);

        this.$('#time').datetimepicker({
            pick12HourFormat: true,
            pickSeconds: false,
            pickDate: false
        });

        this.timepicker = this.$('#time').data('DateTimePicker');
        this.timepicker.setDate(new Date());
        this.$('#time').on('changeDate', this.changeForm);

        this.bikeTriangle = new BikeView({
            model: this.model,
            el: this.$('#bikeTriangle')
        });

        var url = window.OTP_config.esriApi + 'findAddressCandidates';

        this.selectFrom = this.$('#fromPlace').select2({
            placeholder: 'Start Address',
            minimumInputLength: 4,
            allowClear: true,
            selectOnBlur: true,
            createSearchChoice : function(term) {
                if(view.lastResults.length === 0) {
                    var text = term + ' (not found)';
                    return { id: 'not found', text: text };
                }
            },
            formatResult: function(object, container, query) {
                var item = view.geocodeItem(object);
                return item;
            },
            formatSelection: function(object, container, query) {
                var item = view.selectedGeocodeItem(object);
                return item;
            },
            ajax: {
                url:  url,
                dataType: 'json',
                quietMillis: 10,
                data: function (term, page) {
                    view.lastResults = [];

                    var searchLocation = '-73.7562271,42.6525795';

                    if(view.options.map) {
                      var latlng = view.options.map.getCenter();
                      searchLocation = latlng.lng + ',' + latlng.lat;
                    }

                    return {
                        singleLine: term, // search term
                        outFields: 'City,Region',
                        location: searchLocation,
                        f: 'json'
                    };
                },
                results: function (res, page) {
                    var data = [];
                    for(var itemPos in res.candidates.slice(0, 10)) {

                        var item = {
                            text: res.candidates[itemPos].address.split(',')[0],
                            city : res.candidates[itemPos].attributes.City,
                            state : res.candidates[itemPos].attributes.Region,
                            id : res.candidates[itemPos].location.y + ',' + res.candidates[itemPos].location.x
                        };

                        data.push(item);
                    }

                    view.skipReverseGeocode = true;

                    view.lastResults = data;

                    if(data.length > 0) {
                        view.$('#fromPlace').select2('data', data[0]);
                        view.changeForm();
                    }

                    return {results: data};
                }
            }

        });


        this.selectTo = this.$('#toPlace').select2({
            placeholder: 'End Address',
            minimumInputLength: 4,
            allowClear: true,
            selectOnBlur: true,
            createSearchChoice : function(term) {
                if(view.lastResults.length === 0) {
                    var text = term + ' (not found)';
                    return { id: 'not found', text: text };
                }
            },
            formatResult: function(object, container, query) {
                var item = view.geocodeItem(object);
                return item;
            },
            formatSelection: function(object, container, query) {
                var item = view.selectedGeocodeItem(object);
                return item;
            },
            ajax: {
                url:  url,
                dataType: 'json',
                quietMillis: 10,
                data: function (term, page) {
                    view.lastResults = [];

                    var searchLocation = '-73.7562271,42.6525795';

                    if(view.options.map) {
                      var latlng = view.options.map.getCenter();
                      searchLocation = latlng.lng + ',' + latlng.lat;
                    }

                    return {
                        singleLine: term, // search term
                        outFields: 'City,Region',
                        location: searchLocation,
                        f: 'json'
                    };
                },
                results: function (res, page) {
                    var data = [];
                    for(var itemPos in res.candidates.slice(0, 10)) {

                        var item = {
                            text: res.candidates[itemPos].address.split(',')[0],
                            city : res.candidates[itemPos].attributes.City,
                            state : res.candidates[itemPos].attributes.Region,
                            id : res.candidates[itemPos].location.y + ',' + res.candidates[itemPos].location.x
                        };

                        data.push(item);
                    }

                    view.skipReverseGeocode = true;

                    view.lastResults = data;

                    if(data.length > 0) {
                        view.$('#toPlace').select2('data', data[0]);
                        view.changeForm();
                    }

                    return {results: data};
                }
            }

        });

        view.updatingForm = false;

        this.changeForm();

        this.updateModeControls();
    },

    changeForm: function(evt) {

        // skip duplicate change events caused by selectize form inputs
        if(this.updatingForm)
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
        if(this.$('#fromPlace').select2('val') == 'not found')
            data.fromPlace = false;
        if(this.$('#toPlace').select2('val') == 'not found')
            data.toPlace = false;

        var mode = $('#mode').val();
        if(mode.indexOf('BICYCLE') != -1) {
            data.triangleSafetyFactor = $('#').val();
            data.triangleSlopeFactor = $('#').val();
            data.triangleTimeFactor = $('#').val();
        }
        else {
            this.model.unset('triangleSafetyFactor', {silent: true});
            this.model.unset('triangleSlopeFactor', {silent: true});
            this.model.unset('triangleTimeFactor', {silent: true});
        }

        this.model.set(data);

    },

    updateModeControls : function() {
        var mode = $('#mode').val();

        if(mode.indexOf('WALK') != -1 && mode.indexOf('TRANSIT') != -1) this.$el.find('.maxWalkControl').show();
        else this.$el.find('.maxWalkControl').hide();

        if(mode.indexOf('BICYCLE') != -1 && mode.indexOf('TRANSIT') != -1) this.$el.find('.maxBikeControl').show();
        else this.$el.find('.maxBikeControl').hide();

        if(mode.indexOf('TRANSIT') != -1 && mode.indexOf('BICYCLE') == -1)
            this.$el.find('.optimizeControl').show();
        else
            this.$el.find('.optimizeControl').hide();

        if(mode.indexOf('BICYCLE') != -1) this.$el.find('.bikeTriangleControl').show();
        else this.$el.find('.bikeTriangleControl').hide();
    },

    toggleSettings : function() {

        if($('#hidableSettings').is(':visible')) {
            $('#hidableSettings').slideUp('fast', function(){
                $('#itineraries').height($(window).height() - ($('#request').height() + $('#messageWell').height() + 80));
            });
            $('#showSettings').show();
            $('#hideSettings').hide();
        }
        else {
            $('#hidableSettings').slideDown('fast', function(){
                $('#itineraries').height($(window).height() - ($('#request').height() + $('#messageWell').height() + 80));
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
            url: window.OTP_config.esriApi + 'reverseGeocode?location=' + encodeURIComponent(lonlat) + '&f=pjson',
            type: 'GET',
            dataType : 'jsonp',
            error: function() {
               error();
            },
            success: function(res) {

                var data = {
                            address: res.address.Address,
                            city : res.address.City,
                            state : res.address.Region,
                            latlon : place
                        };

                success(data);
            }
        });
    },

});

module.exports.OtpRequestFormView = OtpRequestFormView;
