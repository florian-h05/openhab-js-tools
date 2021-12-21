/*
WORK IN PROGRESS: the clockRule must either be modified or deleted and recreated by the main rule of getAlarmClock().
*/

/**
 * Copyright (c) 2021-2021 Florian Hotze
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const { items, rules, triggers, osgi } = require('openhab');
const logger = require('openhab').log('alarmclock');
const ruleRegistry = osgi.getService('org.openhab.core.automation.RuleRegistry');

/**
 * Alarm clock.
 * Create an alarm clock rule with cron trigger based on settings Items.
 * Provides a JSRule from package 'openhab'.
 * @memberOf rules
 * @private
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
    if (items.getItem(switchItem + '_MON').state === 'ON') days.push('MON');
    if (items.getItem(switchItem + '_TUE').state === 'ON') days.push('TUE');
    if (items.getItem(switchItem + '_WED').state === 'ON') days.push('WED');
    if (items.getItem(switchItem + '_THU').state === 'ON') days.push('THU');
    if (items.getItem(switchItem + '_FRI').state === 'ON') days.push('FRI');
    if (items.getItem(switchItem + '_SAT').state === 'ON') days.push('SAT');
    if (items.getItem(switchItem + '_SUN').state === 'ON') days.push('SUN');
    if (days.length === 0) { items.getItem(switchItem).sendCommand('OFF'); }
    this.quartz = '0 ' + parseInt(minute) + ' ' + parseInt(hour) + ' ? * ' + days.join(',') + ' *';
    logger.info('Cron expression [{}] generated.', this.quartz);
  }

  /**
   * Provides the clock itself.
   * @private
   * @type {HostRule}
   */
  get clockRule () {
    return rules.JSRule({
      name: 'Alarm Clock ' + this.switchItem,
      description: 'The Alarm Clock itself.',
      triggers: [triggers.GenericCronTrigger(this.quartz)],
      execute: this.alarmFunc,
      id: this.switchItem
    });
  }
}

/**
 * Creates an instance of {@link rules.AlarmClock} and builds the rule
 * @memberOf rules
 * @param {String} switchItem Item to switch the alarm on/off
 * @param {String} alarmFunc function to execute when the rule runs.
 * @returns {HostRule} JSRule from openhab-js
 * @private
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
      execute: data => {
        ruleRegistry.remove(switchItem);
        new AlarmClock(switchItem, alarmFunc).clockRule;
      }
    }),
    new AlarmClock(switchItem, alarmFunc).clockRule
  ];
};

module.exports = {
  getAlarmClock
};
