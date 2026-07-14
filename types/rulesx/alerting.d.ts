/**
 * Callback for sending an alert.
 */
export type SendAlertCallback = (id: string, message: string) => any;
/**
 * Callback for revoking an alert.
 */
export type RevokeAlertCallback = (id: string) => any;
/**
 * Function to mute an alert for a specific contact Item for a certain time.
 */
export type MuteAlertFunction = Function;
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
        treshold: Quantity;
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
 * Callback for evaluating a temperature condition.
 */
export type TemperatureConditionCallback = (temperature: Quantity) => boolean;
/**
 * Callback for getting the alerting delay depending on the temperature and the contact level.
 */
export type TemperatureDelayCallback = (temperature: Quantity, contactLevel: number) => number;
/**
 * Callback for getting the alert message pattern depending on the temperature and the contact level.
 * Use `%LABEL` as placeholder for the Item label.
 */
export type TemperatureMessagePatternCallback = (temperature: Quantity, contactLevel: number) => string;
/**
 * Callback for evaluating conditions per Item for the temperature alarm.
 */
export type TemperaturePerItemConditionCallback = (temperature: Quantity, item: items.Item) => boolean;
/**
 * configuration for heat and frost alarms
 */
export type TemperatureAlarmConfig = {
    /**
     * the name of the alarm, e.g. "Heat Alarm"
     */
    name: string;
    /**
     * callback to send an alert
     */
    sendAlertCallback: SendAlertCallback;
    /**
     * callback to revoke an alert
     */
    revokeAlertCallback: RevokeAlertCallback;
    /**
     * whether to repeat the alert after the delay
     */
    repeat?: boolean;
    /**
     * name of the Item that to monitor the temperature
     */
    temperatureItemName: string;
    /**
     * name of the contact group to monitor
     */
    contactGroupName: string;
    /**
     * list of Item names to ignore
     */
    ignoreItems?: string[];
    /**
     * callback to decide whether the alarm is active depending on the temperature
     */
    alarmConditionCallback: TemperatureConditionCallback;
    /**
     * callback to get the delay in minutes for alerting depending on the temperature
     */
    delayCallback: TemperatureDelayCallback;
    /**
     * callback to get the message pattern depending on the temperature
     */
    messagePatternCallback: TemperatureMessagePatternCallback;
    /**
     * optional callback to evaluate conditions per Item
     */
    perItemConditionCallback?: TemperaturePerItemConditionCallback;
};
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
 * Function to mute an alert for a specific contact Item for a certain time.
 *
 * @typedef {function} MuteAlertFunction
 * @param {string} contactItemName the name of the contact Item to mute
 * @param {number} duration the duration in minutes to mute the alert for
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
 * @property {Array<{ contactLevel: number, treshold: Quantity }>} [contactLevelToWindspeed] wind speed threshold as Quantity for individual contact levels
 * @property {Array<{ contactLevel: number, messagePattern: string }>} [contactLevelToMessagePattern] message pattern overrides for individual contact levels, use placeholder `%LABEL` for Item label
 */
/**
 * Create a rain alarm rule that monitors rain and wind conditions to raise alerts for open windows and doors when it rains.
 *
 * Please note that, if enabled, the wind speed condition is only evaluated when the rain alarm becomes active or when the contact opens.
 * It is not continuously monitored, so if the wind speed changes while the rain alarm is active, it will not trigger a alert.
 *
 * @memberof rulesx
 * @param {RainAlarmConfig} config
 */
export function createRainAlarmRule(config: RainAlarmConfig): void;
/**
 * Callback for evaluating a temperature condition.
 *
 * @callback TemperatureConditionCallback
 * @param {Quantity} temperature the current temperature
 * @return {boolean} true if the temperature is in alarm range, false otherwise
 */
/**
 * Callback for getting the alerting delay depending on the temperature and the contact level.
 *
 * @callback TemperatureDelayCallback
 * @param {Quantity} temperature the current temperature
 * @param {number} contactLevel the contact level of the Item
 * @return {number} delay in minutes
 */
/**
 * Callback for getting the alert message pattern depending on the temperature and the contact level.
 * Use `%LABEL` as placeholder for the Item label.
 *
 * @callback TemperatureMessagePatternCallback
 * @param {Quantity} temperature the current temperature
 * @param {number} contactLevel the contact level of the Item
 * @return {string} message pattern
 */
/**
 * Callback for evaluating conditions per Item for the temperature alarm.
 *
 * @callback TemperaturePerItemConditionCallback
 * @param {Quantity} temperature the current temperature
 * @param {items.Item} item the Item to evaluate conditions for
 * @return {boolean} true if the conditions are met for the Item, false otherwise
 */
/**
 * @typedef {Object} TemperatureAlarmConfig configuration for heat and frost alarms
 * @property {string} name the name of the alarm, e.g. "Heat Alarm"
 * @property {SendAlertCallback} sendAlertCallback callback to send an alert
 * @property {RevokeAlertCallback} revokeAlertCallback callback to revoke an alert
 * @property {boolean} [repeat=false] whether to repeat the alert after the delay
 * @property {string} temperatureItemName name of the Item that to monitor the temperature
 * @property {string} contactGroupName name of the contact group to monitor
 * @property {string[]} [ignoreItems] list of Item names to ignore
 * @property {TemperatureConditionCallback} alarmConditionCallback callback to decide whether the alarm is active depending on the temperature
 * @property {TemperatureDelayCallback} delayCallback callback to get the delay in minutes for alerting depending on the temperature
 * @property {TemperatureMessagePatternCallback} messagePatternCallback callback to get the message pattern depending on the temperature
 * @property {TemperaturePerItemConditionCallback} [perItemConditionCallback] optional callback to evaluate conditions per Item
 */
/**
 * Create a rule for a temperature-based alarm that monitors the temperature and raises alerts for open windows and doors when the temperatur condition callback returns true.
 *
 * @memberof rulesx
 * @param {TemperatureAlarmConfig} config
 * @returns {MuteAlertFunction} a method to mute alerts for a specific contact Item for a certain time
 */
export function createTemperatureAlarmRule(config: TemperatureAlarmConfig): MuteAlertFunction;
import { Quantity } from "openhab";
import { items } from "openhab";
//# sourceMappingURL=alerting.d.ts.map