/**
 * Jest test setup file
 * Configures the test environment for the extension
 */

// Use Jest's built-in fake timers
jest.useFakeTimers();

// Mock Chrome extension APIs
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  },
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    sendMessage: jest.fn(),
    lastError: null
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  action: {
    setIcon: jest.fn(),
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  }
};

// Mock browser APIs
global.browser = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  },
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    sendMessage: jest.fn(),
    lastError: null
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  action: {
    setIcon: jest.fn(),
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  }
};

// Mock DOM APIs
global.document = {
  body: {
    querySelectorAll: jest.fn(),
    style: {}
  },
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  createElement: jest.fn(),
  getElementById: jest.fn()
};

global.window = {
  location: {
    pathname: '/',
    href: 'https://www.youtube.com/',
    hostname: 'www.youtube.com'
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  requestAnimationFrame: jest.fn(cb => cb()),
  innerWidth: 1920,
  innerHeight: 1080
};

global.navigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

// Mock console methods
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Mock MutationObserver
global.MutationObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn()
}));

// Setup test utilities
global.createMockElement = (tagName = 'DIV', className = '', attributes = {}) => ({
  tagName: tagName.toUpperCase(),
  className,
  style: { display: '' },
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  hasAttribute: jest.fn().mockReturnValue(false),
  getAttribute: jest.fn().mockReturnValue(undefined),
  setAttribute: jest.fn(),
  removeAttribute: jest.fn(),
  closest: jest.fn(),
  matches: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  textContent: '',
  children: [],
  ...attributes
});

global.createMockLink = (href, textContent = '') => ({
  tagName: 'A',
  href,
  textContent,
  style: { display: '' },
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  hasAttribute: jest.fn().mockReturnValue(false),
  getAttribute: jest.fn().mockReturnValue(undefined),
  closest: jest.fn(),
  matches: jest.fn()
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
}); 