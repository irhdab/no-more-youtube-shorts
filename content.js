// Initialize variables
let isBlocking = false;
let isMobileYouTube = false;
let selectorCache = {};
let isAndroid = false;
let isFirefox = false;
let lastProcessTime = 0;
let processingInProgress = false;

// Check for Firefox on Android
function detectEnvironment() {
    // Check for Firefox
    isFirefox = navigator.userAgent.includes('Firefox');

    // Check for Android
    isAndroid = navigator.userAgent.includes('Android');

    // Check if mobile YouTube - be more aggressive for Android detection
    isMobileYouTube = window.location.hostname.includes('m.youtube.com') ||
        isAndroid ||
        navigator.userAgent.includes('Mobile') ||
        navigator.userAgent.includes('Mobi') ||
        window.innerWidth <= 768;

    console.log(`Environment detected: Firefox=${isFirefox}, Android=${isAndroid}, Mobile YouTube=${isMobileYouTube}`);
}

// Run detection
detectEnvironment();

// Check saved state
function checkInitialState() {
    // Start with default blocking enabled for better user experience
    isBlocking = true;

    chrome.storage.local.get('blockShorts', function (data) {
        if (data.blockShorts !== undefined) {
            isBlocking = !!data.blockShorts;
        } else {
            // First run, set default to enabled
            chrome.storage.local.set({ 'blockShorts': true });
        }

        if (isBlocking) {
            hideShorts();
        }
    });
}

// Delay initial check to ensure page is ready
setTimeout(checkInitialState, 500);

// Listen for toggle events from popup or background
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'toggleShorts') {
        isBlocking = request.isBlocking;

        if (isBlocking) {
            hideShorts();
        } else {
            showShorts();
        }

        sendResponse({ success: true });
    }
    return true;
});

// Handle window resize to detect mobile/desktop switch with throttling
let resizeTimeout;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
        const wasMobile = isMobileYouTube;
        detectEnvironment(); // Re-detect environment

        // If switching between mobile/desktop view, refresh our approach
        if (wasMobile !== isMobileYouTube && isBlocking) {
            // Clear cache when switching modes
            selectorCache = {};
            hideShorts();
        }
    }, 300); // Throttle interval
});

// Throttled observer to avoid performance issues on mobile
const processNewContent = function () {
    if (processingInProgress || !isBlocking) return;

    const now = Date.now();
    // Don't process more often than every 500ms on mobile
    if (isAndroid && now - lastProcessTime < 500) return;

    processingInProgress = true;
    lastProcessTime = now;

    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
        if (isBlocking) {
            hideShorts();
        }
        processingInProgress = false;
    });
};

// Set up a MutationObserver to watch for new content
const observer = new MutationObserver(processNewContent);

// Start observing with a delay to ensure page is loaded
setTimeout(() => {
    if (document.body) {
        // Initial quick pass
        if (isBlocking) hideShorts();

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}, 1000);

// Enhanced function to hide shorts with better precision
function hideShorts() {
    if (!document.body) return;

    try {
        // Log for debugging on mobile
        if (isAndroid) {
            console.log('Hiding Shorts - Mobile mode active');
        }

        // Hide dedicated Shorts sections first (these are safe to hide entirely)
        hideShortsSections();

        // Hide individual Shorts items more carefully
        hideShortsItems();

        // Hide Shorts navigation
        hideShortsNavigation();

        // Hide Shorts filter chips
        hideShortFilterChips();

        // Handle Shorts URL redirects
        redirectShortsUrls();

        // Use improved mobile approach for Firefox Android (without toggle box)
        if (isAndroid && isFirefox) {
            hideMobileShortsImproved();
        }
    } catch (e) {
        console.error('Error in hideShorts:', e);
    }
}

// Improved method for mobile Firefox Android - more targeted approach
function hideMobileShortsImproved() {
    // Only target elements that we can confirm are Shorts
    const confirmedShortsSelectors = [
        'ytm-reel-shelf-renderer',
        'ytm-reel-item-renderer',
        '[data-content-type="shorts"]'
    ];

    confirmedShortsSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            element.style.display = 'none';
            console.log('Hidden confirmed Shorts element:', selector);
        });
    });

    // Find links specifically going to /shorts/ and hide only their immediate containers
    document.querySelectorAll('a[href*="/shorts/"]').forEach(link => {
        // Don't hide search result containers or general video containers
        if (isInSearchResults(link) || isInGeneralVideoList(link)) {
            return;
        }

        let current = link;
        let attempts = 0;

        // Walk up the DOM tree to find a suitable container to hide
        while (current && current !== document.body && attempts < 5) { // Reduced attempts
            attempts++;

            // Only hide if it's specifically a Shorts container
            if (current.tagName && (
                current.tagName.includes('REEL') ||
                current.classList.contains('reel-item') ||
                current.hasAttribute('data-shorts') ||
                (current.tagName.includes('YTM-') && isShortsSpecificContainer(current))
            )) {
                current.style.display = 'none';
                console.log('Hidden Shorts container:', current.tagName, current.className);
                break;
            }

            current = current.parentElement;
        }
    });
}

