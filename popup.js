document.addEventListener('DOMContentLoaded', function () {
    const blockShortsToggle = document.getElementById('blockShorts');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const mobileInstruction = document.getElementById('mobile-instruction');

    // Detect environment
    const isFirefox = navigator.userAgent.includes('Firefox') || typeof InstallTrigger !== 'undefined';
    const isAndroid = navigator.userAgent.includes('Android');
    const isMobile = isAndroid || 'ontouchstart' in window;

    console.log('Environment:', { isFirefox, isAndroid, isMobile });

    // Show appropriate message for different environments
    if (isFirefox && isAndroid) {
        mobileInstruction.textContent = "Toggle works in popup or tap extension icon";
        mobileInstruction.style.display = 'block';
    } else if (isMobile) {
        mobileInstruction.textContent = "Tap the toggle to enable/disable";
        mobileInstruction.style.display = 'block';
    } else {
        mobileInstruction.style.display = 'none';
    }

    // Increase touch target size for mobile
    if (isMobile) {
        const toggleContainer = document.querySelector('.toggle-container');
        if (toggleContainer) {
            toggleContainer.style.padding = '12px 0';
            toggleContainer.style.minHeight = '44px';
        }

        // Make the entire toggle area clickable
        const toggleArea = document.querySelector('.toggle-container');
        toggleArea.style.cursor = 'pointer';
        toggleArea.addEventListener('click', function (e) {
            if (!e.target.matches('input[type="checkbox"]')) {
                blockShortsToggle.checked = !blockShortsToggle.checked;
                handleToggle();
            }
        });

        document.body.classList.add('mobile');
    }

    // Load saved state with better error handling
    function loadState() {
        try {
            chrome.storage.local.get('blockShorts', function (data) {
                if (chrome.runtime.lastError) {
                    console.error('Storage error:', chrome.runtime.lastError);
                    // Default to enabled if there's an error
                    updateUI(true);
                    return;
                }

                const isBlocking = data.blockShorts !== undefined ? !!data.blockShorts : true;
                console.log('Loaded state:', isBlocking);
                updateUI(isBlocking);
            });
        } catch (error) {
            console.error('Error loading state:', error);
            updateUI(true); // Default to enabled
        }
    }

    // Update UI based on state
    function updateUI(isBlocking) {
        blockShortsToggle.checked = isBlocking;

        if (isBlocking) {
            statusIndicator.classList.add('active');
            statusText.textContent = 'Enabled';
        } else {
            statusIndicator.classList.remove('active');
            statusText.textContent = 'Disabled';
        }
    }

    // Handle toggle changes
    function handleToggle() {
        const isBlocking = blockShortsToggle.checked;
        console.log('Toggle changed to:', isBlocking);

        // Update UI immediately for responsiveness
        updateUI(isBlocking);

        // Save state
        try {
            chrome.storage.local.set({ 'blockShorts': isBlocking }, function () {
                if (chrome.runtime.lastError) {
                    console.error('Error saving state:', chrome.runtime.lastError);
                    return;
                }
                console.log('State saved successfully');
            });

            // For Firefox, also send message to background script
            if (isFirefox) {
                chrome.runtime.sendMessage({
                    action: 'toggleShorts',
                    isBlocking: isBlocking
                }, function (response) {
                    if (chrome.runtime.lastError) {
                        console.error('Message error:', chrome.runtime.lastError);
                    } else {
                        console.log('Message sent successfully:', response);
                    }
                });
            } else {
                // For other browsers, notify active tabs directly
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    if (chrome.runtime.lastError) {
                        console.error('Query tabs error:', chrome.runtime.lastError);
                        return;
                    }

                    if (tabs[0] && (tabs[0].url.includes('youtube.com') || tabs[0].url.includes('m.youtube.com'))) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: 'toggleShorts',
                            isBlocking: isBlocking
                        }, function (response) {
                            if (chrome.runtime.lastError) {
                                console.error('Send message error:', chrome.runtime.lastError);
                            }
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error in handleToggle:', error);
        }
    }

    // Load initial state
    loadState();

    // Add event listeners
    blockShortsToggle.addEventListener('change', handleToggle);

    // Additional click handler for better mobile support
    if (isMobile) {
        blockShortsToggle.addEventListener('click', function (e) {
            // Let the change event handle the logic
            e.stopPropagation();
        });
    }

    // Handle messages from background script (for status updates)
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.action === 'updateStatus') {
            updateUI(request.isBlocking);
            sendResponse({ success: true });
        }
    });

    // Debug: Add keyboard shortcut for testing
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            if (e.target === blockShortsToggle) {
                e.preventDefault();
                blockShortsToggle.checked = !blockShortsToggle.checked;
                handleToggle();
            }
        }
    });
});