/*
Only works with the JS Scripting Add-On/GraalJS.
Dependents on: the official openHAB JS library 'openhab', which is pre-installed in the JS Scripting Add-On.

Copyright (c) 2021 Florian Hotze under MIT License
*/

const { items, rules, triggers } = require('openhab');
const logger = require('openhab').log('alarmclock');

/**
 * Alarm clock.
 * Create an alarm clock rule with cron trigger based on settings Items.
 * Provides a JSRule from package 'openhab'.
 * @memberOf rules
 */
class AlarmClock {
  /**
   * Constructor to create an instance. Do not call directly, instead call {@link getSceneEngine}.
   * Generates name of configuration Items from the switchItem. Therefore naming must follow scheme.
   * @param {String} switchItem Item to switch the alarm on/off
   * @param {String} alarmFunc function to execute when the rule runs.
   */
  constructor (switchItem, alarmFunc) {
    this.switchItem = switchItem;
    this.alarmFunc = alarmFunc;
    // Get Items' states for time configuration.
    const hour = parseInt(items.getItem(switchItem + '_H').state);
    const minute = parseInt(items.getItem(switchItem + '_M').state);
    // Generate Array for days of week.
    let days = [];
    if (items.getItem(switchItem + '_SUN').state === 'ON') days.push('SUN');
    if (items.getItem(switchItem + '_MON').state === 'ON') days.push('MON');
    if (items.getItem(switchItem + '_TUE').state === 'ON') days.push('TUE');
    if (items.getItem(switchItem + '_WED').state === 'ON') days.push('WED');
    if (items.getItem(switchItem + '_THU').state === 'ON') days.push('THU');
    if (items.getItem(switchItem + '_FRI').state === 'ON') days.push('FRI');
    if (items.getItem(switchItem + '_SAT').state === 'ON') days.push('SAT');
    if (days.length === 0) { items.getItem(switchItem).sendCommand('OFF'); }
    this.quartz = '0 ' + parseInt(minute) + ' ' + parseInt(hour) + ' ? * ' + days.join(',') + ' *';
    logger.info('Cron expression [{}] generated.', this.quartz);
    this.vRuleItem = 'vRuleItemForAlarm_Clock_' + this.switchItem;
  }

  /**
   * Provides the clock itself.
   * @private
   * @type {HostRule}
   */
  get clockRule () {
    return rules.SwitchableJSRule({
      name: 'Alarm Clock ' + this.switchItem,
      description: 'Switchable rule to run the alarm clock.',
      triggers: [triggers.GenericCronTrigger(this.quartz)],
      execute: this.alarmFunc
    });
  }

  /**
   * Provides the main rule. It links the switch of {@link clockRule} with the switchItem and regenerates the clockRule every time a configuration changes.
   * @private
   * @type {HostRule}
   */
  get mainRule () {
    return rules.JSRule({
      name: 'Alarm Clock Switch Link for ' + this.switchItem,
      description: 'Rule to switch the main alarm clock rule.',
      triggers: [
        triggers.ItemCommandTrigger(this.switchItem),
        triggers.ItemStateChangeTrigger(this.switchItem + '_H'),
        triggers.ItemStateChangeTrigger(this.switchItem + '_M'),
        triggers.ItemStateChangeTrigger(this.switchItem + '_MON'),
        triggers.ItemStateChangeTrigger(this.switchItem + '_TUE'),
        triggers.ItemStateChangeTrigger(this.switchItem + '_WED'),
        triggers.ItemStateChangeTrigger(this.switchItem + '_THU'),
        triggers.ItemStateChangeTrigger(this.switchItem + '_FRI'),
        triggers.ItemStateChangeTrigger(this.switchItem + '_SAT'),
        triggers.ItemStateChangeTrigger(this.switchItem + '_SUN')
      ],
      execute: event => {
        if (event.itemName === this.switchItem) {
          items.getItem(this.vRuleItem).sendCommand(event.receivedCommand);
        } else {
          return this.clockRule;
        }
      }
    });
  }
}

/**
 * Creates an instance of {@link rules.AlarmClock} and builds the rule
 * @memberOf rules
 * @param {String} switchItem Item to switch the alarm on/off
 * @param {String} alarmFunc function to execute when the rule runs.
 * @returns {HostRule} JSRule from openhab-js
 */
const getAlarmClock = (switchItem, alarmFunc) => {
  const clock = new AlarmClock(switchItem, alarmFunc).mainRule;
  return [clock];
};

module.exports = {
  getAlarmClock
};
