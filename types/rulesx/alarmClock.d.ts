/**
 * Provides the full alarm clock.
 *
 * The manager rule that creates and updates the alarm clock rule {@link rulesx.getClockRule} on change of settings Items.
 * Also creates and removes the alarm clock rule on ON/OFF of switchItem.
 * @memberof rulesx
 * @param {String} switchItem name of Item to switch the alarm on/off
 * @param {*} alarmFunc function to execute when the alarm clock fires
 * @returns {HostRule} the alarm manager rule
 * @example
 * rulesx.getAlarmClock(switchItem, data => { console.log('Successfully tested alarm clock.'); });
 */
export function getAlarmClock(switchItem: string, alarmFunc: any): HostRule;
/**
 * Creates all required Items for an alarm clock.
 *
 * @memberof rulesx
 * @param {String} switchItemName name of Item to switch alarm on/off
 * @param {String} switchItemLabel label of Item to switch alarm on/off
 * @param {String} persistenceGroup name of group whose members are persisted & restored on startup
 * @param {Boolean} [sitemapSnippet=false] whether to output a Sitemap snippet for alarm configuration
 * @param {String[]} [weekdaysLabels=['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']] names of weekdays in your language, starting with Monday & ending with Sunday
 */
export function createAlarmClockItems(switchItemName: string, switchItemLabel: string, persistenceGroup: string, sitemapSnippet?: boolean, weekdaysLabels?: string[]): void;
//# sourceMappingURL=alarmClock.d.ts.map