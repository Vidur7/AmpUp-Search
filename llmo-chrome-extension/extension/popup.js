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
  
  if (usage) {
    const analysesLeft = 5 - usage.analysis_count;
    const fullViewsLeft = 2 - usage.full_views_used;
    
    usageInfo.innerHTML = `
      <div class="usage-stats">
        <p>Free Analyses Left: <strong>${Math.max(0, analysesLeft)}</strong></p>
        <p>Full Views Left: <strong>${Math.max(0, fullViewsLeft)}</strong></p>
      </div>
      ${analysesLeft <= 1 ? '<p class="warning">⚠️ Almost out of free analyses!</p>' : ''}
      ${fullViewsLeft <= 0 ? '<p class="info">ℹ️ Future analyses will show limited results</p>' : ''}
    `;
  }
}

// Handle analysis results
function displayResults(data) {
  const resultsDiv = document.getElementById('results');
  if (!resultsDiv) return;
  
  if (data.error) {
    if (data.limit_reached) {
      resultsDiv.innerHTML = `
        <div class="upgrade-prompt">
          <h3>Free Analysis Limit Reached</h3>
          <p>You've used all your free analyses. Upgrade to continue getting insights!</p>
          <button onclick="window.open('https://ampup.ai/pricing')">Upgrade Now</button>
        </div>
      `;
    } else {
      resultsDiv.innerHTML = `<p class="error">${data.error}</p>`;
    }
    return;
  }
  
  if (!data.show_full_results) {
    resultsDiv.innerHTML = `
      <div class="limited-results">
        <h3>Preview Results</h3>
        <p>Overall Score: ${data.result.overall_score}</p>
        <div class="blur-overlay">
          <p>Detailed results are available with a premium account</p>
          <button onclick="window.open('https://ampup.ai/pricing')">Upgrade to See More</button>
        </div>
      </div>
    `;
  } else {
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
  
  // Update usage display
  if (data.usage) {
    updateUsageUI(data.usage);
  }
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