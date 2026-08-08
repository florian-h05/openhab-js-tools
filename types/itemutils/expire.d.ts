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
export function createExpireCountdownRule(config: {
    itemName: string;
    delay: time.Duration;
    action?: 'STATE' | 'COMMAND';
    targetState: string;
    ignoreStateUpdates?: boolean;
    ignoreCommands?: boolean;
    countdownItemName?: string;
}): void;
//# sourceMappingURL=expire.d.ts.map