/**
 * YouTube Shorts Blocker Service
 * Core functionality for detecting and hiding YouTube Shorts content
 */

import { Environment, detectEnvironment } from '../utils/environment.js';

/**
 * Shorts Blocker Service Class
 */
export class ShortsBlocker {
    constructor() {
        this.isBlocking = false;
        this.selectorCache = {};
        this.lastProcessTime = 0;
        this.processingInProgress = false;
        this.observer = null;
        
        // Initialize environment
        detectEnvironment();
    }

    /**
     * Initialize the blocker
     * @param {boolean} initialBlockingState - Initial blocking state
     */
    async initialize(initialBlockingState = true) {
        this.isBlocking = initialBlockingState;
        
        if (this.isBlocking) {
            this.hideShorts();
        }
        
        this.setupObserver();
        this.setupResizeHandler();
    }

    /**
     * Set blocking state
     * @param {boolean} isBlocking - New blocking state
     */
    setBlockingState(isBlocking) {
        this.isBlocking = isBlocking;
        
        if (isBlocking) {
            this.hideShorts();
        } else {
            this.showShorts();
        }
    }

    /**
     * Setup mutation observer for dynamic content
     */
    setupObserver() {
        if (this.observer) {
            this.observer.disconnect();
        }

        this.observer = new MutationObserver(() => {
            this.processNewContent();
        });

        // Start observing with delay to ensure page is loaded
        setTimeout(() => {
            if (document.body) {
                if (this.isBlocking) {
                    this.hideShorts();
                }
                
                this.observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
        }, Environment.isAndroid ? 1500 : 1000);
    }

    /**
     * Setup resize handler for mobile/desktop switching
     */
    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const wasMobile = Environment.isMobileYouTube;
                detectEnvironment();

                // If switching between mobile/desktop view, refresh approach
                if (wasMobile !== Environment.isMobileYouTube && this.isBlocking) {
                    this.selectorCache = {};
                    this.hideShorts();
                }
            }, 300);
        });
    }

    /**
     * Process new content with throttling
     */
    processNewContent() {
        if (this.processingInProgress || !this.isBlocking) return;

        const now = Date.now();
        const throttleInterval = Environment.isAndroid ? 500 : 300;
        
        if (now - this.lastProcessTime < throttleInterval) return;

        this.processingInProgress = true;
        this.lastProcessTime = now;

        requestAnimationFrame(() => {
            if (this.isBlocking) {
                this.hideShorts();
            }
            this.processingInProgress = false;
        });
    }

    /**
     * Main function to hide shorts
     */
    hideShorts() {
        if (!document.body) return;

        try {
            if (Environment.isAndroid) {
                console.log('Hiding Shorts - Mobile mode active');
            }

            this.hideShortsSections();
            this.hideShortsItems();
            this.hideShortsNavigation();
            this.hideShortFilterChips();
            this.redirectShortsUrls();

            if (Environment.isAndroid && Environment.isFirefox) {
                this.hideMobileShortsImproved();
            }
        } catch (error) {
            console.error('Error in hideShorts:', error);
        }
    }

    /**
     * Hide dedicated shorts sections
     */
    hideShortsSections() {
        const sectionSelectors = [
            'ytd-rich-section-renderer[is-shorts]',
            'ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts])',
            'ytd-rich-shelf-renderer[is-shorts]',
            'ytd-mini-guide-entry-renderer[aria-label*="Shorts"]',
            'ytd-guide-entry-renderer[aria-label*="Shorts"]',
            'ytd-guide-section-renderer:has(ytd-guide-entry-renderer[aria-label*="Shorts"])'
        ];

        sectionSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.style.display = 'none';
            });
        });
    }

    /**
     * Hide individual shorts items
     */
    hideShortsItems() {
        const itemSelectors = [
            'ytd-rich-item-renderer:has(a[href*="/shorts/"])',
            'ytd-video-renderer:has(a[href*="/shorts/"])',
            'ytd-compact-video-renderer:has(a[href*="/shorts/"])',
            'ytd-grid-video-renderer:has(a[href*="/shorts/"])'
        ];

        itemSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                if (this.isDefiniteShortsElement(element)) {
                    element.style.display = 'none';
                }
            });
        });
    }

    /**
     * Check if element is definitely a shorts element
     * @param {Element} element - Element to check
     * @returns {boolean} True if definitely shorts
     */
    isDefiniteShortsElement(element) {
        // Check for shorts-specific attributes
        if (element.hasAttribute('is-shorts') || 
            element.getAttribute('data-content-type') === 'shorts') {
            return true;
        }

        // Check for shorts in href
        const link = element.querySelector('a[href*="/shorts/"]');
        if (!link) return false;

        // Additional validation for search results
        if (this.isInSearchResults(link)) {
            return false;
        }

        return true;
    }

    /**
     * Check if element is in search results
     * @param {Element} element - Element to check
     * @returns {boolean} True if in search results
     */
    isInSearchResults(element) {
        return element.closest('ytd-search') !== null;
    }

    /**
     * Hide shorts navigation elements
     */
    hideShortsNavigation() {
        const navSelectors = [
            'ytd-mini-guide-entry-renderer[aria-label*="Shorts"]',
            'ytd-guide-entry-renderer[aria-label*="Shorts"]',
            'a[href="/shorts"]',
            'a[href="/feed/trending?bp=4gINGgt2d2bi1aWX1QeQ%3D%3D"]'
        ];

        navSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.style.display = 'none';
            });
        });
    }

    /**
     * Hide shorts filter chips
     */
    hideShortFilterChips() {
        const chipSelectors = [
            'ytd-chip-cloud-chip-renderer:has(a[href*="shorts"])',
            'ytd-chip-cloud-chip-renderer[aria-label*="Shorts"]'
        ];

        chipSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.style.display = 'none';
            });
        });
    }

    /**
     * Redirect shorts URLs to regular video player
     */
    redirectShortsUrls() {
        if (window.location.pathname.includes('/shorts/')) {
            const videoId = window.location.pathname.split('/shorts/')[1];
            if (videoId) {
                const newUrl = `https://www.youtube.com/watch?v=${videoId}`;
                window.location.href = newUrl;
            }
        }
    }

    /**
     * Improved mobile shorts hiding for Firefox Android
     */
    hideMobileShortsImproved() {
        const confirmedShortsSelectors = [
            'ytm-reel-shelf-renderer',
            'ytm-reel-item-renderer',
            '[data-content-type="shorts"]'
        ];

        confirmedShortsSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.style.display = 'none';
            });
        });

        // Handle shorts links more carefully
        document.querySelectorAll('a[href*="/shorts/"]').forEach(link => {
            if (this.isInSearchResults(link) || this.isInGeneralVideoList(link)) {
                return;
            }

            let current = link;
            let attempts = 0;

            while (current && current !== document.body && attempts < 5) {
                attempts++;

                if (current.tagName && (
                    current.tagName.includes('REEL') ||
                    current.classList.contains('reel-item') ||
                    current.hasAttribute('data-shorts') ||
                    (current.tagName.includes('YTM-') && this.isShortsSpecificContainer(current))
                )) {
                    current.style.display = 'none';
                    break;
                }

                current = current.parentElement;
            }
        });
    }

    /**
     * Check if element is in general video list
     * @param {Element} element - Element to check
     * @returns {boolean} True if in general video list
     */
    isInGeneralVideoList(element) {
        const container = element.closest('ytd-rich-grid-renderer, ytd-video-renderer, ytd-compact-video-renderer');
        return container !== null;
    }

    /**
     * Check if element is a shorts-specific container
     * @param {Element} element - Element to check
     * @returns {boolean} True if shorts-specific container
     */
    isShortsSpecificContainer(element) {
        return element.tagName.includes('REEL') || 
               element.classList.contains('reel-item') ||
               element.hasAttribute('data-shorts');
    }

    /**
     * Show all shorts (reverse hiding)
     */
    showShorts() {
        if (!document.body) return;

        try {
            // Remove display:none from all hidden elements
            document.querySelectorAll('[style*="display: none"]').forEach(element => {
                if (this.isShortsElement(element)) {
                    element.style.display = '';
                }
            });
        } catch (error) {
            console.error('Error in showShorts:', error);
        }
    }

    /**
     * Check if element is a shorts element
     * @param {Element} element - Element to check
     * @returns {boolean} True if shorts element
     */
    isShortsElement(element) {
        const shortsIndicators = [
            'shorts',
            'reel',
            'short',
            'ytd-rich-shelf-renderer[is-shorts]',
            'ytd-mini-guide-entry-renderer[aria-label*="Shorts"]',
            'ytd-guide-entry-renderer[aria-label*="Shorts"]'
        ];

        return shortsIndicators.some(indicator => {
            if (indicator.includes('[')) {
                return element.matches(indicator);
            }
            return element.tagName.toLowerCase().includes(indicator) ||
                   element.className.toLowerCase().includes(indicator) ||
                   element.getAttribute('aria-label')?.toLowerCase().includes(indicator);
        });
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.selectorCache = {};
    }
} 