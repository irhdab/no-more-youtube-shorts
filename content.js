/**
 * Content Script for YouTube Shorts Blocker
 * Handles the main blocking functionality on YouTube pages
 */

import { ShortsBlocker } from './services/shorts-blocker.js';
import { ConfigService } from './services/config-service.js';
import { getBlockingState, initializeSettings } from './utils/storage.js';
import { detectEnvironment } from './utils/environment.js';

// Initialize services
const configService = new ConfigService();
const shortsBlocker = new ShortsBlocker();

// Initialize the extension
async function initializeExtension() {
    try {
        // Initialize environment detection
        detectEnvironment();
        
        // Initialize configuration
        await configService.initialize();
        
        // Initialize storage settings
        await initializeSettings();
        
        // Get initial blocking state
        const isBlocking = await getBlockingState();
        
        // Initialize the shorts blocker
        await shortsBlocker.initialize(isBlocking);
        
        console.log('YouTube Shorts Blocker initialized successfully');
    } catch (error) {
        console.error('Error initializing extension:', error);
    }
}

// Listen for toggle events from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleShorts') {
        try {
            const isBlocking = request.isBlocking;
            
            // Update the blocker state
            shortsBlocker.setBlockingState(isBlocking);
            
            // Update configuration
            configService.set('blockShorts', isBlocking);
            
            sendResponse({ success: true });
        } catch (error) {
            console.error('Error handling toggle message:', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    
    if (request.action === 'getStatus') {
        try {
            const isBlocking = shortsBlocker.isBlocking;
            sendResponse({ isBlocking });
        } catch (error) {
            console.error('Error getting status:', error);
            sendResponse({ isBlocking: false, error: error.message });
        }
    }
    
    return true; // Keep message channel open for async response
});

// Handle configuration changes
configService.addListener((key, value) => {
    if (key === 'blockShorts') {
        shortsBlocker.setBlockingState(value);
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    shortsBlocker.destroy();
});