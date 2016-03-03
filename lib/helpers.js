var Handlebars = require('handlebars')

var utils = require('./utils')

Handlebars.registerHelper('formatTime', function (time, offset, options) {
  if (time) {
    return utils.formatTime(time, options.hash.format, offset)
  } else {
    return ''
  }
})

Handlebars.registerHelper('formatDuration', function (duration) {
  if (duration) {
    return utils.secToHrMin(duration)
  } else {
    return ''
  }
})

// can this be handled by i18n framework?
Handlebars.registerHelper('ordinal', function (n) {
  if (n > 10 && n < 14) return n + 'th'
  switch (n % 10) {
    case 1:
      return n + 'st'
    case 2:
      return n + 'nd'
    case 3:
      return n + 'rd'
  }
  return n + 'th'
})

Handlebars.registerHelper('modeString', function (mode) {
  switch(mode) {
    case 'TRANSIT':
    case 'TRANSIT,WALK':
      return 'Transit'
    case 'TRAINISH':
    case 'TRAINISH,WALK':
      return 'Train only'
    case 'BUS':
    case 'BUS,WALK':
      return 'Bus only'
    case 'BICYCLE':
      return 'Bicycle only'
    case 'WALK':
      return 'Walk only'
    case 'CAR':
      return 'Drive only'
    case 'TRANSIT,BICYCLE':
      return 'Bike to Transit'
    case 'TRANSIT,CAR_PARK':
      return 'Drive to Transit'
  }
  return mode
})

Handlebars.registerHelper('fareString', function (fare) {
  if(fare && fare.regular) {
    var cents = parseInt(fare.regular.cents)
    if(cents === 0) return ''
    var f = cents / Math.pow(10, fare.regular.currency.defaultFractionDigits)
    return fare.regular.currency.symbol + f.toFixed(fare.regular.currency.defaultFractionDigits)
  }
  return ''
})
