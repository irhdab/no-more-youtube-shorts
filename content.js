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

    // Check if mobile YouTube
    isMobileYouTube = window.location.hostname.includes('m.youtube.com') ||
        (window.location.hostname.includes('youtube.com') && (
            window.innerWidth <= 600 ||
            isAndroid ||
            navigator.userAgent.includes('Mobi')
        ));

    console.log(`Environment detected: Firefox=${isFirefox}, Android=${isAndroid}, Mobile YouTube=${isMobileYouTube}`);
}

// Run detection
detectEnvironment();

// Add a message to the page
function addStatusMessage() {
    if (isAndroid && isFirefox) {
        if (document.querySelector('.shorts-blocker-status')) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'shorts-blocker-status youtube-shorts-blocked-notice';
        messageDiv.innerHTML = `
            <p>YouTube Shorts Blocker is ${isBlocking ? 'active' : 'inactive'}</p>
            <button id="toggleBlocker">Toggle Blocker</button>
        `;
        messageDiv.style.position = 'fixed';
        messageDiv.style.bottom = '10px';
        messageDiv.style.right = '10px';
        messageDiv.style.zIndex = '9999';
        messageDiv.style.width = 'auto';

        document.body.appendChild(messageDiv);

        // Add click handler
        document.getElementById('toggleBlocker').addEventListener('click', function () {
            isBlocking = !isBlocking;
            chrome.storage.local.set({ 'blockShorts': isBlocking });

            if (isBlocking) {
                hideShorts();
            } else {
                showShorts();
            }

            // Update status text
            messageDiv.querySelector('p').textContent = `YouTube Shorts Blocker is ${isBlocking ? 'active' : 'inactive'}`;
        });

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.opacity = '0.3';
            }
        }, 5000);

        // Show on hover
        messageDiv.addEventListener('mouseenter', () => {
            messageDiv.style.opacity = '1';
        });

        messageDiv.addEventListener('mouseleave', () => {
            messageDiv.style.opacity = '0.3';
        });
    }
}

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

        // Add status message if on Firefox Android
        if (isAndroid && isFirefox && document.body) {
            addStatusMessage();
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

        // Update status message if it exists
        const statusMsg = document.querySelector('.shorts-blocker-status p');
        if (statusMsg) {
            statusMsg.textContent = `YouTube Shorts Blocker is ${isBlocking ? 'active' : 'inactive'}`;
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

        // Add status message for Firefox Android
        if (isAndroid && isFirefox) {
            addStatusMessage();
        }
    }
}, 1000);

// Enhanced function to hide shorts with optimizations for mobile
function hideShorts() {
    if (!document.body) return;

    // Choose selectors based on desktop or mobile YouTube
    const selectors = getSelectors();

    // Process sections first (they contain multiple shorts)
    try {
        const shortsSections = document.querySelectorAll(selectors.shortsSection);
        shortsSections.forEach(section => {
            section.style.display = 'none';
        });
    } catch (e) {
        console.error('Error hiding shorts sections:', e);
    }

    // Process individual items
    try {
        const videoItems = document.querySelectorAll(selectors.videoItems);
        videoItems.forEach(item => {
            if (isShortsElement(item)) {
                item.style.display = 'none';
            }
        });
    } catch (e) {
        console.error('Error hiding video items:', e);
    }

    // Hide navigation elements
    try {
        const navItems = document.querySelectorAll(selectors.navMenu);
        navItems.forEach(item => {
            const parentItem = isMobileYouTube ? item : item.closest('ytd-guide-entry-renderer');
            if (parentItem) {
                parentItem.style.display = 'none';
            }
        });
    } catch (e) {
        console.error('Error hiding nav menu:', e);
    }

    // Handle shorts filter chips in search
    try {
        hideShortFilterChips();
    } catch (e) {
        console.error('Error hiding filter chips:', e);
    }

    // Redirect from /shorts/ URLs to normal video
    try {
        redirectShortsUrls();
    } catch (e) {
        console.error('Error redirecting shorts URL:', e);
    }
}

