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

/**
 * Provides the alarm clock rule with QUARTZ cron trigger.
 * Do not call directly, instead call {@link rulesx.getAlarmClock}.
 *
 * Needs settings Items that must follow a given naming scheme.
 * The cron expression is build based on settings items.
 * When no day is selected, send command OFF to alarmSwitch and do not return rule.
 * When hour/minute are NaN, return no rule and set them to defaults.
 * @memberof rulesx
 * @param {String} switchItem name of Item to switch the alarm on/off
 * @param {*} alarmFunc function to execute when the rule runs
 * @returns {(HostRule | null)} the alarm clock rule or null
 */
function getClockRule (switchItem, alarmFunc) {
  // Get Items' states for time configuration.
  const hour = parseInt(items.getItem(switchItem + '_H').state);
  const minute = parseInt(items.getItem(switchItem + '_M').state);
  // If hour or minute is NaN, return and initialize default values.
  if (isNaN(hour) || isNaN(minute)) {
    items.getItem(switchItem + '_H').postUpdate('7');
    items.getItem(switchItem + '_M').postUpdate('0');
    items.getItem(switchItem + '_Time').postUpdate('07:00');
    return console.info('Not adding clock rule for ' + switchItem + ' due to missing time configuration.');
  }
  // Post time string.
  items.getItem(switchItem + '_Time').postUpdate(((hour < 10) ? '0' : '') + hour.toString() + ':' + ((minute < 10) ? '0' : '') + minute.toString());
  // If switchItem is OFF, return.
  if (items.getItem(switchItem).state !== 'ON') {
    return console.info('Not adding clock rule for ' + switchItem + ' because alarm is switched off.');
  }
  // Generate Array for days of week.
  const days = [];
  if (items.getItem(switchItem + '_MON').state === 'ON') days.push('MON');
  if (items.getItem(switchItem + '_TUE').state === 'ON') days.push('TUE');
  if (items.getItem(switchItem + '_WED').state === 'ON') days.push('WED');
  if (items.getItem(switchItem + '_THU').state === 'ON') days.push('THU');
  if (items.getItem(switchItem + '_FRI').state === 'ON') days.push('FRI');
  if (items.getItem(switchItem + '_SAT').state === 'ON') days.push('SAT');
  if (items.getItem(switchItem + '_SUN').state === 'ON') days.push('SUN');
  // If no day is selected, return and turn of the switchItem.
  if (days.length === 0) {
    items.getItem(switchItem).sendCommand('OFF');
    return console.info('Not adding clock rule for ' + switchItem + ' because no day is enabled.');
  }
  // Generate the QUARTZ cron expression.
  const quartz = '0 ' + minute + ' ' + hour + ' ? * ' + days.join(',') + ' *';
  // Return the JSRule.
  return rules.JSRule({
    name: 'Alarm Clock ' + switchItem,
    description: 'The Alarm Clock itself.',
    triggers: [triggers.GenericCronTrigger(quartz)],
    execute: alarmFunc,
    id: 'alarmClock-for-' + switchItem,
    tags: ['@hotzware/openhab-tools', 'alarmClock', 'Schedule'],
    overwrite: true
  });
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
      execute: (event) => {
        rules.removeRule('alarmClock-for-' + switchItem);
        getClockRule(switchItem, alarmFunc);
      },
      id: 'alarmClock-manager-for-' + switchItem,
      tags: ['@hotzware/openhab-tools', 'alarmClock manager']
    }),
    getClockRule(switchItem, alarmFunc)
  ];
}

/**
 * Creates all required Items for an alarm clock.
 *
 * @memberof rulesx
 * @param {String} switchItemName name of Item to switch alarm on/off
 * @param {String} switchItemLabel label of Item to switch alarm on/off
 * @param {String} persistenceGroup name of group whose members are persisted & restored on startup
 * @param {Boolean} [sitemapSnippet=false] whether to output a Sitemap snippet for alarm configuration
 * @param {String[]} [weekdaysLabels=['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']] names of weekdays in your language, starting with Monday & ending with Sunday
 */
function createAlarmClockItems (switchItemName, switchItemLabel, persistenceGroup, sitemapSnippet = false, weekdaysLabels = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']) {
  function createItemAndSetState (itemConfig, state) {
    try {
      items.addItem(itemConfig);
    } catch (error) {
      console.warn(`Failed to create Item ${itemConfig.name}: ${error}`);
    }
    items.getItem(itemConfig.name).postUpdate(state);
  }
  // Create switchItem
  createItemAndSetState({
    type: 'Switch',
    name: switchItemName,
    label: switchItemLabel,
    category: 'time',
    groups: [persistenceGroup]
  }, 'OFF');
  // Create weekday Items
  const weekdaysNames = ['_MON', '_TUE', '_WED', '_THU', '_FRI', '_SAT', '_SUN'];
  for (const i in weekdaysNames) {
    createItemAndSetState({
      type: 'Switch',
      name: switchItemName + weekdaysNames[i],
      label: weekdaysLabels[i],
      category: 'switch',
      groups: [persistenceGroup]
    }, 'OFF');
  }
  // Create hour & minute Items
  createItemAndSetState({
    type: 'Number',
    name: switchItemName + '_H',
    label: 'Stunde',
    category: 'time',
    groups: [persistenceGroup],
    metadata: {
      stateDescription: {
        config: {
          pattern: '%d'
        }
      }
    }
  }, '7');
  createItemAndSetState({
    type: 'Number',
    name: switchItemName + '_M',
    label: 'Minute',
    category: 'time',
    groups: [persistenceGroup],
    metadata: {
      stateDescription: {
        config: {
          pattern: '%d'
        }
      }
    }
  }, '0');
  // Create state Item
  createItemAndSetState({
    type: 'String',
    name: switchItemName + '_Time',
    label: '',
    category: 'time',
    groups: [persistenceGroup],
    metadata: {
      stateDescription: {
        config: {
          pattern: '%s'
        }
      }
    }
  }, '07:00');

  const sitemapText =
  `Text label="Wecker 1 [%s]" item=${switchItemName}_Time icon="time" valuecolor=[${switchItemName}==ON="green", ${switchItemName}==OFF="grey"] {
    Default item=${switchItemName}
    Frame label="Zeit" {
      Setpoint item=${switchItemName}_H minValue=0 maxValue=23 step=1
      Setpoint item=${switchItemName}_M minValue=0 maxValue=55 step=5
    }
    Frame label="Wochentage" {
      Switch item=${switchItemName}_MON
      Switch item=${switchItemName}_TUE
      Switch item=${switchItemName}_WED
      Switch item=${switchItemName}_THU
      Switch item=${switchItemName}_FRI
      Switch item=${switchItemName}_SAT
      Switch item=${switchItemName}_SUN
    }
  }`;
  if (sitemapSnippet === true) console.info(`alarm clock configuration Sitemap snippet: \n${sitemapText}`);
}

module.exports = {
  getAlarmClock,
  createAlarmClockItems
};
