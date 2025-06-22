# 🛠️ Troubleshooting Guide

This guide helps resolve common issues encountered while setting up and running AmpUp Search.

## 🐍 Backend Issues

### Uvicorn Module Import Error

**Problem**: Getting `ModuleNotFoundError: No module named 'uvicorn'` when starting the server.

**Solution**:
```bash
# 1. Activate virtual environment
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# 2. Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 3. Use the startup script instead
python start.py
```

### Virtual Environment Issues

**Problem**: Dependencies not found even after installation.

**Solution**:
```bash
# 1. Delete existing virtual environment
rm -rf venv  # macOS/Linux
Remove-Item -Recurse -Force venv  # Windows PowerShell

# 2. Create fresh virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# 3. Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### Database Migration Issues

**Problem**: Database not initializing or migration errors.

**Solution**:
```bash
cd backend
alembic upgrade head
```

If that fails:
```bash
# Remove existing database and recreate
rm ampup.db  # macOS/Linux
del ampup.db  # Windows

# Run migrations again
alembic upgrade head
```

### Port Already in Use

**Problem**: `Error: [Errno 48] Address already in use`

**Solution**:
```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process (replace PID with actual process ID)
kill -9 PID  # macOS/Linux
taskkill /PID PID /F  # Windows

# Or use a different port
uvicorn app.main:app --reload --port 8001
```

## 🌐 Frontend Issues

### Node Dependencies Error

**Problem**: `npm install` fails or modules not found.

**Solution**:
```bash
cd frontend

# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules  # macOS/Linux
Remove-Item -Recurse -Force node_modules  # Windows

npm install
```

### API Connection Error

**Problem**: Frontend can't connect to backend API.

**Solution**:
1. Verify backend is running on port 8000
2. Check `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```
3. Restart frontend development server:
```bash
npm run dev
```

### Build Failures

**Problem**: `npm run build` fails with TypeScript errors.

**Solution**:
```bash
# Check for linting issues
npm run lint

# Fix TypeScript issues
npx tsc --noEmit

# Clear cache and rebuild
rm -rf .next
npm run build
```

## 🔌 Chrome Extension Issues

### Extension Not Loading

**Problem**: Extension doesn't appear in Chrome or fails to load.

**Solution**:
1. Check `manifest.json` syntax:
```bash
cd extension
# Validate JSON
python -m json.tool manifest.json
```

2. Enable Developer mode in Chrome:
   - Go to `chrome://extensions/`
   - Toggle "Developer mode" on
   - Click "Load unpacked"
   - Select the `extension/` directory

3. Check console for errors:
   - Right-click extension icon → "Inspect popup"
   - Look for JavaScript errors

### Analysis Not Working

**Problem**: Extension shows errors when analyzing pages.

**Solution**:
1. Verify backend is running and accessible
2. Check extension permissions in `manifest.json`
3. Test API connection:
```javascript
// In browser console
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(console.log)
```

### Content Script Injection Errors

**Problem**: `Cannot access chrome:// URL` or similar errors.

**Solution**:
- These are expected on restricted pages (chrome://, file://, etc.)
- Extension only works on regular websites (http://, https://)
- Test on a regular website like `https://example.com`

## 🔐 Authentication Issues

### Google OAuth Not Working

**Problem**: Google sign-in fails or shows errors.

**Solution**:
1. Verify OAuth credentials in `.env`:
```env
GOOGLE_CLIENT_ID=your-actual-client-id
GOOGLE_CLIENT_SECRET=your-actual-client-secret
```

2. Check Google Cloud Console:
   - Ensure OAuth app is configured
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:8000/auth/google/callback`

3. Restart both frontend and backend after config changes

### Session Issues

**Problem**: User gets logged out frequently or sessions don't persist.

**Solution**:
1. Check session secret in backend config
2. Verify browser cookies are enabled
3. Clear browser cookies for localhost
4. Restart browser and try again

## 📊 Database Issues

### SQLite Lock Errors

**Problem**: `database is locked` errors.

**Solution**:
```bash
# Stop all running processes
# Then restart backend
cd backend
python start.py
```

### Missing Tables

**Problem**: Database tables don't exist.

**Solution**:
```bash
cd backend
# Run migrations
alembic upgrade head

# If migrations fail, recreate database
rm ampup.db
alembic upgrade head
```

## 🚀 Performance Issues

### Slow Analysis

**Problem**: Website analysis takes too long or times out.

**Solution**:
1. Check website accessibility (some sites block automated requests)
2. Verify internet connection
3. Try analyzing a different, simpler website first
4. Check backend logs for specific errors

### High Memory Usage

**Problem**: Application uses too much memory.

**Solution**:
1. Restart the backend server
2. Clear browser cache
3. Close unnecessary browser tabs
4. Check for memory leaks in console

## 🆘 Getting Help

If these solutions don't resolve your issue:

1. **Check Logs**: Look at console output for specific error messages
2. **Search Issues**: Check [GitHub Issues](https://github.com/Vidur7/AmpUp-Search/issues)
3. **Create Issue**: Report new bugs with:
   - Steps to reproduce
   - Error messages
   - System information (OS, browser, versions)
   - Screenshots if applicable

4. **Join Discussions**: Ask questions in [GitHub Discussions](https://github.com/Vidur7/AmpUp-Search/discussions)

## 📝 Debug Mode

Enable debug mode for more detailed logging:

### Backend Debug
```bash
# Set environment variable
export DEBUG=1  # macOS/Linux
set DEBUG=1     # Windows

# Or modify .env file
DEBUG=1
```

### Frontend Debug
```bash
# Run in development mode with verbose logging
npm run dev -- --verbose
```

### Extension Debug
1. Open Chrome DevTools on extension popup
2. Check Console and Network tabs
3. Look for error messages and failed requests

Remember: Most issues are environment-related and can be resolved by ensuring all dependencies are properly installed and services are running correctly. 🎯 