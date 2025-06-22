# 📦 Installation Guide

This guide will walk you through setting up AmpUp Search for development and production.

## 🔧 Prerequisites

### System Requirements
- **Node.js**: 18.0.0 or higher
- **Python**: 3.8 or higher
- **npm**: 9.0.0 or higher
- **pip**: Latest version
- **Chrome Browser**: Latest version

### Development Tools (Optional)
- **VS Code**: Recommended IDE
- **Git**: For version control
- **Postman**: For API testing

## 🚀 Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Vidur7/AmpUp-Search.git
cd AmpUp-Search
```

### 2. Backend Setup (FastAPI)

#### Navigate to Backend Directory
```bash
cd llmo-chrome-extension/backend
```

#### Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Environment Setup
Create `.env` file:
```bash
# Copy example environment file
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL=sqlite:///./ampup.db
SECRET_KEY=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
FRONTEND_URL=http://localhost:3000
```

#### Database Setup
```bash
# Run database migrations
alembic upgrade head
```

#### Start Backend Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

### 3. Frontend Setup (Next.js)

#### Navigate to Frontend Directory
```bash
cd ../frontend
```

#### Install Dependencies
```bash
npm install
```

#### Environment Setup
Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_SECRET=your-nextauth-secret
```

#### Start Development Server
```bash
npm run dev
```

Frontend will be available at: `http://localhost:3000`

### 4. Chrome Extension Setup

#### Navigate to Extension Directory
```bash
cd ../extension
```

#### Load Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" button
4. Select the `extension/` directory
5. The AmpUp Search extension should now appear in your extensions list

#### Test Extension
1. Navigate to any website
2. Click the AmpUp Search extension icon
3. Click "Analyze This Page"
4. Verify the analysis results appear

## 🌐 Production Deployment

### Backend Deployment

#### Using Docker (Recommended)
```bash
cd backend
docker build -t ampup-backend .
docker run -p 8000:8000 ampup-backend
```

#### Using Traditional Server
```bash
# Install production dependencies
pip install gunicorn

# Start with Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend Deployment

#### Build for Production
```bash
cd frontend
npm run build
npm start
```

#### Deploy to Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Extension Publication
See [Chrome Web Store Submission Guide](../CHROME_STORE_SUBMISSION_GUIDE.md)

## 🔍 Verification

### Backend Health Check
```bash
curl http://localhost:8000/health
```

### Frontend Health Check
Open `http://localhost:3000` in your browser

### Extension Test
1. Visit any website
2. Open the extension popup
3. Run an analysis
4. Check the dashboard for results

## 🐛 Troubleshooting

### Common Issues

#### Backend Issues
- **Port 8000 already in use**: Change port with `--port 8001`
- **Database connection error**: Check database URL in `.env`
- **Missing dependencies**: Run `pip install -r requirements.txt`

#### Frontend Issues
- **API connection error**: Verify backend is running
- **Build failures**: Clear cache with `npm run clean`
- **Environment variables**: Check `.env.local` file

#### Extension Issues
- **Extension not loading**: Verify manifest.json syntax
- **API calls failing**: Check CORS settings in backend
- **Analysis not working**: Verify content script permissions

### Getting Help
- Check [GitHub Issues](https://github.com/Vidur7/AmpUp-Search/issues)
- Join our [Discussions](https://github.com/Vidur7/AmpUp-Search/discussions)
- Email: support@ampupsearch.com

## 📋 Development Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Extension loaded in Chrome
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] All tests passing
- [ ] API endpoints responding
- [ ] Extension analysis working
- [ ] Dashboard displaying data

## 🎯 Next Steps

After successful installation:
1. Read the [API Documentation](API.md)
2. Check the [Extension Development Guide](EXTENSION.md)
3. Review the [Contributing Guidelines](CONTRIBUTING.md)
4. Explore the codebase and start developing!

Happy coding! 🚀 