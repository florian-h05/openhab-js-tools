/**
 * Things namespace
 *
 * This namespace provides access to external devices and services, which is usually functionality provided by bindings.
 * @namespace thingsx
 */

module.exports = {
  ...require('./health'),
  ...require('./mlsc')
};
