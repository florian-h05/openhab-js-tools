/**
 * Copyright (c) 2023 Florian Hotze
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const { actions, items, rules, triggers } = require('openhab');
// @ts-ignore
const HSBType = Java.type('org.openhab.core.library.types.HSBType'); // eslint-disable-line no-unused-vars

const HEADERS = new Map([['accept', 'application/json']]);

class MlscRestClient {
  constructor (effectItemName, colorItemName, url, deviceId, switchItemName, effectDefault = 'effect_gradient', refreshInterval = 15000) {
    if (typeof effectItemName !== 'string') throw new Error('effectItemName must be a string!');
    if (typeof colorItemName !== 'string') throw new Error('colorItemName must be a string!');
    if (typeof url !== 'string') throw new Error('url must be a string!');
    if (typeof deviceId !== 'string') throw new Error('deviceId must be a string!');

    this.effectItemName = effectItemName;
    this.colorItemName = colorItemName;
    this.url = url;
    this.deviceId = deviceId;
    this.switchItemName = switchItemName;
    this.effectDefault = effectDefault;
    this.refreshInterval = refreshInterval;
  }

  scheduleStateFetching () {
    const logMsg = `from "${this.deviceId}"" of "${this.host}"`;
    return setInterval(() => {
      console.debug(`Refreshing Items ${logMsg} ...`);
      try {
        const response = actions.HTTP.sendHttpGetRequest(this.host + '/api/effect/active?device=' + this.deviceId, HEADERS, 1000);
        const json = JSON.parse(response);
        items.get(this.effectItemName).postUpdate(json.effect);
      } catch (e) {
        console.warn(`Failed to fetch effect ${logMsg}:`, e);
      }
      try {
        const response = actions.HTTP.sendHttpGetRequest(this.host + '/api/settings/effect?effect=effect_single&device=' + this.deviceId, HEADERS, 1000);
        const json = JSON.parse(response);
        const rgb = json.settings.custom_color;
        const hsb = HSBType.fromRGB(rgb[0], rgb[1], rgb[2]);
        items.getItem(this.colorItemName).postUpdate(hsb.toString());
      } catch (e) {
        console.warn(`Failed to fetch color ${logMsg}:`, e);
      }
    }, this.refreshInterval);
  }

  createCommandHandlingRule () {
    const logMsg = `from "${this.deviceId}"" of "${this.host}"`;
    const ruleConfig = {
      name: `mlsc REST client for "${this.deviceId}" of "${this.host}"`,
      description: 'Provides command handling, state fetching is done by a scheduled job',
      triggers: [
        triggers.ItemCommandTrigger(this.effectItemName),
        triggers.ItemCommandTrigger(this.colorItemName)
      ],
      execute: (event) => {
        // Switching ON or OFF
        if (event.itemName === this.switchItemName) {
          console.debug(`Commanding ${logMsg} to ON (default effect) or OFF ...`);
          items.getItem(this.effectItemName).sendCommand((event.receivedCommand === 'ON') ? this.effectDefault : 'effect_off');
        } else if (event.itemName === this.effectItemName) {
          console.debug(`Commanding effect of ${logMsg} to ${event.receivedCommand} ...`);
          actions.HTTP.sendHttpPostRequest(this.host + '/api/effect/active', 'application/json', JSON.stringify({
            device: this.deviceId,
            effect: event.receivedCommand
          }));
        } else if (event.itemName === this.colorItemName) {
          const hsb = HSBType.valueOf(event.receivedCommand);
          const r = parseInt(hsb.getRed() * 2.55);
          const g = parseInt(hsb.getGreen() * 2.55);
          const b = parseInt(hsb.getBlue() * 2.55);
          console.debug(`Commanding color of ${logMsg} to ${[r, g, b]}...`);
          actions.HTTP.sendHttpPostRequest(this.host + '/api/settings/effect', 'application/json', JSON.stringify({
            device: this.deviceId,
            effect: 'effect_single',
            settings: {
              custom_color: [r, g, b],
              use_custom_color: true
            }
          }));
          items.getItem(this.effectItemname).sendCommand('effect_single');
        }
      }
    };
    // Add switchItem as trigger if defined
    if (this.switchItemName) ruleConfig.triggers.push(triggers.ItemCommandTrigger(this.switchItemName));
    return rules.JSRule(ruleConfig);
  }
}

module.exports = {
  MlscRestClient
};
