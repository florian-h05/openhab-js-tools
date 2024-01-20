/**
 * Copyright (c) 2023 Florian Hotze
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const { actions, items, rules, triggers, utils } = require('openhab');
// @ts-ignore
const HSBType = Java.type('org.openhab.core.library.types.HSBType'); // eslint-disable-line no-unused-vars

/**
 * @typedef {Object} mlscRestClientConfig configuration for {@link MlscRestClient}
 * @memberof thingsx
 * @property {string} effectItemName name of the effect Item: Do NOT set state description metadata on that Item, this will be done for you.
 * @property {string} url full URL for mlsc, e.g. `http://127.0.0.1:8080`
 * @property {string} deviceId ID of device inside mlsc, use HTTP GET `/api/system/devices` to get a list of available devices
 * @property {string} [colorItemName] name of the color Item
 * @property {string} [dimmerItemName] name of the dimmer Item
 * @property {string} [defaultEffect='effect_gradient'] default effect for the `Dimmer` Item
 * @property {number} [refreshInterval=15000] refresh interval in milliseconds
 */

/**
 * A `MlscApiError` is thrown when a {@link MlscApi} operation fails.
 *
 * @private
 */
class MlscApiError extends Error {
  /**
   * @param {string} message
   */
  constructor (message) {
    super(message);
    super.name = 'MlscApiError';
  }
}

/**
 * The `MlscApi` class provides access to the REST API of music led strip control.
 *
 * @private
 */
class MlscApi {
  static #HEADERS = new Map([['accept', 'application/json']]);
  /**
   * All available non music and music effects.
   *
   * @type {{music: object, non_music: object}}
   */
  static effects;

  #baseUrl;
  #deviceId;
  #prettyName;

  /**
   * @param {string} url full URL of the music led strip control server, e.g. `http://127.0.0.1:8080`
   * @param {string} deviceId id of device inside mlsc, use HTTP GET `/api/system/devices` to get a list of available devices
   */
  constructor (url, deviceId) {
    // Validate parameters
    if (typeof url !== 'string') throw new Error('url must be a string!');
    if (typeof deviceId !== 'string') throw new Error('deviceId must be a string!');

    // Initialize private fields
    this.#baseUrl = url + '/api/';
    this.#deviceId = deviceId;
    this.#prettyName = `${deviceId} on ${url}`;

    // Initialize static field effects
    if (!MlscApi.effects) MlscApi.effects = this.#getAvailableEffects();
  }

  #getAvailableEffects () {
    console.debug(`Getting available effects from ${this.#prettyName} ...`);
    try {
      const response = actions.HTTP.sendHttpGetRequest(this.#baseUrl + 'resources/effects', MlscApi.#HEADERS, 1000);
      return JSON.parse(response);
    } catch (e) {
      throw new MlscApiError('Failed to get available effects: ' + e);
    }
  }

  #getEffect () {
    console.debug(`Getting effect from ${this.#prettyName} ...`);
    try {
      const response = actions.HTTP.sendHttpGetRequest(this.#baseUrl + 'effect/active?device=' + this.#deviceId, MlscApi.#HEADERS, 1000);
      const json = JSON.parse(response);
      return json.effect;
    } catch (e) {
      throw new MlscApiError('Failed to get effect: ' + e);
    }
  }

  #getBrightness () {
    console.debug(`Getting brightness from ${this.#prettyName} ...`);
    try {
      const response = actions.HTTP.sendHttpGetRequest(`${this.#baseUrl}/settings/device?device=${this.#deviceId}&setting_key=led_brightness`, MlscApi.#HEADERS, 1000);
      const json = JSON.parse(response);
      return parseInt(json.setting_value);
    } catch (e) {
      throw new MlscApiError('Failed to get brightness: ' + e);
    }
  }

  #getColor () {
    console.debug(`Getting color from ${this.#prettyName} ...`);
    try {
      const response = actions.HTTP.sendHttpGetRequest(this.#baseUrl + 'settings/effect?effect=effect_single&device=' + this.#deviceId, MlscApi.#HEADERS, 1000);
      const json = JSON.parse(response);
      const rgb = json.settings.custom_color;
      return HSBType.fromRGB(rgb[0], rgb[1], rgb[2]);
    } catch (e) {
      throw new MlscApiError('Failed to get color: ' + e);
    }
  }

