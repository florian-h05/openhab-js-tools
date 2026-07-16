const { time, Quantity } = require('openhab');
const { calculateOptimalChargeLimit } = require('../src/ems');

describe('calculateOptimalChargeLimit', () => {
  function createMockInstant (epochMilli) {
    return {
      toEpochMilli: () => epochMilli,
      isAfter: (other) => epochMilli > other.toEpochMilli(),
      isBefore: (other) => epochMilli < other.toEpochMilli(),
      toString: () => `Instant(${epochMilli})`
    };
  }

  function createMockZonedDateTime (epochMilli) {
    const instant = createMockInstant(epochMilli);
    return {
      toInstant: () => instant,
      toString: () => `ZonedDateTime(${epochMilli})`
    };
  }

  function createForecastItem (epochMilli, power, isQuantity = false) {
    const instant = createMockInstant(epochMilli);
    if (isQuantity) {
      return {
        instant,
        quantityState: {
          toUnit: (unit) => ({ float: power })
        }
      };
    } else {
      return {
        instant,
        numericState: power
      };
    }
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null if energy needed is <= 0 (currentSoC >= targetSoC)', () => {
    const result = calculateOptimalChargeLimit(80, [], 80, createMockZonedDateTime(1000));
    expect(result).toBeNull();
  });

  it('returns null if targetTime is in the past', () => {
    const nowMilli = 10000;
    const targetMilli = 5000;
    time.toInstant.mockReturnValue(createMockInstant(nowMilli));

    const result = calculateOptimalChargeLimit(50, [], 100, createMockZonedDateTime(targetMilli));
    expect(result).toBeNull();
  });

  it('returns null if surplusForecast has fewer than 2 items', () => {
    const nowMilli = 10000;
    const targetMilli = 20000;
    time.toInstant.mockReturnValue(createMockInstant(nowMilli));

    const singleItem = [createForecastItem(15000, 5)];
    const result = calculateOptimalChargeLimit(50, singleItem, 100, createMockZonedDateTime(targetMilli));
    expect(result).toBeNull();
  });

  it('returns null if no forecast items fall within the relevant window', () => {
    const nowMilli = 10000;
    const targetMilli = 20000;
    time.toInstant.mockReturnValue(createMockInstant(nowMilli));

    // Forecast intervals: 1 hour (3600000 ms) resolution
    const forecast = [
      createForecastItem(5000, 5), // in the past
      createForecastItem(30000, 5) // after target time
    ];

    const result = calculateOptimalChargeLimit(50, forecast, 100, createMockZonedDateTime(targetMilli));
    expect(result).toBeNull();
  });

  it('returns null if max possible energy is less than or equal to needed energy', () => {
    const nowMilli = 10000;
    const targetMilli = 50000;
    time.toInstant.mockReturnValue(createMockInstant(nowMilli));

    // interval is 10000 ms = 10s = (10 / 3600) hours
    const forecast = [
      createForecastItem(20000, 2),
      createForecastItem(30000, 2)
    ];

    // energyNeededKWh = 10.2 * (1 - 50 / 100) = 5.1 kWh
    // max possible energy is much less
    const result = calculateOptimalChargeLimit(50, forecast, 100, createMockZonedDateTime(targetMilli));
    expect(result).toBeNull();
  });

  it('calculates the correct optimal charge limit with quantityState items (includeConsumption = false)', () => {
    const nowMilli = 10000;
    const targetMilli = 10000 + 3 * 3600000; // 3 hours later
    time.toInstant.mockReturnValue(createMockInstant(nowMilli));

    // Resolution: 1 hour
    const forecast = [
      createForecastItem(nowMilli + 3600000, 5, true),
      createForecastItem(nowMilli + 2 * 3600000, 10, true)
    ];

    // battery capacity = 10kWh. SoC: 0 to 100% -> needs 10kWh.
    // 5kW * 1h + 10kW * 1h = 15kWh max possible energy.
    // We need 10kWh.
    // If P_limit is 7.5kW:
    // hour 1: min(5, 7.5) = 5kWh
    // hour 2: min(10, 7.5) = 7.5kWh
    // Total = 12.5kWh (too high, we can go lower)
    // If P_limit is 5kW:
    // hour 1: min(5, 5) = 5kWh
    // hour 2: min(10, 5) = 5kWh
    // Total = 10kWh. So optimal limit is 5 kW.
    const result = calculateOptimalChargeLimit(0, forecast, 100, createMockZonedDateTime(targetMilli), 10.0, false);

    expect(Quantity).toHaveBeenCalledWith('5 kW');
    expect(result.value).toBe('5 kW');
  });

  it('ignores negative power when includeConsumption is false', () => {
    const nowMilli = 10000;
    const targetMilli = 10000 + 3 * 3600000;
    time.toInstant.mockReturnValue(createMockInstant(nowMilli));

    // Resolution: 1 hour
    const forecast = [
      createForecastItem(nowMilli + 3600000, -5, false),
      createForecastItem(nowMilli + 2 * 3600000, 15, false)
    ];

    // energyNeeded = 10kWh.
    // If includeConsumption = false, -5 becomes max(0, -5) = 0.
    // Forecast is [0, 15].
    // If limit is 10kW:
    // hour 1: min(0, 10) = 0
    // hour 2: min(15, 10) = 10
    // Total = 10kWh. Optimal limit should be 10 kW.
    const result = calculateOptimalChargeLimit(0, forecast, 100, createMockZonedDateTime(targetMilli), 10.0, false);

    expect(Quantity).toHaveBeenCalledWith('10 kW');
    expect(result.value).toBe('10 kW');
  });

  it('includes negative power when includeConsumption is true', () => {
    const nowMilli = 10000;
    const targetMilli = 10000 + 3 * 3600000;
    time.toInstant.mockReturnValue(createMockInstant(nowMilli));

    // Resolution: 1 hour
    const forecast = [
      createForecastItem(nowMilli + 3600000, -2, false),
      createForecastItem(nowMilli + 2 * 3600000, 15, false)
    ];

    // energyNeeded = 10kWh.
    // If includeConsumption = true, negative power is kept.
    // Forecast is [-2, 15].
    // Summing: sum + Math.min(available, mid) * 1
    // If limit is 12kW:
    // hour 1: min(-2, 12) = -2
    // hour 2: min(15, 12) = 12
    // Total = 10kWh. Optimal limit should be 12 kW.
    const result = calculateOptimalChargeLimit(0, forecast, 100, createMockZonedDateTime(targetMilli), 10.0, true);

    expect(Quantity).toHaveBeenCalledWith('12 kW');
    expect(result.value).toBe('12 kW');
  });
});
