/**
 * Environment detection utilities
 * Handles browser detection, mobile detection, and platform-specific logic
 */

/**
 * Environment configuration object
 */
export const Environment = {
    isFirefox: false,
    isAndroid: false,
    isMobileYouTube: false,
    isChrome: false,
    isEdge: false,
    isSafari: false
};

/**
 * Detect the current browser environment
 * @returns {Object} Environment configuration
 */
export function detectEnvironment() {
    const userAgent = navigator.userAgent;
    
    // Browser detection
    Environment.isFirefox = userAgent.includes('Firefox') || typeof InstallTrigger !== 'undefined';
    Environment.isChrome = userAgent.includes('Chrome') && !userAgent.includes('Edg');
    Environment.isEdge = userAgent.includes('Edg');
    Environment.isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
    
    // Platform detection
    Environment.isAndroid = userAgent.includes('Android');
    
    // Mobile YouTube detection
    Environment.isMobileYouTube = window.location.hostname.includes('m.youtube.com') ||
        Environment.isAndroid ||
        userAgent.includes('Mobile') ||
        userAgent.includes('Mobi') ||
        window.innerWidth <= 768;

    console.log('Environment detected:', Environment);
    return Environment;
}

/**
 * Check if the current environment supports specific features
 * @returns {Object} Feature support object
 */
export function getFeatureSupport() {
    return {
        serviceWorker: 'serviceWorker' in navigator,
        storage: 'storage' in chrome,
        action: 'action' in chrome,
        tabs: 'tabs' in chrome,
        runtime: 'runtime' in chrome
    };
}

/**
 * Get browser-specific configuration
 * @returns {Object} Browser-specific settings
 */
export function getBrowserConfig() {
    const config = {
        storageKey: 'blockShorts',
        defaultBlocking: true,
        throttleInterval: 500,
        observerDelay: 1000
    };

    // Adjust settings based on environment
    if (Environment.isAndroid) {
        config.throttleInterval = 500;
        config.observerDelay = 1500;
    }

    if (Environment.isFirefox) {
        config.throttleInterval = 300;
    }

    return config;
} 