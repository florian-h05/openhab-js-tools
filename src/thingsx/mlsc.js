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

/**
 * music_led_strip_control REST client
 *
 * Class providing state fetching from and command sending to the REST API of {@link https://github.com/TobKra96/music_led_strip_control music_led_strip_control}.
 * It is using a scheduled job to fetch states and a rule to handle commands.
 *
 * @example
 * var FlorianRGB = new MlscRestClient('FlorianRGB_effect', 'FlorianRGB_color', 'http://127.0.0.1:8080', 'device_0', 'FlorianRGB', 'effect_single');
 * FlorianRGB.scheduleStateFetching();
 * FlorianRGB.createCommandHandlingRule();
 *
 * @memberof thingsx
 */
class MlscRestClient {
  /**
   * Be aware that you need to call {@link scheduleStateFetching} and {@link createCommandHandlingRule} to fully initialize the REST client.
   *
   * @param {string} effectItemName Name of `String` Item for mslc effect
   * @param {string} colorItemName Name of `Color` Item for `effect_single` color
   * @param {string} url Full URL of mlsc host, e.g. `http://127.0.0.1:8080`
   * @param {deviceId} deviceId ID of device inside mlsc, use HTTP GET `/api/system/devices` to get a list of available devices
   * @param {string} [switchItemName] Name of `Switch` Item to switch mlsc on/off
   * @param {string} [effectDefault='effect_gradient'] Default effect for the `Switch` Item
   * @param {number} [refreshInterval=15000] Refresh interval in milliseconds
   */
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

  /**
   * Schedules the state fetching using `setInterval`
   *
   * @returns {number} `intervalId`
   */
  scheduleStateFetching () {
    const logMsg = `"${this.deviceId}"" of "${this.url}"`;
    console.info(`Initializing state fetching for ${logMsg} ...`);
    return setInterval(() => {
      console.debug(`Refreshing Items from ${logMsg} ...`);
      try {
        const response = actions.HTTP.sendHttpGetRequest(this.url + '/api/effect/active?device=' + this.deviceId, HEADERS, 1000);
        const json = JSON.parse(response);
        items.getItem(this.effectItemName).postUpdate(json.effect);
      } catch (e) {
        console.warn(`Failed to fetch effect from ${logMsg}:`, e);
      }
      try {
        const response = actions.HTTP.sendHttpGetRequest(this.url + '/api/settings/effect?effect=effect_single&device=' + this.deviceId, HEADERS, 1000);
        const json = JSON.parse(response);
        const rgb = json.settings.custom_color;
        const hsb = HSBType.fromRGB(rgb[0], rgb[1], rgb[2]);
        items.getItem(this.colorItemName).postUpdate(hsb.toString());
      } catch (e) {
        console.warn(`Failed to fetch color from ${logMsg}:`, e);
      }
    }, this.refreshInterval);
  }

  /**
   * Creates the rule used for command handling.
   *
   * @returns {HostRule} command handling rule
   */
  createCommandHandlingRule () {
    const logMsg = `"${this.deviceId}"" of "${this.url}"`;
    const ruleConfig = {
      name: `mlsc REST client for "${this.deviceId}" of "${this.url}"`,
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
          actions.HTTP.sendHttpPostRequest(this.url + '/api/effect/active', 'application/json', JSON.stringify({
            device: this.deviceId,
            effect: event.receivedCommand
          }));
          if (this.switchItemName) items.getItem(this.switchItemName).postUpdate(event.receivedCommand === 'effect_off' ? 'OFF' : 'ON');
        } else if (event.itemName === this.colorItemName) {
          const hsb = HSBType.valueOf(event.receivedCommand);
          const r = parseInt(hsb.getRed() * 2.55);
          const g = parseInt(hsb.getGreen() * 2.55);
          const b = parseInt(hsb.getBlue() * 2.55);
          console.debug(`Commanding color of ${logMsg} to ${[r, g, b]}...`);
          actions.HTTP.sendHttpPostRequest(this.url + '/api/settings/effect', 'application/json', JSON.stringify({
            device: this.deviceId,
            effect: 'effect_single',
            settings: {
              custom_color: [r, g, b],
              use_custom_color: true
            }
          }));
          items.getItem(this.effectItemName).sendCommand('effect_single');
        }
      }
    };
    // Add switchItem as trigger if defined
    if (this.switchItemName) ruleConfig.triggers.push(triggers.ItemCommandTrigger(this.switchItemName));
    console.info(`Creating command handling rule for ${logMsg} ...`);
    return rules.JSRule(ruleConfig);
  }
}

module.exports = {
  MlscRestClient
};