// Get appropriate selectors for current YouTube view
function getSelectors() {
    // Use cached selectors if available
    const cacheKey = isMobileYouTube ? 'mobile' : 'desktop';
    if (selectorCache[cacheKey]) {
        return selectorCache[cacheKey];
    }

    let selectors;

    if (isMobileYouTube) {
        selectors = {
            videoItems: [
                'ytm-video-with-context-renderer',
                'ytm-compact-video-renderer',
                'ytm-item-section-renderer',
                'ytm-shelf-renderer',
                'ytm-reel-item-renderer',
                'ytm-slim-video-metadata-renderer'
            ].join(', '),

            shortsSection: [
                'ytm-reel-shelf-renderer',
                'ytm-rich-section-renderer'
            ].join(', '),

            navMenu: [
                '.pivot-shorts'
            ].join(', '),

            filterChips: [
                'ytm-chip-cloud-chip-renderer'
            ].join(', ')
        };
    } else {
        selectors = {
            videoItems: [
                'ytd-rich-item-renderer',
                'ytd-video-renderer',
                'ytd-grid-video-renderer',
                'ytd-reel-item-renderer',
                'ytd-search ytd-video-renderer',
                'ytd-item-section-renderer',
                'ytd-shelf-renderer',
                'ytd-horizontal-card-list-renderer'
            ].join(', '),

            shortsSection: [
                'ytd-rich-section-renderer',
                'ytd-reel-shelf-renderer',
                'ytd-shorts-shelf-renderer'
            ].join(', '),

            navMenu: [
                'ytd-guide-entry-renderer a[title="Shorts"]'
            ].join(', '),

            filterChips: [
                'ytd-feed-filter-chip-bar-renderer yt-chip-cloud-chip-renderer'
            ].join(', ')
        };
    }

    // Cache the selectors
    selectorCache[cacheKey] = selectors;
    return selectors;
}

// Determine if an element is a Shorts element
function isShortsElement(element) {
    try {
        // Quick check for guaranteed shorts elements
        if (element.tagName === 'YTD-REEL-ITEM-RENDERER' ||
            element.tagName === 'YTM-REEL-ITEM-RENDERER') {
            return true;
        }

        // Check for shorts in the URL or title
        if (element.querySelector('a[href*="/shorts/"]') ||
            element.querySelector('[title="Shorts"]')) {
            return true;
        }

        // Check for #shorts text
        if (element.textContent &&
            (element.textContent.includes('#shorts') ||
                element.textContent.includes(' shorts'))) {
            return true;
        }

        // Desktop-specific checks
        if (!isMobileYouTube) {
            if (element.querySelector('[data-short-type]') ||
                (element.tagName === 'YTD-ITEM-SECTION-RENDERER' &&
                    element.querySelector('span')?.textContent.includes('Shorts'))) {
                return true;
            }
        }

        return false;
    } catch (e) {
        console.error('Error checking for shorts element:', e);
        return false;
    }
}

// Hide "Shorts" filter chips in search results
function hideShortFilterChips() {
    const selectors = getSelectors();
    const filterChips = document.querySelectorAll(selectors.filterChips);

    filterChips.forEach(chip => {
        const chipText = chip.textContent.trim().toLowerCase();
        const chipLabel = chip.getAttribute('aria-label')?.toLowerCase() || '';

        if (chipText === 'shorts' || chipLabel.includes('shorts')) {
            chip.style.display = 'none';
        }
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
        // Get all potentially hidden elements
        const selectors = getSelectors();

        // Show video items
        document.querySelectorAll(selectors.videoItems).forEach(element => {
            element.style.display = '';
        });

        // Show shorts sections
        document.querySelectorAll(selectors.shortsSection).forEach(section => {
            section.style.display = '';
        });

        // Show nav menu items for shorts
        const navItems = document.querySelectorAll(selectors.navMenu);
        navItems.forEach(item => {
            const parentItem = isMobileYouTube ? item : item.closest('ytd-guide-entry-renderer');
            if (parentItem) {
                parentItem.style.display = '';
            }
        });

        // Show filter chips
        const filterChips = document.querySelectorAll(selectors.filterChips);
        filterChips.forEach(chip => {
            chip.style.display = '';
        });

        // Remove any notices we might have added
        document.querySelectorAll('.youtube-shorts-blocked-notice:not(.shorts-blocker-status)').forEach(notice => {
            notice.remove();
        });
    } catch (e) {
        console.error('Error showing shorts:', e);
    }
}

// Add a direct control method for Firefox Android
if (isAndroid && isFirefox) {
    window.addEventListener('load', function () {
        // Add keyboard shortcut for Android Firefox
        document.addEventListener('keydown', function (e) {
            // Use Alt+S as a shortcut to toggle
            if (e.altKey && e.key === 's') {
                isBlocking = !isBlocking;
                chrome.storage.local.set({ 'blockShorts': isBlocking });

                if (isBlocking) {
                    hideShorts();
                } else {
                    showShorts();
                }

                // Show temporary status
                const existingMsg = document.querySelector('.shorts-blocker-status');
                if (existingMsg) {
                    existingMsg.querySelector('p').textContent = `YouTube Shorts Blocker is ${isBlocking ? 'active' : 'inactive'}`;
                    existingMsg.style.opacity = '1';
                    setTimeout(() => { existingMsg.style.opacity = '0.3'; }, 3000);
                }
            }
        });
    });
}