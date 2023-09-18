/**
 * Dims an Item step-by-step to a target state.
 *
 * Only works for Items with support for float states.
 * The dimmer uses the shared cache to ensure that there are not multiple timers for the same Item active at the same time.
 *
 * @example
 * // Dim the Bedroom_Light to 50% in 750 seconds (1% each 15 seconds).
 * itemutils.dimItem('Bedroom_Light', 50.0, 1, 15 * 1000);
 *
 * @memberof itemutils
 * @param {string} itemName name of the Item to control
 * @param {number} targetState float number to dim to
 * @param {number} step dimming step size
 * @param {number} time time in milliseconds between each step
 * @param {boolean} [ignoreExternalChange=false] whether to break dimmer if Item receives a large external change
 * @param {boolean} [overwrite=false] whether to cancel an existing dimmer and create a new one
 * @throws {TypeError} when a parameter has wrong type
 *
 */
export function dimItem(itemName: string, targetState: number, step: number, time: number, ignoreExternalChange?: boolean, overwrite?: boolean): void;
//# sourceMappingURL=dimmer.d.ts.map