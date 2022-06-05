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
const { getRoofwindowOpenLevel } = require('../utils');

/**
 * Sends a rainalarm notification for a roowindow.
 * @private
 * @param {String} baseItemName base of the Items names, e.g. Florian_Dachfenster
 * @param {Number} windspeed current windspeed
 * @param {Object} config rainalarm configuration
 * @param {Number} config.windspeedKlLueftung windspeed threshold for an alarm on "kleine Lüftung"
 * @param {Number} config.windspeedGrLueftung windspeed threshold for an alarm on "große Lüftung"
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

const _rainalarmSingleContact = (contactItem) => {
  if (contactItem.state === 'OPEN') actions.NotificationAction.sendBroadcastNotification(`Achtung! Regenalarm: ${contactItem.label} geöffnet!`);
};

/**
 * Returns the rainalarm rule.
 * @param {Object} config rainalarm configuration
 * @param {String} config.rainalarmItemName name of the rainalarm Item
 * @param {String} config.contactGroupName name of the contact group to monitor
 * @param {String[]} config.ignoreList list of contact Item names to ignore
 * @returns 
 */
const getRainalarmRule = (config) => {
  return rules.JSRule({
    name: 'Rainalarm',
    description: 'Sends a broadcast notification when a window is open when it rains.',
    triggers: [

    ],
    execute: (event) => {
      if (event.itemName === config.rainalarmItemName) {
        console.info('Rainalarm rule is running on alarm or manual execution');
        const groupMembers = items.getItem(config.contactGroupName).members;
        for (const i in groupMembers) {
          // Check whether itemname is member of ignoreList.
          
        }
      }
    }
  });
};

module.exports = {
  getRainalarmRule
};
