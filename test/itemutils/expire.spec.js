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

    // Reset mockItem methods
    mockItem.postUpdate.mockReset();
    mockItem.sendCommand.mockReset();

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

  describe('execute callback', () => {
    describe('when event matches targetState', () => {
      it.each([
        ['ItemStateUpdatedEvent', { receivedState: 'OFF' }],
        ['ItemCommandEvent', { receivedCommand: 'OFF' }]
      ])('should cancel existing timer and reset countdown item on %s', (eventName, eventPayload) => {
        const existingTimer = { interval: 111, timeout: 222 };
        openhab.cache.shared.get.mockReturnValue(existingTimer);

        const config = _buildExpireCountdownRuleConfig({
          itemName: 'TestItem',
          delay: mockDelay,
          targetState: 'OFF',
          countdownItemName: 'CountdownItem'
        });

        config.execute(eventPayload);

        expect(clearInterval).toHaveBeenCalledWith(111);
        expect(clearTimeout).toHaveBeenCalledWith(222);
        expect(openhab.cache.shared.remove).toHaveBeenCalledWith('expire_timer_TestItem');
        expect(mockItem.postUpdate).toHaveBeenCalledWith('0 s');
      });

      it('should cancel existing timer without updating countdown item when no countdownItemName is defined', () => {
        const existingTimer = { interval: 123, timeout: 456 };
        openhab.cache.shared.get.mockReturnValue(existingTimer);

        const config = _buildExpireCountdownRuleConfig({
          itemName: 'TestItem',
          delay: mockDelay,
          targetState: 'OFF'
        });

        config.execute({ receivedState: 'OFF' });

        expect(clearInterval).toHaveBeenCalledWith(123);
        expect(clearTimeout).toHaveBeenCalledWith(456);
        expect(openhab.cache.shared.remove).toHaveBeenCalledWith('expire_timer_TestItem');
        expect(mockItem.postUpdate).not.toHaveBeenCalled();
      });
    });

    describe('when event does not match targetState', () => {
      it('should clear any pre-existing timer before creating a new one', () => {
        const existingTimer = { interval: 999, timeout: 888 };
        openhab.cache.shared.get.mockReturnValue(existingTimer);

        const config = _buildExpireCountdownRuleConfig({
          itemName: 'TestItem',
          delay: mockDelay,
          targetState: 'OFF'
        });

        config.execute({ receivedState: 'ON' });

        expect(clearInterval).toHaveBeenCalledWith(999);
        expect(clearTimeout).toHaveBeenCalledWith(888);
      });

      it('should set initial delay as number and post decremented values formatted with unit every second', () => {
        const config = _buildExpireCountdownRuleConfig({
          itemName: 'TestItem',
          delay: mockDelay,
          targetState: 'OFF',
          countdownItemName: 'CountdownItem'
        });

        config.execute({ receivedState: 'ON' });

        // Initial numeric update
        expect(mockItem.postUpdate).toHaveBeenNthCalledWith(1, '10 s');

        // Advance 3 seconds
        jest.advanceTimersByTime(3000);
        expect(mockItem.postUpdate).toHaveBeenNthCalledWith(2, '9 s');
        expect(mockItem.postUpdate).toHaveBeenNthCalledWith(3, '8 s');
        expect(mockItem.postUpdate).toHaveBeenNthCalledWith(4, '7 s');
      });

      it('should send target state as COMMAND by default and reset countdown item on completion', () => {
        const config = _buildExpireCountdownRuleConfig({
          itemName: 'TestItem',
          delay: mockDelay,
          targetState: 'OFF',
          countdownItemName: 'CountdownItem'
        });

        config.execute({ receivedState: 'ON' });

        // Fast-forward past total delay (10s)
        jest.advanceTimersByTime(10000);

        expect(mockItem.sendCommand).toHaveBeenNthCalledWith(1, 'OFF');
        expect(mockItem.postUpdate).toHaveBeenLastCalledWith('0 s');
        expect(openhab.cache.shared.remove).toHaveBeenCalledWith('expire_timer_TestItem');
      });

      it('should post target state as STATE when action is set to "STATE"', () => {
        const config = _buildExpireCountdownRuleConfig({
          itemName: 'TestItem',
          delay: mockDelay,
          action: 'STATE',
          targetState: 'OFF'
        });

        config.execute({ receivedState: 'ON' });

        jest.advanceTimersByTime(10000);

        expect(mockItem.postUpdate).toHaveBeenCalledWith('OFF');
        expect(mockItem.sendCommand).not.toHaveBeenCalled();
      });

      it('should create timer without interval when countdownItemName item does not exist in openhab', () => {
        openhab.items.getItem.mockImplementation((name, nullIfMissing) => {
          if (name === 'MissingCountdownItem' && nullIfMissing) return null;
          return mockItem;
        });

        const config = _buildExpireCountdownRuleConfig({
          itemName: 'TestItem',
          delay: mockDelay,
          targetState: 'OFF',
          countdownItemName: 'MissingCountdownItem'
        });

        config.execute({ receivedState: 'ON' });

        expect(openhab.cache.shared.put).toHaveBeenCalledWith('expire_timer_TestItem', {
          interval: null,
          timeout: expect.any(Object)
        });

        jest.advanceTimersByTime(10000);
        expect(mockItem.sendCommand).toHaveBeenCalledWith('OFF');
        expect(clearInterval).toHaveBeenCalledWith(null);
      });
    });
  });
});
