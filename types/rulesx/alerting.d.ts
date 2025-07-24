/**
 * Callback for sending an alert.
 */
export type SendAlertCallback = (id: string, message: string) => any;
/**
 * Callback for revoking an alert.
 */
export type RevokeAlertCallback = (id: string) => any;
/**
 * configuration for rain alarm
 */
export type RainAlarmConfig = {
    /**
     * callback to send an alert
     */
    sendAlertCallback: SendAlertCallback;
    /**
     * callback to revoke an alert
     */
    revokeAlertCallback: RevokeAlertCallback;
    /**
     * name of the Item to monitor for rain
     */
    rainalarmItemName: string;
    /**
     * state of the Item that indicates rain
     */
    rainalarmActiveState?: string;
    /**
     * name of the contact group to monitor
     */
    contactGroupName: string;
    /**
     * list of Item names to ignore
     */
    ignoreItems?: string[];
    /**
     * message pattern to use for alerts, use placeholder `%LABEL` for Item label
     */
    messagePattern: string;
    /**
     * name of the wind speed Item
     */
    windspeedItemName?: string;
    /**
     * wind speed threshold as Quantity for individual contact levels
     */
    contactLevelToWindspeed?: Array<{
        contactLevel: number;
        treshold: any;
    }>;
    /**
     * message pattern overrides for individual contact levels, use placeholder `%LABEL` for Item label
     */
    contactLevelToMessagePattern?: Array<{
        contactLevel: number;
        messagePattern: string;
    }>;
};
/**
 * configuration for rainalarm
 */
export type heatOrFrostAlarmConfig = any;
/**
 * Callback for sending an alert.
 *
 * @callback SendAlertCallback
 * @param {string} id the unique identifier for the alert
 * @param {string} message the message to be displayed in the alert
 */
/**
 * Callback for revoking an alert.
 *
 * @callback RevokeAlertCallback
 * @param {string} id the unique identifier of the alert to be revoked
 */
/**
 * @typedef {Object} RainAlarmConfig configuration for rain alarm
 * @property {SendAlertCallback} sendAlertCallback callback to send an alert
 * @property {RevokeAlertCallback} revokeAlertCallback callback to revoke an alert
 * @property {string} rainalarmItemName name of the Item to monitor for rain
 * @property {string} [rainalarmActiveState=OPEN] state of the Item that indicates rain
 * @property {string} contactGroupName name of the contact group to monitor
 * @property {string[]} [ignoreItems] list of Item names to ignore
 * @property {string} messagePattern message pattern to use for alerts, use placeholder `%LABEL` for Item label
 * @property {string} [windspeedItemName] name of the wind speed Item
 * @property {Array<{ contactLevel: number, treshold: * }>} [contactLevelToWindspeed] wind speed threshold as Quantity for individual contact levels
 * @property {Array<{ contactLevel: number, messagePattern: string }>} [contactLevelToMessagePattern] message pattern overrides for individual contact levels, use placeholder `%LABEL` for Item label
 */
/**
 * Create a rain alarm rule that monitors rain and wind conditions to raise alerts for open windows and doors when it rains.
 *
 * Please note that, if enabled, the wind speed condition is only evaluated when the rain alarm becomes active or when the contact opens.
 * It is not continuously monitored, so if the wind speed changes while the rain alarm is active, it will not trigger a alert.
 *
 * @memberof rulesx.alerting
 * @param {RainAlarmConfig} config
 */
export function createRainAlarmRule(config: RainAlarmConfig): void;
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