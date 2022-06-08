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
const { TimerMgr } = require('openhab_rules_tools/timerMgr');
const { getRoofwindowOpenLevel } = require('../itemutils');

/**
 * Get the temperature difference from the temperature in a room to the outside temperature.
 *
 * The temperatures's Itemname must be: ${roomname}${temperatureItemSuffix}.
 * @private
 * @param {String} roomname name of room
 * @param {Number} outsideTemperatureItem outside temperature Item name
 * @param {String} [temperatureItemSuffix=_Temperatur]
 * @returns {Number|null} temperature difference (outside-inside) or null if no inside temperature is available
 */
const getTemperatureDifferenceInToOut = (roomname, outsideTemperatureItem, temperatureItemSuffix = '_Temperatur') => {
  const temperatureItem = items.getItem(roomname + temperatureItemSuffix, true);
  if (temperatureItem == null) return null;
  const insideTemperature = parseFloat(temperatureItem.state);
  const outsideItem = items.getItem(outsideTemperatureItem, true);
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
 * @property {String} type alarm type, either `heat` or `frost`
 * @property {String} alarmLevelItem
 * @property {String} outsideTemperatureItem
 * @property {String} contactGroupName name of the contact group to monitor
 * @property {String[]} ignoreList list of contact Item names to ignore
 * @property {Number} tempTreshold
 * @property {Object} notification
 * @property {Object} notification.alarm
 * @property {String} notification.alarm.title
 * @property {String} notification.alarm.message
 * @property {Object} notification.warning
 * @property {String} notification.warning.title
 * @property {String} notification.warning.message
 * @property {Object} time
 * @property {Number} time.open
 * @property {Number} time.halfOpen
 * @property {Number} time.klLueftung
 * @property {Number} time.addForWarning
 */

class HeatFrostalarm {
  /**
   * Constructor to create an instance. Do not call directly, instead call {@link rulesx.}.
   * @param {rulesx.heatfrostalarmConfig} config configuration
   * @param {TimerMgr} timerMgr instance of {@link TimerMgr}
   * @hideconstructor
   */
  constructor (config, timerMgr) {
    if (typeof config.ignoreList !== 'object' || config.ignoreList === null) {
      throw Error('contactGroupName is not supplied or is not Array!');
    }
    if (typeof config.roofwindowTag !== 'string') {
      throw Error('roofwindowTag is not supplied or is not string!');
    }
    this.config = config;
    this.timerMgr = timerMgr;
  }

  /**
   * Function generator for the function to run when the timer expires.
   * @private
   * @param {String} contactItem name of contact item
   * @returns {Function} function to run when the timer expires
   */
  timerFuncGenerator (contactItem) {
    return () => {
      const outsideTemperature = parseFloat(items.getItem(this.config.outsideTemperatureItem).state);
      this.scheduleOrPerformAlarm(this.timerMgr, this.config, contactItem, outsideTemperature, true);
    };
  }

  /**
   * Schedules a timer for a given contact or sends the notification.
   * Checks whether all conditions are met.
   * @private
   * @param {String} contactItem name of contact Item
   * @param {Boolean} [calledOnExpire=false] if true, send notification
   * @param {Number} [time] time in minutes until timer expires, not required if `calledOnExpire === true`
   */
  scheduleOrPerformAlarm (contactItem, calledOnExpire = false, time) {
    console.info(`checkContact: Checking ${contactItem} (called from expired timer: ${calledOnExpire}).`);
    // If contact is closed, return false.
    if (items.getItem(contactItem).state === 'CLOSED') {
      if (this.timerMgr.hasTimer(contactItem)) {
        this.timerMgr.cancel(contactItem);
        return console.info(`checkContact: ${contactItem} is closed, cancelling timer.`);
      }
      return console.info(`checkContact: ${contactItem} is closed, returning.`);
    }
    const alarmLevel = parseInt(items.getItem(this.config.alarmLevelItem).state);
    // If alarmLevel indicates no alarm or warning, return false.
    if (alarmLevel === 0) return console.info('checkContact: No alarms or warning should be sent, returning.');
    const temperatureDifferenceInOut = getTemperatureDifferenceInToOut(contactItem, this.config.outsideTemperatureItem);
    const tresholdReached = (temperatureDifferenceInOut == null) ? true : (this.config.tempTreshold < 0) ? (temperatureDifferenceInOut <= this.config.tempTreshold) : (temperatureDifferenceInOut >= this.config.tempTreshold);
    // If tempTreshold is not reached, return false.
    if (tresholdReached === false) return console.info(`checkContact: Temperature treshold for ${contactItem} (${this.config.type}) not reached, returning.`);
    // Send notification if called on expire of timer.
    if (calledOnExpire === true) {
      console.info(`Timer for ${contactItem} (${this.config.type}) expired, sending notification.`);
      if (alarmLevel === 4) return actions.NotificationAction.sendBroadcastNotification(`${this.config.notification.alarm.title}${items.getItem(contactItem).label}${this.config.notification.alarm.message}`);
      return actions.NotificationAction.sendBroadcastNotification(`${this.config.notification.warning.title}${items.getItem(contactItem).label}${this.config.notification.warning.message}`);
    }
    // If not called on expire of timer, schedule timer.
    const timerTime = (alarmLevel !== 4) ? time + this.config.time.addForWarning + 'm' : time + 'm';
    if (this.timerMgr.hasTimer(contactItem)) {
      console.info(`checkContact: Timer for ${contactItem} (${this.config.type}) already exists, skipping!`);
    } else {
      this.timerMgr.check(contactItem, timerTime, this.timerFuncGenerator(this.configtimerMgr, this.config, contactItem));
      console.info(`checkContact: Created timer for ${contactItem} (${this.config.type}) with time ${timerTime}.`);
    }
  }

  getTimeForRoofwindow (contactItem) {
    const state = getRoofwindowOpenLevel(contactItem.replace('_zu', '').replace('_klLueftung', '').replace('_grLueftung', ''));
    switch (state.int) {
      case 1: // kleine Lüftung
        return this.config.time.klLueftung;
      case 2: // große Lüftung
        return this.config.time.halfOpen;
      default:
        return this.config.time.open;
    }
  }

  checkAlarm (itemname) {
    if (parseInt(items.getItem(this.config.alarmLevelItem).state) === 0) return;
    if (!this.config.ignoreList.includes(itemname)) {
      const tags = items.getItem(itemname).tags;
      if (tags.includes(this.config.roofwindowTag)) {
        const time = this.getTimeForRoofwindow(itemname.replace('_zu', '').replace('_klLueftung', '').replace('_grLueftung', ''));
        this.scheduleOrPerformAlarm(itemname, false, time);
      } else {
        this.scheduleOrPerformAlarm(itemname, false, this.config.time.open);
      }
    }
  }
}

module.exports = {
  getRainalarmRule
};
