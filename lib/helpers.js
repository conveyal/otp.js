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