  /**
   * Set the effect.
   * If the passed in effect is invalid, an error is thrown.
   *
   * @param {string} effect new effect
   * @throws MlscApiError if effect is invalid or the API request failed
   */
  setEffect (effect) {
    console.debug(`Setting effect of ${this.#prettyName} to ${effect} ...`);

    if (!Object.keys(MlscApi.effects.music).concat(Object.keys(MlscApi.effects.non_music)).includes(effect)) {
      throw new MlscApiError('Failed to set effect: Invalid value ' + effect);
    }

    try {
      actions.HTTP.sendHttpPostRequest(this.#baseUrl + 'effect/active', 'application/json', JSON.stringify({
        device: this.#deviceId,
        effect
      }));
    } catch (e) {
      throw new MlscApiError('Failed to set effect: ' + e);
    }
  }

  /**
   * Set the brightness.
   * If the passed in value is not `ON`, `OFF` or an integer between 0 and 100, an error is thrown.
   *
   * @param {number|string} brightness brightness value as integer between 0 and 100 or `ON` or `OFF`
   * @throws MlscApiError if brightness is invalid or the API request failed
   */
  setBrightness (brightness) {
    console.debug(`Setting brightness of ${this.#prettyName} to ${brightness} ...`);
    if (brightness === 'OFF') brightness = 0;
    if (brightness === 'ON') brightness = 100;

    // @ts-ignore
    const intValue = parseInt(brightness);
    if (isNaN(intValue) || intValue < 0 || intValue > 100) {
      throw new MlscApiError('Failed to set brightness: Invalid value ' + brightness);
    }

    try {
      actions.HTTP.sendHttpPostRequest(this.#baseUrl + 'settings/device', 'application/json', JSON.stringify({
        device: this.#deviceId,
        settings: {
          led_brightness: intValue
        }
      }));
    } catch (e) {
      throw new MlscApiError('Failed to set brightness: ' + e);
    }
  }

  /**
   * Set the color.
   * If the passed in value is not a HSBType, an error is thrown.
   *
   * @param {*} hsb instance of {@link https://www.openhab.org/javadoc/latest/org/openhab/core/library/types/hsbtype org.openhab.core.library.types.HSBType}
   * @throws MlscApiError if hsb is no HSBType or the API request failed
   */
  setColor (hsb) {
    console.debug(`Setting color of ${this.#prettyName} to ${hsb} ...`);
    if (!utils.isJsInstanceOfJavaType(hsb, HSBType)) {
      throw new MlscApiError('Failed to set color: hsb must be a "org.openhab.core.library.types.HSBType"');
    }

    // @ts-ignore
    const r = parseInt(hsb.getRed() * 2.55);
    // @ts-ignore
    const g = parseInt(hsb.getGreen() * 2.55);
    // @ts-ignore
    const b = parseInt(hsb.getBlue() * 2.55);

    try {
      actions.HTTP.sendHttpPostRequest(this.#baseUrl + 'settings/effect', 'application/json', JSON.stringify({
        device: this.#deviceId,
        effect: 'effect_single',
        settings: {
          custom_color: [r, g, b],
          use_custom_color: true
        }
      }));
    } catch (e) {
      throw new MlscApiError('Failed to set color: ' + e);
    }
  }

  /**
   * Get the current, processed state.
   *
   * @returns {{brightness: number, color: null, effect: (string|any)}|{brightness: number, color: *, effect: (string|any|AnimationEffect)}}
   */
  getProcessedState () {
    console.debug(`Getting state from ${this.#prettyName} ...`);
    const effect = this.#getEffect();
    if (effect === 'effect_off') {
      return {
        effect,
        brightness: 0,
        color: null
      };
    }
    return {
      effect,
      brightness: this.#getBrightness(),
      color: this.#getColor()
    };
  }
}

/**
 * music_led_strip_control REST client
 *
 * Class providing state fetching from and command sending to the REST API of {@link https://github.com/TobKra96/music_led_strip_control music_led_strip_control}.
 * It is using a scheduled job to fetch states and a rule to handle commands.
 *
 * @example
 * var { thingsx } = require('@hotzware/openhab-tools');
 * var FlorianRGB = new thingsx.MlscRestClient({
 *   effectItemName: 'FlorianRGB_effect',
 *   url: 'http://127.0.0.1:8080',
 *   deviceId: 'device_0',
 *   colorItemName: 'FlorianRGB_color',
 *   dimmerItemName: 'FlorianRGB_dimmer'
 * });
 * FlorianRGB.scheduleStateFetching();
 * FlorianRGB.createCommandHandlingRule();
 *
 * @memberof thingsx
 */
class MlscRestClient {
  #config;
  #prettyName;
  #api;
  #effect = null;
  #lastEffect = 'effect_gradient';

