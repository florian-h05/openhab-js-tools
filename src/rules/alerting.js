/**
 * Copyright (c) 2022 Florian Hotze
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const { actions, rules, items, triggers } = require('openhab');
const { getRoofwindowOpenLevel } = require('../itemutils');

/**
 * Get the temperature difference from the temperature in a room to the outside temperature.
 *
 * The temperatures's Itemname must be: ${roomname}${temperatureItemSuffix}.
 * @private
 * @param {String} roomname name of room
 * @param {Number} ousideTemperatureItemname outside temperature Item name
 * @param {String} [temperatureItemSuffix=_Temperatur]
 * @returns {Number|null} temperature difference (outside-inside) or null if no inside temperature is available
 */
const getTemperatureDifferenceInToOut = (roomname, ousideTemperatureItemname, temperatureItemSuffix = '_Temperatur') => {
  const temperatureItem = items.getItem(roomname + temperatureItemSuffix, true);
  if (temperatureItem == null) return null;
  const insideTemperature = parseFloat(temperatureItem.state);
  const outsideItem = items.getItem(ousideTemperatureItemname, true);
  if (outsideItem == null) return null;
  const outsideTemperature = parseFloat(outsideItem.state);
  return outsideTemperature - insideTemperature;
};

/**
 * @typedef {Object} rainalarmConfig configuration for rainalarm
 * @memberof rulesx
 * @property {String} rainalarmItemName name of the rainalarm Item
 * @property {String} windspeedItemName bame of the windspeed Item-
 * @property {String} contactGroupName name of the contact group to monitor
 * @property {String[]} ignoreList list of contact Item names to ignore
 * @property {String} roofwindowTag tag that all roofwindow contacts have for identification
 * @property {Number} windspeedKlLueftung windspeed threshold for an alarm on "kleine Lüftung"
 * @property {Number} windspeedGrLueftung windspeed threshold for an alarm on "große Lüftung"
 */

/**
 * Rainalarm
 *
 * @memberof rulesx
 * Issues a rainalarm notification if the given window/door is open (and windspeed is high enough).
 */
class Rainalarm {
  /**
   * Constructor to create an instance. Do not call directly, instead call {@link rulesx.getRainalarmRule}.
   * @param {rulesx.rainalarmConfig} config rainalarm configuration
   * @hideconstructor
   */
  constructor (config) {
    if (typeof config.ignoreList !== 'object' || config.ignoreList === null) {
      throw Error('contactGroupName is not supplied or is not Array!');
    }
    if (typeof config.roofwindowTag !== 'string') {
      throw Error('roofwindowTag is not supplied or is not string!');
    }
    this.config = config;
  }

  /**
 * Sends a rainalarm notification for a roowindow.
 * @private
 * @param {String} baseItemName base of the Items names, e.g. Florian_Dachfenster
 * @param {Number} windspeed current windspeed
 */
  alarmRoofwindow (baseItemName, windspeed) {
    console.info(`Checking rainalarm for roofwindow ${baseItemName} ...`);
    const state = getRoofwindowOpenLevel(baseItemName);
    const label = items.getItem(baseItemName + '_zu').label;
    switch (state.int) {
      case 1: // kleine Lüftung
        if (windspeed >= this.config.windspeedKlLueftung) actions.NotificationAction.sendBroadcastNotification(`Achtung! Regenalarm: ${label} kleine Lüftung!`);
        break;
      case 2: // große Lüftung
        if (windspeed >= this.config.windspeedGrLueftung) actions.NotificationAction.sendBroadcastNotification(`Achtung! Regenalarm: ${label} große Lüftung!`);
        break;
      case 4:
        actions.NotificationAction.sendBroadcastNotification(`Achtung! Regenalarm: ${label} geöffnet!`);
        break;
      default:
        break;
    }
  }

  /**
 * Send a rainalarm notification for a single contact.
 * @private
 * @param {String} contactItem name of the contact Item.
 */
  alarmSingleContact (contactItem) {
    console.info(`Checking rainalarm for single contact ${contactItem} ...`);
    if (contactItem.state === 'OPEN') actions.NotificationAction.sendBroadcastNotification(`Achtung! Regenalarm: ${contactItem.label} geöffnet!`);
  }

  /**
 * Calls the appropiate function depending on the type of window/door.
 * @private
 * @param {String} itemname name of the Item
 * @param {Number} windspeed current windspeed
 */
  checkAlarm (itemname, windspeed) {
    if (!this.config.ignoreList.includes(itemname)) {
      const tags = items.getItem(itemname).tags;
      if (tags.includes(this.config.roofwindowTag)) {
        this.alarmRoofwindow(itemname.replace('_zu', '').replace('_klLueftung', '').replace('_grLueftung', ''), windspeed);
      } else {
        this.alarmSingleContact(itemname);
      }
    }
  }
}

/**
 * Returns the rainalarm rule.
 * @memberof rulesx
 * @param {rulesx.rainalarmConfig} config rainalarm configuration
 * @returns {HostRule}
 */
const getRainalarmRule = (config) => {
  return rules.JSRule({
    name: 'Rainalarm',
    description: 'Sends a broadcast notification when a window is open when it rains.',
    triggers: [
      triggers.ItemStateChangeTrigger(config.rainalarmItemName, 'CLOSED', 'OPEN'),
      triggers.GroupStateChangeTrigger(config.contactGroupName, 'CLOSED', 'OPEN')
    ],
    execute: (event) => {
      const windspeed = parseFloat(items.getItem(config.windspeedItemName).state);
      const RainalarmImpl = new Rainalarm(config);
      if (event.itemName === config.rainalarmItemName) {
        console.info('Rainalarm rule is running on alarm.');
        const groupMembers = items.getItem(config.contactGroupName).members.map((item) => item.name);
        for (const i in groupMembers) {
          RainalarmImpl.checkAlarm(groupMembers[i], windspeed);
        }
      } else if (event.itemName !== null) {
        if (items.getItem(config.rainalarmItemName).state === 'CLOSED') return;
        console.info(`Rainalarm rule is running on change, Item ${event.itemName}.`);
        const timeoutFunc = function (itemname, windspeed, config) {
          return () => {
            RainalarmImpl.checkAlarm(itemname, windspeed);
          };
        };
        setTimeout(timeoutFunc(event.itemName, windspeed, config), 2000);
      }
    },
    id: `rainalarm-for-${config.rainalarmItemName}`,
    tags: ['@hotzware/openhab-tools', 'getRainalarmRule', 'Alerting']
  });
};

/**
 * @typedef {Object} heatfrostalarmConfig configuration for rainalarm
 * @memberof rulesx
 * @property {String} alarmLevelItem
 */

module.exports = {
  getRainalarmRule
};
