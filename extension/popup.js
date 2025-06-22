// Get current tab URL
async function getCurrentTabUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab.url;
}

// Check usage status
async function checkUsageStatus() {
  const { anonId } = await chrome.storage.local.get(['anonId']);
  if (!anonId) return null;
  
  try {
    const response = await fetch(`http://127.0.0.1:8000/usage/${anonId}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch usage:', error);
    return null;
  }
}

// Update UI based on usage
function updateUsageUI(usage) {
  const usageInfo = document.getElementById('usage-info');
  if (!usageInfo) return;
  
  usageInfo.innerHTML = `
    <div class="usage-stats">
      <p class="text-sm text-gray-600">You are part of our exclusive beta testing program!</p>
      <p class="text-sm text-gray-600">Enjoy unlimited access to all features.</p>
    </div>
  `;
}

// Handle analysis results
function displayResults(data) {
  const resultsDiv = document.getElementById('results');
  if (!resultsDiv) return;
  
  if (data.error) {
    resultsDiv.innerHTML = `<p class="error">${data.error}</p>`;
    return;
  }
  
  // Show full results
  resultsDiv.innerHTML = `
    <div class="full-results">
      <h3>Analysis Results</h3>
      <p>Overall Score: ${data.result.overall_score}</p>
      <div class="score-details">
        <div class="score-item">
          <h4>Crawlability</h4>
          <p>${data.result.crawlability.total_score}%</p>
        </div>
        <div class="score-item">
          <h4>Structure</h4>
          <p>${data.result.content_structure.total_score}%</p>
        </div>
        <div class="score-item">
          <h4>E-E-A-T</h4>
          <p>${data.result.eeat.total_score}%</p>
        </div>
      </div>
      <div class="recommendations">
        <h4>Recommendations</h4>
        <ul>
          ${data.result.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}

// Handle the analysis response
function handleAnalysisResponse(response) {
    console.log('Handling analysis response:', response);
    
    if (!response || !response.data) {
        showError('Invalid response format from analysis.');
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

// Update UI with analysis results
function updateUI(data) {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;
    
    if (data.error) {
        resultsDiv.innerHTML = `<p class="error">${data.error}</p>`;
        return;
    }
    
    // Show full results
    resultsDiv.innerHTML = `
        <div class="full-results">
            <h3>Analysis Results</h3>
            <p>Overall Score: ${data.overall_score}</p>
            <div class="score-details">
                <div class="score-item">
                    <h4>Crawlability</h4>
                    <p>${data.crawlability.total_score}%</p>
                </div>
                <div class="score-item">
                    <h4>Structure</h4>
                    <p>${data.content_structure.total_score}%</p>
                </div>
                <div class="score-item">
                    <h4>E-E-A-T</h4>
                    <p>${data.eeat.total_score}%</p>
                </div>
            </div>
            <div class="recommendations">
                <h4>Recommendations</h4>
                <ul>
                    ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            <div class="actions">
                <button onclick="viewDetailedAnalysis()" class="view-details-btn">
                    View Detailed Analysis
                </button>
            </div>
        </div>
    `;
}

// Function to open detailed analysis view
function viewDetailedAnalysis() {
    console.log('Current analysis state:', currentAnalysis);
    if (!currentAnalysis || !currentAnalysis.id) {
        console.error('No analysis ID available');
        return;
    }
    const url = `http://localhost:3000/analysis?id=${encodeURIComponent(currentAnalysis.id)}`;
    console.log('Opening detailed analysis URL:', url);
    chrome.tabs.create({ url });
}

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Check and display usage
  const usage = await checkUsageStatus();
  updateUsageUI(usage);
  
  // Handle analyze button click
  document.getElementById('analyze-btn').addEventListener('click', async () => {
    const url = await getCurrentTabUrl();
    const resultsDiv = document.getElementById('results');
    
    resultsDiv.innerHTML = '<p>Analyzing page...</p>';
    
    chrome.runtime.sendMessage(
      { type: 'analyze', url },
      response => {
        if (response.success) {
          displayResults(response.data);
        } else {
          resultsDiv.innerHTML = `<p class="error">Analysis failed: ${response.error}</p>`;
        }
      }
    );
  });
}); 