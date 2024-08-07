/**
 * Copyright (c) 2023 Florian Hotze
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const { actions, cache, items, rules, things, triggers } = require('openhab');

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
function createThingStatusToItemRule (groupName, patterns, replacements) {
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
    tags: ['@hotzware/openhab-tools', 'createThingStatusToItemRule']
  });
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
 * @param {string} thingUID
 * @param {string|Array<string>} patterns Pattern(s) to replace.
 * @param {string|Array<string>} replacements String(s) that is/are used for replacing.
 */

/**
 * Creates a rule that sends a notification if a Thing goes offline and another one if it goes back online.
 *
 * @memberof thingsx
 * @param {string} thingUID
 * @param {string[]} [recipients] the recipients of the notification: leave empty to send a broadcast notification or put the email addresses of the openHAB Cloud users to receive the notification
 * @param {number} [offlineDuration=60] the duration to wait for the Thing to come back online before sending the offline notification
 * @param {number} [onlineDuration=30] the duration to wait for the Thing to stay online before sending the online notification
 * @param {string} [offlineMessage='WARNUNG: %LABEL nicht mehr erreichbar (%STATUS)!'] the message to send when the Thing goes offline: use %UID, %LABEL, and %STATUS as placeholders for the respective values
 * @param {string} [onlineMessage='%LABEL wieder erreichbar.'] the message to send when the Thing goes back online: use %UID and %LABEL as placeholders for the respective values
 */
function createThingStatusNotificationRule (thingUID, recipients = [], offlineDuration = 60, onlineDuration = 30,
  offlineMessage = 'WARNUNG: %LABEL nicht mehr erreichbar (%STATUS)!', onlineMessage = '%LABEL wieder erreichbar.') {
  const cacheKey = `${thingUID}-offlineNotificationReferenceId`;

  rules.JSRule({
    name: `Thing ${thingUID} status notification`,
    description: 'Send a broadcast notification if the Thing goes offline and if it goes back online',
    triggers: [
      triggers.ThingStatusChangeTrigger(thingUID, undefined, 'ONLINE'),
      triggers.ThingStatusChangeTrigger(thingUID, 'ONLINE')
    ],
    execute: (event) => {
      if (event.newStatus !== 'ONLINE') {
        if (cache.private.exists(cacheKey)) return;
        setTimeout(() => {
          const thing = things.getThing(thingUID);
          if (thing.status === 'ONLINE') return;
          if (cache.private.exists(cacheKey)) return;
          const builder = actions.notificationBuilder(offlineMessage.replace('%UID', thingUID).replace('%LABEL', thing.label).replace('%STATUS', event.newStatus))
            .withIcon('error').withTitle('Thing offline');
          for (const recipient of recipients) {
            builder.addUserId(recipient);
          }
          builder.send();
          const referenceId = builder.send();
          cache.private.put(cacheKey, referenceId);
        }, offlineDuration * 1000);
      } else {
        if (!cache.private.exists(cacheKey)) return;
        setTimeout(() => {
          const thing = things.getThing(thingUID);
          if (thing.status !== 'ONLINE') return;
          if (!cache.private.exists(cacheKey)) return;
          const referenceId = cache.private.get(cacheKey);
          const builder = actions.notificationBuilder(onlineMessage.replace('%UID', thingUID).replace('%LABEL', thing.label))
            .withIcon('error').withTitle('Thing wieder online').withReferenceId(referenceId);
          for (const recipient of recipients) {
            builder.addUserId(recipient);
          }
          builder.send();
          cache.private.remove(cacheKey);
        }, onlineDuration * 1000);
      }
    },
    id: 'thing-status-notification-' + thingUID,
    tags: ['@hotzware/openhab-tools', 'createThingStatusNotificationRule']
  });
}

/**
 * Creates a rule that re-enables a Thing on command ON to a given Item.
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
    tags: ['@hotzware/openhab-tools', 'createReEnableThingWithItemRule']
  });
}

module.exports = {
  reEnableThing,
  createThingStatusToItemRule,
  createThingStatusNotificationRule,
  createReEnableThingWithItemRule
};
