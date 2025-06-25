// LLMO Configuration
const LLMO_CONFIG = {
    API: {
        BASE_URL: 'http://localhost:8000/api/v1',
        ENDPOINTS: {
            ANALYZE: '/analyze',
            ANONYMOUS_ID: '/user/anonymous-id'
        }
    },
    
    CACHE: {
        DURATION: 5 * 60 * 1000 // 5 minutes in milliseconds
    }
};

// LLMO Chrome Extension Background Script
console.log('🚀 Background script starting...');

// Verify config is loaded
if (typeof LLMO_CONFIG === 'undefined') {
    console.error('❌ LLMO_CONFIG not available! Extension may not work properly.');
} else {
    console.log('✅ LLMO_CONFIG loaded successfully:', LLMO_CONFIG.API.BASE_URL);
}

// Cache management configuration

// Generate and manage anonymous ID locally (always for guests)
async function getOrCreateAnonymousIdLocally() {
    const result = await chrome.storage.local.get(['anonId']);
    if (result.anonId) {
        return result.anonId;
    }
    const uuid = crypto.randomUUID();
    await chrome.storage.local.set({ anonId: uuid });
    return uuid;
}

// Get effective anonymous ID (dashboard override if logged in, otherwise local)
async function getEffectiveAnonymousId() {
    console.log('🎬 getEffectiveAnonymousId: Starting anonymous ID resolution...');
    
    try {
        // Try to get token from dashboard if it's open
        const dashboardToken = await getDashboardToken();
        
        if (dashboardToken) {
            console.log('🔍 Found dashboard token, attempting to get user anonymous ID...');
            const res = await fetch(`${LLMO_CONFIG.API.BASE_URL}${LLMO_CONFIG.API.ENDPOINTS.ANONYMOUS_ID}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${dashboardToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('🔍 API response status:', res.status);
            
            if (res.ok) {
                const responseData = await res.json();
                console.log('🔍 API response data:', responseData);
                const { anonymous_id } = responseData;
                if (anonymous_id && anonymous_id !== 'YOUR_ACCOUNT_ID') {
                    console.log('✅ Using logged-in user\'s anonymous ID:', anonymous_id);
                    return anonymous_id;
                } else {
                    console.warn('🔍 API returned invalid anonymous_id:', anonymous_id);
                }
            } else {
                const errorText = await res.text();
                console.warn('❌ Failed to fetch user anonymous ID with token:', res.status, errorText);
            }
        } else {
            console.log('🔍 No dashboard token found, using local anonymous ID');
        }
    } catch (err) {
        console.warn('🔌 Error fetching dashboard anonymous ID:', err.message);
    }

    // Fallback to local anonymous ID
    const localId = await getOrCreateAnonymousIdLocally();
    console.log('📍 Using local anonymous ID:', localId);
    return localId;
}

// Get dashboard token from open tabs
async function getDashboardToken() {
    try {
        console.log('🔍 getDashboardToken: Starting token search...');
        
        // Check if we have permission to access tabs
        const tabs = await chrome.tabs.query({url: 'http://localhost:3000/*'});
        console.log(`🔍 getDashboardToken: Found ${tabs.length} dashboard tabs:`, tabs.map(t => ({id: t.id, url: t.url, title: t.title})));
        
        for (const tab of tabs) {
            try {
                console.log(`🔍 getDashboardToken: Trying to inject script into tab ${tab.id} (${tab.url})`);
                
                // Inject script to get token from localStorage
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                        try {
                            const token = localStorage.getItem('token');
                            const user = localStorage.getItem('user');
                            console.log('🔍 Content script: localStorage token exists:', !!token);
                            console.log('🔍 Content script: localStorage user exists:', !!user);
                            if (token) {
                                console.log('🔍 Content script: Token starts with:', token.substring(0, 20) + '...');
                            }
                            return {
                                token: token,
                                user: user,
                                url: window.location.href
                            };
                        } catch (e) {
                            console.error('🔍 Content script error:', e);
                            return { error: e.message };
                        }
                    }
                });
                
                console.log('🔍 getDashboardToken: Script execution results:', results);
                
                if (results && results[0] && results[0].result) {
                    const result = results[0].result;
                    if (result.error) {
                        console.warn(`🔍 getDashboardToken: Content script error in tab ${tab.id}:`, result.error);
                    } else if (result.token) {
                        console.log('🎯 getDashboardToken: Found dashboard token from tab:', tab.id);
                        console.log('🎯 getDashboardToken: Token preview:', result.token.substring(0, 20) + '...');
                        console.log('🎯 getDashboardToken: User data exists:', !!result.user);
                        return result.token;
                    } else {
                        console.log(`📍 getDashboardToken: No token in tab ${tab.id} localStorage`);
                    }
                }
            } catch (scriptError) {
                console.warn('Failed to inject script into tab:', tab.id, scriptError.message);
            }
        }
        
        console.log('🔍 getDashboardToken: No token found in any dashboard tabs');
    } catch (error) {
        console.warn('Failed to query dashboard tabs:', error.message);
    }
    
    return null;
}

// Legacy function for backward compatibility - now just calls getEffectiveAnonymousId
async function getOrCreateAnonymousId() {
    return await getEffectiveAnonymousId();
}

// Analyze URL with timeout and error handling
async function analyzeUrl(url, anonId) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
        // Clean the URL by removing tracking parameters
        const cleanUrl = url.split('?')[0];
        console.log('Starting analysis for URL:', cleanUrl);
        console.log('Making API request to:', `${LLMO_CONFIG.API.BASE_URL}${LLMO_CONFIG.API.ENDPOINTS.ANALYZE}`);
        
        const response = await fetch(`${LLMO_CONFIG.API.BASE_URL}${LLMO_CONFIG.API.ENDPOINTS.ANALYZE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Anonymous-ID': anonId
            },
            body: JSON.stringify({ 
                url: cleanUrl,
                include_content: true
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('Received response status:', response.status);
        const data = await response.json();
        console.log('Received response data:', data);
        
        if (!response.ok) {
            console.error('Response not OK:', {
                status: response.status,
                statusText: response.statusText,
                data: data
            });
            throw new Error(data.error || `Server error: ${response.status}`);
        }
        
        if (!data.success) {
            console.error('❌ Analysis not successful:', data);
            
            // Extract more specific error information
            let errorMessage = 'Analysis failed';
            let errorDetails = '';
            
            if (data.error) {
                errorMessage = data.error;
            }
            
            if (data.message) {
                errorDetails = data.message;
            }
            
            // Check for specific error patterns in the data
            if (data.data && data.data.recommendations && data.data.recommendations.length > 0) {
                const firstRecommendation = data.data.recommendations[0];
                if (typeof firstRecommendation === 'string' && firstRecommendation.includes('Failed to')) {
                    errorMessage = firstRecommendation;
                }
            }
            
            throw new Error(errorMessage + (errorDetails ? ': ' + errorDetails : ''));
        }
        
        console.log('Analysis successful:', data);
        return data;
    } catch (error) {
        console.error('Analysis failed with error:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        // Handle specific error types
        if (error.name === 'AbortError') {
            throw new Error('Analysis request timed out. Please try again.');
        } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            throw new Error('Could not connect to the analysis service. Please check your internet connection.');
        } else if (error.message) {
            throw new Error(error.message);
        } else {
            throw new Error('Analysis failed. The page might block scraping or took too long to respond.');
        }
    } finally {
        clearTimeout(timeoutId);
    }
}

// Add retry logic
async function analyzeUrlWithRetry(url, anonId, maxRetries = 1) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                console.log(`Retry attempt ${attempt} for URL: ${url}`);
                await new Promise(r => setTimeout(r, 1000 * attempt)); // Exponential backoff
            }
            return await analyzeUrl(url, anonId);
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);
            lastError = error;
        }
    }
    
    throw lastError;
}

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
    console.log('🔄 Extension installed/updated. Initializing background script...');
    try {
        // Ensure we have an anonymous ID, synced from dashboard if possible
        const anonId = await getOrCreateAnonymousId();
        console.log('✅ Background script initialized with anonymous ID:', anonId);
    } catch (error) {
        console.error('❌ Error initializing background script:', error);
    }
});

