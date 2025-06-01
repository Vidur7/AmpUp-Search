// Cache management
let LLMO_CONFIG = null;

// Initialize configuration
chrome.runtime.sendMessage({ action: 'getConfig' }, response => {
    if (response && response.config) {
        LLMO_CONFIG = response.config;
        console.log('Configuration loaded:', LLMO_CONFIG);
    } else {
        console.error('Failed to load configuration');
    }
});

if (typeof window.LLMO_CACHE === 'undefined') {
    window.LLMO_CACHE = new Map();
}

// Function to clear old cache entries
function clearOldCacheEntries() {
    const now = Date.now();
    for (const [url, data] of window.LLMO_CACHE.entries()) {
        if (now - data.timestamp > LLMO_CONFIG.CACHE.DURATION) {
            window.LLMO_CACHE.delete(url);
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
                if (response.success) {
                    const transformedData = transformApiResponse(response.data);
                    console.log('Transformed data:', transformedData);
                    sendResponse({ success: true, data: transformedData });
                } else {
                    console.error('Error from background:', response.error);
                    sendResponse({ success: false, error: response.error });
                }
            }
        );
        return true; // Will respond asynchronously
    }
});

// Main analysis function
async function analyzePage() {
    try {
        const url = window.location.href;
        
        // Check cache first
        const cachedResult = window.LLMO_CACHE.get(url);
        if (cachedResult) {
            return cachedResult;
        }
        
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                {
                    action: 'analyze',
                    url: url
                },
                async response => {
                    if (response.success) {
                        const transformedData = transformApiResponse(response.data);
                        // Cache the result
                        window.LLMO_CACHE.set(url, transformedData);
                        resolve(transformedData);
                    } else {
                        reject(new Error(response.error));
                    }
                }
            );
        });
    } catch (error) {
        console.error('Analysis failed:', error);
        return {
            error: true,
            message: error.message || 'Failed to analyze page. Please try again.'
        };
    }
}

// Transform API response to match our UI needs
function transformApiResponse(apiData) {
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
        recommendations: apiData.recommendations
    };
}

// Transform issues array into UI-friendly format
function transformIssues(issues, section) {
    return issues.map(issue => ({
        text: issue,
        type: issue.toLowerCase().includes('no ') ? 'check-fail' : 'check-pass',
        recommendation: getRecommendation(issue, section),
        playbook: getPlaybookReference(issue, section)
    }));
}

// Get recommendation based on issue
function getRecommendation(issue, section) {
    const recommendations = {
        'No robots.txt found': 'Create a robots.txt file to guide search engine and AI crawlers.',
        'No llms.txt found': 'Create an llms.txt file to specify AI crawler preferences.',
        'No structured data found': 'Add relevant schema.org markup to improve content understanding.',
        'No clear author attribution': 'Add author information with proper schema markup.',
        'No clear publication date': 'Include publication and last updated dates.',
        'No external links or citations': 'Add citations to authoritative sources.',
        'No headings found': 'Structure your content with clear headings.',
        'No lists found': 'Use lists to organize related information.',
        'No tables found': 'Consider using tables for structured data presentation.',
        'No paragraphs found': 'Format your content into clear paragraphs.'
    };
    return recommendations[issue] || null;
}

// Get playbook reference based on issue
function getPlaybookReference(issue, section) {
    const playbookRefs = {
        technical: {
            'No robots.txt found': '1.1',
            'No llms.txt found': '1.2'
        },
        structured: {
            'No structured data found': '2.1',
            'No schema.org markup': '2.2'
        },
        content: {
            'No headings found': '3.1',
            'No lists found': '3.2'
        },
        eeat: {
            'No clear author attribution': '4.1',
            'No external links or citations': '4.2'
        }
    };
    return playbookRefs[section]?.[issue] || null;
}

