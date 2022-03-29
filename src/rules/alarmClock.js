/**
 * Copyright (c) 2021 Florian Hotze
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const { items, rules, triggers } = require('openhab');
const logger = require('openhab').log('org.openhab.automation.js.@hotzware/openhab-tools.rulesx.AlarmClock');
const { ruleRegistry } = require('@runtime/RuleSupport');

/**
 * Provides the alarm clock rule with QUARTZ cron trigger.
 * Do not call directly, instead call {@link rulesx.getAlarmClock}.
 *
 * Needs settings Items that must follow a given naming scheme.
 * The cron expression is build based on settings items.
 * When no day is selected, send command OFF to alarmSwitch and do not return rule.
 * @memberof rulesx
 * @param {String} switchItem name of Item to switch the alarm on/off
 * @param {*} alarmFunc function to execute when the rule runs
 * @returns {(HostRule | null)} the alarm clock rule or null
 */
function getClockRule (switchItem, alarmFunc) {
  // Get Items' states for time configuration.
  const hour = parseInt(items.getItem(switchItem + '_H').state);
  const minute = parseInt(items.getItem(switchItem + '_M').state);
  // Post time string.
  items.getItem(switchItem + '_Time').postUpdate(hour.toString() + ':' + ((minute < 10) ? '0' : '') + minute.toString());
  // Generate Array for days of week.
  const days = [];
  if (items.getItem(switchItem + '_MON').state === 'ON') days.push('MON');
  if (items.getItem(switchItem + '_TUE').state === 'ON') days.push('TUE');
  if (items.getItem(switchItem + '_WED').state === 'ON') days.push('WED');
  if (items.getItem(switchItem + '_THU').state === 'ON') days.push('THU');
  if (items.getItem(switchItem + '_FRI').state === 'ON') days.push('FRI');
  if (items.getItem(switchItem + '_SAT').state === 'ON') days.push('SAT');
  if (items.getItem(switchItem + '_SUN').state === 'ON') days.push('SUN');
  // If no days is selected, turn of the switchItem.
  if (days.length === 0) { items.getItem(switchItem).sendCommand('OFF'); }
  // Generate the QUARTZ cron expression.
  const quartz = '0 ' + parseInt(minute) + ' ' + parseInt(hour) + ' ? * ' + days.join(',') + ' *';
  // Return the JSRule.
  if (items.getItem(switchItem).state === 'ON') {
    return rules.JSRule({
      name: 'Alarm Clock ' + switchItem,
      description: 'The Alarm Clock itself.',
      triggers: [triggers.GenericCronTrigger(quartz)],
      execute: alarmFunc,
      id: switchItem
    });
  }
}

/**
 * Provides the full alarm clock.
 *
 * The manager rule that creates and updates the alarm clock rule {@link rulesx.getClockRule} on change of settings Items.
 * Also creates and removes the alarm clock rule on ON/OFF of switchItem.
 * @memberof rulesx
 * @param {String} switchItem name of Item to switch the alarm on/off
 * @param {*} alarmFunc function to execute when the alarm clock fires
 * @returns {HostRule} the alarm manager rule
 * @example
 * rulesx.getAlarmClock(switchItem, data => { console.log('Successfully tested alarm clock.'); });
 */
function getAlarmClock (switchItem, alarmFunc) {
  return [
    rules.JSRule({
      name: 'Alarm Clock Manager ' + switchItem,
      triggers: [
        triggers.ItemStateChangeTrigger(switchItem),
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
        // As far as openHAB stable relies uses openhab-js 1.2.2, rules.removeRule(id) can be used.
        if (!(ruleRegistry.get(switchItem) == null)) {
          ruleRegistry.remove(switchItem);
          logger.debug('Removing rule: Alarm Clock {}', switchItem);
        }
        getClockRule(switchItem, alarmFunc);
      }
    }),
    getClockRule(switchItem, alarmFunc)
  ];
}

module.exports = {
  getAlarmClock
};
