document.addEventListener('DOMContentLoaded', function () {
    const blockShortsToggle = document.getElementById('blockShorts');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const mobileInstruction = document.getElementById('mobile-instruction');

    // Detect environment
    const isFirefox = navigator.userAgent.includes('Firefox') || typeof InstallTrigger !== 'undefined';
    const isAndroid = navigator.userAgent.includes('Android');
    const isMobile = isAndroid || 'ontouchstart' in window;

    // Show appropriate message for Firefox Android
    if (isFirefox && isAndroid) {
        mobileInstruction.textContent = "On Firefox Android, tap the extension icon to toggle";
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
            toggleContainer.style.padding = '8px 0';
        }

        // Adjust for mobile screens
        document.body.classList.add('mobile');
    }

    // Load saved state - two approaches for compatibility
    function loadState() {
        if (isFirefox && isAndroid) {
            // For Firefox Android, message the background script
            chrome.runtime.sendMessage({ action: 'getStatus' }, function (response) {
                if (response && response.isBlocking !== undefined) {
                    updateUI(response.isBlocking);
                } else {
                    // Default to enabled
                    updateUI(true);
                }
            });
        } else {
            // Standard approach
            chrome.storage.local.get('blockShorts', function (data) {
                updateUI(!!data.blockShorts);
            });
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

    // Load initial state
    loadState();

    // Handle clicks and touches
    blockShortsToggle.addEventListener('change', handleToggle);

    // If on mobile, add tap handler
    if (isMobile) {
        // Create an overlay for better tap targeting
        const toggleArea = document.querySelector('.toggle-container');
        toggleArea.addEventListener('click', function (e) {
            // Toggle the checkbox if user clicks anywhere in container
            if (!e.target.matches('input')) {
                blockShortsToggle.checked = !blockShortsToggle.checked;
                handleToggle();
            }
        });
    }

    function handleToggle() {
        const isBlocking = blockShortsToggle.checked;

        // Update UI first for responsiveness
        updateUI(isBlocking);

        // Save state
        if (isFirefox && isAndroid) {
            // Use messaging for Firefox Android
            chrome.runtime.sendMessage({
                action: 'toggleShorts',
                isBlocking: isBlocking
            });
        } else {
            // Standard approach
            chrome.storage.local.set({ 'blockShorts': isBlocking });

            // Notify active tabs
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs[0] && (tabs[0].url.includes('youtube.com') || tabs[0].url.includes('m.youtube.com'))) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'toggleShorts',
                        isBlocking: isBlocking
                    });
                }
            });
        }
    }
});