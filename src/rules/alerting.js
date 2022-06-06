/**
 * Copyright (c) 2021 Florian Hotze
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const { actions, rules, items } = require('openhab');
const { getRoofwindowOpenLevel } = require('../itemutils');

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
 * Sends a rainalarm notification for a roowindow.
 * @private
 * @param {String} baseItemName base of the Items names, e.g. Florian_Dachfenster
 * @param {Number} windspeed current windspeed
 * @param {rulexs.rainalarmConfig} config rainalarm configuration
 */
const _rainalarmRoofwindow = (baseItemName, windspeed, config) => {
  const state = getRoofwindowOpenLevel(baseItemName);
  const label = items.getItem(baseItemName + '_zu').label;
  switch (state.int) {
    case 1: // kleine Lüftung
      if (windspeed >= config.windspeedKlLueftung) actions.NotificationAction.sendBroadcastNotification(`Achtung! Regenalarm: ${label} kleine Lüftung!`);
      break;
    case 2: // große Lüftung
      if (windspeed >= config.windspeedGrLueftung) actions.NotificationAction.sendBroadcastNotification(`Achtung! Regenalarm: ${label} große Lüftung!`);
      break;
    case 4:
      actions.NotificationAction.sendBroadcastNotification(`Achtung! Regenalarm: ${label} geöffnet!`);
      break;
    default:
      break;
  }
};

/**
 * Send a rainalarm notification for a single contact.
 * @private
 * @param {String} contactItem name of the contact Item.
 */
const _rainalarmSingleContact = (contactItem) => {
  if (contactItem.state === 'OPEN') actions.NotificationAction.sendBroadcastNotification(`Achtung! Regenalarm: ${contactItem.label} geöffnet!`);
};

/**
 * Calls the appropiate function depending on the type of window/door.
 * @private
 * @param {String} itemname name of the Item
 * @param {Number} windspeed current windspeed
 * @param {rulesx.rainalarmConfig} config rainalarm config
 */
const _rainalarmContactFunction = (itemname, windspeed, config) => {
  const tags = items.getItem(itemname).tags;
  if (tags.includes(config.roofwindowTag)) {
    _rainalarmRoofwindow(itemname.replace('_zu', '').replace('_klLueftung', '').replace('_grLueftung', ''), windspeed, config);
  } else {
    _rainalarmSingleContact(itemname);
  }
};

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

    ],
    execute: (event) => {
      const windspeed = parseFloat(items.getItem(config.windspeedItemName).state);
      if (event.itemName === config.rainalarmItemName) {
        console.info('Rainalarm rule is running on alarm or manual execution');
        const groupMembers = items.getItem(config.contactGroupName).members;
        for (const i in groupMembers) {
          // Check whether itemname is member of ignoreList.
          _rainalarmContactFunction(groupMembers[i], windspeed, config);
        }
      } else {
        _rainalarmContactFunction(event.itemName, windspeed, config);
      }
    },
    id: `rainalarm-for-${config.rainalarmItemName}`,
    tags: ['@hotzware/openhab-tools', 'getRainalarmRule', 'Alerting']
  });
};

module.exports = {
  getRainalarmRule
};
