/**
 * Rules namespace
 *
 * This namespace provides complete rules with specific functions.
 * It is not comparable to but uses the namespace rules from openhab-js.
 * @namespace rulesx
 */

module.exports = {
  ...require('./sceneEngine.js'),
  ...require('./alarmClock.js'),
  alerting: require('./alerting')
};
