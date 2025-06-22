# 🚀 AmpUp Search - AI Content Optimization Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Vidur7/AmpUp-Search)

> **Transform your website content for the AI search era**

AmpUp Search is a comprehensive platform that analyzes and optimizes website content for Large Language Models (LLMs) and AI-powered search engines. As AI becomes the primary way users discover information, ensure your content is perfectly positioned for maximum visibility and engagement.

## 🎯 What is AmpUp Search?

AmpUp Search provides detailed optimization scores across four critical areas:

- **🔍 Crawlability Analysis** - Check robots.txt, llms.txt, and technical accessibility
- **📊 Structured Data Optimization** - Evaluate Schema.org markup and rich snippets  
- **📝 Content Structure Assessment** - Analyze headings, lists, tables, and Q&A formats
- **🏆 E-E-A-T Evaluation** - Assess Expertise, Experience, Authoritativeness, and Trustworthiness

## 🏗️ Project Structure

```
AmpUp-Search/
├── 🌐 frontend/          # Next.js web dashboard
├── ⚙️ backend/           # FastAPI Python backend
├── 🔌 extension/         # Chrome extension
├── 📚 docs/              # Documentation
└── 🛠️ scripts/          # Utility scripts
```

## ✨ Key Features

- **🎯 One-Click Analysis** - Instantly analyze any webpage
- **📊 Detailed Scoring** - Comprehensive 0-100 scores for each category
- **📈 Historical Tracking** - Monitor optimization progress over time
- **🔧 Actionable Insights** - Specific recommendations for improvement
- **📱 Dashboard Integration** - Beautiful web interface for detailed reports
- **🔒 Privacy-First** - Secure analysis with no data sharing
- **🆓 Free to Use** - Open source with optional premium features

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Chrome browser

### 1. Clone the Repository
```bash
git clone https://github.com/Vidur7/AmpUp-Search.git
cd AmpUp-Search
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Option 1: Using uvicorn directly
uvicorn app.main:app --reload

# Option 2: Using the startup script (if having issues)
python start.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Extension Setup
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `extension/` directory

## 📖 Documentation

- **[Installation Guide](docs/INSTALLATION.md)** - Detailed setup instructions
- **[API Documentation](docs/API.md)** - Backend API reference
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Contributing](docs/CONTRIBUTING.md)** - How to contribute to the project
- **[Chrome Store Guide](CHROME_STORE_SUBMISSION_GUIDE.md)** - Extension publication guide

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Query** - Data fetching

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **Alembic** - Database migrations
- **BeautifulSoup** - Web scraping
- **Authlib** - OAuth implementation

### Extension
- **Manifest V3** - Latest Chrome extension API
- **Vanilla JavaScript** - Lightweight and fast
- **Chrome APIs** - Storage, tabs, scripting

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Support the Project

If you find AmpUp Search helpful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🤝 Contributing code
- 📢 Sharing with others

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/Vidur7/AmpUp-Search/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Vidur7/AmpUp-Search/discussions)
- **Email**: support@ampupsearch.com
- **Website**: [ampupsearch.com](https://ampupsearch.com)

## 🎯 Roadmap

- [ ] **v1.1** - Advanced AI recommendations
- [ ] **v1.2** - Multi-language support
- [ ] **v1.3** - WordPress plugin
- [ ] **v1.4** - API for third-party integrations
- [ ] **v2.0** - Machine learning optimization suggestions

## 🏆 Acknowledgments

- Built with ❤️ for the developer community
- Inspired by the growing importance of AI in search
- Thanks to all contributors and beta testers

---

**Ready to optimize your content for the AI-powered future?** 🚀

[Install Extension](https://chrome.google.com/webstore) | [Try Dashboard](https://ampupsearch.com) | [View Documentation](docs/) 