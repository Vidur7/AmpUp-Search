// Global configuration and cache management
window.LLMO = {
    config: null,
    cache: new Map()
};

// Initialize configuration
chrome.runtime.sendMessage({ action: 'getConfig' }, response => {
    if (response && response.config) {
        window.LLMO.config = response.config;
        console.log('Configuration loaded:', window.LLMO.config);
    } else {
        console.error('Failed to load configuration');
    }
});

// Function to clear old cache entries
function clearOldCacheEntries() {
    const now = Date.now();
    for (const [url, data] of window.LLMO.cache.entries()) {
        if (now - data.timestamp > window.LLMO.config.CACHE.DURATION) {
            window.LLMO.cache.delete(url);
        }
    }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyze') {
        console.log('Content script received analyze request');
        
        // Forward the analysis request to the background script
        chrome.runtime.sendMessage(
            { 
                action: 'analyze',
                url: window.location.href
            },
            response => {
                console.log('Received response from background:', response);
                
                // Handle error cases
                if (!response) {
                    console.error('No response from background script');
                    sendResponse({ 
                        success: false, 
                        error: 'No response from analysis service' 
                    });
                    return;
                }
                
                if (response.error) {
                    console.error('Error from background script:', response.error);
                    sendResponse({ 
                        success: false, 
                        error: response.error 
                    });
                    return;
                }
                
                try {
                    // Transform the API response
                    const transformedData = transformApiResponse(response.data || response);
                    console.log('Transformed data:', transformedData);
                    
                    // Validate the transformed data
                    if (!isValidAnalysisData(transformedData)) {
                        throw new Error('Invalid analysis data structure');
                    }
                    
                    sendResponse({ 
                        success: true, 
                        data: transformedData 
                    });
                } catch (error) {
                    console.error('Error transforming response:', error);
                    sendResponse({ 
                        success: false, 
                        error: 'Error processing analysis results: ' + error.message 
                    });
                }
            }
        );
        return true; // Will respond asynchronously
    }
});

// Validate analysis data structure
function isValidAnalysisData(data) {
    if (!data || typeof data !== 'object') return false;
    
    // Check required fields
    const requiredFields = [
        'overall_score',
        'technical',
        'structured',
        'content',
        'eeat'
    ];
    
    for (const field of requiredFields) {
        if (!(field in data)) {
            console.error(`Missing required field: ${field}`);
            return false;
        }
    }
    
    // Check score types
    if (typeof data.overall_score !== 'number') {
        console.error('Invalid overall_score type');
        return false;
    }
    
    // Check section structures
    const sections = ['technical', 'structured', 'content', 'eeat'];
    for (const section of sections) {
        const sectionData = data[section];
        if (!sectionData || 
            typeof sectionData.total_score !== 'number' || 
            !Array.isArray(sectionData.issues)) {
            console.error(`Invalid section structure: ${section}`);
            return false;
        }
    }
    
    return true;
}

// Transform API response to match our UI needs
function transformApiResponse(apiData) {
    console.log('Transforming API response:', apiData);
    
    if (!apiData) {
        throw new Error('No API data to transform');
    }
    
    return {
        overall_score: apiData.overall_score || 0,
        technical: {
            total_score: apiData.crawlability?.total_score || 0,
            issues: transformIssues(apiData.crawlability?.issues || [], 'technical')
        },
        structured: {
            total_score: apiData.structured_data?.total_score || 0,
            issues: transformIssues(apiData.structured_data?.issues || [], 'structured')
        },
        content: {
            total_score: apiData.content_structure?.total_score || 0,
            issues: transformIssues(apiData.content_structure?.issues || [], 'content')
        },
        eeat: {
            total_score: apiData.eeat?.total_score || 0,
            issues: transformIssues(apiData.eeat?.issues || [], 'eeat')
        },
        timestamp: apiData.timestamp,
        recommendations: apiData.recommendations || []
    };
} 