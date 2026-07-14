/**
 * Copyright (c) 2026 Florian Hotze
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const { time, log, Quantity } = require('openhab');

const logger = log('org.openhab.automation.js.hotzware_openhab_tools.ems');

const dtFormatter = time.DateTimeFormatter.ISO_TIME;

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
function calculateOptimalChargeLimit (
  currentSoC,
  surplusForecast,
  targetSoC = 100,
  targetTime,
  batteryCapacityKWh = 10.2,
  includeConsumption = false
) {
  // Calculate the energy needed to reach target SoC
  const energyNeededKWh = batteryCapacityKWh * (1 - currentSoC / targetSoC);
  logger.debug(`calculateOptimalChargeLimit: need ${energyNeededKWh} kWh to reach ${targetSoC}% SoC until ${dtFormatter.format(targetTime)}`);

  if (energyNeededKWh <= 0) {
    logger.info('calculateOptimalChargeLimit: energy needed is <= 0 kWh');
    return null;
  }

  // Define the time window
  const now = time.toInstant();
  const targetInstant = targetTime.toInstant();
  if (now.isAfter(targetInstant)) {
    logger.warn(`calculateOptimalChargeLimit: target time ${targetTime} is in the past`);
    return null;
  }

  // Automatically determine the resolution (in hours) from the forecast data
  let intervalHours = null;
  if (surplusForecast.length >= 2) {
    const timeDiffMs = surplusForecast[1].instant.toEpochMilli() - surplusForecast[0].instant.toEpochMilli();
    intervalHours = timeDiffMs / (1000 * 60 * 60); // Convert milliseconds to hours
  }
  if (intervalHours === null) {
    logger.warn('calculateOptimalChargeLimit: no forecast data available');
    return null;
  }
  logger.debug(`calculateOptimalChargeLimit: surplus forecast resolution = ${intervalHours}`);

  // Filter the forecast for the relevant window and extract the numeric power
  const availablePowerKW = surplusForecast
    .filter(item => item.instant.isAfter(now) && item.instant.isBefore(targetInstant))
    .map(item => {
      let power;
      if (item.quantityState) {
        // Automatically handles W to kW conversion if needed
        power = item.quantityState.toUnit('kW').float;
      } else if (item.numericState !== null) {
        // Fallback for Number items without dimensions
        power = item.numericState;
      }

      if (!includeConsumption) {
        // Ignore battery drain caused by consumption
        return Math.max(0, power);
      }
      // Include consumption from the battery caused by missing surplus power
      return power;
    });

  if (availablePowerKW.length === 0) {
    logger.warn(`calculateOptimalChargeLimit: no surplus forecast available for timeframe ${dtFormatter.format(now)} - ${dtFormatter.format(targetInstant)}`);
    return null;
  }

  // Check if a full charge is even possible without any limits
  const maxPossibleEnergyKWh = availablePowerKW.reduce(
    (sum, power) => sum + power * intervalHours,
    0
  );

  if (maxPossibleEnergyKWh <= energyNeededKWh) {
    logger.info(`calculateOptimalChargeLimit: max possible energy ${maxPossibleEnergyKWh} kWh <= needed ${energyNeededKWh} kWh`);
    return null;
  }

  // Binary Search to find the exact P_limit
  let low = 0;
  let high = Math.max(...availablePowerKW);
  const precisionEpsilon = 0.01; // 10 Watt precision

  while (high - low > precisionEpsilon) {
    const mid = (low + high) / 2; // Test limit

    // Calculate how much energy we would store with this tested limit
    const energyWithLimit = availablePowerKW.reduce((sum, available) => {
      return sum + Math.min(available, mid) * intervalHours;
    }, 0);

    if (energyWithLimit >= energyNeededKWh) {
      // We reached the target. See if we can do it with an even lower limit.
      high = mid;
    } else {
      // We fell short. We need a higher charging power limit.
      low = mid;
    }
  }

  // Return the upper bound to ensure we strictly meet or barely exceed the required energy
  return Quantity(Number(high.toFixed(2)) + ' kW');
}

module.exports = {
  calculateOptimalChargeLimit
};
