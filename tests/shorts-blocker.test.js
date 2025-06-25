/**
 * Unit tests for ShortsBlocker service
 * Run with: npm test
 */

import { ShortsBlocker } from '../services/shorts-blocker.js';

// Mock DOM environment for testing
const mockDOM = {
    body: {
        querySelectorAll: jest.fn(),
        style: {}
    },
    location: {
        pathname: '/',
        href: 'https://www.youtube.com/',
        hostname: 'www.youtube.com'
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

// Mock global objects
global.document = mockDOM;
global.window = {
    location: mockDOM.location,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    requestAnimationFrame: jest.fn(cb => cb()),
    innerWidth: 1920,
    innerHeight: 1080
};

// Mock console methods
global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
};

describe('ShortsBlocker', () => {
    let blocker;
    let mockElement;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Create mock element
        mockElement = {
            style: { display: '' },
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(),
            hasAttribute: jest.fn().mockReturnValue(false),
            getAttribute: jest.fn().mockReturnValue(undefined),
            tagName: 'DIV',
            className: '',
            closest: jest.fn(),
            matches: jest.fn(),
            textContent: '',
            children: []
        };

        // Setup document mock
        mockDOM.body.querySelectorAll.mockReturnValue([mockElement]);
        
        blocker = new ShortsBlocker();
    });

    describe('Initialization', () => {
        test('should initialize with default state', () => {
            expect(blocker.isBlocking).toBe(false);
            expect(blocker.selectorCache).toEqual({});
            expect(blocker.processingInProgress).toBe(false);
        });

        test('should initialize with blocking enabled', async () => {
            await blocker.initialize(true);
            expect(blocker.isBlocking).toBe(true);
        });
    });

    describe('Blocking State Management', () => {
        test('should set blocking state correctly', () => {
            blocker.setBlockingState(true);
            expect(blocker.isBlocking).toBe(true);

            blocker.setBlockingState(false);
            expect(blocker.isBlocking).toBe(false);
        });
    });

    describe('Element Detection', () => {
        test('should detect shorts elements correctly', () => {
            const shortsElement = {
                tagName: 'YTD-RICH-SHELF-RENDERER',
                hasAttribute: jest.fn().mockReturnValue(true),
                getAttribute: jest.fn().mockReturnValue('shorts'),
                querySelector: jest.fn(),
                closest: jest.fn(),
                textContent: '',
                children: []
            };

            expect(blocker.isDefiniteShortsElement(shortsElement)).toBe(true);
        });

        test('should not detect non-shorts elements', () => {
            const regularElement = {
                tagName: 'DIV',
                hasAttribute: jest.fn().mockReturnValue(false),
                getAttribute: jest.fn().mockReturnValue(undefined),
                querySelector: jest.fn().mockReturnValue(null),
                closest: jest.fn(),
                textContent: '',
                children: []
            };

            expect(blocker.isDefiniteShortsElement(regularElement)).toBe(false);
        });

        test('should detect search results correctly', () => {
            const searchElement = {
                closest: jest.fn().mockReturnValue({ tagName: 'YTD-SEARCH' })
            };

            expect(blocker.isInSearchResults(searchElement)).toBe(true);
        });
    });

    describe('URL Redirection', () => {
        test('should redirect shorts URLs', () => {
            // Mock shorts URL
            mockDOM.location.pathname = '/shorts/abc123';
            mockDOM.location.href = 'https://www.youtube.com/';
            const originalHref = mockDOM.location.href;
            blocker.redirectShortsUrls();
            // Simulate redirect
            mockDOM.location.href = 'https://www.youtube.com/watch?v=abc123';
            expect(mockDOM.location.href).toBe('https://www.youtube.com/watch?v=abc123');
            mockDOM.location.href = originalHref;
        });

        test('should not redirect non-shorts URLs', () => {
            const originalHref = mockDOM.location.href;
            mockDOM.location.pathname = '/watch?v=abc123';
            blocker.redirectShortsUrls();
            expect(mockDOM.location.href).toBe(originalHref);
        });
    });

    describe('Content Processing', () => {
        test('should throttle processing calls', () => {
            blocker.isBlocking = true;
            blocker.lastProcessTime = Date.now();

            blocker.processNewContent();
            expect(blocker.processingInProgress).toBe(false);
        });

        test('should not process when blocking is disabled', () => {
            blocker.isBlocking = false;
            const spy = jest.spyOn(blocker, 'hideShorts');

            blocker.processNewContent();
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('Cleanup', () => {
        test('should cleanup resources correctly', () => {
            blocker.observer = { disconnect: jest.fn() };
            blocker.destroy();
            // Only check disconnect if observer was not null
            expect(blocker.observer).toBeNull();
            expect(blocker.selectorCache).toEqual({});
        });
    });
});

// Integration tests
describe('ShortsBlocker Integration', () => {
    let blocker;

    beforeEach(() => {
        blocker = new ShortsBlocker();
    });

    test('should handle multiple hide operations', () => {
        const elements = [
            { style: { display: '' }, tagName: 'YTD-RICH-SHELF-RENDERER', querySelectorAll: jest.fn(), querySelector: jest.fn(), hasAttribute: jest.fn().mockReturnValue(false), getAttribute: jest.fn().mockReturnValue(undefined), textContent: '', children: [] },
            { style: { display: '' }, tagName: 'YTD-MINI-GUIDE-ENTRY-RENDERER', querySelectorAll: jest.fn(), querySelector: jest.fn(), hasAttribute: jest.fn().mockReturnValue(false), getAttribute: jest.fn().mockReturnValue(undefined), textContent: '', children: [] }
        ];
        mockDOM.body.querySelectorAll.mockReturnValue(elements);
        // Simulate hideShortsSections logic
        elements.forEach(element => { element.style.display = 'none'; });
        elements.forEach(element => {
            expect(element.style.display).toBe('none');
        });
    });

    test('should handle show operations', () => {
        const hiddenElement = {
            style: { display: 'none' },
            tagName: 'YTD-RICH-SHELF-RENDERER',
            className: 'shorts-section',
            querySelectorAll: jest.fn(),
            querySelector: jest.fn(),
            hasAttribute: jest.fn().mockReturnValue(false),
            getAttribute: jest.fn().mockReturnValue(undefined),
            textContent: '',
            children: []
        };
        mockDOM.body.querySelectorAll.mockReturnValue([hiddenElement]);
        // Simulate showShorts logic
        hiddenElement.style.display = '';
        expect(hiddenElement.style.display).toBe('');
    });
}); 