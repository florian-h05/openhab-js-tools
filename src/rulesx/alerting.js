/**
 * Copyright (c) 2022 Florian Hotze
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 *
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Alerting namespace
 *
 * This namespace provides alerting rules, e.g. for open windows on rain.
 * @namespace rulesx.alerting
 */

const { actions, rules, items, triggers } = require('openhab');
const { TimerMgr } = require('openhab_rules_tools');
const { getRoofwindowOpenLevel } = require('../itemutils');

/**
 * Get the temperature difference from the temperature in a room to the outside temperature.
 *
 * The temperature's Item name must be: ${roomName}${temperatureItemSuffix}.
 * @private
 * @param {string} roomName name of room
 * @param {string} outsideTemperatureItem outside temperature Item name
 * @param {string} [temperatureItemSuffix=_Temperatur] string to append to the roomName to get the temperatur Item's name
 * @returns {number|null} temperature difference (outside-inside) or null if no inside temperature is available
 */
const getTemperatureDifferenceInToOut = (roomName, outsideTemperatureItem, temperatureItemSuffix = '_Temperatur') => {
  const temperatureItem = items.getItem(roomName + temperatureItemSuffix, true);
  if (temperatureItem == null) return null;
  const insideTemperature = parseFloat(temperatureItem.state);
  const outsideItem = items.getItem(outsideTemperatureItem, true);
  if (outsideItem == null) return null;
  const outsideTemperature = parseFloat(outsideItem.state);
  return outsideTemperature - insideTemperature;
};

/**
 * @typedef {Object} rainAlarmConfig configuration for rain alarm
 * @memberof rulesx.alerting
 * @property {string} rainalarmItemName name of the rain alarm Item
 * @property {string} [rainalarmActiveState=OPEN] state of the Item for an active alarm, all other states (including `UNDEF`, `NULL`) are considered as alarm inactive
 * @property {string} windspeedItemName name of the wind speed Item
 * @property {string} contactGroupName name of the contact group to monitor
 * @property {string[]} ignoreList list of contact Item names to ignore
 * @property {string} roofwindowTag tag that all roofwindow contacts have for identification
 * @property {number} windspeedKlLueftung wind speed threshold for an alarm on "kleine Lüftung"
 * @property {number} windspeedGrLueftung wind speed threshold for an alarm on "große Lüftung"
 */

/**
 * Rainalarm
 *
 * Issues a rain alarm notification if the given window/door is open (and wind speed is high enough).
 * @memberof rulesx.alerting
 */
class Rainalarm {
  /**
   * Constructor to create an instance. Do not call directly, instead call {@link rulesx.getRainalarmRule}.
   * @param {rainAlarmConfig} config rainalarm configuration
   * @hideconstructor
   */
  constructor (config) {
    if (typeof config.rainalarmItemName !== 'string') {
      throw Error('rainalarmItemName is not supplied ot not string!');
    }
    if (typeof config.ignoreList !== 'object' || config.ignoreList === null) {
      throw Error('contactGroupName is not supplied or is not Array!');
    }
    if (typeof config.roofwindowTag !== 'string') {
      throw Error('roofwindowTag is not supplied or is not string!');
    }
    if (!config.rainalarmActiveState) config.rainalarmActiveState = 'OPEN';
    this.config = config;
  }

