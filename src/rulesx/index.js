/**
 * Rules namespace
 *
 * This namespace provides complete rules with specific functionality, as well as utilities to be used in rules.
 * It is not comparable to but uses the namespace rules from openhab-js.
 * The rules provided by this namespace are developed to be created from file-based scripts only!
 * @namespace rulesx
 */

module.exports = {
  ...require('./sceneEngine.js'),
  ...require('./alarmClock.js'),
  ...require('./alerting'),
  AlertManager: require('./alertManager')
};
