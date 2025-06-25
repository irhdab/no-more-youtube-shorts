/**
 * Popup Script for YouTube Shorts Blocker
 * Handles the extension popup UI and user interactions
 */

import { ConfigService } from './services/config-service.js';
import { setBlockingState, getBlockingState } from './utils/storage.js';
import { detectEnvironment } from './utils/environment.js';

// Initialize services
const configService = new ConfigService();

// DOM elements
let blockShortsToggle;
let statusIndicator;
let statusText;
let mobileInstruction;

/**
 * Initialize the popup
 */
async function initializePopup() {
    try {
        // Initialize environment detection
        detectEnvironment();
        
        // Initialize configuration
        await configService.initialize();
        
        // Get DOM elements
        getDOMElements();
        
        // Setup event listeners
        setupEventListeners();
        
        // Load initial state
        await loadState();
        
        console.log('Popup initialized successfully');
    } catch (error) {
        console.error('Error initializing popup:', error);
    }
}

/**
 * Get DOM elements
 */
function getDOMElements() {
    blockShortsToggle = document.getElementById('blockShorts');
    statusIndicator = document.getElementById('status-indicator');
    statusText = document.getElementById('status-text');
    mobileInstruction = document.getElementById('mobile-instruction');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    if (!blockShortsToggle) return;

    // Toggle change event
    blockShortsToggle.addEventListener('change', handleToggle);

    // Additional click handler for better mobile support
    if (isMobile()) {
        setupMobileSupport();
    }

    // Keyboard shortcuts
    setupKeyboardShortcuts();
}

/**
 * Check if running on mobile
 * @returns {boolean} True if mobile
 */
function isMobile() {
    const isFirefox = navigator.userAgent.includes('Firefox') || typeof InstallTrigger !== 'undefined';
    const isAndroid = navigator.userAgent.includes('Android');
    return isAndroid || 'ontouchstart' in window;
}

/**
 * Setup mobile-specific support
 */
function setupMobileSupport() {
    if (!mobileInstruction) return;

    const isFirefox = navigator.userAgent.includes('Firefox') || typeof InstallTrigger !== 'undefined';
    const isAndroid = navigator.userAgent.includes('Android');

    // Show appropriate message for different environments
    if (isFirefox && isAndroid) {
        mobileInstruction.textContent = "Toggle works in popup or tap extension icon";
        mobileInstruction.style.display = 'block';
    } else if (isMobile()) {
        mobileInstruction.textContent = "Tap the toggle to enable/disable";
        mobileInstruction.style.display = 'block';
    } else {
        mobileInstruction.style.display = 'none';
    }

    // Increase touch target size for mobile
    const toggleContainer = document.querySelector('.toggle-container');
    if (toggleContainer) {
        toggleContainer.style.padding = '12px 0';
        toggleContainer.style.minHeight = '44px';
        toggleContainer.style.cursor = 'pointer';

        // Make the entire toggle area clickable
        toggleContainer.addEventListener('click', (e) => {
            if (!e.target.matches('input[type="checkbox"]')) {
                blockShortsToggle.checked = !blockShortsToggle.checked;
                handleToggle();
            }
        });
    }

    document.body.classList.add('mobile');
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            if (e.target === blockShortsToggle) {
                e.preventDefault();
                blockShortsToggle.checked = !blockShortsToggle.checked;
                handleToggle();
            }
        }
    });
}

/**
 * Load saved state
 */
async function loadState() {
    try {
        const isBlocking = await getBlockingState();
        console.log('Loaded state:', isBlocking);
        updateUI(isBlocking);
    } catch (error) {
        console.error('Error loading state:', error);
        // Default to enabled if there's an error
        updateUI(true);
    }
}

/**
 * Update UI based on state
 * @param {boolean} isBlocking - Current blocking state
 */
function updateUI(isBlocking) {
    if (!blockShortsToggle || !statusIndicator || !statusText) return;

    blockShortsToggle.checked = isBlocking;

    if (isBlocking) {
        statusIndicator.classList.add('active');
        statusText.textContent = 'Enabled';
    } else {
        statusIndicator.classList.remove('active');
        statusText.textContent = 'Disabled';
    }
}

/**
 * Handle toggle changes
 */
async function handleToggle() {
    if (!blockShortsToggle) return;

    const isBlocking = blockShortsToggle.checked;
    console.log('Toggle changed to:', isBlocking);

    try {
        // Update UI immediately for responsiveness
        updateUI(isBlocking);

        // Save state
        await setBlockingState(isBlocking);
        
        // Update configuration
        await configService.set('blockShorts', isBlocking);
        
        console.log('State saved successfully');

        // Notify active tabs
        await notifyActiveTabs(isBlocking);

    } catch (error) {
        console.error('Error in handleToggle:', error);
        // Revert UI on error
        updateUI(!isBlocking);
    }
}

/**
 * Notify active tabs of state change
 * @param {boolean} isBlocking - New blocking state
 */
async function notifyActiveTabs(isBlocking) {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tabs[0] && (tabs[0].url.includes('youtube.com') || tabs[0].url.includes('m.youtube.com'))) {
            await chrome.tabs.sendMessage(tabs[0].id, {
                action: 'toggleShorts',
                isBlocking: isBlocking
            });
        }
    } catch (error) {
        console.error('Error notifying active tabs:', error);
    }
}

/**
 * Handle messages from background script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateStatus') {
        updateUI(request.isBlocking);
        sendResponse({ success: true });
    }
});

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePopup);
} else {
    initializePopup();
}