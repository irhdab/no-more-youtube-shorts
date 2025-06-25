/**
 * Storage utilities for Chrome extension
 * Handles all storage operations with proper error handling
 */

import { getBrowserConfig } from './environment.js';

const config = getBrowserConfig();

/**
 * Storage error types
 */
export const StorageError = {
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
    UNKNOWN: 'UNKNOWN'
};

/**
 * Get data from Chrome storage
 * @param {string|Array} keys - Key or array of keys to retrieve
 * @returns {Promise<Object>} Storage data
 */
export async function getStorageData(keys = config.storageKey) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(keys, (data) => {
            if (chrome.runtime.lastError) {
                console.error('Storage get error:', chrome.runtime.lastError);
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve(data);
        });
    });
}

/**
 * Set data in Chrome storage
 * @param {Object} data - Data to store
 * @returns {Promise<void>}
 */
export async function setStorageData(data) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set(data, () => {
            if (chrome.runtime.lastError) {
                console.error('Storage set error:', chrome.runtime.lastError);
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve();
        });
    });
}

/**
 * Remove data from Chrome storage
 * @param {string|Array} keys - Key or array of keys to remove
 * @returns {Promise<void>}
 */
export async function removeStorageData(keys) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.remove(keys, () => {
            if (chrome.runtime.lastError) {
                console.error('Storage remove error:', chrome.runtime.lastError);
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve();
        });
    });
}

/**
 * Clear all storage data
 * @returns {Promise<void>}
 */
export async function clearStorage() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.clear(() => {
            if (chrome.runtime.lastError) {
                console.error('Storage clear error:', chrome.runtime.lastError);
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve();
        });
    });
}

/**
 * Get the current blocking state
 * @returns {Promise<boolean>} Current blocking state
 */
export async function getBlockingState() {
    try {
        const data = await getStorageData();
        return data[config.storageKey] !== undefined ? !!data[config.storageKey] : config.defaultBlocking;
    } catch (error) {
        console.error('Error getting blocking state:', error);
        return config.defaultBlocking;
    }
}

/**
 * Set the blocking state
 * @param {boolean} isBlocking - New blocking state
 * @returns {Promise<void>}
 */
export async function setBlockingState(isBlocking) {
    try {
        await setStorageData({ [config.storageKey]: isBlocking });
        console.log('Blocking state saved:', isBlocking);
    } catch (error) {
        console.error('Error setting blocking state:', error);
        throw error;
    }
}

/**
 * Initialize default settings if not already set
 * @returns {Promise<void>}
 */
export async function initializeSettings() {
    try {
        const data = await getStorageData();
        if (data[config.storageKey] === undefined) {
            await setBlockingState(config.defaultBlocking);
            console.log('Default settings initialized');
        }
    } catch (error) {
        console.error('Error initializing settings:', error);
    }
} 