// Show an error message with proper UI
function showError(message, duration = 5000) {
    showNotification(message, NOTIFICATION_TYPES.ERROR, duration);
    
    // Also update the UI to show error state
    const resultsView = document.getElementById('resultsView');
    if (resultsView) {
        const errorSection = document.createElement('div');
        errorSection.className = 'error-section';
        errorSection.innerHTML = `
            <div class="error-container" style="
                padding: 16px;
                background: #fee2e2;
                border: 1px solid #ef4444;
                border-radius: 8px;
                margin: 16px;
                color: #991b1b;
                font-size: 14px;
            ">
                <div style="font-weight: 600; margin-bottom: 8px;">Analysis Error</div>
                <div>${message}</div>
                <button onclick="startAnalysis()" style="
                    margin-top: 12px;
                    background: #dc2626;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    border: none;
                    cursor: pointer;
                    font-size: 12px;
                ">Try Again</button>
            </div>
        `;
        
        // Replace any existing error section or add new one
        const existingError = resultsView.querySelector('.error-section');
        if (existingError) {
            existingError.replaceWith(errorSection);
        } else {
            resultsView.prepend(errorSection);
        }
    }
}

// Enhanced notification system
function showNotification(message, type = NOTIFICATION_TYPES.SUCCESS, duration = 3000) {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    // Style based on notification type
    const notificationStyles = {
        [NOTIFICATION_TYPES.SUCCESS]: {
            background: '#10b981',
            border: '1px solid #059669'
        },
        [NOTIFICATION_TYPES.ERROR]: {
            background: '#ef4444',
            border: '1px solid #dc2626'
        },
        [NOTIFICATION_TYPES.WARNING]: {
            background: '#f59e0b',
            border: '1px solid #d97706'
        },
        [NOTIFICATION_TYPES.INFO]: {
            background: '#3b82f6',
            border: '1px solid #2563eb'
        }
    };
    
    const currentStyle = notificationStyles[type] || notificationStyles[NOTIFICATION_TYPES.INFO];
    
    notification.style.cssText = `
        position: fixed;
        top: 16px;
        right: 16px;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        color: white;
        z-index: 10000;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
        ${Object.entries(currentStyle).map(([key, value]) => `${key}: ${value}`).join(';')};
    `;
    
    // Add icon based on type
    const icons = {
        [NOTIFICATION_TYPES.SUCCESS]: '✓',
        [NOTIFICATION_TYPES.ERROR]: '✕',
        [NOTIFICATION_TYPES.WARNING]: '⚠',
        [NOTIFICATION_TYPES.INFO]: 'ℹ'
    };
    
    notification.innerHTML = `
        <span style="font-weight: bold;">${icons[type] || ''}</span>
        <span style="flex: 1;">${message}</span>
        <span style="cursor: pointer; padding-left: 8px;" onclick="this.parentElement.remove()">×</span>
    `;
    
    document.body.appendChild(notification);
    
    // Add slide-in animation
    const animationStyle = document.createElement('style');
    animationStyle.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(animationStyle);
    
    if (duration > 0) {
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
}

// Update the startAnalysis function to support force refresh
async function startAnalysis(forceRefresh = false) {
    showLoadingState();
    
    try {
        const tab = await getCurrentTab();
        if (!tab) {
            throw new Error('Could not access the current tab');
        }
        
        // Clear cache if force refresh
        if (forceRefresh) {
            window.LLMO_CACHE.clear(tab.url);
        }
        
        // Send message to content script to analyze the page
        chrome.tabs.sendMessage(tab.id, { action: 'analyze' }, (response) => {
            if (chrome.runtime.lastError) {
                showError('Could not connect to the page. Please refresh and try again.');
                showResultsView(); // Show results view even on error
                return;
            }
            
            if (response.error) {
                showError(response.error);
                showResultsView();
                return;
            }
            
            handleAnalysisResponse(response);
            showNotification(
                forceRefresh ? 'Page re-analyzed successfully!' : 'Analysis completed successfully!',
                NOTIFICATION_TYPES.SUCCESS
            );
        });
    } catch (error) {
        showError('An error occurred while analyzing the page: ' + error.message);
        showResultsView(); // Show results view even on error
        console.error('Analysis error:', error);
    }
}

// Update event listeners to handle force refresh
function setupEventListeners() {
    document.getElementById('rescanBtn').addEventListener('click', () => startAnalysis(true));
    document.getElementById('exportBtn').addEventListener('click', exportReport);
    
    // Delegate click events for section toggles
    document.querySelector('.analysis-sections').addEventListener('click', (e) => {
        const header = e.target.closest('.section-header');
        if (header) {
            toggleSection(header);
        }
    });
} 