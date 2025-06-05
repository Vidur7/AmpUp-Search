// LLMO Configuration
const LLMO_CONFIG = {
    API: {
        BASE_URL: 'http://localhost:8000/api/v1',
        TIMEOUT: 15000, // 15 seconds in milliseconds
    },
    
    CACHE: {
        DURATION: 1000 * 60 * 30, // 30 minutes in milliseconds
    }
};

// Generate and manage anonymous ID for usage tracking
async function getOrCreateAnonymousId() {
    const result = await chrome.storage.local.get(['anonId']);
    if (result.anonId) {
        return result.anonId;
    }
    
    // Generate new UUID
    const uuid = crypto.randomUUID();
    await chrome.storage.local.set({ anonId: uuid });
    return uuid;
}

// Analyze URL with timeout and error handling
async function analyzeUrl(url, anonId) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LLMO_CONFIG.API.TIMEOUT);
    
    try {
        const response = await fetch(`${LLMO_CONFIG.API.BASE_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Anonymous-ID': anonId
            },
            body: JSON.stringify({ url: url }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Server error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Analysis request timed out. Please try again.');
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener(async () => {
    console.log('LLMO Readiness Auditor installed');
    console.log('LLMO Config loaded:', LLMO_CONFIG);
    // Generate anonymous ID on install
    await getOrCreateAnonymousId();
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);
    
    if (request.action === 'getConfig') {
        sendResponse({ config: LLMO_CONFIG });
        return true;
    }
    
    if (request.action === 'analyze') {
        // Handle analysis request
        (async () => {
            try {
                console.log('Starting analysis for URL:', request.url);
                const anonId = await getOrCreateAnonymousId();
                const data = await analyzeUrl(request.url, anonId);
                
                console.log('Analysis completed:', data);
                
                // If upgrade required, store the state
                if (data.upgrade_required) {
                    await chrome.storage.local.set({ upgradeRequired: true });
                }
                
                sendResponse({ success: true, data });
            } catch (error) {
                console.error('Analysis failed:', error);
                sendResponse({ 
                    success: false, 
                    error: error.message || 'Analysis failed. Please try again.' 
                });
            }
        })();
        
        return true; // Will respond asynchronously
    }
});

// Listen for extension icon clicks
chrome.action.onClicked.addListener((tab) => {
    // This won't actually fire since we have a popup
    console.log('Extension clicked');
}); 