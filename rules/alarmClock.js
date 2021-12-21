/**
 * Copyright (c) 2021-2021 Florian Hotze
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const { items, rules, triggers } = require('openhab');
const logger = require('openhab').log('alarmClock');
const { ruleRegistry } = require('@runtime/RuleSupport');

/**
 * Alarm clock.
 * Provides a switchable alarm clock rule with cron trigger.
 * The cron expression is build based on settings Items.
 * It requires a specific naming scheme for these Items.
 * @memberOf rules
 */
class AlarmClock {
  /**
   * Constructor.
   * Generates the cron expression.
   * Do not call directly, instead call {@link getSceneEngine}.
   * @param {String} switchItem Item to switch the alarm on/off
   * @param {String} alarmFunc function to execute when the rule runs.
   * @hideconstructor
   */
  constructor (switchItem, alarmFunc) {
    this.switchItem = switchItem;
    this.alarmFunc = alarmFunc;
    // Get Items' states for time configuration.
    const hour = parseInt(items.getItem(switchItem + '_H').state);
    const minute = parseInt(items.getItem(switchItem + '_M').state);
    // Generate Array for days of week.
    let days = [];
    if (items.getItem(switchItem + '_MON').state === 'ON') days.push('MON');
    if (items.getItem(switchItem + '_TUE').state === 'ON') days.push('TUE');
    if (items.getItem(switchItem + '_WED').state === 'ON') days.push('WED');
    if (items.getItem(switchItem + '_THU').state === 'ON') days.push('THU');
    if (items.getItem(switchItem + '_FRI').state === 'ON') days.push('FRI');
    if (items.getItem(switchItem + '_SAT').state === 'ON') days.push('SAT');
    if (items.getItem(switchItem + '_SUN').state === 'ON') days.push('SUN');
    if (days.length === 0) { items.getItem(switchItem).sendCommand('OFF'); }
    this.quartz = '0 ' + parseInt(minute) + ' ' + parseInt(hour) + ' ? * ' + days.join(',') + ' *';
  }

  /**
   * Provides the alarm clock rule.
   * @private
   * @type {HostRule}
   * @private
   */
  get clockRule () {
    return rules.SwitchableJSRule({
      name: 'Alarm Clock ' + this.switchItem,
      description: 'The Alarm Clock itself.',
      triggers: [triggers.GenericCronTrigger(this.quartz)],
      execute: this.alarmFunc,
      id: this.switchItem
    });
  }
}

/**
 * Creates an instance of {@link rules.AlarmClock}.
 * @memberOf rules
 * @param {String} switchItem Item to switch the alarm on/off
 * @param {String} alarmFunc function to execute when the rule runs.
 * @returns {HostRule} alarm clock rule
 * @private
 */
const getClockRule = (switchItem, alarmFunc) => {
  return new AlarmClock(switchItem, alarmFunc).clockRule;
};

/**
 * Provides the full alarm clock.
 * It returns the manager rule that creates and updates the alarm clock rule on change of settings Items.
 * The manager rule also links the switch of the alarm clock rule with the switchItem.
 * @memberOf rules
 * @param {String} switchItem Item to switch the alarm on/off
 * @param {String} alarmFunc function to execute when the alarm clock fires
 * @returns {HostRule} alarm manager rule
 * @example
 * require('florianh-openhab-tools').rules.getAlarmClock(switchItem, data => { console.log('Successfully tested alarm clock.'); });
 */
const getAlarmClock = (switchItem, alarmFunc) => {
  return [
    rules.JSRule({
      name: 'Alarm Clock Manager ' + switchItem,
      triggers: [
        triggers.ItemCommandTrigger(switchItem),
        triggers.ItemStateChangeTrigger(switchItem + '_H'),
        triggers.ItemStateChangeTrigger(switchItem + '_M'),
        triggers.ItemStateChangeTrigger(switchItem + '_MON'),
        triggers.ItemStateChangeTrigger(switchItem + '_TUE'),
        triggers.ItemStateChangeTrigger(switchItem + '_WED'),
        triggers.ItemStateChangeTrigger(switchItem + '_THU'),
        triggers.ItemStateChangeTrigger(switchItem + '_FRI'),
        triggers.ItemStateChangeTrigger(switchItem + '_SAT'),
        triggers.ItemStateChangeTrigger(switchItem + '_SUN')
      ],
      execute: event => {
        if (event.itemName === switchItem) {
          items.getItem('vRuleItemForAlarm_Clock_' + switchItem).sendCommand(event.itemCommand);
        } else {
          logger.info('Updating alarm clock [Alarm Clock {}].', switchItem);
          ruleRegistry.remove(switchItem);
          getClockRule(switchItem, alarmFunc);
        }
      }
    }),
    getClockRule(switchItem, alarmFunc)
  ];
};

module.exports = {
  getAlarmClock
};
