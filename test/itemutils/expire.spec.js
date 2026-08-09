jest.mock('openhab');

const { _buildExpireCountdownRuleConfig } = require('../../src/itemutils/expire');
const openhab = require('openhab');

describe('_buildExpireCountdownRuleConfig', () => {
  const mockDelay = {
    seconds: () => 10,
    toMillis: () => 10000
  };

  const mockItem = {
    postUpdate: jest.fn(),
    sendCommand: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset cache mocks
    openhab.cache.shared.get.mockReset();
    openhab.cache.shared.get.mockReturnValue(undefined);
    openhab.cache.shared.put.mockReset();
    openhab.cache.shared.remove.mockReset();

    // Reset items mock
    openhab.items.getItem.mockReset();
    openhab.items.getItem.mockImplementation((name, _nullIfMissing) => {
      if (!name) return null;
      return mockItem;
    });

    jest.useFakeTimers();
    jest.spyOn(global, 'clearInterval');
    jest.spyOn(global, 'clearTimeout');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('configuration validation', () => {
    it('should throw TypeError when config is undefined', () => {
      expect(() => _buildExpireCountdownRuleConfig()).toThrow();
    });

    it('should validate required config parameters', () => {
      expect(() => _buildExpireCountdownRuleConfig({ delay: mockDelay, targetState: 'OFF' })).toThrow();
      expect(() => _buildExpireCountdownRuleConfig({ itemName: 'TestItem', targetState: 'OFF' })).toThrow();
      expect(() => _buildExpireCountdownRuleConfig({ itemName: 'TestItem', delay: mockDelay })).toThrow();
    });
  });

  it('should generate triggers for commands and state updates by default', () => {
    const ruleConfig = _buildExpireCountdownRuleConfig({
      itemName: 'TestItem',
      delay: mockDelay,
      targetState: 'OFF'
    });
    expect(ruleConfig.triggers).toEqual([
      { type: 'ItemCommandTrigger', itemName: 'TestItem' },
      { type: 'ItemStateUpdateTrigger', itemName: 'TestItem' }
    ]);
  });

  it('should respect ignoreCommands configuration', () => {
    const ruleConfig = _buildExpireCountdownRuleConfig({
      itemName: 'TestItem',
      delay: mockDelay,
      targetState: 'OFF',
      ignoreCommands: true
    });
    expect(ruleConfig.triggers).toEqual([
      { type: 'ItemStateUpdateTrigger', itemName: 'TestItem' }
    ]);
  });

  it('should respect ignoreStateUpdates configuration', () => {
    const ruleConfig = _buildExpireCountdownRuleConfig({
      itemName: 'TestItem',
      delay: mockDelay,
      targetState: 'OFF',
      ignoreStateUpdates: true
    });
    expect(ruleConfig.triggers).toEqual([
      { type: 'ItemCommandTrigger', itemName: 'TestItem' }
    ]);
  });
});
