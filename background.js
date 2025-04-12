// Background script for better mobile compatibility

// Store default state
let isInitialized = false;

// Initialize settings if not already set
function initializeSettings() {
    if (isInitialized) return;

    chrome.storage.local.get('blockShorts', function (data) {
        if (data.blockShorts === undefined) {
            // Default to enabled if never set before
            chrome.storage.local.set({ 'blockShorts': true });
        }
        isInitialized = true;
    });
}

// Run initialization
initializeSettings();

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // Pass status to requesting scripts
    if (request.action === 'getStatus') {
        chrome.storage.local.get('blockShorts', function (data) {
            sendResponse({ isBlocking: !!data.blockShorts });
        });
        return true; // Required for async response
    }

    // Toggle feature
    if (request.action === 'toggleShorts') {
        const isBlocking = request.isBlocking;

        // Save setting
        chrome.storage.local.set({ 'blockShorts': isBlocking });

        // Notify all YouTube tabs
        chrome.tabs.query({ url: ['*://*.youtube.com/*', '*://*.m.youtube.com/*'] }, function (tabs) {
            for (const tab of tabs) {
                try {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'toggleShorts',
                        isBlocking: isBlocking
                    });
                } catch (err) {
                    // Suppress errors for inactive tabs
                    console.log("Could not send message to tab: " + tab.id);
                }
            }
        });

        sendResponse({ success: true });
        return true;
    }
});

// Handle browser action clicks (for mobile where popups might not work)
// Firefox MV3 uses "action" instead of "browserAction"
chrome.action.onClicked.addListener(function (tab) {
    // Only act on YouTube tabs
    if (!tab.url.includes('youtube.com')) return;

    // Toggle the setting
    chrome.storage.local.get('blockShorts', function (data) {
        const newState = !data.blockShorts;
        chrome.storage.local.set({ 'blockShorts': newState });

        // Notify the tab
        try {
            chrome.tabs.sendMessage(tab.id, {
                action: 'toggleShorts',
                isBlocking: newState
            });
        } catch (err) {
            console.log("Error sending message to tab:", err);
        }

        // Update icon to show state
        updateIcon(newState);
    });
});

// Update the browser action icon based on state
function updateIcon(isBlocking) {
    try {
        const iconPath = isBlocking ?
            {
                16: "icons/icon16.png",
                48: "icons/icon48.png"
            } :
            {
                16: "icons/icon16-disabled.png",
                48: "icons/icon48-disabled.png"
            };

        chrome.action.setIcon({ path: iconPath });
    } catch (err) {
        console.log("Error updating icon:", err);
    }
}

// Set initial icon state
chrome.storage.local.get('blockShorts', function (data) {
    updateIcon(!!data.blockShorts);
});