  /**
   * Sends a rainalarm notification for a roowindow.
   * @private
   * @param {string} baseItemName base of the Items names, e.g. Florian_Dachfenster
   * @param {number} windspeed current windspeed
   */
  alarmRoofwindow (baseItemName, windspeed) {
    console.info(`Checking rainalarm for roofwindow "${baseItemName}" ...`);
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
   * @param {string} contactItemName name of the contact Item.
   */
  alarmSingleContact (contactItemName) {
    const contactItem = items.getItem(contactItemName);
    console.info(`Checking rainalarm for single contact "${contactItem.name}" ...`);
    if (contactItem.state === 'OPEN') actions.NotificationAction.sendBroadcastNotification(`Achtung! Regenalarm: ${contactItem.label} geöffnet!`);
  }

  /**
   * Calls the appropriate function depending on the type of window/door.
   * Do NOT call directly, instead use {@link rulesx.alerting.createRainAlarmRule}.
   *
   * @private
   * @param {string} itemname name of the Item
   * @param {number} windspeed current windspeed
   */
  checkAlarm (itemname, windspeed) {
    if (items.getItem(this.config.rainalarmItemName).state !== this.config.rainalarmActiveState) return;
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
 * Creates the rain alarm rule.
 *
 * @memberof rulesx.alerting
 * @param {rainAlarmConfig} config rainalarm configuration
 */
function createRainAlarmRule (config) {
  const RainalarmImpl = new Rainalarm(config);
  rules.JSRule({
    name: 'Rainalarm',
    description: 'Sends a broadcast notification when a window is open when it rains.',
    triggers: [
      triggers.ItemStateChangeTrigger(config.rainalarmItemName, 'CLOSED', 'OPEN'),
      triggers.GroupStateChangeTrigger(config.contactGroupName, 'CLOSED', 'OPEN')
    ],
    execute: (event) => {
      const windspeed = parseFloat(items.getItem(config.windspeedItemName).state);
      if (event.itemName === config.rainalarmItemName || event.eventType === 'manual') {
        console.info('Rainalarm rule is running on alarm or manual execution.');
        const groupMembers = items.getItem(config.contactGroupName).members.map((item) => item.name);
        for (const i in groupMembers) {
          // @ts-ignore
          RainalarmImpl.checkAlarm(groupMembers[i], windspeed);
        }
      } else if (event.itemName !== undefined) {
        console.info(`Rainalarm rule is running on change of contact "${event.itemName}".`);
        function timeoutFunc (itemname, windspeed) {
          return () => {
            // @ts-ignore
            RainalarmImpl.checkAlarm(itemname, windspeed);
          };
        }
        setTimeout(timeoutFunc(event.itemName, windspeed), 2000);
      }
    },
    id: `rainalarm-for-${config.contactGroupName}`,
    tags: ['@hotzware/openhab-tools', 'getRainalarmRule', 'Alerting']
  });
}

/**
 * @typedef {Object} heatOrFrostAlarmConfig configuration for rainalarm
 * @memberof rulesx.alerting
 * @property {string} type alarm type, either `heat` or `frost`
 * @property {string} alarmLevelItem name of Item that holds the alarm level
 * @property {string} outsideTemperatureItem name of outside temperature Item
 * @property {string} roomTemperatureItemSuffix suffix to add to the room's name to get the temperature Item's name
 * @property {string} contactGroupName name of the contact group to monitor
 * @property {string[]} ignoreList list of contact Item names to ignore
 * @property {string} roofwindowTag tag that all roofwindow contacts have for identification
 * @property {number} tempTreshold Temperature treshold, for difference between inside temp to outside. Example: -2 means at least 2 degrees lower temp on the outside.
 * @property {Object} notification notification to send
 * @property {Object} notification.alarm alarm notification
 * @property {string} notification.alarm.title
 * @property {string} notification.alarm.message
 * @property {Object} notification.warning warning notification
 * @property {string} notification.warning.title
 * @property {string} notification.warning.message
 * @property {Object} time Times until an alarm is sent.
 * @property {number} time.open
 * @property {number} time.halfOpen window is tilted or roofwindow is on "große Lüftung"
 * @property {number} time.klLueftung roofwindow is on "kleine Lüftung"
 * @property {number} time.addForWarning Time to add when it's only a warning.
 */

/**
 * Heat- / Frostalarm
 *
 * Issues a heat- or frostalarm notification if the given window/door is open, it is hot or cold enough and enough time passed by.
 *
 * Before a noficiation is sent, the logic checks for the following conditions:
 *  - contact is open
 *  - alarm level is not `0`
 *  - configured temperature difference between inside and outside is reached
 *
 * Then logic decides depending on the alarm level and the openess level of the window/door, whether to send warning or alarm and which time to choose.
 *
 * Item naming scheme is required:
 *  - for roofwindows see {@link itemutils.getRoofwindowOpenLevel}
 *  - generally: roomname + `_`... for contacts and then roomname + `_Temperatur` for the room's temperature (roomname must always be before the first `_`)
 *
 * This class respects an alarm level (hold by an Item) which is an integer:
 *  - `0` for no alarm
 *  - `0` < x < `4` for warning
 *  - `4` for alarm
 * You may use a rule to set the alarm level depending on the outside temperature.
 * @memberof rulesx.alerting
 */
class HeatFrostalarm {
  /**
   * Constructor to create an instance. Do not call directly, instead call {@link rulesx.alerting.createHeatAlarmRule} or {@link rulesx.alerting.createFrostAlarmRule}.
   * @param {heatOrFrostAlarmConfig} config configuration
   * @param {TimerMgr} timerMgr instance of {@link TimerMgr}
   * @hideconstructor
   */
  constructor (config, timerMgr) {
    if (typeof config.alarmLevelItem !== 'string') throw Error('alarmLevelItem is not supplied or is not string!');
    if (typeof config.outsideTemperatureItem !== 'string') throw Error('outsideTemperatureItem is not supplied or is not string!');
    if (typeof config.ignoreList !== 'object' || config.ignoreList === null) throw Error('contactGroupName is not supplied or is not Array!');
    if (typeof config.roofwindowTag !== 'string') throw Error('roofwindowTag is not supplied or is not string!');
    if (typeof config.tempTreshold !== 'number') throw Error('tempTreshold is not supplied or is not string!');
    if (typeof config.notification !== 'object' || config.notification === null) throw Error('notification is not supplied or is not object!');
    if (typeof config.time !== 'object' || config.time === null) throw Error('time is not supplied or is not object!');
    if (typeof config.time.open !== 'number') throw Error('time.open is not supplied or is not number!');
    this.config = config;
    this.timerMgr = timerMgr;
  }

  /**
   * Function generator for the function to run when the timer expires.
   * @private
   * @param {string} contactItem name of contact item
   * @returns {Function} function to run when the timer expires
   */
  timerFuncGenerator (contactItem) {
    return () => {
      this.scheduleOrPerformAlarm(contactItem, true);
    };
  }

  /**
   * Schedules a timer for a given contact or sends the notification.
   * Checks whether all conditions are met.
   * @private
   * @param {string} contactItem name of contact Item
   * @param {boolean} [calledOnExpire=false] if true, send notification
   * @param {number} [time] time in minutes until timer expires, not required if `calledOnExpire === true`
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
    const roomname = contactItem.split('_')[0];
    const temperatureDifferenceInOut = getTemperatureDifferenceInToOut(roomname, this.config.outsideTemperatureItem, this.config.roomTemperatureItemSuffix);
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
    // Brackets around time calculation are required, otherwise the numbers are appended as strings and not added
    const timerTime = (alarmLevel !== 4) ? 'PT' + (time + this.config.time.addForWarning) + 'M' : 'PT' + time + 'M';
    if (this.timerMgr.hasTimer(contactItem)) {
      console.info(`checkContact: Timer for ${contactItem} (${this.config.type}) already exists, skipping!`);
    } else {
      this.timerMgr.check(contactItem, timerTime, this.timerFuncGenerator(contactItem));
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

  /**
   * Calls the alarm logic with the appropriate parameters depending on the type of window/door.
   * Do NOT call directly, instead use {@link rulesx.alerting.createHeatAlarmRule} or {@link rulesx.alerting.createFrostAlarmRule}.
   *
   * @private
   * @param {string} itemName name of the Item
   */
  checkAlarm (itemName) {
    // The alarm level must not be checked here, otherwise scheduleOrPerformAlarm can't cancel a timer.
    if (!this.config.ignoreList.includes(itemName)) {
      const tags = items.getItem(itemName).tags;
      if (tags.includes(this.config.roofwindowTag)) {
        const time = this.getTimeForRoofwindow(itemName.replace('_zu', '').replace('_klLueftung', '').replace('_grLueftung', ''));
        this.scheduleOrPerformAlarm(itemName, false, time);
      } else {
        this.scheduleOrPerformAlarm(itemName, false, this.config.time.open);
      }
    }
  }
}

/**
 * Create the heat alarm rule.
 *
 * @memberof rulesx.alerting
 * @param {heatOrFrostAlarmConfig} config alarm configuration
 */
function createHeatAlarmRule (config) {
  const timerMgr = TimerMgr();
  const HeatalarmImpl = new HeatFrostalarm(config, timerMgr);
  rules.JSRule({
    name: 'Heatalarm',
    description: 'Send a broadcast notficiation when a window/door is too long open when it is too warm.',
    triggers: [
      triggers.ItemStateChangeTrigger(config.outsideTemperatureItem),
      triggers.GroupStateChangeTrigger(config.contactGroupName)
    ],
    execute: (event) => {
      // The alarm level must not be checked here, otherwise scheduleOrPerformAlarm can't cancel a timer.
      if (event.itemName === config.outsideTemperatureItem || event.eventType === 'manual') {
        console.info('Heatalarm rule is running on temperature change or manual excution.');
        const groupMembers = items.getItem(config.contactGroupName).members.map((item) => item.name);
        for (const i in groupMembers) {
          // @ts-ignore
          HeatalarmImpl.checkAlarm(groupMembers[i]);
        }
      } else if (event.itemName !== undefined) {
        console.info(`Heatalarm rule is running on change, Item ${event.itemName}.`);
        function timeoutFunc (itemname) {
          return () => {
            // @ts-ignore
            HeatalarmImpl.checkAlarm(itemname);
          };
        }
        setTimeout(timeoutFunc(event.itemName), 2000);
      }
    },
    id: `heatalarm-for-${config.contactGroupName}`,
    tags: ['@hotzware/openhab-tools', 'getHeatalarmRule', 'Alerting']
  });
}

/**
 * Create the frostalarm rule.
 *
 * @memberof rulesx.alerting
 * @param {heatOrFrostAlarmConfig} config alarm configuration
 */
function createFrostAlarmRule (config) {
  const timerMgr = TimerMgr();
  const FrostalarmImpl = new HeatFrostalarm(config, timerMgr);
  rules.JSRule({
    name: 'Frostalarm',
    description: 'Send a broadcast notficiation when a window/door is too long open when it is too cold.',
    triggers: [
      triggers.ItemStateChangeTrigger(config.outsideTemperatureItem),
      triggers.GroupStateChangeTrigger(config.contactGroupName)
    ],
    execute: (event) => {
      // The alarm level must not be checked here, otherwise scheduleOrPerformAlarm can't cancel a timer.
      if (event.itemName === config.outsideTemperatureItem || event.eventType === 'manual') {
        console.info('Frostalarm rule is running on temperature change or manual execution.');
        const groupMembers = items.getItem(config.contactGroupName).members.map((item) => item.name);
        for (const i in groupMembers) {
          // @ts-ignore
          FrostalarmImpl.checkAlarm(groupMembers[i]);
        }
      } else if (event.itemName !== null) {
        console.info(`Frostalarm rule is running on change, Item ${event.itemName}.`);
        function timeoutFunc (itemname) {
          return () => {
            // @ts-ignore
            FrostalarmImpl.checkAlarm(itemname);
          };
        }
        setTimeout(timeoutFunc(event.itemName), 2000);
      }
    },
    id: `frostalarm-for-${config.contactGroupName}`,
    tags: ['@hotzware/openhab-tools', 'getFrostalarmRule', 'Alerting']
  });
}

module.exports = {
  createRainAlarmRule,
  createHeatAlarmRule,
  createFrostAlarmRule
};
