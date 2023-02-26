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
 * Controls an Item step-by-step to a target state. Only works for Items with support for float states.
 *
 * @memberof itemutils
 * @param {string} managerID id for the dimmer manager, used as key for the cache
 * @param {string} targetItem name of the Item to control
 * @param {number} targetState target to dim to
 * @param {number} step dimming step size
 * @param {number} time time in milliseconds between each step
 * @param {boolean} [ignoreExternalChange=false] whether to break dimmer if Item receives large external change
 * @param {boolean} [overwrite=false] whether to cancel an existing dimmer and create a new one
 * @throws error when targetItem does not support float state or a parameter has wrong type
 *
 * @example
 * itemutils.dimmer('exampleManager', targetItem, targetState, step, time);
 */
const dimmer = (managerID, targetItem, targetState, step, time, ignoreExternalChange = false, overwrite = false) => {
  const CACHE_KEY = managerID;
  // Check Item and parameters.
  if (typeof managerID !== 'string') throw Error('managerID must be a string.');
  const item = items.getItem(targetItem);
  // @ts-ignore
  if (!item.rawState.floatValue()) throw Error('targetItem must support float states.');
  if (typeof targetState !== 'number') throw Error('targetState must be a number.');
  if (typeof step !== 'number') throw Error('step must be a number.');
  if (typeof time !== 'number') throw Error('time must be a number.');

  // If targetState already met, do not create a dimmer.
  let state = parseFloat(item.state);
  if (state === targetState) {
    logger.debug(`${targetItem} already has targetState ${targetState}, skipping.`);
    return;
  }
  // If targetState not met, create dimmer.
  const collection = cache.private.get(CACHE_KEY, () => { return new Map(); });
  // If dimmer for targetItem already exists, do not create new one.
  if (collection.has(targetItem)) {
    if (overwrite) {
      const interval = collection.get(targetItem);
      clearInterval(interval);
      collection.delete(targetItem);
      logger.info(`Dimmer ${targetItem}: already exists, overwriting.`);
    } else {
      logger.info(`Dimmer ${targetItem}: already exists, skipping.`);
      return;
    }
  }
  // Initialize and create dimmer.
  logger.info(`Dimming ${targetItem} to ${targetState}.`);
  const interval = setInterval(() => {
    // Function to call when the dimmer finishes or cancels.
    const breakDimmer = (msg) => {
      logger.info(`Dimmer ${targetItem}: Cancelled due to: ${msg}.`);
      clearInterval(interval);
      collection.delete(targetItem);
    };
    // Cancel when targetState is reached.
    // Workaround for an issue where the target state is never exactly met and therefore the dimmer never ends.
    if (Math.abs(state - targetState) <= 1) {
      breakDimmer('reached targetState');
      return;
    }
    // Item receives large external change or state update on Item is really slow.
    const stateRet = parseFloat(item.state);
    if (Math.abs(stateRet - state) > 2) {
      logger.debug(`Dimmer ${targetItem}: Difference between returned state ${stateRet} and (calculated) state ${state} is large. External item change happened or state update is slow.`);
      if (!ignoreExternalChange) {
        breakDimmer('external change');
        return;
      }
    }
    // Dim to target state.
    state = (state > targetState) ? (state - step) : (state < targetState) ? (state + step) : state;
    logger.trace(`Dimmer ${targetItem}: Sending command ${state} to ${targetItem}.`);
    item.sendCommand(state.toString());
  }, time);
  collection.set(targetItem, interval);
  cache.private.put(CACHE_KEY, collection);
};

module.exports = {
  dimmer
};
