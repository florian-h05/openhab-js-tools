/**
 * configuration for {@link MlscRestClient }
 */
export type mlscRestClientConfig = any;
/**
 * @typedef {Object} mlscRestClientConfig configuration for {@link MlscRestClient}
 * @memberof thingsx
 * @property {string} effectItemName name of the effect Item
 * @property {string} url full URL for mlsc, e.g. `http://127.0.0.1:8080`
 * @property {string} deviceId ID of device inside mlsc, use HTTP GET `/api/system/devices` to get a list of available devices
 * @property {string} [colorItemName] name of the color Item
 * @property {string} [dimmerItemName] name of the dimmer Item
 * @property {string} [defaultEffect='effect_gradient'] default effect for the `Dimmer` Item
 * @property {number} [refreshInterval=15000] refresh interval in milliseconds
 */
/**
 * music_led_strip_control REST client
 *
 * Class providing state fetching from and command sending to the REST API of {@link https://github.com/TobKra96/music_led_strip_control music_led_strip_control}.
 * It is using a scheduled job to fetch states and a rule to handle commands.
 *
 * @example
 * var FlorianRGB = new MlscRestClient({
 *   effectItemName: 'FlorianRGB_effect',
 *   url: 'http://127.0.0.1:8080',
 *   deviceId: 'device_0',
 *   colorItemName: 'FlorianRGB_color',
 *   dimmerItemName: 'FlorianRGB_dimmer'
 * });
 * FlorianRGB.scheduleStateFetching();
 * FlorianRGB.createCommandHandlingRule();
 *
 * @memberof thingsx
 */
export class MlscRestClient {
    /**
     * Be aware that you need to call {@link scheduleStateFetching} and {@link createCommandHandlingRule} to fully initialize the REST client.
     *
     * @param {mlscRestClientConfig} config MLSC REST client config
     */
    constructor(config: mlscRestClientConfig);
    config: any;
    id: string;
    logMsg: string;
    effect: any;
    hsb: any;
    brightness: number;
    lastEffect: string;
    /**
     * @private
     */
    private fetchState;
    /**
     * Schedules the state fetching using `setInterval`.
     *
     * @returns {number} `intervalId` of the interval used for state fetching
     */
    scheduleStateFetching(): number;
    /**
     * Creates the rule used for command handling.
     */
    createCommandHandlingRule(): void;
}
//# sourceMappingURL=mlsc.d.ts.map