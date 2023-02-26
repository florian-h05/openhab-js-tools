/**
 * Things namespace
 *
 * This namespace provides access to external devices and services, which is usually functionalty provided by bindings.
 * State fetching is implemented by scheduling a job, and command handling is provided by rules.
 * @namespace thingsx
 */

module.exports = {
  ...require('./mlsc')
};
