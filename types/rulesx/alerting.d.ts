/**
 * configuration for rainalarm
 */
export type rainalarmConfig = any;
/**
 * configuration for rainalarm
 */
export type heatfrostalarmConfig = any;
/**
 * Returns the rainalarm rule.
 * @memberof rulesx.alerting
 * @param {rainalarmConfig} config rainalarm configuration
 * @returns {HostRule}
 */
export function getRainalarmRule(config: rainalarmConfig): HostRule;
/**
 * Returns the heatalarm rule.
 * @memberof rulesx.alerting
 * @param {heatfrostalarmConfig} config alarm configuration
 * @returns {HostRule}
 */
export function getHeatalarmRule(config: heatfrostalarmConfig): HostRule;
/**
 * Returns the frostalarm rule.
 * @memberof rulesx.alerting
 * @param {heatfrostalarmConfig} config alarm configuration
 * @returns {HostRule}
 */
export function getFrostalarmRule(config: heatfrostalarmConfig): HostRule;
//# sourceMappingURL=alerting.d.ts.map