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

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('LLMO Readiness Auditor installed');
    console.log('LLMO Config loaded:', LLMO_CONFIG);
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getConfig') {
        sendResponse({ config: LLMO_CONFIG });
        return true;
    }
    
    if (request.action === 'analyze') {
        handleAnalysis(request.url)
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Will respond asynchronously
    }
});

// Handle the analysis request
async function handleAnalysis(url) {
    try {
        console.log('Making API request to:', `${LLMO_CONFIG.API.BASE_URL}/analyze`);
        const response = await fetch(`${LLMO_CONFIG.API.BASE_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Analysis failed:', error);
        throw error;
    }
}

// Listen for extension icon clicks
chrome.action.onClicked.addListener((tab) => {
    // This won't actually fire since we have a popup
    console.log('Extension clicked');
}); 