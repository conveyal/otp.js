var Handlebars = require('handlebars');

var log = require('./log')('narrative-views');
var utils = require('./utils');

var narrativeNewTemplate = Handlebars.compile(require('./narrative-new.html'));
var narrativeAdjustTemplate = Handlebars.compile(require('./narrative-adjust.html'));
var narrativeErrorTemplate = Handlebars.compile(require('./narrative-error.html'));
var itinNarrativeTemplate = Handlebars.compile(require('./narrative-itinerary.html'));
var accessLegTemplate = Handlebars.compile(require('./access-leg.html'));
var transitLegTemplate = Handlebars.compile(require('./transit-leg.html'));
var genericLegTemplate = Handlebars.compile(require('./generic-leg.html'));

var PlanResponseNarrativeView = module.exports.PlanResponseNarrativeView = Backbone.View.extend({
  initialize: function(options) {
    this.options = options || {};
  },

  render: function() {
    log('rendering model: %s, error: %s', !!this.model, !!this.error);

    if (this.error) {
      return this.$el.html(narrativeErrorTemplate({
        message: this.error
      }));
    }

    if (this.model) {
      if (!this.error) this.$el.html(narrativeAdjustTemplate());

      var itins = this.model.get('itineraries');
      _.each(itins.models, this.processItinerary, this);
    } else
      this.$el.html(narrativeNewTemplate());
  },

  processItinerary: function(itin, index) {
    var itinView = new OtpItineraryNarrativeView({
      model: itin,
      planView: this,
      index: index
    });

    itinView.render();
    this.$el.find('.itineraries').append(itinView.el);
  }
});

var OtpItineraryNarrativeView = Backbone.View.extend({
  className: 'PlanResponseNarrativeView',

  events: {
    'click .otp-itinHeader': 'headerClicked',
    'mouseenter .otp-itinHeader': 'headerMouseenter',
    'mouseleave .otp-itinHeader': 'headerMouseleave',
    'click .print': 'print'
  },

  initialize: function(options) {
    this.options = options || {};

    _.bindAll(this, 'headerClicked', 'headerMouseenter', 'headerMouseleave');

    this.listenTo(this.model, 'activate', this.expand);
    this.listenTo(this.model, 'deactivate', this.collapse);
  },

  print: function(e) {
    e.preventDefault();
    if (!this.isActive) this.model.trigger('activate');
    if (this.legs) this.legs.forEach(function(leg) { leg.print(); });

    setTimeout(function() {
      window.print();
    }, 500);
  },

  render: function() {
    var legs = this.model.get('legs');
    var timeOffset = this.options.planView.model.getTimeOffset();
    var duration = this.options.planView.options.showFullDuration ?
      this.model.getFullDuration(this.options.planView.model.get('request'),
        timeOffset) :
      this.model.get('duration');

    var context = _.clone(this.model.attributes);
    context.index = this.options.index + 1;
    context.legs = legs.models;
    context.duration = duration;
    context.timeOffset = timeOffset;
    this.$el.html(itinNarrativeTemplate(context));

    this.legs = [];
    _.each(legs.models, this.processLeg, this);

    this.$el.find('.otp-itinBody').hide();
  },

  processLeg: function(leg) {
    var legView = new OtpLegNarrativeView({
      itinView: this,
      model: leg,
    });
    legView.render();
    this.legs.push(legView);
    this.$el.find('.otp-itinBody').append(legView.el);
  },

  collapse: function() {
    this.$el.find('.otp-itinBody').slideUp('fast');
    this.$el.removeClass('activated');
  },

  expand: function() {
    this.$el.find('.otp-itinBody').slideDown('fast');
    this.$el.addClass('activated');
  },

  headerClicked: function(e) {
    if (!this.isActive()) {
      this.model.trigger('activate');
    }
  },

  headerMouseenter: function(e) {
    if (!this.isActive()) {
      this.model.trigger('mouseenter');
    }
  },

  headerMouseleave: function(e) {
    if (!this.isActive()) {
      this.model.trigger('mouseleave');
    }
  },

  isActive: function() {
    return this.options.planView.model.get('itineraries').activeItinerary ===
      this.model;
  }

});

module.exports.OtpItineraryNarrativeView = OtpItineraryNarrativeView;

Handlebars.registerHelper('formatTime', function(time, offset, options) {
  if (time)
    return utils.formatTime(time, options.hash.format, offset);
  else
    return '';
});

Handlebars.registerHelper('formatDuration', function(duration) {
  if (duration)
    return utils.secToHrMin(duration);
  else
    return '';
});

