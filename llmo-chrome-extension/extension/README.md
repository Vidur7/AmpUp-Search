# LLMO Chrome Extension

## Anonymous ID Sync Implementation

The extension now properly syncs the anonymous ID with the dashboard to ensure that analyses are associated with the correct user account.

### How It Works

1. When the extension starts or the popup opens, it tries to fetch the anonymous ID from the dashboard
2. If the user is logged in, it uses their dashboard anonymous ID for all analyses
3. If the user is not logged in, it falls back to a locally generated anonymous ID
4. When the user logs out, the anonymous ID is cleared

### Testing the Anonymous ID Sync

1. **Sign in as User A**
   - Open the dashboard and log in as User A
   - Open the extension popup
   - Check the browser console for "✅ Synced anon ID from dashboard: [ID]"
   - Run an analysis on a website
   - Verify in the dashboard that the analysis appears under User A's account

2. **Switch to User B**
   - Log out from the dashboard
   - Log in as User B
   - Open the extension popup
   - Check the browser console for "✅ Synced anon ID from dashboard: [ID]" (should be different)
   - Run an analysis on a website
   - Verify in the dashboard that the analysis appears under User B's account

3. **Test Offline Usage**
   - Log out from the dashboard
   - Open the extension popup
   - Check the browser console for "⚠️ Could not sync anon ID from dashboard"
   - Run an analysis on a website
   - The extension should use a locally generated anonymous ID

### Debugging

To view the current anonymous ID in the extension:
1. Open the browser console
2. Run: `chrome.storage.local.get(['anonId'], console.log)`

To clear the anonymous ID manually:
1. Open the browser console
2. Run: `chrome.storage.local.remove('anonId')` 