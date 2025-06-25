/**
 * Configuration Service
 * Handles user settings and preferences for the extension
 */

import { setStorageData, getStorageData } from '../utils/storage.js';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
    blockShorts: true,
    redirectShortsUrls: true,
    hideShortsNavigation: true,
    hideShortsFilterChips: true,
    hideShortsSections: true,
    hideIndividualShorts: true,
    enableKeyboardShortcuts: true,
    showBlockingStats: true,
    autoRefreshOnToggle: true,
    mobileOptimized: true,
    debugMode: false
};

/**
 * Configuration keys
 */
export const CONFIG_KEYS = {
    BLOCK_SHORTS: 'blockShorts',
    REDIRECT_URLS: 'redirectShortsUrls',
    HIDE_NAVIGATION: 'hideShortsNavigation',
    HIDE_FILTER_CHIPS: 'hideShortsFilterChips',
    HIDE_SECTIONS: 'hideShortsSections',
    HIDE_INDIVIDUAL: 'hideIndividualShorts',
    KEYBOARD_SHORTCUTS: 'enableKeyboardShortcuts',
    SHOW_STATS: 'showBlockingStats',
    AUTO_REFRESH: 'autoRefreshOnToggle',
    MOBILE_OPTIMIZED: 'mobileOptimized',
    DEBUG_MODE: 'debugMode'
};

/**
 * Configuration Service Class
 */
export class ConfigService {
    constructor() {
        this.config = { ...DEFAULT_CONFIG };
        this.listeners = [];
    }

    /**
     * Initialize configuration
     */
    async initialize() {
        try {
            const storedConfig = await getStorageData(Object.values(CONFIG_KEYS));
            
            // Merge stored config with defaults
            this.config = {
                ...DEFAULT_CONFIG,
                ...storedConfig
            };

            console.log('Configuration initialized:', this.config);
        } catch (error) {
            console.error('Error initializing configuration:', error);
            // Use default config if storage fails
            this.config = { ...DEFAULT_CONFIG };
        }
    }

    /**
     * Get configuration value
     * @param {string} key - Configuration key
     * @returns {any} Configuration value
     */
    get(key) {
        return this.config[key];
    }

    /**
     * Set configuration value
     * @param {string} key - Configuration key
     * @param {any} value - Configuration value
     */
    async set(key, value) {
        this.config[key] = value;
        
        try {
            await setStorageData({ [key]: value });
            this.notifyListeners(key, value);
            console.log(`Configuration updated: ${key} = ${value}`);
        } catch (error) {
            console.error(`Error setting configuration ${key}:`, error);
            throw error;
        }
    }

    /**
     * Get all configuration
     * @returns {Object} All configuration values
     */
    getAll() {
        return { ...this.config };
    }

    /**
     * Reset configuration to defaults
     */
    async reset() {
        this.config = { ...DEFAULT_CONFIG };
        
        try {
            await setStorageData(this.config);
            this.notifyListeners('reset', this.config);
            console.log('Configuration reset to defaults');
        } catch (error) {
            console.error('Error resetting configuration:', error);
            throw error;
        }
    }

    /**
     * Add configuration change listener
     * @param {Function} listener - Listener function
     */
    addListener(listener) {
        this.listeners.push(listener);
    }

    /**
     * Remove configuration change listener
     * @param {Function} listener - Listener function
     */
    removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Notify all listeners of configuration changes
     * @param {string} key - Changed key
     * @param {any} value - New value
     */
    notifyListeners(key, value) {
        this.listeners.forEach(listener => {
            try {
                listener(key, value, this.config);
            } catch (error) {
                console.error('Error in configuration listener:', error);
            }
        });
    }

    /**
     * Get blocking-related configuration
     * @returns {Object} Blocking configuration
     */
    getBlockingConfig() {
        return {
            blockShorts: this.config.blockShorts,
            redirectShortsUrls: this.config.redirectShortsUrls,
            hideShortsNavigation: this.config.hideShortsNavigation,
            hideShortsFilterChips: this.config.hideShortsFilterChips,
            hideShortsSections: this.config.hideShortsSections,
            hideIndividualShorts: this.config.hideIndividualShorts
        };
    }

    /**
     * Get UI-related configuration
     * @returns {Object} UI configuration
     */
    getUIConfig() {
        return {
            enableKeyboardShortcuts: this.config.enableKeyboardShortcuts,
            showBlockingStats: this.config.showBlockingStats,
            autoRefreshOnToggle: this.config.autoRefreshOnToggle,
            mobileOptimized: this.config.mobileOptimized,
            debugMode: this.config.debugMode
        };
    }

    /**
     * Export configuration
     * @returns {Object} Exportable configuration
     */
    export() {
        return {
            version: '1.0',
            timestamp: new Date().toISOString(),
            config: { ...this.config }
        };
    }

    /**
     * Import configuration
     * @param {Object} importData - Configuration to import
     */
    async import(importData) {
        if (!importData || !importData.config) {
            throw new Error('Invalid import data');
        }

        const newConfig = { ...DEFAULT_CONFIG, ...importData.config };
        
        try {
            await setStorageData(newConfig);
            this.config = newConfig;
            this.notifyListeners('import', newConfig);
            console.log('Configuration imported successfully');
        } catch (error) {
            console.error('Error importing configuration:', error);
            throw error;
        }
    }
} 