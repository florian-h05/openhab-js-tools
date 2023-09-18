/**
 * Copyright (c) 2022 Florian Hotze
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const { cache, items, log } = require('openhab');
const logger = log('org.openhab.automation.js.openhab-tools.itemutils.dimmer');

/**
 * Dims an Item step-by-step to a target state.
 *
 * Only works for Items with support for float states.
 * The dimmer uses the shared cache to ensure that there are not multiple timers for the same Item active at the same time.
 *
 * @example
 * // Dim the Bedroom_Light to 50% in 750 seconds (1% each 15 seconds).
 * itemutils.dimItem('Bedroom_Light', 50.0, 1, 15 * 1000);
 *
 * @memberof itemutils
 * @param {string} itemName name of the Item to control
 * @param {number} targetState float number to dim to
 * @param {number} step dimming step size
 * @param {number} time time in milliseconds between each step
 * @param {boolean} [ignoreExternalChange=false] whether to break dimmer if Item receives a large external change
 * @param {boolean} [overwrite=false] whether to cancel an existing dimmer and create a new one
 * @throws {TypeError} when a parameter has wrong type
 *
 */
function dimItem (itemName, targetState, step, time, ignoreExternalChange = false, overwrite = false) {
  // Get Item and check parameters.
  const item = items.getItem(itemName);
  // @ts-ignore
  if (typeof targetState !== 'number') throw TypeError('targetState must be a number!');
  if (typeof step !== 'number') throw TypeError('step must be a number!');
  if (typeof time !== 'number') throw TypeError('time must be a number!');

  const CACHE_KEY = 'hotzware_openhab-js-tools_dimmer-for-' + itemName;

  // If targetState already met, do not create a dimmer.
  if (items.getItem(itemName).numericState === targetState) {
    logger.debug(`${itemName} already has targetState ${targetState}, skipping.`);
    return;
  }

  // If targetState not met, create dimmer.
  // If dimmer for itemName already exists, do not create new one.
  const intervalIdFromCache = cache.shared.get(CACHE_KEY);
  if (intervalIdFromCache !== null) {
    if (overwrite) {
      clearInterval(intervalIdFromCache);
      cache.shared.put(CACHE_KEY, null);
      logger.info(`Dimmer for Item ${itemName} already exists, overwriting.`);
    } else {
      logger.info(`Dimmer for Item ${itemName} already exists, skipping.`);
      return;
    }
  }

  // Initialize and create dimmer.
  logger.info(`Dimming Item ${itemName} to ${targetState} ...`);
  let calculatedState = items.getItem(itemName).numericState;
  const intervalId = setInterval(() => {
    /**
     * Cancels the dimmer and removes the intervalId from the cache.
     * @param {string} msg message to log
     */
    function breakDimmer (msg) {
      logger.info(`Dimmer for Item ${itemName} ${msg}`);
      clearInterval(intervalId);
      cache.shared.put(CACHE_KEY, null);
    }
    // Cancel when targetState is reached.
    // Workaround for an issue where the target state is never exactly met because the step size is too large and therefore the dimmer never ends.
    if (Math.abs(calculatedState - targetState) < step) {
      item.sendCommand(targetState.toString()); // Ensure the target state is met
      logger.trace(`Dimmer for ${itemName}: Sending command ${targetState}.`);
      breakDimmer('reached target state.');
      return;
    }
    // Item receives large external change or state update on Item is really slow.
    const realState = items.getItem(itemName).numericState;
    if (Math.abs(realState - calculatedState) > 2) {
      logger.debug(`Dimmer ${itemName}: Difference between real state ${realState} and calculated state ${calculatedState} is large. External item change happened or state update is slow.`);
      if (!ignoreExternalChange) {
        breakDimmer('cancelled due to external change.');
        return;
      }
    }
    // Dim to target state.
    calculatedState = calculatedState > targetState ? calculatedState - step : (calculatedState < targetState ? calculatedState + step : calculatedState);
    logger.trace(`Dimmer for ${itemName}: Sending command ${calculatedState}.`);
    item.sendCommand(calculatedState.toString());
  }, time);
  cache.shared.put(CACHE_KEY, intervalId);
}

module.exports = {
  dimItem
};
