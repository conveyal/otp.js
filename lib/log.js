var debug = require('debug')

module.exports = function (namespace) {
  return debug('otp.js:' + namespace)
}