// Add startup logging
chrome.runtime.onStartup.addListener(() => {
    console.log('🚀 Extension startup - background script starting');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Background script received message:', request, 'from sender:', sender);

    if (request.action === 'getConfig') {
        console.log('Sending config response');
        // Make sure we include all the necessary configuration
        sendResponse({ 
            config: {
                API: LLMO_CONFIG.API,
                CACHE: LLMO_CONFIG.CACHE,
                NOTIFICATION_TYPES: {
                    SUCCESS: 'success',
                    ERROR: 'error',
                    INFO: 'info',
                    WARNING: 'warning'
                }
            } 
        });
        return true;
    }
    
    if (request.action === 'getOrCreateAnonymousId') {
        getOrCreateAnonymousId().then(anonId => {
            sendResponse({ anonId: anonId });
        });
        return true; // Indicate async response
    }
    
    if (request.action === 'clearAnonId') {
        chrome.storage.local.remove('anonId', () => {
            console.log('🧹 Cleared anonymous ID on logout');
        });
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === 'analyze') {
        console.log('Background script received analyze request for:', request.url);
        
        // Check if LLMO_CONFIG is available
        if (!LLMO_CONFIG) {
            console.error('❌ LLMO_CONFIG not available in background script');
            sendResponse({
                success: false,
                error: 'Configuration not loaded',
                data: {
                    url: request.url,
                    overall_score: 0,
                    crawlability: { total_score: 0, issues: ['Configuration not loaded'] },
                    structured_data: { total_score: 0, issues: ['Configuration not loaded'] },
                    content_structure: { total_score: 0, issues: ['Configuration not loaded'] },
                    eeat: { total_score: 0, issues: ['Configuration not loaded'] },
                    recommendations: ['Configuration not loaded. Please refresh the extension.'],
                    timestamp: new Date().toISOString()
                }
            });
            return true;
        }
        
        // Get the anonymous ID first
        getOrCreateAnonymousId().then(anonId => {
            console.log('🔥 ANALYSIS: Using anonymous ID:', anonId);
            
            // Make the API request
            fetch(`${LLMO_CONFIG.API.BASE_URL}${LLMO_CONFIG.API.ENDPOINTS.ANALYZE}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Anonymous-ID': anonId
                },
                body: JSON.stringify({ 
                    url: request.url,
                    include_content: true
                })
            })
        .then(response => {
            console.log('Received response status:', response.status);
            return response.json().then(data => {
                console.log('✅ RAW response from server:', JSON.stringify(data, null, 2));
                if (!response.ok) {
                    throw new Error(data.error || `Server error: ${response.status}`);
                }
                return data;
            });
        })
        .then(data => {
            try {
                // Validate the response structure
                if (!data || typeof data !== 'object') {
                    console.error('❌ Invalid response: not an object', data);
                    throw new Error('Invalid response format: Response is not an object');
                }

                if (!data.success) {
                    console.error('❌ Analysis not successful:', data);
                    
                    // Extract more specific error information
                    let errorMessage = 'Analysis failed';
                    let errorDetails = '';
                    
                    if (data.error) {
                        errorMessage = data.error;
                    }
                    
                    if (data.message) {
                        errorDetails = data.message;
                    }
                    
                    // Check for specific error patterns in the data
                    if (data.data && data.data.recommendations && data.data.recommendations.length > 0) {
                        const firstRecommendation = data.data.recommendations[0];
                        if (typeof firstRecommendation === 'string' && firstRecommendation.includes('Failed to')) {
                            errorMessage = firstRecommendation;
                        }
                    }
                    
                    throw new Error(errorMessage + (errorDetails ? ': ' + errorDetails : ''));
                }

                if (!data.data || typeof data.data !== 'object') {
                    console.error('❌ Invalid response: missing or invalid data field', data);
                    throw new Error('Invalid response format: Missing or invalid data field');
                }

                const analysisData = data.data;
                console.log('✅ Analysis data:', analysisData);

                // Validate required fields
                const requiredFields = [
                    'overall_score',
                    'crawlability',
                    'structured_data',
                    'content_structure',
                    'eeat'
                ];

                for (const field of requiredFields) {
                    if (!analysisData[field]) {
                        console.error(`❌ Missing required field: ${field}`, analysisData);
                        throw new Error(`Invalid response format: Missing required field ${field}`);
                    }
                }

                // Ensure all scores are numbers
                if (typeof analysisData.overall_score !== 'number') {
                    console.error('❌ Invalid overall_score type:', typeof analysisData.overall_score);
                    throw new Error('Invalid response format: overall_score must be a number');
                }

                // Ensure all sub-scores are numbers
                const scoreFields = [
                    'crawlability.total_score',
                    'structured_data.total_score',
                    'content_structure.total_score',
                    'eeat.total_score'
                ];

                for (const field of scoreFields) {
                    const value = field.split('.').reduce((obj, key) => obj?.[key], analysisData);
                    if (typeof value !== 'number') {
                        console.error(`❌ Invalid score type for ${field}:`, typeof value);
                        throw new Error(`Invalid response format: ${field} must be a number`);
                    }
                }

                // Ensure all issues arrays exist
                const issueFields = [
                    'crawlability.issues',
                    'structured_data.issues',
                    'content_structure.issues',
                    'eeat.issues'
                ];

                for (const field of issueFields) {
                    const value = field.split('.').reduce((obj, key) => obj?.[key], analysisData);
                    if (!Array.isArray(value)) {
                        console.error(`❌ Invalid issues type for ${field}:`, typeof value);
                        throw new Error(`Invalid response format: ${field} must be an array`);
                    }
                }

                // Ensure recommendations is an array
                if (!Array.isArray(analysisData.recommendations)) {
                    console.error('❌ Invalid recommendations type:', typeof analysisData.recommendations);
                    throw new Error('Invalid response format: recommendations must be an array');
                }

                // Ensure timestamp exists and is a string
                if (!analysisData.timestamp || typeof analysisData.timestamp !== 'string') {
                    console.log('⚠️ Adding missing timestamp');
                    analysisData.timestamp = new Date().toISOString();
                }

                console.log("✅ Final validated data sent to content script:", analysisData);

                // Send the validated response
                sendResponse({
                    success: true,
                    data: analysisData
                });
            } catch (error) {
                console.error('❌ Error validating response:', error);
                sendResponse({
                    success: false,
                    error: error.message,
                    data: {
                        url: request.url,
                        overall_score: 0,
                        crawlability: {
                            total_score: 0,
                            issues: [error.message]
                        },
                        structured_data: {
                            total_score: 0,
                            issues: [error.message]
                        },
                        content_structure: {
                            total_score: 0,
                            issues: [error.message]
                        },
                        eeat: {
                            total_score: 0,
                            issues: [error.message]
                        },
                        recommendations: [error.message],
                        timestamp: new Date().toISOString()
                    }
                });
            }
        })
        .catch(error => {
            console.error('❌ Error during analysis:', error);
            try {
                sendResponse({
                    success: false,
                    error: error.message,
                    data: {
                        url: request.url,
                        overall_score: 0,
                        crawlability: {
                            total_score: 0,
                            issues: [error.message]
                        },
                        structured_data: {
                            total_score: 0,
                            issues: [error.message]
                        },
                        content_structure: {
                            total_score: 0,
                            issues: [error.message]
                        },
                        eeat: {
                            total_score: 0,
                            issues: [error.message]
                        },
                        recommendations: [error.message],
                        timestamp: new Date().toISOString()
                    }
                });
            } catch (e) {
                console.error('❌ sendResponse failed inside catch:', e);
            }
        });
        }).catch(error => {
            console.error('❌ Error getting anonymous ID:', error);
            sendResponse({
                success: false,
                error: 'Failed to get anonymous ID',
                data: {
                    url: request.url,
                    overall_score: 0,
                    crawlability: { total_score: 0, issues: ['Failed to get anonymous ID'] },
                    structured_data: { total_score: 0, issues: ['Failed to get anonymous ID'] },
                    content_structure: { total_score: 0, issues: ['Failed to get anonymous ID'] },
                    eeat: { total_score: 0, issues: ['Failed to get anonymous ID'] },
                    recommendations: ['Failed to get anonymous ID'],
                    timestamp: new Date().toISOString()
                }
            });
        });
        
        // Return true to indicate we will send response asynchronously
        return true;
    }
    
    // Handle unknown actions
    console.warn('⚠️ Unknown action received:', request.action);
    sendResponse({
        success: false,
        error: `Unknown action: ${request.action}`,
        data: {
            url: request.url || '',
            overall_score: 0,
            crawlability: {
                total_score: 0,
                issues: [`Unknown action: ${request.action}`]
            },
            structured_data: {
                total_score: 0,
                issues: [`Unknown action: ${request.action}`]
            },
            content_structure: {
                total_score: 0,
                issues: [`Unknown action: ${request.action}`]
            },
            eeat: {
                total_score: 0,
                issues: [`Unknown action: ${request.action}`]
            },
            recommendations: [`Unknown action: ${request.action}`],
            timestamp: new Date().toISOString()
        }
    });
    return true;
});

// Listen for extension icon clicks
chrome.action.onClicked.addListener((tab) => {
    // This won't actually fire since we have a popup
    console.log('Extension clicked');
}); 