@echo off
echo.
echo ==========================================
echo   AmpUp Chrome Extension Icon Updater
echo ==========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python first: https://python.org
    pause
    exit /b 1
)

REM Install required package if not present
echo 📦 Installing required packages...
pip install Pillow >nul 2>&1

REM Run the icon update script
echo.
python update_icons.py

echo.
echo Press any key to exit...
pause >nul 