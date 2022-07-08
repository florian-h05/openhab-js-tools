/**
 * Controls an Item step-by-step to a target state. Only works for Items with support for float states.
 *
 * @memberof itemutils
 * @param {string} managerID id for the dimmer manager, used as key for the cache
 * @param {string} targetItem name of the Item to control
 * @param {number} targetState target to dim to
 * @param {number} step dimming step size
 * @param {number} time time in milliseconds between each step
 * @param {boolean} [ignoreExternalChange=false] whether to break dimmer if Item receives large external change
 * @param {boolean} [overwrite=false] whether to cancel an existing dimmer and create a new one
 * @throws error when targetItem does not support float state or a parameter has wrong type
 *
 * @example
 * itemutils.dimmer('exampleManager', targetItem, targetState, step, time);
 */
export function dimmer(managerID: string, targetItem: string, targetState: number, step: number, time: number, ignoreExternalChange?: boolean, overwrite?: boolean): void;
//# sourceMappingURL=dimmer.d.ts.map