/**
 * Energy Management System (EMS) namespace.
 *
 * This namespace provides functions for energy management.
 * @namespace ems
 */
/**
 * Calculates the minimum charging power limit (in kW) needed to ensure the battery reaches target SoC exactly by the target time.
 *
 * @memberOf ems
 * @param {number} currentSoC Current State of Charge in percentage (0 - 100)
 * @param {items.PersistedItem[]} surplusForecast Array of forecasted surplus power (Solar - Consumption) in kW
 * @param {number} targetSoC Target State of Charge in percentage (0 - 100)
 * @param {time.ZonedDateTime} targetTime Target time to reach the target SoC
 * @param {number} [batteryCapacityKWh=10.2] Total capacity of the battery in kWh
 * @param {boolean} [includeConsumption=false] If true, negative surplus (house consumption) reduces the available energy for charging.
 * @returns {Quantity|null} The calculated charging power limit
 */
export function calculateOptimalChargeLimit(currentSoC: number, surplusForecast: items.PersistedItem[], targetSoC: number, targetTime: time.ZonedDateTime, batteryCapacityKWh?: number, includeConsumption?: boolean): Quantity | null;
import { time } from "openhab";
import { Quantity } from "openhab";
//# sourceMappingURL=ems.d.ts.map