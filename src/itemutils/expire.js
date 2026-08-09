/**
 * Copyright (c) 2026 Florian Hotze
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const { cache, items, rules, triggers } = require('openhab');

/**
 * Builds rule config for a universal expire rule with a second-accurate countdown.
 *
 * @private
 * @param {Object} config Configuration object
 * @param {string} config.itemName The item to monitor (e.g., Switch, Dimmer, etc.)
 * @param {time.Duration} config.delay Delay to wait before the timer expires and the specified action is performed
 * @param {'STATE'|'COMMAND'} [config.action='COMMAND'] The action to be performed when the timer expires
 * @param {string} config.targetState The state or command to be sent to the item when the timer expires
 * @param {boolean} [config.ignoreStateUpdates=false] Whether to ignore state updates and don't reset the timer
 * @param {boolean} [config.ignoreCommands=false] Whether to ignore commands and don't reset the timer
 * @param {string} [config.countdownItemName] The optional {@code Number:Time} item for the remaining countdown in seconds
 * @throws {TypeError} when {@code config} is invalid
 */
function _buildExpireCountdownRuleConfig (config) {
  const {
    itemName,
    delay,
    action = 'COMMAND',
    targetState,
    ignoreStateUpdates = false,
    ignoreCommands = false,
    countdownItemName
  } = config;

  if (typeof itemName !== 'string') throw new TypeError('`itemName` must be a string');
  if (typeof delay !== 'object') throw new TypeError('`delay` must be a time.Duration');
  if (typeof targetState !== 'string') throw new TypeError('`targetState` must be a string');

  const delaySeconds = delay.seconds();
  const delayMillis = delay.toMillis();

  const ruleTriggers = [];
  if (!ignoreCommands) {
    ruleTriggers.push(triggers.ItemCommandTrigger(itemName));
  }
  if (!ignoreStateUpdates) {
    ruleTriggers.push(triggers.ItemStateUpdateTrigger(itemName));
  }

  const cacheKey = `expire_timer_${itemName}`;

  const cancel = () => {
    const existingTimer = cache.shared.get(cacheKey);
    if (!existingTimer) return;
    clearInterval(existingTimer.interval);
    clearTimeout(existingTimer.timeout);
    cache.shared.remove(cacheKey);
  };

  return {
    name: `Universal Expire Countdown for ${itemName}`,
    description: `${countdownItemName ? 'Sends countdown to ' + countdownItemName + ' and p' : 'P'}erforms ${action} after ${delaySeconds}s`,
    triggers: ruleTriggers,
    execute: (event) => {
      const eventValue = event.receivedCommand ?? event.receivedState;

      if (eventValue === targetState) {
        // If the item assumes the target state/command, cancel the timer
        cancel();
        if (countdownItemName) {
          items.getItem(countdownItemName).postUpdate('0 s');
        }
      } else {
        // Otherwise, start or reset the timer
        cancel();

        let interval = null;
        const countdownItem = items.getItem(countdownItemName, true);
        if (countdownItem) {
          let remainingSeconds = delaySeconds;
          countdownItem.postUpdate(remainingSeconds);
          // Decrement and send the countdown every second
          interval = setInterval(() => {
            remainingSeconds--;
            if (remainingSeconds >= 0) {
              countdownItem.postUpdate(remainingSeconds + ' s');
            }
          }, 1000);
        }

        // Send the target action after the total duration expires
        const timeout = setTimeout(() => {
          clearInterval(interval);
          if (action === 'STATE') {
            items.getItem(itemName).postUpdate(targetState);
          } else {
            items.getItem(itemName).sendCommand(targetState);
          }
          if (countdownItemName) {
            items.getItem(countdownItemName).sendCommand(0);
          }
          cache.shared.remove(cacheKey);
        }, delayMillis);

        // Store references in the shared cache
        cache.shared.put(cacheKey, { interval, timeout });
      }
    }
  };
}

/**
 * Creates a universal expire rule with a second-accurate countdown.
 *
 * @memberof itemutils
 * @param {Object} config Configuration object
 * @param {string} config.itemName The item to monitor (e.g., Switch, Dimmer, etc.)
 * @param {time.Duration} config.delay Delay to wait before the timer expires and the specified action is performed
 * @param {'STATE'|'COMMAND'} [config.action='COMMAND'] The action to be performed when the timer expires
 * @param {string} config.targetState The state or command to be sent to the item when the timer expires
 * @param {boolean} [config.ignoreStateUpdates=false] Whether to ignore state updates and don't reset the timer
 * @param {boolean} [config.ignoreCommands=false] Whether to ignore commands and don't reset the timer
 * @param {string} [config.countdownItemName] The optional {@code Number:Time} item for the remaining countdown in seconds
 * @throws {TypeError} when {@code config} is invalid
 */
function createExpireCountdownRule (config) {
  const ruleConfig = _buildExpireCountdownRuleConfig(config);
  rules.JSRule(ruleConfig);
}

module.exports = {
  createExpireCountdownRule,
  _buildExpireCountdownRuleConfig
};
