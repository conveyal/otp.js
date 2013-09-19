var _ = require('underscore');
var $ = jQuery = require('jquery-browserify');
var Backbone = require('../lib/backbone');
var Handlebars = require('handlebars');

var requestFormTemplate = Handlebars.compile([
    
        '<div class="row-fluid" style="margin: 5px 0px;">',
            '<select id="fromPlace" class="apiParam" style="width: 100%" placeholder="Start Address"></select>',
        '</div>',
        '<div class="row-fluid" style="margin: 5px 0px;">',
            '<select id="toPlace" class="apiParam" style="width: 100%"  placeholder="End Address"></select>',
        '</div>',
        '<div class="row-fluid">',
            '<select id="arriveBy" class="apiParam span3" placeholder="Arrive"><option value="true">Arrive</option><option value="false" selected>Depart</option></select>',
        
            '<div class="input-append bootstrap-timepicker">',
                '<input id="time" type="text" class="apiParam input-small">',
                '<span class="add-on"><i class="icon-time"></i></span>',
            '</div>',

            '<div class="input-append date" data-date-format="mm/dd/yyyy">',
                '<input id="date" class="apiParam input-small" size="16" type="text"><span class="add-on"><i class="icon-th"></i></span>',
            '</div>',
    
            '<form class="form-horizontal">',
                '<div class="control-group">',
                    '<label class="control-label" for="mode">Travel by: </label>',
                    '<div class="controls">',
                        '<select id="mode" class="apiParam span12" placeholder="Arrive"><option value="TRANSIT,WALK">Transit</option><option value="WALK">Walk only</option><option value="BICYCLE">Bike only</option><option value="TRANSIT,BICYCLE">Transit & Bike</option></select>',
                    '</div>',
                '</div>',

                '<div class="optimizeControl control-group">',
                    '<label class="control-label" for="type">Find: </label>',
                    '<div class="controls">',
                        '<select id="optimize" class="apiParam span12" placeholder="Arrive"><option value="QUICK">Quickest trip</option><option value="TRANSFERS">Fewest transfers</option><option>Custom trip</option></select>',
                    '</div>',
                '</div>',

                '<div class="bikeTriangleControl control-group">',
                    '<div id="bikeTriangle" style="height: 100px; cursor: pointer;">',
                    '</div>',    
                '</div>',

                '<div class="maxWalkControl control-group">',
                    '<label class="control-label" for="maxWalkDist">Maximum walk: </label>',
                    '<div class="controls">',
                        '<select id="maxWalkDistance" class="apiParam span12" placeholder="Arrive"><option value="402">1/4 mile</option><option value="804">1/2 mile</option><option value="1223" selected>3/4 mile</option><option value="1609">1 mile</option><option value="3218">2 miles</option><option value="4828">3 miles</option></select>',
                    '</div>',
                '</div>',

                '<div class="maxBikeControl control-group">',
                    '<label class="control-label" for="maxWalkDist">Maximum bike: </label>',
                    '<div class="controls">',
                        '<select id="maxBikeDistance" class="apiParam span12" placeholder="Arrive"><option value="804">1/2 mile</option><option value="1609">1 mile</option><option value="4026">2.5 miles</option><option value="8047">5 miles</option><option value="16093">10 miles</option></select>',
                    '</div>',
                '</div>',

            '</form>',
        '</div>'
].join('\n'));

var geocodeItem = Handlebars.compile([
    '<div>',
        '<span class="title">{{address}}</span>',
        '<span class="description">{{city}}, {{state}}</span>',
    '</div>'
].join('\n'));


