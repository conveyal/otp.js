var _ = require('underscore');
var $ = require('jquery');
window.jQuery = $;
var Backbone = require('backbone');
Backbone.$ = $;
var moment = require('moment');
var Handlebars = require('handlebars');
var select2 = require('select2');
require('datetimepicker');

var requestFormTemplate = Handlebars.compile([

                '<div class="visibleSettings">',

                    '<div class="row fromPlaceControl">', 
                        '<input class="apiParam col-sm-12" id="fromPlace" placeholder="Start Address"/>',
                    '</div>', 
                    '<div class="row toPlaceControl">', 
                        '<input id="toPlace" class="apiParam col-sm-12" placeholder="End Address"/>', 
                    '</div>', 
                    
                '</div>', 
               
                '<div id="hidableSettings">',

                     '<div class="row arriveByControl">', 
                        '<div class="col-md-12">', 
                            '<select id="arriveBy" class="apiParam form-control" placeholder="Arrive"><option value="true">Arrive at</option><option value="false" selected>Depart by</option></select>', 
                        '</div>', 
                    '</div>', 

                
                    '<div class="row timeControl">', 
                        '<div class="input-group date col-md-12" id="time">', 
                            '<input type="text" class="form-control apiParam" data-format="HH:mm PP"/>', 
                            '<span class="input-group-addon"><span class="glyphicon glyphicon-time"></span></span>', 
                        '</div>', 
                    '</div>', 
                    '<div class="row dateControl">', 
                        '<div class="input-group date col-md-12" id="date">', 
                            '<input type="text" class="form-control apiParam"/>', 
                            '<span class="input-group-addon"><span class="glyphicon glyphicon-time"></span></span>', 
                        '</div>', 
                    '</div>', 
            
                    '<div class="row travelByControl">', 
                        '<div class="col-sm-4">', 
                            '<label for="mode">Travel by: </label>', 
                        '</div>', 
                        
                        '<div class="col-sm-8">', 
                            '<select id="mode" class="apiParam form-control" placeholder="Arrive">', 
                                '<option value="TRANSIT,WALK">Transit</option>', 
                                '<option value="WALK">Walk only</option>', 
                                '<option value="BICYCLE">Bike only</option>', 
                                '<option value="TRANSIT,BICYCLE">Transit & Bike</option>', 
                            '</select>', 
                        '</div>', 
                    '</div>', 

                    '<div class="row optimizeControl">', 
                        '<div class="col-sm-4">', 
                            '<label for="type">Find: </label>', 
                        '</div>', 

                        '<div class="col-sm-8">', 
                            '<select id="optimize" class="apiParam form-control" placeholder="Arrive">', 
                                '<option value="QUICK" selected>Quickest trip</option>', 
                                '<option value="TRANSFERS">Fewest transfers</option>', 
                            '</select>', 
                        '</div>', 
                    '</div>', 

                    '<div class="maxWalkControl row">', 
                        '<div class="col-sm-6">', 
                           '<label for="maxWalkDist">Maximum walk:</label>', 
                        '</div>',
                        '{{#metric}}',
                            '<div class="col-sm-6">', 
                                '<select id="maxWalkDistance" class="apiParam form-control" placeholder="Arrive">', 
                                    '<option value="250">1/4 km</option>', 
                                    '<option value="500">1/2 km</option>', 
                                    '<option value="1000" selected>1 km</option>', 
                                    '<option value="2500">2.5 km</option>', 
                                    '<option value="5000">5 km</option>', 
                                '</select>', 
                            '</div>', 
                        '{{/metric}}',
                        '{{^metric}}',
                            '<div class="col-sm-6">', 
                                '<select id="maxWalkDistance" class="apiParam form-control" placeholder="Arrive">', 
                                    '<option value="402">1/4 mile</option>', 
                                    '<option value="804">1/2 mile</option>', 
                                    '<option value="1223">3/4 mile</option>', 
                                    '<option value="1609" selected>1 mile</option>', 
                                    '<option value="3218">2 miles</option>', 
                                    '<option value="4828">3 miles</option>', 
                                '</select>', 
                            '</div>', 
                        '{{/metric}}',
                    '</div>', 

                    '<div class="maxBikeControl row">', 
                        '<div class="col-sm-6">', 
                            '<label class="control-label" for="maxWalkDist">Maximum bike: </label>', 
                        '</div>', 

                        '{{#metric}}',
                            '<div class="col-sm-6">', 
                                '<select id="maxBikeDistance" class="apiParam form-control" placeholder="Arrive">', 
                                    '<option value="1000">1 km</option>', 
                                    '<option value="2500">2.5 km</option>', 
                                    '<option value="5000" selected>5 km</option>', 
                                    '<option value="10000">10 km</option>', 
                                    '<option value="15000">15 km</option>', 
                                '</select>', 
                            '</div>', 
                        '{{/metric}}',
                        '{{^metric}}',
                            '<div class="col-sm-6">', 
                                '<select id="maxBikeDistance" class="apiParam form-control" placeholder="Arrive">', 
                                    '<option value="804">1/2 mile</option>', 
                                    '<option value="1609">1 mile</option>', 
                                    '<option value="4026" selected>2.5 miles</option>', 
                                    '<option value="8047">5 miles</option>', 
                                    '<option value="16093">10 miles</option>', 
                                '</select>', 
                            '</div>', 
                        '{{/metric}}',

                    '</div>',   
                        
                    '<div class="row bikeTriangleControl">',   
                        '<div class=" col-md-offset-2 col-lg-offset-4">', 
                            '<div id="bikeTriangle" style="height: 110px; cursor: pointer;"></div>',    
                        '</div>', 
                    '</div>', 
                '</div>',

                '<div class="row" id="hideSettings">', 
                    '<div class="col-sm-12">', 
                        '<button class="btn toggleSettings btn-default col-sm-12">Hide Settings <span class="glyphicon glyphicon-chevron-up"></span></button>',
                    '</div>',
                '</div>',

                '<div class="row" id="showSettings">', 
                    '<div class="col-sm-12">', 
                        '<button class="btn toggleSettings btn-default col-sm-12">Show Settings <span class="glyphicon glyphicon-chevron-down"></span></button>',
                    '</div>',
                '</div>'

     
        
].join('\n'));


