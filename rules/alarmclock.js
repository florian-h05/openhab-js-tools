/*
Only works with the JS Scripting Add-On/GraalJS.
Dependents on: the official openHAB JS library 'openhab', which is pre-installed in the JS Scripting Add-On.

Copyright (c) 2021 Florian Hotze under MIT License
*/

const { items, rules, triggers } = require('openhab');
const logger = require('openhab').log('alarmclock');
const cronTime = require('cron-time-generator');

/**
 * Alarm clock.
 * Create an alarm clock rule with cron trigger based on settings Items.
 * Provides a JSRule from package 'openhab'.
 * @memberOf rules
 */
class AlarmClock {
  /**
   * Constructor to create an instance. Do not call directly, instead call {@link getSceneEngine}.
   * @param {String} switchItem Item to switch the alarm on/off
   * @param {Number} hour hour of alarm
   * @param {Number} minute minute of alarm
   * @param {String} alarmFunc function to execute when the rule runs.
   * @param {Boolean} monday
   * @param {Boolean} tuesday
   * @param {Boolean} wednesday
   * @param {Boolean} thursday
   * @param {Boolean} friday
   * @param {Boolean} saturday
   * @param {Boolean} sunday
   * @hideconstructor
   */
  constructor (switchItem, hour, minute, alarmFunc, monday, tuesday, thursday, wednesday, friday, saturday, sunday) {
    if (typeof sceneDefinition === 'undefined') {
      logger.error('Supplied scenes are undefined');
    }
    this.switchItem = switchItem;
    this.alarmFunc = alarmFunc;
    let days = [];
    if (monday === true) days.push('monday');
    if (tuesday === true) days.push('tuesday');
    if (wednesday === true) days.push('wednesday');
    if (thursday === true) days.push('thursday');
    if (friday === true) days.push('friday');
    if (saturday === true) days.push('saturday');
    if (sunday === true) days.push('sunday');
    this.cronExp = cronTime.onSpecificDaysAt(days, parseInt(hour), parseInt(minute));
    this.vRuleItem = 'vRuleItemForAlarm_Clock_' + this.switchItem;
    logger.info('Cron expression [{}] generated.', this.cronExp);
  }

  /**
   * Provides the alarm clock.
   * @private
   * @type {HostRule}
   */
  get clockRule () {
    return rules.SwitchableJSRule({
      name: 'Alarm Clock ' + this.switchItem,
      description: 'Switchable rule to run the alarm clock.',
      triggers: [triggers.GenericCronTrigger(this.cronExp)],
      execute: this.alarmFunc
    });
  }

  /**
   * Provides a rule to link the switch of {@link clockRule} with the switchItem.
   * @private
   * @type {HostRule}
   */
  get linkRule () {
    return rules.JSRule({
      name: 'Alarm Clock Switch Link for ' + this.switchItem,
      description: 'Rule to switch the main alarm clock rule.',
      triggers: [triggers.ItemCommandTrigger(this.switchItem)],
      execute: data => {
        items.getItem(this.vRuleItem).sendCommand(items.getItem(this.switchItem).state);
      }
    });
  }
}

/**
 * Creates an instance of {@link rules.AlarmClock} and builds the rule
 * @memberOf rules
 * @param {String} switchItem Item to switch the alarm on/off
 * @param {Number} hour hour of alarm
 * @param {Number} minute minute of alarm
 * @param {String} alarmFunc function to execute when the rule runs.
 * @param {Boolean} monday
 * @param {Boolean} tuesday
 * @param {Boolean} wednesday
 * @param {Boolean} thursday
 * @param {Boolean} friday
 * @param {Boolean} saturday
 * @param {Boolean} sunday
 * @returns {HostRule} JSRule from openhab-js
 */
const getAlarmClock = (switchItem, hour, minute, alarmFunc, monday, tuesday, thursday, wednesday, friday, saturday, sunday) => {
  const clock = new AlarmClock(switchItem, hour, minute, alarmFunc, monday, tuesday, thursday, wednesday, friday, saturday, sunday);
  return [clock.clockRule, clock.linkRule];
};

module.exports = {
  getAlarmClock
};