  /**
   * Be aware that you need to call {@link scheduleStateFetching} and {@link createCommandHandlingRule} to fully initialize the REST client.
   *
   * @param {mlscRestClientConfig} config mlsc REST client config
   */
  constructor (config) {
    // Validate parameters
    if (typeof config.effectItemName !== 'string') throw new Error('effectItemName must be a string!');
    if (config.colorItemName && typeof config.colorItemName !== 'string') throw new Error('colorItemName must be a string!');
    if (config.dimmerItemName && typeof config.dimmerItemName !== 'string') throw new Error('dimmerItemName must be a string!');
    if (config.defaultEffect && typeof config.defaultEffect !== 'string') throw new Error('defaultEffect must be a string!');
    if (config.refreshInterval && typeof config.refreshInterval !== 'number') throw new Error('refreshInterval must be a number!');

    // Initialize private fields
    this.#config = config;
    // Fallback to defaults
    if (!this.#config.defaultEffect) this.#config.defaultEffect = 'effect_gradient';
    if (!this.#config.refreshInterval) this.#config.refreshInterval = 15000;
    this.#prettyName = `${this.#config.deviceId} of ${this.#config.url}`;

    // Initialize API
    this.#api = new MlscApi(config.url, config.deviceId);

    // Set command/state description metadata on effect Item
    this.#setCommandAndStateDescription();
  }

  #setCommandAndStateDescription () {
    console.info(`Setting state description of ${this.#config.effectItemName} to available effects ...`);
    let options = '"effect_off"="Off"';
    for (const [key, value] of Object.entries(MlscApi.effects.non_music)) {
      options += `"${key}"="${value}", `;
    }
    for (const [key, value] of Object.entries(MlscApi.effects.music)) {
      options += `"${key}"="Music - ${value}", `;
    }
    options = options.substring(0, options.length - 2); // Remove last " ,"
    items.metadata.replaceMetadata(this.#config.effectItemName, 'stateDescription', '', {
      options
    });
  }

  #updateState () {
    let state;
    try {
      state = this.#api.getProcessedState();
    } catch (e) {
      if (e instanceof MlscApiError) {
        console.warn(e);
        return;
      }
      throw e;
    }
    this.#effect = state.effect;
    if (state.effect !== 'effect_off') this.#lastEffect = state.effect;
    items.getItem(this.#config.effectItemName).postUpdate(state.effect);

    if (this.#config.colorItemName && state.color) items.getItem(this.#config.colorItemName).postUpdate(state.color.toString());
    if (this.#config.dimmerItemName) items.getItem(this.#config.dimmerItemName).postUpdate(state.brightness);
  }

  /**
   * Schedules the state fetching using `setInterval`.
   *
   * @returns {NodeJS.Timeout} `intervalId` of the interval used for state fetching
   */
  scheduleStateFetching () {
    console.info(`Initializing state fetching for ${this.#prettyName} ...`);
    return setInterval(() => {
      this.#updateState();
    }, this.#config.refreshInterval);
  }

  /**
   * Creates the rule used for command handling.
   */
  createCommandHandlingRule () {
    const ruleConfig = {
      name: `mlsc REST client for "${this.#config.deviceId}" of "${this.#config.url}"`,
      description: 'Provides command handling, state fetching is done by a scheduled job',
      triggers: [
        triggers.ItemCommandTrigger(this.#config.effectItemName)
      ],
      execute: (event) => {
        console.debug(`Handling command ${event.receivedCommand} of ${event.itemName} for ${this.#prettyName} ...`);
        // Handle effect control
        if (event.itemName === this.#config.effectItemName) {
          try {
            this.#api.setEffect(event.receivedCommand);
          } catch (e) {
            if (e instanceof MlscApiError) {
              console.warn(e);
              return;
            }
            throw e;
          }
          this.#updateState();

          // Handle color control
        } else if (event.itemName === this.#config.colorItemName) {
          const hsb = HSBType.valueOf(event.receivedCommand);
          try {
            this.#api.setColor(hsb);
          } catch (e) {
            if (e instanceof MlscApiError) {
              console.warn(e);
              return;
            }
            throw e;
          }
          items.getItem(this.#config.effectItemName).sendCommandIfDifferent('effect_single');
          this.#updateState();

          // Handle dimmer control
        } else if (this.#config.dimmerItemName && event.itemName === this.#config.dimmerItemName) {
          if (event.receivedCommand === 'OFF' || event.receivedCommand === '0') {
            items.getItem(this.#config.effectItemName).sendCommandIfDifferent('effect_off');
          } else {
            try {
              this.#api.setBrightness(event.receivedCommand);
            } catch (e) {
              if (e instanceof MlscApiError) {
                console.warn(e);
                return;
              }
              throw e;
            }
            // Turn on the stripes if needed
            if (this.#effect === 'effect_off') {
              items.getItem(this.#config.effectItemName).sendCommandIfDifferent(this.#lastEffect);
            }
          }
          this.#updateState();
        }
      },
      id: `mlsc-rest-client-for-${this.#config.dimmerItemName || this.#config.effectItemName}`,
      tags: ['@hotzware/openhab-tools', 'MlscRestClient', 'music_led_strip_control']
    };
    // Add colorItem as trigger (if defined)
    if (this.#config.colorItemName) ruleConfig.triggers.push(triggers.ItemCommandTrigger(this.#config.colorItemName));
    // Add dimmerItem as trigger (if defined)
    if (this.#config.dimmerItemName) ruleConfig.triggers.push(triggers.ItemCommandTrigger(this.#config.dimmerItemName));
    console.info(`Creating command handling rule for ${this.#prettyName} ...`);
    rules.JSRule(ruleConfig);
  }

  /**
   * Get all available music and non-music effects.
   *
   * @returns {{music: Object, non_music: Object}}
   */
  getAvailableEffects () {
    return MlscApi.effects;
  }
}

module.exports = {
  MlscRestClient
};
