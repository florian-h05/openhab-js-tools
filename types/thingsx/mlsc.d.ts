/**
 * configuration for {@link MlscRestClient }
 */
export type MlscRestClientConfig = {
    /**
     * name of the effect Item: Do NOT set state description metadata on that Item, this will be done for you.
     */
    effectItemName: string;
    /**
     * full URL for mlsc, e.g. `http://127.0.0.1:8080`
     */
    url: string;
    /**
     * ID of device inside mlsc, use HTTP GET `/api/system/devices` to get a list of available devices
     */
    deviceId: string;
    /**
     * name of the color Item
     */
    colorItemName?: string;
    /**
     * name of the dimmer Item
     */
    dimmerItemName?: string;
    /**
     * default effect for the `Dimmer` Item
     */
    defaultEffect?: string;
    /**
     * refresh interval in milliseconds
     */
    refreshInterval?: number;
    /**
     * switch-on delay in milliseconds, e.g. useful if power multiple power supplies with different power-on times are used
     */
    switchOnDelay?: number;
};
/**
 * music_led_strip_control REST client
 *
 * Class providing state fetching from and command sending to the REST API of {@link https://github.com/TobKra96/music_led_strip_control music_led_strip_control}.
 * It is using a scheduled job to fetch states and a rule to handle commands.
 *
 * @example
 * var { thingsx } = require('@hotzware/openhab-tools');
 * var mlsc = new thingsx.MlscRestClient({
 *   effectItemName: 'FlorianRGB_effect',
 *   url: 'http://127.0.0.1:8080',
 *   deviceId: 'device_0',
 *   colorItemName: 'FlorianRGB_color',
 *   dimmerItemName: 'FlorianRGB_dimmer'
 * });
 * mlsc.scheduleStateFetching();
 * mlsc.createCommandHandlingRule();
 *
 * @memberof thingsx
 */
export class MlscRestClient {
    /**
     * Be aware that you need to call {@link scheduleStateFetching} and {@link createCommandHandlingRule} to fully initialize the REST client.
     *
     * @param {MlscRestClientConfig} config mlsc REST client config
     */
    constructor(config: MlscRestClientConfig);
    /**
     * Schedules the state fetching using `setInterval`.
     *
     * @returns {NodeJS.Timeout} `intervalId` of the interval used for state fetching
     */
    scheduleStateFetching(): NodeJS.Timeout;
    /**
     * Creates the rule used for command handling.
     */
    createCommandHandlingRule(): void;
    /**
     * Get all available music and non-music effects.
     *
     * @returns {{music: Object, non_music: Object}}
     */
    getAvailableEffects(): {
        music: any;
        non_music: any;
    };
    #private;
}
//# sourceMappingURL=mlsc.d.ts.map