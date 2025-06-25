/**
 * Background Script for YouTube Shorts Blocker
 * Handles extension lifecycle and cross-tab communication
 */

import { ConfigService } from './services/config-service.js';
import { setBlockingState, getBlockingState, initializeSettings } from './utils/storage.js';
import { detectEnvironment } from './utils/environment.js';

// Initialize services
const configService = new ConfigService();
let isInitialized = false;

/**
 * Initialize the background script
 */
async function initializeBackground() {
    if (isInitialized) return;

    try {
        // Initialize environment detection
        detectEnvironment();
        
        // Initialize configuration
        await configService.initialize();
        
        // Initialize storage settings
        await initializeSettings();
        
        isInitialized = true;
        console.log('Background script initialized successfully');
    } catch (error) {
        console.error('Error initializing background script:', error);
    }
}

/**
 * Handle messages from content script or popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);

    // Get current status
    if (request.action === 'getStatus') {
        getBlockingState()
            .then(isBlocking => {
                console.log('Sending status:', isBlocking);
                sendResponse({ isBlocking });
            })
            .catch(error => {
                console.error('Error getting status:', error);
                sendResponse({ isBlocking: true, error: error.message });
            });
        return true; // Required for async response
    }

    // Toggle feature
    if (request.action === 'toggleShorts') {
        const isBlocking = request.isBlocking;
        console.log('Background processing toggle:', isBlocking);

        setBlockingState(isBlocking)
            .then(() => {
                console.log('Toggle state saved successfully');
                
                // Update configuration
                configService.set('blockShorts', isBlocking);
                
                // Update icon
                updateIcon(isBlocking);
                
                // Notify all YouTube tabs
                notifyAllYouTubeTabs(isBlocking);
                
                sendResponse({ success: true });
            })
            .catch(error => {
                console.error('Error saving toggle state:', error);
                sendResponse({ success: false, error: error.message });
            });

        return true; // Required for async response
    }
});

/**
 * Notify all YouTube tabs of state changes
 * @param {boolean} isBlocking - New blocking state
 */
function notifyAllYouTubeTabs(isBlocking) {
    chrome.tabs.query({ url: ['*://*.youtube.com/*', '*://*.m.youtube.com/*'] }, (tabs) => {
        if (chrome.runtime.lastError) {
            console.error('Error querying tabs:', chrome.runtime.lastError);
            return;
        }

        console.log('Found YouTube tabs:', tabs.length);

        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'toggleShorts',
                isBlocking: isBlocking
            }, (response) => {
                if (chrome.runtime.lastError) {
                    // This is normal for tabs that haven't loaded the content script yet
                    console.log(`Could not message tab ${tab.id}:`, chrome.runtime.lastError.message);
                } else {
                    console.log(`Successfully messaged tab ${tab.id}`);
                }
            });
        });
    });
}

/**
 * Handle browser action clicks (for mobile where popups might not work well)
 */
if (chrome.action && chrome.action.onClicked) {
    chrome.action.onClicked.addListener((tab) => {
        console.log('Extension icon clicked on tab:', tab.url);

        // Only act on YouTube tabs
        if (!tab.url.includes('youtube.com')) {
            console.log('Not a YouTube tab, ignoring click');
            return;
        }

        // Toggle the setting
        getBlockingState()
            .then(currentState => {
                const newState = !currentState;
                console.log('Icon click toggle:', currentState, '->', newState);

                return setBlockingState(newState);
            })
            .then(() => {
                // Update icon
                updateIcon(newState);

                // Notify the specific tab
                chrome.tabs.sendMessage(tab.id, {
                    action: 'toggleShorts',
                    isBlocking: newState
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error messaging tab from icon click:', chrome.runtime.lastError);
                    } else {
                        console.log('Icon click message sent successfully');
                    }
                });

                // Also notify other YouTube tabs
                notifyAllYouTubeTabs(newState);
            })
            .catch(error => {
                console.error('Error handling icon click:', error);
            });
    });
}

/**
 * Update the browser action icon based on state
 * @param {boolean} isBlocking - Current blocking state
 */
function updateIcon(isBlocking) {
    if (!chrome.action || !chrome.action.setIcon) {
        console.log('Icon update not supported');
        return;
    }

    try {
        // Use different icons or badge to show state
        const iconPath = {
            16: "icons/icon16.png",
            48: "icons/icon48.png",
            128: "icons/icon128.png"
        };

        chrome.action.setIcon({ path: iconPath }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error setting icon:', chrome.runtime.lastError);
            }
        });

        // Set badge to show status
        chrome.action.setBadgeText({
            text: isBlocking ? 'ON' : 'OFF'
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error setting badge:', chrome.runtime.lastError);
            }
        });

        chrome.action.setBadgeBackgroundColor({
            color: isBlocking ? '#4CAF50' : '#F44336'
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error setting badge color:', chrome.runtime.lastError);
            }
        });

    } catch (err) {
        console.error("Error updating icon:", err);
    }
}

/**
 * Set initial icon state when extension loads
 */
getBlockingState()
    .then(isBlocking => {
        updateIcon(isBlocking);
    })
    .catch(error => {
        console.error('Error setting initial icon state:', error);
        // Default to enabled state
        updateIcon(true);
    });

// Initialize background script
initializeBackground();