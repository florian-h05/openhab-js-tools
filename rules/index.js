/**
 * Rules namspace.
 * This namespace provides complete rules with specific functions.
 * It is not comparable to rules from the official JS library.
 * @namespace rulesx
 */

module.exports = {
  ...require('./sceneEngine.js'),
  ...require('./alarmClock.js')
};
