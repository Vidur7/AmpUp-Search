// State management
let currentAnalysis = null;

// Initialize the popup
document.addEventListener('DOMContentLoaded', async () => {
    await getCurrentTab();
    setupEventListeners();
    startAnalysis();
});

// Get the current tab information
async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Clean the URL before displaying
    const cleanUrl = cleanUrlForDisplay(tab.url);
    const urlDisplay = document.getElementById('currentUrl');
    urlDisplay.textContent = cleanUrl;
    urlDisplay.setAttribute('data-full-url', tab.url);
    urlDisplay.title = 'Click to copy full URL';
    return tab;
}

// Clean URL by removing tracking parameters and showing clean path
function cleanUrlForDisplay(url) {
    try {
        const urlObj = new URL(url);
        
        // Remove common tracking parameters
        const paramsToRemove = [
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'utm_term',
            'utm_content',
            'gclid',
            'fbclid',
            'gad_source',
            'gad_campaignid',
            'gbraid',
            '_ga',
            'ref',
            'source'
        ];
        
        // Remove tracking parameters
        paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
        
        // If there are no search parameters left, remove the '?' entirely
        const cleanUrl = urlObj.toString().replace(/\?$/, '');
        
        // Truncate if still too long (over 50 characters)
        if (cleanUrl.length > 50) {
            return cleanUrl.substring(0, 47) + '...';
        }
        
        return cleanUrl;
    } catch (e) {
        console.error('Error cleaning URL:', e);
        return url; // Return original URL if there's an error
    }
}

// Set up event listeners
function setupEventListeners() {
    document.getElementById('rescanBtn').addEventListener('click', () => startAnalysis(true));
    document.getElementById('exportBtn').addEventListener('click', exportReport);
    
    // Add URL click-to-copy functionality
    const urlDisplay = document.getElementById('currentUrl');
    urlDisplay.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(urlDisplay.getAttribute('data-full-url'));
            showNotification('URL copied to clipboard!', LLMO_CONFIG.NOTIFICATION_TYPES.SUCCESS, 2000);
        } catch (err) {
            console.error('Failed to copy URL:', err);
        }
    });
}

// Start the analysis process
async function startAnalysis(force = false) {
    showLoadingState();
    
    try {
        const tab = await getCurrentTab();
        
        // Send message to content script to analyze the page
        chrome.tabs.sendMessage(tab.id, { action: 'analyze' }, (response) => {
            console.log('Received response in popup:', response);
            
            if (chrome.runtime.lastError) {
                // If content script is not injected, inject it
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['config.js', 'content.js']
                }).then(() => {
                    // Retry the analysis after injection
                    chrome.tabs.sendMessage(tab.id, { action: 'analyze' }, handleAnalysisResponse);
                }).catch(error => {
                    console.error('Script injection error:', error);
                    showError('Could not initialize analysis. Please refresh and try again.');
                    showResultsView();
                });
                return;
            }
            
            if (!response) {
                showError('No response received from the analysis.');
                showResultsView();
                return;
            }

            if (!response.success) {
                showError(response.error || 'Analysis failed.');
                showResultsView();
                return;
            }
            
            // Handle the analysis response
            handleAnalysisResponse(response);
        });
    } catch (error) {
        showError('An error occurred while analyzing the page: ' + error.message);
        showResultsView();
        console.error('Analysis error:', error);
    }
}

// Handle the analysis response
function handleAnalysisResponse(response) {
    console.log('Handling analysis response:', response);
    
    if (!response || !response.data) {
        showError('Invalid response format from analysis.');
        showResultsView();
        return;
    }
    
    // Check for specific error messages and show user-friendly errors
    if (!response.success) {
        let userFriendlyMessage = 'Analysis failed';
        
        // Handle common error cases
        if (response.error) {
            if (response.error.includes('Failed to fetch page')) {
                userFriendlyMessage = 'Could not access this website. The site may be blocking automated access or requires authentication.';
            } else if (response.error.includes('timeout')) {
                userFriendlyMessage = 'The website took too long to respond. Try analyzing a different page.';
            } else if (response.error.includes('403')) {
                userFriendlyMessage = 'Access to this website was forbidden. The site may be blocking automated access.';
            } else if (response.error.includes('404')) {
                userFriendlyMessage = 'The page was not found. Please check the URL and try again.';
            } else if (response.error.includes('Network')) {
                userFriendlyMessage = 'Network error. Please check your internet connection and try again.';
            }
        }
        
        showError(userFriendlyMessage);
        showResultsView();
        return;
    }
    
    const data = response.data;
    console.log('Setting currentAnalysis with data:', data);
    currentAnalysis = data;  // Store the analysis data
    
    // Update the UI with the analysis results
    updateUI(data);
    
    // Show the results view
    showResultsView();
    
    // Show success notification
    showNotification('Analysis completed successfully!', LLMO_CONFIG.NOTIFICATION_TYPES.SUCCESS);
}