var OtpRequestFormView = Backbone.View.extend({
 
    events: {
        "change .apiParam"      : "changeForm",
        "change #mode"          : "updateModeControls",
        "click .toggleSettings" : "toggleSettings"
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


        this.model.on("change", function(data) {
            
            var reverseLookup = OTP.config.reverseGeocode;

            if(_.has(data.changed, 'fromPlace') && data.attributes.fromPlace &&  view.selectFrom) {

                var select = view.selectFrom;
                view.updateReverseGeocoder('From',  data.attributes.fromPlace, select);

            }

            if(_.has(data.changed, 'toPlace') && data.attributes.toPlace && view.selectTo) {

                var select = view.selectTo;
                 view.updateReverseGeocoder('To',  data.attributes.toPlace, select);
                
            }

            if(_.has(data.changed, 'toPlace') && data.attributes.toPlace && view.selectTo) {

                var select = view.selectTo;
                 view.updateReverseGeocoder('To',  data.attributes.toPlace, select);
                
            }

            view.$('#arriveBy').val(data.attributes.arriveBy);
            view.$('#mode').val(data.attributes.mode);
            view.$('#maxWalkDistance').val(data.attributes.maxWalkDistance);
            view.$('#optimize').val(data.attributes.optimize);

            var date = moment(data.attributes.date, "MM-DD-YYYY").toDate();
            view.datepicker.setLocalDate(date);

            var time = moment(data.attributes.time, "hh:mm aa").toDate();
            view.timepicker.setLocalDate(time);

            view.updateModeControls();
           
        });  
    },

    updateReverseGeocoder: function (field, latlon, select) {

        if(this.skipReverseGeocode) {
            this.skipReverseGeocode = false;
            return;
        }
            

        var reverseLookup = OTP.config.reverseGeocode;

        var view = this;


        if(reverseLookup) {
   
            error = function() {
                view.updatingForm = true;

                select.select2("data", []);
                
                view.updatingForm = false;    

            };

            success = function(response) {
                view.updatingForm = true;
                select.select2(data, null);
                response.text =  field + ' ' + response.address;
                select.select2("data", response);
                view.updatingForm = false;
            
            };

            reverse(latlon, error, success)
        }
        else {

            // this isn't great but appears to be neccesary as selectize triggers a change event even when programatically updated
            view.updatingForm = true;

            var item = {
                            text: field + " marker location",
                            id : latlon
            };

            select.select2("data", item);
            
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

        this.datepicker = this.$('#date').data('datetimepicker');
        this.datepicker.setLocalDate(new Date());
        this.$('#date').on('changeDate', this.changeForm);

        this.$('#time').datetimepicker({
            pick12HourFormat: true,
            pickSeconds: false,
            pickDate: false
        });

        this.timepicker = this.$('#time').data('datetimepicker');
        this.timepicker.setLocalDate(new Date());
        this.$('#time').on('changeDate', this.changeForm);

        this.bikeTriangle = new OTP.bike_views.OtpBikeTrianglePanel({
            model: this.model,
            el: this.$('#bikeTriangle')
        });

        var url = OTP.config.esriApi + 'find';

        this.selectFrom = this.$('#fromPlace').select2({
            placeholder: "Start Address",
            minimumInputLength: 4,
            allowClear: true,
            selectOnBlur: true,
            createSearchChoice : function(term) {
                if(view.lastResults.length == 0) {
                    var text = term + " (not found)";
                    return { id: "not found", text: text };
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

                    return {
                        text: term, // search term
                        outFields: "City,Region",
                        bbox: "-123.1093389,44.9785603,-122.9184514,44.8745235",
                        f: "json"
                    };
                },
                results: function (res, page) { 
                    var data = new Array();
                    for(var itemPos in res.locations.slice(0, 10)) {

                        item = {
                            text: res.locations[itemPos].name.split(",")[0],
                            city : res.locations[itemPos].feature.attributes.City,
                            state : res.locations[itemPos].feature.attributes.Region,
                            id : res.locations[itemPos].feature.geometry.y + ',' + res.locations[itemPos].feature.geometry.x
                        }
                        
                        data.push(item);
                    }

                    view.skipReverseGeocode = true;

                    view.lastResults = data;

                    if(data.length > 0) {
                        view.$("#fromPlace").select2("data", data[0]);
                        view.changeForm();
                    }

                    return {results: data};
                }
            }

        });


        this.selectTo = this.$('#toPlace').select2({
            placeholder: "End Address",
            minimumInputLength: 4,
            allowClear: true,
            selectOnBlur: true,
            createSearchChoice : function(term) {
                if(view.lastResults.length == 0) {
                    var text = term + " (not found)";
                    return { id: "not found", text: text };
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

                    return {
                        text: term, // search term
                        outFields: "City,Region",
                        bbox: "-123.1093389,44.9785603,-122.9184514,44.8745235",
                        f: "json"
                    };
                },
                results: function (res, page) { 
                    var data = new Array();
                    for(var itemPos in res.locations.slice(0, 10)) {

                        item = {
                            text: res.locations[itemPos].name.split(",")[0],
                            city : res.locations[itemPos].feature.attributes.City,
                            state : res.locations[itemPos].feature.attributes.Region,
                            id : res.locations[itemPos].feature.geometry.y + ',' + res.locations[itemPos].feature.geometry.x
                        }
                        
                        data.push(item);
                    }

                    view.skipReverseGeocode = true;

                    view.lastResults = data;
                    
                    if(data.length > 0) {
                        view.$("#toPlace").select2("data", data[0]);
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

        var maxDistance = $('#mode').val().indexOf("WALK") != -1 ?
            $('#maxWalkDistance').val() : $('#maxBikeDistance').val()

        var data = {
            fromPlace: this.$('#fromPlace').select2("val"),
            toPlace: this.$('#toPlace').select2("val"),
            date: this.$('#date input').val(),
            time: this.$('#time input').val(),
            arriveBy: this.$('#arriveBy').val(),
            maxWalkDistance: maxDistance,
            optimize: this.$('#optimize').val(),
            mode: this.$('#mode').val()
        };

        // skip if either to/from fields are unset
        if(this.$('#fromPlace').select2("val") == "not found")
            data.fromPlace = false;
        if(this.$('#toPlace').select2("val") == "not found") 
            data.toPlace = false;

        var mode = $('#mode').val();
        if(mode.indexOf("BICYCLE") != -1) { 
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

        if(mode.indexOf("WALK") != -1 && mode.indexOf("TRANSIT") != -1) this.$el.find(".maxWalkControl").show();
        else this.$el.find(".maxWalkControl").hide();

        if(mode.indexOf("BICYCLE") != -1 && mode.indexOf("TRANSIT") != -1) this.$el.find(".maxBikeControl").show();
        else this.$el.find(".maxBikeControl").hide();

        if(mode.indexOf("TRANSIT") != -1 && mode.indexOf("BICYCLE") == -1) 
            this.$el.find(".optimizeControl").show();
        else 
            this.$el.find(".optimizeControl").hide();

        if(mode.indexOf("BICYCLE") != -1) this.$el.find(".bikeTriangleControl").show();
        else this.$el.find(".bikeTriangleControl").hide();
    },

    toggleSettings : function() {

        if($('#hidableSettings').is(":visible")) {
            $('#hidableSettings').slideUp("fast", function(){
                $('#itineraries').height($(window).height() - ($('#request').height() + $('#messageWell').height() + 80));
            });
            $('#showSettings').show();
            $('#hideSettings').hide();
        }
        else {
            $('#hidableSettings').slideDown("fast", function(){
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
            url: OTP.config.esriApi + 'reverseGeocode?location=' + encodeURIComponent(lonlat) + '&f=pjson',
            type: 'GET',
            dataType : "jsonp",
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
