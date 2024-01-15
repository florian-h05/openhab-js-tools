/**
 * Copyright (c) 2023 Florian Hotze
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const { actions, cache, items, rules, triggers } = require('openhab');
// @ts-ignore
const HSBType = Java.type('org.openhab.core.library.types.HSBType'); // eslint-disable-line no-unused-vars

const HEADERS = new Map([['accept', 'application/json']]);

/**
 * @typedef {Object} mlscRestClientConfig configuration for {@link MlscRestClient}
 * @memberof thingsx
 * @property {string} effectItemName name of the effect Item
 * @property {string} url full URL for mlsc, e.g. `http://127.0.0.1:8080`
 * @property {string} deviceId ID of device inside mlsc, use HTTP GET `/api/system/devices` to get a list of available devices
 * @property {string} [colorItemName] name of the color Item
 * @property {string} [dimmerItemName] name of the dimmer Item
 * @property {string} [defaultEffect='effect_gradient'] default effect for the `Dimmer` Item
 * @property {number} [refreshInterval=15000] refresh interval in milliseconds
 */

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
   * @param {mlscRestClientConfig} config MLSC REST client config
   */
  constructor (config) {
    if (typeof config.effectItemName !== 'string') throw new Error('effectItemName must be a string!');
    if (typeof config.url !== 'string') throw new Error('url must be a string!');
    if (typeof config.deviceId !== 'string') throw new Error('deviceId must be a string!');
    if (config.colorItemName && typeof config.colorItemName !== 'string') throw new Error('colorItemName must be a string!');
    if (config.dimmerItemName && typeof config.dimmerItemName !== 'string') throw new Error('dimmerItemName must be a string!');
    if (config.defaultEffect && typeof config.defaultEffect !== 'string') throw new Error('defaultEffect must be a string!');
    if (config.refreshInterval && typeof config.refreshInterval !== 'number') throw new Error('refreshInterval must be a number!');

    this.config = config;

    if (!this.config.defaultEffect) this.config.defaultEffect = 'effect_gradient';
    if (!this.config.refreshInterval) this.config.refreshInterval = 15000;

    this.id = `mlsc-rest-client-for-${this.config.dimmerItemName || this.config.effectItemName}`;
    this.logMsg = `"${this.config.deviceId}" of "${this.config.url}"`;
  }

  /**
   * Schedules the state fetching using `setInterval`
   *
   * @returns {number} `intervalId`
   */
  scheduleStateFetching () {
    console.info(`Initializing state fetching for ${this.logMsg} ...`);
    return setInterval(() => {
      console.debug(`Refreshing Items from ${this.logMsg} ...`);
      let currentEffect;
      // Fetch effect
      try {
        const response = actions.HTTP.sendHttpGetRequest(this.config.url + '/api/effect/active?device=' + this.config.deviceId, HEADERS, 1000);
        const json = JSON.parse(response);
        currentEffect = json.effect;
        items.getItem(this.config.effectItemName).postUpdate(currentEffect);
        // Store current effect (if not effect_off)
        if (currentEffect !== 'effect_off') {
          cache.private.put(this.id + '-last-effect', currentEffect);
        } else if (this.config.dimmerItemName) {
          items.getItem(this.config.dimmerItemName).postUpdate('OFF');
          return;
        }
      } catch (e) {
        console.warn(`Failed to fetch effect from ${this.logMsg}:`, e);
      }
      // Fetch color
      if (this.config.colorItemName) {
        try {
          const response = actions.HTTP.sendHttpGetRequest(this.config.url + '/api/settings/effect?effect=effect_single&device=' + this.config.deviceId, HEADERS, 1000);
          const json = JSON.parse(response);
          const rgb = json.settings.custom_color;
          const hsb = HSBType.fromRGB(rgb[0], rgb[1], rgb[2]);
          items.getItem(this.config.colorItemName).postUpdate(hsb.toString());
        } catch (e) {
          console.warn(`Failed to fetch color from ${this.logMsg}:`, e);
        }
      }
      // Fetch brightness
      if (this.config.dimmerItemName) {
        try {
          const response = actions.HTTP.sendHttpGetRequest(`${this.config.url}/api/settings/device?device=${this.config.deviceId}&setting_key=led_brightness`, HEADERS, 1000);
          const json = JSON.parse(response);
          items.getItem(this.config.dimmerItemName).postUpdate(json.setting_value.toString());
        } catch (e) {
          console.warn(`Failed to fetch brightness from ${this.logMsg}:`, e);
        }
      }
    }, this.config.refreshInterval);
  }

  /**
   * Creates the rule used for command handling.
   *
   * @returns {HostRule} command handling rule
   */
  createCommandHandlingRule () {
    const ruleConfig = {
      name: `mlsc REST client for "${this.config.deviceId}" of "${this.config.url}"`,
      description: 'Provides command handling, state fetching is done by a scheduled job',
      triggers: [
        triggers.ItemCommandTrigger(this.config.effectItemName)
      ],
      execute: (event) => {
        // Handle effect control
        if (event.itemName === this.config.effectItemName) {
          console.debug(`Commanding effect of ${this.logMsg} to ${event.receivedCommand} ...`);
          actions.HTTP.sendHttpPostRequest(this.config.url + '/api/effect/active', 'application/json', JSON.stringify({
            device: this.config.deviceId,
            effect: event.receivedCommand
          }));
          // Store current effect (if not effect_off)
          if (event.receivedCommand !== 'effect_off') {
            cache.private.put(this.id + '-last-effect', event.receivedCommand);
            // Update dimmer Item to OFF (if defined)
          } else if (this.config.dimmerItemName) {
            items.getItem(this.config.dimmerItemName).postUpdate('OFF');
          }
          // Handle color control
        } else if (event.itemName === this.config.colorItemName) {
          const hsb = HSBType.valueOf(event.receivedCommand);
          // @ts-ignore
          const r = parseInt(hsb.getRed() * 2.55);
          // @ts-ignore
          const g = parseInt(hsb.getGreen() * 2.55);
          // @ts-ignore
          const b = parseInt(hsb.getBlue() * 2.55);
          console.debug(`Commanding color of ${this.logMsg} to ${[r, g, b]}...`);
          actions.HTTP.sendHttpPostRequest(this.config.url + '/api/settings/effect', 'application/json', JSON.stringify({
            device: this.config.deviceId,
            effect: 'effect_single',
            settings: {
              custom_color: [r, g, b],
              use_custom_color: true
            }
          }));
          items.getItem(this.config.effectItemName).sendCommandIfDifferent('effect_single');
          // Handle dimmer control
        } else if (this.config.dimmerItemName && event.itemName === this.config.dimmerItemName) {
          if (event.receivedCommand === 'OFF' || event.receivedCommand === '0') {
            items.getItem(this.config.effectItemName).sendCommandIfDifferent('effect_off');
          } else {
            console.debug(`Commanding brightness of ${this.logMsg} to ${event.receivedCommand} ...`);
            actions.HTTP.sendHttpPostRequest(this.config.url + '/api/settings/device', 'application/json', JSON.stringify({
              device: this.config.deviceId,
              settings: {
                led_brightness: event.receivedCommand
              }
            }));
            items.getItem(this.config.effectItemName).sendCommandIfDifferent(cache.private.get(this.id + '-last-effect', () => this.config.defaultEffect));
          }
        }
      },
      id: this.id,
      tags: ['@hotzware/openhab-tools', 'MlscRestClient', 'music_led_strip_control']
    };
    // Add colorItem as trigger (if defined)
    if (this.config.colorItemName) ruleConfig.triggers.push(triggers.ItemCommandTrigger(this.config.colorItemName));
    // Add dimmerItem as trigger (if defined)
    if (this.config.dimmerItemName) ruleConfig.triggers.push(triggers.ItemCommandTrigger(this.config.dimmerItemName));
    console.info(`Creating command handling rule for ${this.logMsg} ...`);
    return rules.JSRule(ruleConfig);
  }
}

module.exports = {
  MlscRestClient
};
