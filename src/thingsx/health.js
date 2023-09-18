/**
 * Copyright (c) 2023 Florian Hotze
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const { triggers, items, rules, actions, things } = require('openhab');

/**
 * Get a Thing's UID from Item name by replacing patterns with replacements.
 * If patterns is an Array, replacements must be an Array and search-replace pairs must have the same index.
 * This method is using {@link replaceAll}.
 *
 * @example
 * _getThingNameFromStateItemName('KNX_FF_Lights_state', ['_state', 'KNX_'], ['', 'knx:device:bridge:']);
 * // Returns: knx:device:bridge:FF_Lights
 *
 * @private
 * @param {string} itemName Item's name
 * @param {string|Array<string>} patterns Pattern(s) to replace.
 * @param {string|Array<string>} replacements String(s) that is/are used for replacing.
 */
function _getThingNameFromStateItemName (itemName, patterns, replacements) {
  if (typeof patterns === 'string' && typeof replacements === 'string') return itemName.replaceAll(patterns, replacements);
  // If patterns and replacements are Arrays:
  let thingUID = itemName;
  if (typeof patterns === 'object') {
    for (const i in patterns) {
      thingUID = thingUID.replaceAll(patterns[i], replacements[i]);
    }
    return thingUID;
  }
}

/**
 * Re-enables a Thing by disabling, and then enabling it again.
 *
 * @memberof thingsx
 * @param {string} thingUID
 */
function reEnableThing (thingUID) {
  const thing = things.getThing(thingUID);
  thing.setEnabled(false);
  setTimeout(() => {
    thing.setEnabled(true);
  }, 1000);
}

/**
 * Creates a rule that posts Thing statuses to String Items.
 * The rule takes the name of a group of String Items, generates a Thing UID for each member Item using string replace operations, and then posts the Thing status on every Thing status change to the Items.
 * The rule also runs when start level 100 is reached and regularly (every 5 minutes, starting with minute 0).
 *
 * @example
 * thingsx.createThingStatusRule('gYamahaState', ['_state', '_'], ['', ':']);
 * // This removes "_state" fromt the Item name and replaces all "_" with ":" to get the Thing UID from the members of the "gYamahaState" group members.
 *
 * @memberof thingsx
 * @param {string} groupName
 * @param {string|Array<string>} patterns Pattern(s) to replace.
 * @param {string|Array<string>} replacements String(s) that is/are used for replacing.
 */
function createThingStatusRule (groupName, patterns, replacements) {
  // Set up default triggers for thing status rules.
  const triggersList = [
    triggers.SystemStartlevelTrigger('100'),
    triggers.GenericCronTrigger('0 0/5 * ? * * *')
  ];

  // Add ThingStatusChangeTrigger for the matching Thing of each group member
  // Translates from Item name to Thing UID using replace based on patterns and replacements
  const members = items.getItem(groupName).members.map(item => item.name);
  const pairs = new Map();
  for (const i in members) {
    const thingUID = _getThingNameFromStateItemName(members[i], patterns, replacements);
    triggersList.push(triggers.ThingStatusChangeTrigger(thingUID));
    // Store the pairs, so we don't have to get the Thing names again later.
    pairs.set(members[i], thingUID);
  }

  // Create the rule.
  rules.JSRule({
    name: 'Thing states to Item group ' + groupName,
    description: 'Send the Thing\'s states on change to the according String Items which hold the state.',
    triggers: triggersList,
    execute: (event) => {
      // Update the state of each member Item with the matching Thing's state.
      for (const i in members) {
        const thingUID = pairs.get(members[i]);
        const thingStatus = String(actions.Things.getThingStatusInfo(thingUID));
        items.getItem(members[i]).postUpdate(thingStatus);
      }
    },
    id: 'thing-status-to-items-of-group-' + groupName,
    tags: ['@hotzware/openhab-tools', 'createThingStatusRule', 'Things']
  });
}

/**
 * Creates a rule that re-enabled a Thing on command ON to a given Item.
 *
 * @memberof thingsx
 * @param {string} itemName
 * @param {string} thingUID
 */
function createReEnableThingWithItemRule (itemName, thingUID) {
  rules.JSRule({
    name: 'Re-enable ' + thingUID + ' with ' + itemName,
    description: 'Disables and then enables a Thing again on command ON.',
    triggers: triggers.ItemCommandTrigger(itemName, 'ON'),
    execute: (event) => {
      reEnableThing(thingUID);
      // Set command Item to OFF.
      items.getItem(itemName).postUpdate('OFF');
    },
    id: 're-enable-' + thingUID + '-with-' + itemName,
    tags: ['@hotzware/openhab-tools', 'createReEnableThingWithItemRule', 'Things']
  });
}

module.exports = {
  reEnableThing,
  createThingStatusRule,
  createReEnableThingWithItemRule
};
