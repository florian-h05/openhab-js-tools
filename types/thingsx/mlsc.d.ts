/**
 * configuration for {@link MlscRestClient }
 */
export type mlscRestClientConfig = any;
/**
 * music_led_strip_control REST client
 *
 * Class providing state fetching from and command sending to the REST API of {@link https://github.com/TobKra96/music_led_strip_control music_led_strip_control}.
 * It is using a scheduled job to fetch states and a rule to handle commands.
 *
 * @example
 * var { thingsx } = require('@hotzware/openhab-tools');
 * var FlorianRGB = new thingsx.MlscRestClient({
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