/**
 * Copyright (c) 2021 Florian Hotze
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const { items } = require('openhab');

/**
 * Controls an Item step-by-step to a target state. Only works for Items with support for float states.
 *
 * @memberof itemUtils
 * @param {Object} collection object holding existing dimmers
 * @param {string} targetItem name of the Item to control
 * @param {number} targetState target to dim to
 * @param {number} step dimming step size
 * @param {number} time time in milliseconds between each step
 * @param {boolean} [breaking=true] whether to break dimmer if Item receives large external change
 * @returns {Object} object holding the existing dimmers
 * @throws error when collection is no object
 * @throws error when targetItem does not support float state
 * @example <caption>Store the collection of dimmers in cache.</caption>
 * let dimmers = cache.get(key, () => new Object());
 * dimmers = dimmer(collection, targetItem, targetState, step, time);
 * cache.put(key, dimmers);
 */
const dimmer = (collection, targetItem, targetState, step, time, breaking = true) => {
  // Check parameters and Items for compatibility.
  if (typeof collection !== 'object') throw Error('Collection must be an object');
  const item = items.getItem(targetItem);
  if (!item.rawState.floatValue) throw Error('targetItem must support float states.');
  // Check whether dimmer for that item already exists in collection.
  for (const i of collection) {
    if (typeof collection[i].item !== 'undefined') {
      console.debug(`Dimmer for ${targetItem} already exists, skipping.`);
      return;
    }
  }
  // Initialize and create dimmer.
  let state = parseFloat(item.state);
  const interval = setInterval(() => {
    state = (state > targetState) ? (state - step) : (state < targetState) ? (state + step) : state;
    item.sendCommand(state);
    // Function to call when the dimmer finishes or cancels.
    const breakDimmer = () => {
      clearInterval(interval);
      delete collection.targetItem;
    };
    // Cancel when targetState reached.
    if (state === targetState) breakDimmer();
    // Cancel when item receives large external change and breaking is set to true.
    const stateRet = parseFloat(item.state);
    if (Math.abs(stateRet - state) >= 2) {
      console.warn(`Difference between returned state ${stateRet} and calculated state ${state} is too large. External item change happened.`);
      if (breaking) {
        breakDimmer();
        console.debug(`Cancelled dimmer ${targetItem} due to external change.`);
      }
    }
  }, time);
  collection.targetItem = interval;
  return collection;
};

module.export = {
  dimmer: dimmer
};
