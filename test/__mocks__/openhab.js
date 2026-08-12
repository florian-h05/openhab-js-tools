const mockLogger = {
  trace: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

module.exports = {
  log: jest.fn(() => mockLogger),
  Quantity: jest.fn((val) => ({
    toString: () => val,
    value: val
  })),
  time: {
    DateTimeFormatter: {
      ISO_TIME: {
        format: jest.fn((t) => (t && typeof t.toString === 'function' ? t.toString() : String(t)))
      }
    },
    toZDT: jest.fn(),
    toInstant: jest.fn()
  },
  cache: {
    shared: {
      get: jest.fn(),
      put: jest.fn(),
      remove: jest.fn()
    }
  },
  items: {
    getItem: jest.fn()
  },
  triggers: {
    ItemCommandTrigger: jest.fn(itemName => ({ type: 'ItemCommandTrigger', itemName })),
    ItemStateUpdateTrigger: jest.fn(itemName => ({ type: 'ItemStateUpdateTrigger', itemName }))
  }
};