// Check if element is in search results
function isInSearchResults(element) {
    const searchContainer = element.closest('ytm-search-results, #search-results, .search-results');
    return !!searchContainer;
}

// Check if element is in a general video list (not Shorts-specific)
function isInGeneralVideoList(element) {
    const generalVideoContainers = [
        'ytm-section-list-renderer',
        'ytm-item-section-renderer',
        'ytm-video-with-context-renderer'
    ];

    for (let containerSelector of generalVideoContainers) {
        const container = element.closest(containerSelector);
        if (container) {
            // Check if this container is specifically for Shorts
            const containerText = container.textContent || '';
            const hasReelElements = container.querySelector('ytm-reel-shelf-renderer, ytm-reel-item-renderer');

            // If it doesn't have Shorts-specific elements or text, it's probably general content
            if (!hasReelElements && !containerText.toLowerCase().includes('shorts')) {
                return true;
            }
        }
    }
    return false;
}

// Check if container is specifically for Shorts content
function isShortsSpecificContainer(element) {
    const tagName = element.tagName.toLowerCase();
    const className = element.className.toLowerCase();
    const textContent = (element.textContent || '').toLowerCase();

    // Check for Shorts-specific indicators
    return (
        tagName.includes('reel') ||
        className.includes('reel') ||
        className.includes('shorts') ||
        element.hasAttribute('data-shorts') ||
        element.hasAttribute('data-content-type') && element.getAttribute('data-content-type') === 'shorts' ||
        textContent.includes('shorts') && element.children.length < 5 // Small containers with "shorts" text
    );
}

// Hide dedicated Shorts sections (safe to hide entirely)
function hideShortsSections() {
    const shortsSectionSelectors = isMobileYouTube ? [
        'ytm-reel-shelf-renderer',
        'ytm-rich-section-renderer[data-content-type="shorts"]',
        '.rich-shelf-renderer'
    ] : [
        'ytd-reel-shelf-renderer',
        'ytd-shorts-shelf-renderer',
        'ytd-rich-section-renderer[is-shorts]'
    ];

    shortsSectionSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(section => {
            // For mobile, double-check if section contains Shorts content
            if (isMobileYouTube) {
                const hasShorts = section.querySelector('a[href*="/shorts/"]') ||
                    section.querySelector('ytm-reel-item-renderer') ||
                    section.hasAttribute('data-content-type') && section.getAttribute('data-content-type') === 'shorts';

                if (hasShorts || selector.includes('reel')) {
                    section.style.display = 'none';
                    console.log('Hidden Shorts section:', selector);
                }
            } else {
                section.style.display = 'none';
            }
        });
    });
}

// Hide individual Shorts items with careful detection
function hideShortsItems() {
    if (isMobileYouTube) {
        // Mobile YouTube selectors - be more selective
        const mobileSelectors = [
            'ytm-reel-item-renderer'
        ];

        mobileSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(item => {
                item.style.display = 'none';
                console.log('Hidden mobile Shorts item:', item.tagName);
            });
        });

        // For other containers, only hide if we can confirm they're Shorts
        const generalContainers = [
            'ytm-video-with-context-renderer',
            'ytm-compact-video-renderer'
        ];

        generalContainers.forEach(selector => {
            document.querySelectorAll(selector).forEach(item => {
                // Only hide if this is definitely a Shorts item
                if (isDefiniteShortsElement(item)) {
                    item.style.display = 'none';
                    console.log('Hidden confirmed Shorts item:', item.tagName);
                }
            });
        });
    } else {
        // Desktop selectors
        const desktopSelectors = [
            'ytd-reel-item-renderer',
            'ytd-rich-item-renderer',
            'ytd-video-renderer',
            'ytd-grid-video-renderer'
        ];

        desktopSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(item => {
                if (isShortsElement(item)) {
                    item.style.display = 'none';
                }
            });
        });
    }
}

