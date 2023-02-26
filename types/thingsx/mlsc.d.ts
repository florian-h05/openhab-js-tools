/**
 * music_led_strip_control REST client
 *
 * Class providing state fetching from and command sending to the REST API of {@link https://github.com/TobKra96/music_led_strip_control music_led_strip_control}.
 * It is using a scheduled job to fetch states and a rule to handle commands.
 *
 * @example
 * var FlorianRGB = new MlscRestClient('FlorianRGB_effect', 'FlorianRGB_color', 'http://127.0.0.1:8080', 'device_0', 'FlorianRGB', 'effect_single');
 * FlorianRGB.scheduleStateFetching();
 * FlorianRGB.createCommandHandlingRule();
 *
 * @memberof thingsx
 */
export class MlscRestClient {
    /**
     * Be aware that you need to call {@link scheduleStateFetching} and {@link createCommandHandlingRule} to fully initialize the REST client.
     *
     * @param {string} effectItemName Name of `String` Item for mslc effect
     * @param {string} colorItemName Name of `Color` Item for `effect_single` color
     * @param {string} url Full URL of mlsc host, e.g. `http://127.0.0.1:8080`
     * @param {string} deviceId ID of device inside mlsc, use HTTP GET `/api/system/devices` to get a list of available devices
     * @param {string} [switchItemName] Name of `Switch` Item to switch mlsc on/off
     * @param {string} [effectDefault='effect_gradient'] Default effect for the `Switch` Item
     * @param {number} [refreshInterval=15000] Refresh interval in milliseconds
     */
    constructor(effectItemName: string, colorItemName: string, url: string, deviceId: string, switchItemName?: string, effectDefault?: string, refreshInterval?: number);
    effectItemName: string;
    colorItemName: string;
    url: string;
    deviceId: string;
    switchItemName: string;
    effectDefault: string;
    refreshInterval: number;
    /**
     * Schedules the state fetching using `setInterval`
     *
     * @returns {number} `intervalId`
     */
    scheduleStateFetching(): number;
    /**
     * Creates the rule used for command handling.
     *
     * @returns {HostRule} command handling rule
     */
    createCommandHandlingRule(): HostRule;
}
//# sourceMappingURL=mlsc.d.ts.map