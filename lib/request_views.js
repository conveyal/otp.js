var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;
var Handlebars = require('handlebars');
require('selectize');
require('datetimepicker');

var requestFormTemplate = Handlebars.compile([

                '<div class="visibleSettings">',

                    '<div class="row fromPlaceControl">', 
                        '<select id="fromPlace" class="apiParam col-md-12" placeholder="Start Address"></select>', 
                    '</div>', 
                    '<div class="row toPlaceControl">', 
                        '<select id="toPlace" class="apiParam col-md-12" placeholder="End Address"></select>', 
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

var geocodeItem = Handlebars.compile([
    '<div>',
        '<span class="title">{{address}}</span>',
        '{{#if city}}<span class="description">{{city}}, {{state}}</span>{{/if}}',
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

        this.model.on("change", function(data) {
            
            var reverseLookup = OTP.config.reverseGeocode;

            if(_.has(data.changed, 'fromPlace') && data.attributes.fromPlace &&  view.selectFrom) {

                var select = view.selectFrom[0].selectize;

                if(reverseLookup) {
                    $.ajax({
                        url: OTP.config.simplecoderApi + '/r/' + encodeURIComponent(data.attributes.fromPlace),
                        type: 'GET',
                        error: function() {
                            view.updatingForm = true;

                            select.clearOptions();
                            select.addOption({address: "From marker location", latlon: data.attributes.fromPlace, lat: '', lon: '', city: '', state: ''});
                            select.setValue(data.attributes.fromPlace);
                            
                            view.updatingForm = false;                        
                        },
                        success: function(res) {
                                view.updatingForm = true;
                                res.address = 'From ' + res.address;
                                res.latlon = res.lat + ',' + res.lon;
                                select.clearOptions();
                                select.addOption(res);
                                select.setValue(res.latlon);
                                view.updatingForm = false;
                        }
                    });
                }
                else {

                    // this isn't great but appears to be neccesary as selectize triggers a change event even when programatically updated
                    view.updatingForm = true;

                    select.clearOptions();
                    select.addOption({address: "From marker location", latlon: data.attributes.fromPlace, lat: '', lon: '', city: '', state: ''});
                    select.setValue(data.attributes.fromPlace);
                    
                    view.updatingForm = false;

                }
            }

            if(_.has(data.changed, 'toPlace') && data.attributes.toPlace && view.selectTo) {

                var select = view.selectTo[0].selectize;

                if(reverseLookup) {
                    $.ajax({
                        url: OTP.config.simplecoderApi + '/r/' + encodeURIComponent(data.attributes.toPlace),
                        type: 'GET',
                        error: function() {
                            view.updatingForm = true;

                            select.clearOptions();
                            select.addOption({address: "To marker location", latlon: data.attributes.toPlace, lat: '', lon: '', city: '', state: ''});
                            select.setValue(data.attributes.toPlace);

                            view.updatingForm = false;
                        },
                        success: function(res) {
                                view.updatingForm = true;
                                res.address = 'To ' + res.address;
                                res.latlon = res.lat + ',' + res.lon;
                                select.clearOptions();
                                select.addOption(res);
                                select.setValue(res.latlon);
                                view.updatingForm = false;
                        }
                    });
                }
                else {
                    
                    view.updatingForm = true;

                    select.clearOptions();
                    select.addOption({address: "To marker location", latlon: data.attributes.toPlace, lat: '', lon: '', city: '', state: ''});
                    select.setValue(data.attributes.toPlace);

                    view.updatingForm = false;
                }
            }
        });  
    },

    render : function() {

        var view = this;

        var html = requestFormTemplate({
            metric: this.options.metric || false
        });

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

        var loadCallback = function(query, callback, select) {
            if (!query.length) return callback();
            $.ajax({
                url: OTP.config.simplecoderApi + '/q/' + encodeURIComponent(query) + '/' + encodeURIComponent('Salem, OR'),
                type: 'GET',

                error: function() {
                    callback();
                },
                success: function(res) {
                        select.clearOptions();
                        var data = new Array();
                        for(var item in res.slice(0, 10)) {
                            res[item].latlon = res[item].lat + ',' + res[item].lon;
                            data.push(res[item]);
                        }

                        callback(data);
                }
            });
        }

        this.selectFrom = $('#fromPlace').selectize({
            valueField: 'latlon',
            labelField: 'address',
            searchField: 'address',
            plugins: ['remove_button'],
            loadThrottle: 1000,
            create: false,
            render: { option: function(item, escape) {
                    return geocodeItem(item);
                }
            },
            load: function(query, callback) {
                loadCallback(query, callback, view.selectFrom[0].selectize);
            }
        });

        this.selectTo = $('#toPlace').selectize({
            valueField: 'latlon',
            labelField: 'address',
            searchField: 'address',
            plugins: ['remove_button'],
            loadThrottle: 1000,
            create: false,
            render: { option: function(item, escape) {
                    return geocodeItem(item);
                }
            },
            load: function(query, callback) {
                loadCallback(query, callback, view.selectTo[0].selectize);
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
            fromPlace: this.$('#fromPlace').val(),
            toPlace: this.$('#toPlace').val(),
            date: this.$('#date input').val(),
            time: this.$('#time input').val(),
            arriveBy: this.$('#arriveBy').val(),
            maxWalkDistance: maxDistance,
            optimize: this.$('#optimize').val(),
            mode: this.$('#mode').val()
        };

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


            
    }

});

module.exports.OtpRequestFormView = OtpRequestFormView;
