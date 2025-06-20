// Background script for better mobile compatibility

let isInitialized = false;

// Initialize settings if not already set
function initializeSettings() {
    if (isInitialized) return;

    chrome.storage.local.get('blockShorts', function (data) {
        if (chrome.runtime.lastError) {
            console.error('Storage error during init:', chrome.runtime.lastError);
            return;
        }

        if (data.blockShorts === undefined) {
            // Default to enabled if never set before
            chrome.storage.local.set({ 'blockShorts': true }, function () {
                if (chrome.runtime.lastError) {
                    console.error('Error setting default:', chrome.runtime.lastError);
                } else {
                    console.log('Default settings initialized');
                }
            });
        }
        isInitialized = true;
    });
}

// Run initialization
initializeSettings();

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('Background received message:', request);

    // Get current status
    if (request.action === 'getStatus') {
        chrome.storage.local.get('blockShorts', function (data) {
            if (chrome.runtime.lastError) {
                console.error('Error getting status:', chrome.runtime.lastError);
                sendResponse({ isBlocking: true, error: chrome.runtime.lastError });
                return;
            }
            const isBlocking = data.blockShorts !== undefined ? !!data.blockShorts : true;
            console.log('Sending status:', isBlocking);
            sendResponse({ isBlocking: isBlocking });
        });
        return true; // Required for async response
    }

    // Toggle feature
    if (request.action === 'toggleShorts') {
        const isBlocking = request.isBlocking;
        console.log('Background processing toggle:', isBlocking);

        // Save setting
        chrome.storage.local.set({ 'blockShorts': isBlocking }, function () {
            if (chrome.runtime.lastError) {
                console.error('Error saving toggle state:', chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError });
                return;
            }

            console.log('Toggle state saved successfully');

            // Update icon
            updateIcon(isBlocking);

            // Notify all YouTube tabs
            notifyAllYouTubeTabs(isBlocking);

            sendResponse({ success: true });
        });

        return true; // Required for async response
    }
});

// Function to notify all YouTube tabs
function notifyAllYouTubeTabs(isBlocking) {
    chrome.tabs.query({ url: ['*://*.youtube.com/*', '*://*.m.youtube.com/*'] }, function (tabs) {
        if (chrome.runtime.lastError) {
            console.error('Error querying tabs:', chrome.runtime.lastError);
            return;
        }

        console.log('Found YouTube tabs:', tabs.length);

        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'toggleShorts',
                isBlocking: isBlocking
            }, function (response) {
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

// Handle browser action clicks (for mobile where popups might not work well)
if (chrome.action && chrome.action.onClicked) {
    chrome.action.onClicked.addListener(function (tab) {
        console.log('Extension icon clicked on tab:', tab.url);

        // Only act on YouTube tabs
        if (!tab.url.includes('youtube.com')) {
            console.log('Not a YouTube tab, ignoring click');
            return;
        }

        // Toggle the setting
        chrome.storage.local.get('blockShorts', function (data) {
            if (chrome.runtime.lastError) {
                console.error('Error getting state for icon click:', chrome.runtime.lastError);
                return;
            }

            const currentState = data.blockShorts !== undefined ? !!data.blockShorts : true;
            const newState = !currentState;

            console.log('Icon click toggle:', currentState, '->', newState);

            chrome.storage.local.set({ 'blockShorts': newState }, function () {
                if (chrome.runtime.lastError) {
                    console.error('Error saving icon click state:', chrome.runtime.lastError);
                    return;
                }

                // Update icon
                updateIcon(newState);

                // Notify the specific tab
                chrome.tabs.sendMessage(tab.id, {
                    action: 'toggleShorts',
                    isBlocking: newState
                }, function (response) {
                    if (chrome.runtime.lastError) {
                        console.error('Error messaging tab from icon click:', chrome.runtime.lastError);
                    } else {
                        console.log('Icon click message sent successfully');
                    }
                });

                // Also notify other YouTube tabs
                notifyAllYouTubeTabs(newState);
            });
        });
    });
}

// Update the browser action icon based on state
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

        chrome.action.setIcon({ path: iconPath }, function () {
            if (chrome.runtime.lastError) {
                console.error('Error setting icon:', chrome.runtime.lastError);
            }
        });

        // Set badge to show status
        chrome.action.setBadgeText({
            text: isBlocking ? 'ON' : 'OFF'
        }, function () {
            if (chrome.runtime.lastError) {
                console.error('Error setting badge:', chrome.runtime.lastError);
            }
        });

        chrome.action.setBadgeBackgroundColor({
            color: isBlocking ? '#4CAF50' : '#F44336'
        }, function () {
            if (chrome.runtime.lastError) {
                console.error('Error setting badge color:', chrome.runtime.lastError);
            }
        });

    } catch (err) {
        console.error("Error updating icon:", err);
    }
}

// Set initial icon state when extension loads
chrome.storage.local.get('blockShorts', function (data) {
    if (chrome.runtime.lastError) {
        console.error('Error getting initial state for icon:', chrome.runtime.lastError);
        return;
    }
    const isBlocking = data.blockShorts !== undefined ? !!data.blockShorts : true;
    updateIcon(isBlocking);
});

// Listen for storage changes to keep icon in sync
chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === 'local' && changes.blockShorts) {
        const newValue = changes.blockShorts.newValue;
        updateIcon(!!newValue);
        console.log('Storage changed, updated icon:', newValue);
    }
});