var OtpRequestFormView = Backbone.View.extend({
 
    events: {
        "change .apiParam"      : "changeForm",
        "change #mode"          : "updateModeControls"
    },

    initialize : function() {

        var view = this;

        this.updatingForm = false;

        this.model.on("change", function(data) {
            
            var reverseLookup = false;

            

            if(_.has(data.changed, 'fromPlace') && data.attributes.fromPlace &&  view.selectFrom) {

                var select = view.selectFrom[0].selectize;

                if(reverseLookup) {
                    $.ajax({
                        url: 'http://localhost:9000/r/' + encodeURIComponent(data.attributes.fromPlace),
                        type: 'GET',
                        error: function() {
                            view.updatingForm = true;

                            select.clearOptions();
                            select.addOption({address: "Marker location", latlon: data.attributes.fromPlace, lat: '', lon: '', city: '', state: ''});
                            select.setValue(data.attributes.fromPlace);
                            
                            view.updatingForm = false;                        
                        },
                        success: function(res) {
                                view.updatingForm = true;
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
                    select.addOption({address: "Marker location", latlon: data.attributes.fromPlace, lat: '', lon: '', city: '', state: ''});
                    select.setValue(data.attributes.fromPlace);
                    
                    view.updatingForm = false;

                }
            }

            if(_.has(data.changed, 'toPlace') && data.attributes.toPlace && view.selectTo) {

                var select = view.selectTo[0].selectize;

                if(reverseLookup) {
                    $.ajax({
                        url: 'http://localhost:9000/r/' + encodeURIComponent(data.attributes.toPlace),
                        type: 'GET',
                        error: function() {
                            view.updatingForm = true;

                            select.clearOptions();
                            select.addOption({address: "Marker location", latlon: data.attributes.toPlace, lat: '', lon: '', city: '', state: ''});
                            select.setValue(data.attributes.toPlace);

                            view.updatingForm = false;
                        },
                        success: function(res) {
                                view.updatingForm = true;
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
                    select.addOption({address: "Marker location", latlon: data.attributes.toPlace, lat: '', lon: '', city: '', state: ''});
                    select.setValue(data.attributes.toPlace);

                    view.updatingForm = false;
                }
            }
        });  
    },

    render : function() {

        var view = this;

        var html = requestFormTemplate();

        this.$el.html(html);

        view.updatingForm = true;

        $('#date').datepicker();
        $('#date').datepicker('setValue', new Date());

        $('#time').timepicker();


        this.bikeTriangle = new OTP.bike_views.OtpBikeTrianglePanel({
            model: this.model,
            el: $('#bikeTriangle')
        });


        var loadCallback = function(query, callback, select) {
            if (!query.length) return callback();
            $.ajax({
                url: 'http://localhost:9000/q/' + encodeURIComponent(query) + '/' + encodeURIComponent('Salem, OR'),
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
            fromPlace: $('#fromPlace').val(),
            toPlace: $('#toPlace').val(),
            date: $('#date').val(),
            time: $('#time').val(),
            arriveBy: $('#arriveBy').val(),
            maxWalkDistance: maxDistance,
            //triangleSafetyFactor: $('#').val(),
            //triangleSlopeFactor: $('#').val(),
            //triangleTimeFactor: $('#').val(),
            optimize: $('#optimize').val(),
            mode: $('#mode').val()
        };

        this.model.set(data);

    },

    updateModeControls : function() {
        var mode = $('#mode').val();

        if(mode.indexOf("WALK") != -1 && mode.indexOf("TRANSIT") != -1) this.$el.find(".maxWalkControl").show();
        else this.$el.find(".maxWalkControl").hide();

        if(mode.indexOf("BICYCLE") != -1 && mode.indexOf("TRANSIT") != -1) this.$el.find(".maxBikeControl").show();
        else this.$el.find(".maxBikeControl").hide();

        if(mode.indexOf("TRANSIT") != -1) this.$el.find(".optimizeControl").show();
        else this.$el.find(".optimizeControl").hide();

        if(mode.indexOf("BICYCLE") != -1) this.$el.find(".bikeTriangleControl").show();
        else this.$el.find(".bikeTriangleControl").hide();
    }

});

module.exports.OtpRequestFormView = OtpRequestFormView;
