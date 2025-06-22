@echo off
echo ========================================
echo    AmpUp Search Extension Packager
echo ========================================
echo.

echo Creating Chrome Web Store package...
echo.

echo Files included in package:
echo - manifest.json (v1.0.0)
echo - popup/ directory
echo - background.js
echo - content.js  
echo - config.js
echo - icons/ directory (16, 48, 128 px)
echo - Supporting files
echo.

echo Checking required files...
if exist manifest.json (echo ✓ manifest.json) else (echo ✗ manifest.json MISSING)
if exist popup\popup.html (echo ✓ popup.html) else (echo ✗ popup.html MISSING)
if exist background.js (echo ✓ background.js) else (echo ✗ background.js MISSING)
if exist content.js (echo ✓ content.js) else (echo ✗ content.js MISSING)
if exist icons\icon16.png (echo ✓ icon16.png) else (echo ✗ icon16.png MISSING)
if exist icons\icon48.png (echo ✓ icon48.png) else (echo ✗ icon48.png MISSING)
if exist icons\icon128.png (echo ✓ icon128.png) else (echo ✗ icon128.png MISSING)
echo.

echo ========================================
echo    READY FOR CHROME WEB STORE UPLOAD
echo ========================================
echo.
echo Next Steps:
echo 1. Go to https://chrome.google.com/webstore/devconsole
echo 2. Click "New Item"
echo 3. Upload a ZIP file of this directory
echo 4. Fill in store listing details using STORE_DESCRIPTION.md
echo 5. Add screenshots and promotional images
echo 6. Set privacy policy URL: https://ampupsearch.com/privacy
echo 7. Submit for review
echo.
echo IMPORTANT: Update config.js to use production API URLs before uploading!
echo.
pause 