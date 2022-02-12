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
const logger = log('org.openhab.automation.js.@hotzware/openhab-tools.itemutils.dimmer');

/**
 * Controls an Item step-by-step to a target state. Only works for Items with support for float states.
 *
 * @memberof itemutils
 * @param {string} managerId id for the dimmer manager, used as key for the cache
 * @param {string} targetItem name of the Item to control
 * @param {number} targetState target to dim to
 * @param {number} step dimming step size
 * @param {number} time time in milliseconds between each step
 * @param {boolean} [ignoreExternalChange=true] whether to break dimmer if Item receives large external change
 * @returns {Object} object holding the existing dimmers (only for debugging)
 * @throws error when collection is no object
 * @throws error when targetItem does not support float state
 * @example
 * itemutils.dimmer('exampleManager', targetItem, targetState, step, time);
 */
const dimmer = (managerId, targetItem, targetState, step, time, ignoreExternalChange = false) => {
  // Check parameters and Items for compatibility.
  if (typeof managerId !== 'string') throw Error('managerId must be a string');
  const item = items.getItem(targetItem);
  if (!item.rawState.floatValue) throw Error('targetItem must support float states.');

  const collection = cache.get(managerId, () => { return {}; });
  // Check whether dimmer for that item already exists in collection.
  if (collection[targetItem] !== undefined) {
    logger.debug(`Dimmer for ${targetItem} already exists, skipping.`);
    return;
  }
  // Initialize and create dimmer.
  let state = parseFloat(item.state);
  const interval = setInterval(() => {
    state = (state > targetState) ? (state - step) : (state < targetState) ? (state + step) : state;
    item.sendCommand(state);
    // Function to call when the dimmer finishes or cancels.
    const breakDimmer = () => {
      clearInterval(interval);
      delete collection[targetItem];
    };
    // Cancel when targetState reached.
    if (state === targetState) breakDimmer();
    // Cancel when item receives large external change and breaking is set to true.
    const stateRet = parseFloat(item.state);
    if (Math.abs(stateRet - state) >= 2) {
      logger.debug(`Dimmer ${targetItem}: Difference between returned state ${stateRet} and calculated state ${state} is too large. External item change happened.`);
      if (!ignoreExternalChange) {
        // Make sure the new state stays and is not overwritten by command from before (openHAB doesn't react in milliseconds to changes).
        setTimeout(() => { item.sendCommand(stateRet); }, 250);
        breakDimmer();
        logger.debug(`Cancelled dimmer ${targetItem} due to external change.`);
      }
    }
  }, time);
  collection[targetItem] = interval;
  cache.put(managerId, collection);
  return collection;
};

module.exports = {
  dimmer
};