// Update the UI with analysis results
function updateUI(analysis) {
    console.log('Updating UI with analysis:', analysis);
    
    try {
        updateOverallScore(analysis.overall_score);
        updateSections(analysis);
        
        // Add "View Full Analysis" button after sections
        const container = document.querySelector('.analysis-sections');
        if (!container) {
            throw new Error('Analysis sections container not found');
        }
        
        // Remove existing view more button if present
        const existingButton = container.querySelector('.view-more-container');
        if (existingButton) {
            existingButton.remove();
        }
        
        const viewMoreButton = document.createElement('button');
        viewMoreButton.className = 'btn btn-primary view-more-btn';
        viewMoreButton.innerHTML = `
            <span>View Detailed Analysis</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
        `;
        
        viewMoreButton.addEventListener('click', () => {
            // Ensure all required fields are present and limit data size
            const detailedAnalysis = {
                id: analysis.id || `temp-${Date.now()}`,
                url: analysis.url || document.getElementById('currentUrl').textContent,
                overall_score: analysis.overall_score || 0,
                crawlability: {
                    total_score: analysis.crawlability?.total_score || 0,
                    // Limit issues to reduce URL size
                    issues: (analysis.crawlability?.issues || []).slice(0, 5).map(issue => ({
                        severity: issue.severity || 'medium',
                        message: issue.message || '',
                        recommendation: issue.recommendation || ''
                    }))
                },
                structured_data: {
                    total_score: analysis.structured_data?.total_score || 0,
                    issues: (analysis.structured_data?.issues || []).slice(0, 5).map(issue => ({
                        severity: issue.severity || 'medium',
                        message: issue.message || '',
                        recommendation: issue.recommendation || ''
                    }))
                },
                content_structure: {
                    total_score: analysis.content_structure?.total_score || 0,
                    issues: (analysis.content_structure?.issues || []).slice(0, 5).map(issue => ({
                        severity: issue.severity || 'medium',
                        message: issue.message || '',
                        recommendation: issue.recommendation || ''
                    }))
                },
                eeat: {
                    total_score: analysis.eeat?.total_score || 0,
                    issues: (analysis.eeat?.issues || []).slice(0, 5).map(issue => ({
                        severity: issue.severity || 'medium',
                        message: issue.message || '',
                        recommendation: issue.recommendation || ''
                    }))
                },
                recommendations: (analysis.recommendations || []).slice(0, 5), // Limit recommendations
                timestamp: analysis.timestamp || new Date().toISOString()
            };
            
            // Use URL parameter approach with reduced data size
            const websiteUrl = 'http://localhost:3000/analysis';
            const encodedData = encodeURIComponent(JSON.stringify(detailedAnalysis));
            window.open(`${websiteUrl}?data=${encodedData}`, '_blank');
        });
        
        // Add button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'view-more-container';
        buttonContainer.appendChild(viewMoreButton);
        container.appendChild(buttonContainer);
    } catch (error) {
        console.error('Error updating UI:', error);
        showError('Failed to update display: ' + error.message);
    }
}

// Update the overall score display
function updateOverallScore(score) {
    const scoreText = document.querySelector('.score-text');
    const scoreCircle = document.querySelector('.score-circle');
    const scoreStatus = document.querySelector('.score-status');
    
    // Animate the score
    let currentScore = 0;
    const interval = setInterval(() => {
        if (currentScore < score) {
            currentScore++;
            scoreText.textContent = currentScore;
            scoreCircle.style.background = `conic-gradient(#10b981 ${currentScore}%, #e5e7eb ${currentScore}%)`;
        } else {
            clearInterval(interval);
        }
    }, 30);
    
    // Update status
    const status = getScoreStatus(score);
    scoreStatus.textContent = status.text;
    scoreStatus.className = `score-status ${status.class}`;
}