var OtpLegNarrativeView = Backbone.View.extend({

  events: {
    'click .otp-legHeader': 'headerClicked',
    'mouseenter .otp-legHeader': 'headerMouseenter',
    'mouseleave .otp-legHeader': 'headerMouseleave',
    'click .otp-from': 'fromClicked',
    'click .otp-to': 'toClicked',
    'click .showTimes': 'showTimes'
  },

  initialize: function(options) {
    this.options = options || {};
  },

  render: function() {
    if (this.model.isWalk() || this.model.isBicycle() || this.model.isCar()) {
      this.$el.html(accessLegTemplate(this.model.attributes));

      this.steps = [];
      _.each(this.model.get('steps').models, this.processStep, this);
    } else if (this.model.isTransit()) {
      var context = _.clone(this.model.attributes);
      context.timeOffset = this.options.itinView.options.planView.model.getTimeOffset();
      context.agencyLogoUrl = window.OTP_config.brandingUrl + encodeURIComponent(context.agencyId) + '/logo.png';
      this.$el.html(transitLegTemplate(context));
    } else {
      this.$el.html(genericLegTemplate(this.model.attributes));
    }

    if (!this.model.isTransit()) this.$el.find('.otp-legBody').hide();
  },

  print: function() {
    this.$el.find('.otp-legBody').slideDown();
    if (this.steps) this.steps.forEach(function(step) { step.print(); });
  },

  processStep: function(step, index) {
    var stepView = new OtpStepNarrativeView({
      legView: this,
      model: step,
      index: index,
    });
    stepView.render();
    this.steps.push(stepView);
    this.$el.find('.otp-legBody').append(stepView.el);
  },

  headerClicked: function(e) {
    var body = this.$el.find('.otp-legBody');
    if (body.is(':visible')) body.slideUp('fast');
    else body.slideDown('fast');
  },

  headerMouseenter: function(e) {
    this.model.trigger('mouseenter');
  },

  headerMouseleave: function(e) {
    this.model.trigger('mouseleave');
  },

  fromClicked: function(e) {
    this.model.trigger('fromclick');
  },

  toClicked: function(e) {
    this.model.trigger('toclick');
  },

  showTimes: function(e) {
    e.preventDefault();
    this.model.getSurroundingStopTimes(function(err, times) {
      console.log(err, times);
      this.$('.OTPLeg-times').html('7:00pm<br>8:00pm<br>11:55pm');
    });
  }
});
module.exports.OtpLegNarrativeView = OtpLegNarrativeView;

/** Step (Walk/Bike/Drive) Template & View **/

// can this be handled by i18n framework?
Handlebars.registerHelper('ordinal', function(n) {
  if (n > 10 && n < 14) return n + 'th';
  switch (n % 10) {
    case 1:
      return n + 'st';
    case 2:
      return n + 'nd';
    case 3:
      return n + 'rd';
  }
  return n + 'th';
});

var stepTemplate = Handlebars.compile(require('./step.html'));

var OtpStepNarrativeView = Backbone.View.extend({

  events: {
    'click .otp-legStep-row': 'rowClicked',
    'mouseenter .otp-legStep-row': 'rowMouseenter',
    'mouseleave .otp-legStep-row': 'rowMouseleave',
  },

  initialize: function(options) {
    this.options = options || {};
  },

  print: function() {
    // this.rowClicked();
  },

  render: function() {
    var context = _.clone(this.model.attributes);
    var relDir = this.model.get('relativeDirection');

    // set a flag if this is the first step of the leg
    context.isFirst = (this.options.index === 0);

    // handle the special case of roundabout / traffic circle steps
    if (relDir === 'CIRCLE_COUNTERCLOCKWISE' || relDir ===
      'CIRCLE_CLOCKWISE') {
      context.isRoundabout = true;
      context.roundaboutDirection = (relDir === 'CIRCLE_CLOCKWISE') ?
        'clockwise' : 'counterclockwise'; // TODO: i18n
    }

    // format the leg distance
    var metric = this.options.legView.options.itinView.options.planView.options
      .metric;
    var distStr = utils.distanceString(this.model.get('distance'), metric);
    context.distanceValue = distStr.split(' ')[0];
    context.distanceUnit = distStr.split(' ')[1];

    this.$el.html(stepTemplate(context));
  },

  rowClicked: function(e) {
    this.model.trigger('click');
  },

  rowMouseenter: function(e) {
    this.model.trigger('mouseenter');
  },

  rowMouseleave: function(e) {
    this.model.trigger('mouseleave');
  },

});
module.exports.OtpStepNarrativeView = OtpStepNarrativeView;