var _ = require('underscore');
var L = require('leaflet');

var OTP = require('otp.js');
OTP.config = OTP_config;


$(document).ready(function() {


	var map = L.map('map').setView(OTP.config.initLatLng, (OTP.config.initZoom || 13));
    map.attributionControl.setPrefix('');
    
	// add an OpenStreetMap tile layer
	var osmLayer = L.tileLayer('http://{s}.tiles.mapbox.com/v3/' + OTP.config.osmMapKey + '/{z}/{x}/{y}.png', {
        subdomains : ['a','b','c','d'],
	    attribution: 'Street Map: <a href="http://mapbox.com/about/maps">Terms & Feedback</a>'
	});
    
    var aerialLayer = L.tileLayer('http://{s}.tiles.mapbox.com/v3/' + OTP.config.aerialMapKey + '/{z}/{x}/{y}.png', {
        subdomains : ['a','b','c','d'],
        attribution : 'Satellite Map: <a href="http://mapbox.com/about/maps">Terms & Feedback</a>'
    });

    var baseLayers = {
        "Street Map" : osmLayer,
        "Satellite Map" : aerialLayer
    };
    L.control.layers(baseLayers).addTo(map);
    osmLayer.addTo(map);

    var stopsRequestModel = new OTP.models.OtpStopsInRectangleRequest();//{}, {urlRoot: OTP.config.otpApi + '/transit/stopsInRectangle' });
    stopsRequestModel.urlRoot = OTP.config.otpApi + '/transit/stopsInRectangle';


    var stopsRequestMapView = new OTP.map_views.OtpStopsRequestMapView({
        model: stopsRequestModel,
        map: map
    });
    var stopsResponseMapView = new OTP.map_views.OtpStopsResponseMapView({
        map: map
    });
    stopsRequestModel.on('success', function(response) {
        stopsResponseMapView.newResponse(response);
    });

    var topoControl = new OTP.topo_views.LeafletTopoGraphControl();
    topoControl.addTo(map);

    var requestModel = new OTP.models.OtpPlanRequest();//{}, {urlRoot: OTP.config.otpApi + '/plan' }); 
    requestModel.urlRoot = OTP.config.otpApi + '/plan';

    var requestView = new OTP.request_views.OtpRequestFormView({
        model: requestModel,
        el: $('#request')
    });

    requestView.render();

    var requestMapView = new OTP.map_views.OtpRequestMapView({
    	model: requestModel,
    	map: map
    });
    requestMapView.render();

    var responseView = new OTP.views.OtpPlanResponseView({
        narrative: $('#narrative'),
        map: map,
        topo: topoControl.getGraphElement()
    });

    requestModel.on('success', function(response) {
        responseView.newResponse(response);
    });

    requestModel.on('failure', function(response) {
        responseView.newResponse(response);
    });

    requestModel.request();

    var resize = function() {
        var height = $(window).height() - 30;
        $('#map').height(height);
        $('#sidebar').height(height);
        map.invalidateSize(); 
    };

    $(window).resize(resize);

    resize.call();
});

