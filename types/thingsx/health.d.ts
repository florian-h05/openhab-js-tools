/**
 * Re-enables a Thing by disabling, and then enabling it again.
 *
 * @memberof thingsx
 * @param {string} thingUID
 */
export function reEnableThing(thingUID: string): void;
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
export function createThingStatusRule(groupName: string, patterns: string | Array<string>, replacements: string | Array<string>): void;
/**
 * Creates a rule that re-enables a Thing on command ON to a given Item.
 *
 * @memberof thingsx
 * @param {string} itemName
 * @param {string} thingUID
 */
export function createReEnableThingWithItemRule(itemName: string, thingUID: string): void;
//# sourceMappingURL=health.d.ts.map