// Get the score status based on the score value
function getScoreStatus(score) {
    for (const [key, range] of Object.entries(LLMO_CONFIG.SCORE_RANGES)) {
        if (score >= range.min) {
            return range;
        }
    }
    return LLMO_CONFIG.SCORE_RANGES.CRITICAL;
}

// Update the analysis sections
function updateSections(analysis) {
    const container = document.querySelector('.analysis-sections');
    container.innerHTML = '';
    
    Object.entries(LLMO_CONFIG.SECTION_TEMPLATE).forEach(([key, section]) => {
        const data = analysis[key];
        if (data) {
            container.appendChild(createSection(section.title, data, section.description));
        }
    });
}

// Create a section element
function createSection(title, data, description) {
    const section = document.createElement('div');
    section.className = 'section';
    
    const scoreClass = getScoreStatus(data.total_score).class;
    const scoreText = `${Math.round(data.total_score)}%`;
    
    section.innerHTML = `
        <div class="section-header">
            <div class="section-title">
                <span>${title}</span>
                ${description ? `<span class="section-description">${description}</span>` : ''}
            </div>
            <div class="section-score">
                <div class="score-badge ${scoreClass}">${scoreText}</div>
            </div>
        </div>
    `;
    
    return section;
}

// Export the analysis report
function exportReport() {
    if (!currentAnalysis) {
        showNotification('No analysis data to export', LLMO_CONFIG.NOTIFICATION_TYPES.WARNING);
        return;
    }
    
    const report = {
        url: document.getElementById('currentUrl').textContent,
        timestamp: new Date().toISOString(),
        analysis: currentAnalysis
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `llmo-analysis-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Report exported successfully', LLMO_CONFIG.NOTIFICATION_TYPES.SUCCESS);
}

// Show loading state
function showLoadingState() {
    document.getElementById('scanningView').style.display = 'block';
    document.getElementById('resultsView').style.display = 'none';
}

// Show results view
function showResultsView() {
    document.getElementById('scanningView').style.display = 'none';
    document.getElementById('resultsView').style.display = 'block';
}

// Show error message
function showError(message, duration = 5000) {
    showNotification(message, LLMO_CONFIG.NOTIFICATION_TYPES.ERROR, duration);
    
    // Also update the UI to show error state
    const resultsView = document.getElementById('resultsView');
    if (resultsView) {
        const errorSection = document.createElement('div');
        errorSection.className = 'error-section';
        errorSection.innerHTML = `
            <div class="error-container">
                <div class="error-title">Analysis Error</div>
                <div class="error-message">${message}</div>
                <button onclick="startAnalysis()" class="retry-button">Try Again</button>
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

// Show a notification
function showNotification(message, type = LLMO_CONFIG.NOTIFICATION_TYPES.INFO, duration = 3000) {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    // Style based on notification type
    const notificationStyles = {
        [LLMO_CONFIG.NOTIFICATION_TYPES.SUCCESS]: {
            background: '#10b981',
            border: '1px solid #059669'
        },
        [LLMO_CONFIG.NOTIFICATION_TYPES.ERROR]: {
            background: '#ef4444',
            border: '1px solid #dc2626'
        },
        [LLMO_CONFIG.NOTIFICATION_TYPES.WARNING]: {
            background: '#f59e0b',
            border: '1px solid #d97706'
        },
        [LLMO_CONFIG.NOTIFICATION_TYPES.INFO]: {
            background: '#3b82f6',
            border: '1px solid #2563eb'
        }
    };
    
    const currentStyle = notificationStyles[type] || notificationStyles[LLMO_CONFIG.NOTIFICATION_TYPES.INFO];
    
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
        [LLMO_CONFIG.NOTIFICATION_TYPES.SUCCESS]: '✓',
        [LLMO_CONFIG.NOTIFICATION_TYPES.ERROR]: '✕',
        [LLMO_CONFIG.NOTIFICATION_TYPES.WARNING]: '⚠',
        [LLMO_CONFIG.NOTIFICATION_TYPES.INFO]: 'ℹ'
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