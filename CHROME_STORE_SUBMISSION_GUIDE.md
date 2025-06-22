# 🚀 Chrome Web Store Submission Guide for AmpUp Search

## 📋 Pre-Submission Checklist

### ✅ Extension Files Ready
- [x] `manifest.json` updated to v1.0.0
- [x] All required icons present (16px, 48px, 128px)
- [x] Privacy policy created
- [x] Store description prepared
- [x] All functionality tested and working

### ⚠️ Before Upload - Replace Development Config
**CRITICAL**: Replace `config.js` with production version:
```bash
# In extension directory:
mv config.js config.development.js
mv config.production.js config.js
```

## 🎯 Chrome Web Store Submission Steps

### Step 1: Access Developer Console
1. Go to [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole)
2. Sign in with your Google account
3. If first time: Pay $5 developer registration fee

### Step 2: Create Extension Package
1. Create a ZIP file of the `extension/` directory
2. **Include these files only:**
   - `manifest.json`
   - `popup/` folder
   - `background.js`
   - `content.js`
   - `config.js` (production version!)
   - `icons/` folder

3. **Exclude development files**

### Step 3: Upload Extension
1. Click "New Item" in developer console
2. Upload your ZIP file
3. Wait for upload to complete

### Step 4: Fill Store Listing
- **Product Name**: AmpUp Search - LLM Content Optimizer
- **Summary**: Optimize website content for AI search engines and LLMs
- **Description**: Copy from `STORE_DESCRIPTION.md`
- **Category**: Developer Tools

### Step 5: Submit for Review
1. Review all information
2. Click "Submit for Review"
3. Wait for approval (1-3 business days)

## 🎉 Ready to Launch!
Your extension is ready for Chrome Web Store submission! 