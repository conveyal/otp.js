
var OTP = require('otpjs');

$(document).ready(function() {

  // set up the leafet map object
  var map = L.map('map').setView(window.OTP_config.initLatLng, (window.OTP_config
    .initZoom || 13));
  map.attributionControl.setPrefix('');

  // create OpenStreetMap tile layers for streets and aerial imagery
  var osmLayer = L.tileLayer('http://{s}.tiles.mapbox.com/v3/' + window.OTP_config
    .osmMapKey + '/{z}/{x}/{y}.png', {
      subdomains: ['a', 'b', 'c', 'd'],
      attribution: 'Street Map <a href="http://mapbox.com/about/maps">Terms & Feedback</a>'
    });
  var aerialLayer = L.tileLayer('http://{s}.tiles.mapbox.com/v3/' + window.OTP_config
    .aerialMapKey + '/{z}/{x}/{y}.png', {
      subdomains: ['a', 'b', 'c', 'd'],
      attribution: 'Satellite Map <a href="http://mapbox.com/about/maps">Terms & Feedback</a>'
    });

  // create a leaflet layer control and add it to the map
  var baseLayers = {
    'Street Map': osmLayer,
    'Satellite Map': aerialLayer
  };
  L.control.layers(baseLayers).addTo(map);

  // display the OSM street layer by default
  osmLayer.addTo(map);


  // disabling topo control
  // create the trip topography widget and add it to the map
  //var topoControl = new OTP.topo_views.LeafletTopoGraphControl();
  //topoControl.addTo(map);

  // create a data model for the currently visible stops, and point it
  // to the corresponding API method
  var stopsRequestModel = new OTP.models.StopsInRectangleRequest();
  stopsRequestModel.urlRoot = window.OTP_config.otpApi + 'default/transit/stopsInRectangle';

  // create the stops request view, which monitors the map and updates the
  // bounds of the visible stops request as the viewable area changes
  var stopsRequestMapView = new OTP.map_views.StopsRequestMapView({
    model: stopsRequestModel,
    map: map
  });

  // create the stops response view, which refreshes the stop markers on the
  // map whenever the underlying visible stops model changes
  var stopsResponseMapView = new OTP.map_views.StopsResponseMapView({
    map: map
  });
  stopsRequestModel.on('success', function(response) {
    stopsResponseMapView.newResponse(response);
  });

  // create the main OTP trip plan request model and point it to the API
  var requestModel = new OTP.models.PlanRequest();
  requestModel.urlRoot = window.OTP_config.otpApi + 'default/plan';

  // create and render the main request view, which displays the trip
  // preference form
  var requestView = new OTP.RequestView({
    model: requestModel,
    map: map,
    el: $('#request')
  });
  requestView.render();

  // create and render the request map view, which handles the map-specific
  // trip request elements( e.g. the start and end markers)
  var requestMapView = new OTP.map_views.RequestMapView({
    model: requestModel,
    map: map
  });
  requestMapView.render();

  // create the main response view, which refreshes the trip narrative display
  // and map elements as the underlying OTP response changes
  var responseView = new OTP.PlanResponseView({
    narrative: $('#narrative'),
    map: map,
    //topo: topoControl.getGraphElement()
  });

  // instruct the response view to listen to relevant request model events
  requestModel.on('success', function(response) {
    responseView.newResponse(response);
  });
  requestModel.on('failure', function(response) {
    responseView.newResponse(false);
  });

  requestModel.request();

  var Router = Backbone.Router.extend({
    routes: {
      'start/:lat/:lon/:zoom': 'start',
      'start/:lat/:lon/:zoom/:routerId': 'startWithRouterId',
      'plan(?*querystring)': 'plan'
    },
    start: function(lat, lon, zoom) {
      map.setView(L.latLng(lat, lon), zoom);
    },
    startWithRouterId: function(lat, lon, zoom, routerId) {
      window.OTP_config.routerId = routerId;

      requestModel.urlRoot = window.OTP_config.otpApi + routerId + '/plan';
      map.setView(L.latLng(lat, lon), zoom);
    },
    plan: function(querystring) {
      requestModel.fromQueryString(querystring);
    }
  });

  var router = new Router();
  Backbone.history.start();

  requestModel.on('change', function() {
    router.navigate('plan' + requestModel.toQueryString());
  });

  // make the UI responsive to resizing of the containing window
  var resize = function() {
    var height = $(window).height();
    $('#map').height(height);
    $('#sidebar').height(height);
    map.invalidateSize();
  };
  $(window).resize(resize);
  resize.call();
});
