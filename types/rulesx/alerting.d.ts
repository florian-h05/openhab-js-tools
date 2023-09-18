/**
 * configuration for rain alarm
 */
export type rainAlarmConfig = any;
/**
 * configuration for rainalarm
 */
export type heatOrFrostAlarmConfig = any;
/**
 * Creates the rain alarm rule.
 *
 * @memberof rulesx.alerting
 * @param {rainAlarmConfig} config rainalarm configuration
 */
export function createRainAlarmRule(config: rainAlarmConfig): void;
/**
 * Create the heat alarm rule.
 *
 * @memberof rulesx.alerting
 * @param {heatOrFrostAlarmConfig} config alarm configuration
 */
export function createHeatAlarmRule(config: heatOrFrostAlarmConfig): void;
/**
 * Create the frostalarm rule.
 *
 * @memberof rulesx.alerting
 * @param {heatOrFrostAlarmConfig} config alarm configuration
 */
export function createFrostAlarmRule(config: heatOrFrostAlarmConfig): void;
//# sourceMappingURL=alerting.d.ts.map