// More strict Shorts detection to avoid hiding search results
function isDefiniteShortsElement(element) {
    try {
        // Skip if this is in search results
        if (isInSearchResults(element)) {
            return false;
        }

        // Definitive Shorts elements
        if (element.tagName === 'YTD-REEL-ITEM-RENDERER' ||
            element.tagName === 'YTM-REEL-ITEM-RENDERER') {
            return true;
        }

        // Check for Shorts URL in links - but be more specific
        const shortsLink = element.querySelector('a[href*="/shorts/"]');
        if (shortsLink) {
            // Additional verification - make sure this isn't just a regular video in search
            const parentContainer = element.closest('ytm-reel-shelf-renderer, ytm-rich-section-renderer');
            if (parentContainer || element.tagName.includes('REEL')) {
                return true;
            }

            // Check if container has Shorts-specific attributes
            if (element.hasAttribute('data-content-type') &&
                element.getAttribute('data-content-type') === 'shorts') {
                return true;
            }

            // For mobile, check if it's in a Shorts shelf context
            if (isMobileYouTube) {
                const shortsContext = element.closest('[data-content-type="shorts"]');
                if (shortsContext) {
                    return true;
                }
            }
        }

        // Check for definitive Shorts indicators only
        const definiteShortsIndicator = element.querySelector('[data-shorts="true"]') ||
            element.querySelector('.reel-item') ||
            element.hasAttribute('data-shorts');

        if (definiteShortsIndicator) {
            return true;
        }

        return false;
    } catch (e) {
        console.error('Error in isDefiniteShortsElement:', e);
        return false;
    }
}

// Hide Shorts navigation elements
function hideShortsNavigation() {
    const navSelectors = isMobileYouTube ? [
        '.pivot-shorts'
    ] : [
        'ytd-guide-entry-renderer a[title="Shorts"]',
        'ytd-mini-guide-entry-renderer a[title="Shorts"]'
    ];

    navSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(item => {
            const parentItem = isMobileYouTube ? item : item.closest('ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer');
            if (parentItem) {
                parentItem.style.display = 'none';
            }
        });
    });
}

// Keep the original isShortsElement function for desktop compatibility
function isShortsElement(element) {
    try {
        // For mobile, use the more strict detection
        if (isMobileYouTube) {
            return isDefiniteShortsElement(element);
        }

        // Desktop logic (unchanged)
        if (element.tagName === 'YTD-REEL-ITEM-RENDERER' ||
            element.tagName === 'YTM-REEL-ITEM-RENDERER') {
            return true;
        }

        const shortsLink = element.querySelector('a[href*="/shorts/"]');
        if (shortsLink) {
            return true;
        }

        const shortsIndicator = element.querySelector('[aria-label*="Shorts"]') ||
            element.querySelector('[title*="Shorts"]') ||
            element.querySelector('.shorts-badge') ||
            element.querySelector('[data-shorts]') ||
            element.querySelector('.reel-item') ||
            element.querySelector('[data-content-type="shorts"]');
        if (shortsIndicator) {
            return true;
        }

        const textContent = element.textContent || '';
        if (textContent.includes('#shorts') ||
            textContent.includes('#Shorts') ||
            textContent.includes('YouTube Shorts')) {
            return true;
        }

        const parentShelf = element.closest('ytd-reel-shelf-renderer, ytd-shorts-shelf-renderer');
        if (parentShelf) {
            return true;
        }

        return false;
    } catch (e) {
        console.error('Error in isShortsElement:', e);
        return false;
    }
}

// Hide "Shorts" filter chips in search results
function hideShortFilterChips() {
    const chipSelectors = isMobileYouTube ? [
        'ytm-chip-cloud-chip-renderer'
    ] : [
        'ytd-feed-filter-chip-bar-renderer yt-chip-cloud-chip-renderer',
        'yt-chip-cloud-chip-renderer'
    ];

    chipSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(chip => {
            const chipText = chip.textContent.trim().toLowerCase();
            const chipLabel = chip.getAttribute('aria-label')?.toLowerCase() || '';

            if (chipText === 'shorts' || chipLabel.includes('shorts')) {
                chip.style.display = 'none';
            }
        });
    });
}

// Redirect shorts URLs to normal video view
function redirectShortsUrls() {
    if (window.location.pathname.includes('/shorts/') && isBlocking) {
        const videoId = window.location.pathname.split('/shorts/')[1]?.split('/')[0];

        if (videoId && !window.location.search.includes('redirecting=true')) {
            // Add a flag to prevent redirect loops
            const newUrl = `https://${window.location.hostname}/watch?v=${videoId}&redirecting=true`;
            window.location.replace(newUrl);
        }
    }
}

// Function to show shorts again
function showShorts() {
    try {
        // Show all previously hidden elements by removing inline display styles
        const allHiddenElements = document.querySelectorAll('[style*="display: none"]');
        allHiddenElements.forEach(element => {
            // Only restore elements that were likely hidden by our extension
            if (element.tagName.includes('YT')) {
                element.style.display = '';
            }
        });

        // Remove any notices we might have added
        document.querySelectorAll('.youtube-shorts-blocked-notice').forEach(notice => {
            notice.remove();
        });
    } catch (e) {
        console.error('Error showing shorts:', e);
    }
}