# AmpUp Search Chrome Extension

## Overview
This Chrome extension analyzes webpage content for optimization with Large Language Models and AI search engines.

## Installation for Development
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this directory

## Files Structure
- `manifest.json` - Extension configuration
- `popup/` - Extension popup interface
- `background.js` - Service worker for background tasks
- `content.js` - Content script for webpage analysis
- `config.js` - Configuration settings
- `icons/` - Extension icons in various sizes

## Production Build
For Chrome Web Store submission, ensure:
1. All references to localhost are updated to production URLs
2. Version number is incremented in manifest.json
3. All required icons are present (16x16, 48x48, 128x128)
4. Privacy policy is accessible

## Privacy Policy
See PRIVACY_POLICY.md for complete privacy policy text.

## Store Description  
See STORE_DESCRIPTION.md for Chrome Web Store listing content.

## Version History
- v1.0.0 - Initial release with full analysis features 