# 🤝 Contributing to AmpUp Search

Thank you for your interest in contributing to AmpUp Search! This document provides guidelines and information for contributors.

## 🌟 Ways to Contribute

- 🐛 **Bug Reports**: Found an issue? Let us know!
- ✨ **Feature Requests**: Have an idea? We'd love to hear it!
- 💻 **Code Contributions**: Fix bugs or implement new features
- 📖 **Documentation**: Improve docs, guides, and examples
- 🧪 **Testing**: Help us maintain code quality
- 🎨 **Design**: UI/UX improvements and suggestions
- 🌍 **Translations**: Help make AmpUp Search accessible globally

## 🚀 Getting Started

### 1. Fork and Clone
```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/AmpUp-Search.git
cd AmpUp-Search
```

### 2. Set Up Development Environment
Follow our [Installation Guide](INSTALLATION.md) to set up the project locally.

### 3. Create a Branch
```bash
# Create a new branch for your feature/fix
git checkout -b feature/amazing-feature
# or
git checkout -b fix/bug-description
```

## 📝 Development Guidelines

### Code Style

#### Python (Backend)
- Follow [PEP 8](https://pep8.org/) style guidelines
- Use `black` for code formatting
- Use `flake8` for linting
- Maximum line length: 88 characters

```bash
# Format code
black .

# Check linting
flake8 .
```

#### TypeScript/JavaScript (Frontend & Extension)
- Use Prettier for formatting
- Follow ESLint rules
- Use meaningful variable names
- Prefer `const` over `let` when possible

```bash
# Format code
npm run format

# Check linting
npm run lint
```

### Commit Messages
Use conventional commit format:
```
type(scope): description

feat(extension): add new analysis category
fix(backend): resolve database connection issue
docs(readme): update installation instructions
style(frontend): improve button styling
refactor(api): optimize database queries
test(backend): add unit tests for auth
```

### Pull Request Process

1. **Create Quality Code**
   - Write clear, readable code
   - Add appropriate comments
   - Follow existing patterns
   - Include error handling

2. **Add Tests**
   - Write unit tests for new functions
   - Update existing tests if needed
   - Ensure all tests pass

3. **Update Documentation**
   - Update relevant documentation
   - Add docstrings to new functions
   - Update API documentation if needed

4. **Submit Pull Request**
   - Use a clear, descriptive title
   - Fill out the PR template
   - Link related issues
   - Request appropriate reviewers

## 🐛 Bug Reports

When reporting bugs, please include:

### Bug Report Template
```markdown
**Describe the Bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. Windows 10, macOS 12.0, Ubuntu 20.04]
- Browser: [e.g. Chrome 96, Firefox 95]
- Extension Version: [e.g. 1.0.0]
- Backend Version: [e.g. 1.0.0]

**Additional Context**
Any other context about the problem.
```

## ✨ Feature Requests

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions or features you've considered.

**Additional context**
Screenshots, mockups, or examples.
```

## 🏗️ Project Structure

```
AmpUp-Search/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── tests/              # Backend tests
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── styles/           # CSS and styling
│   └── tests/            # Frontend tests
├── extension/            # Chrome extension
│   ├── popup/           # Extension popup
│   ├── background.js    # Service worker
│   ├── content.js      # Content scripts
│   └── manifest.json   # Extension manifest
└── docs/               # Documentation
```

## 🧪 Testing

### Running Tests

#### Backend Tests
```bash
cd backend
pytest tests/ -v
```

#### Frontend Tests
```bash
cd frontend
npm test
```

#### Extension Tests
```bash
cd extension
# Manual testing in Chrome
# Load unpacked extension and test functionality
```

### Writing Tests
- Write tests for new features
- Update tests when modifying existing code
- Ensure good test coverage
- Use descriptive test names

## 🔄 Development Workflow

### 1. Issue Assignment
- Check existing issues before creating new ones
- Comment on issues you'd like to work on
- Wait for assignment before starting work

### 2. Development
- Keep commits focused and atomic
- Test your changes thoroughly
- Update documentation as needed

### 3. Code Review
- All code must be reviewed before merging
- Address reviewer feedback promptly
- Be open to suggestions and improvements

### 4. Merging
- Squash commits if requested
- Ensure CI/CD passes
- Maintain clean git history

## 📚 Resources

### Documentation
- [Installation Guide](INSTALLATION.md)
- [API Documentation](API.md)
- [Extension Development](EXTENSION.md)
- [Deployment Guide](DEPLOYMENT.md)

### Tools and Libraries
- **Backend**: FastAPI, SQLAlchemy, Alembic
- **Frontend**: Next.js, React, Tailwind CSS
- **Extension**: Chrome APIs, Manifest V3
- **Testing**: pytest, Jest, Chrome DevTools

### External Resources
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🎯 Contribution Areas

### High Priority
- [ ] Bug fixes and stability improvements
- [ ] Performance optimizations
- [ ] Security enhancements
- [ ] Accessibility improvements

### Medium Priority
- [ ] New analysis features
- [ ] UI/UX improvements
- [ ] Additional integrations
- [ ] Testing coverage

### Future Features
- [ ] Mobile app
- [ ] WordPress plugin
- [ ] API integrations
- [ ] Machine learning features

## 💬 Communication

### Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Requests**: Code review and collaboration
- **Email**: support@ampupsearch.com

### Response Times
- Issues: Within 48 hours
- Pull Requests: Within 72 hours
- Discussions: Within 24 hours

## 🏆 Recognition

Contributors will be:
- Listed in the project README
- Mentioned in release notes
- Invited to our contributors' channel
- Eligible for swag and rewards

## 📄 License

By contributing to AmpUp Search, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

Don't hesitate to ask! We're here to help:
- Create a [GitHub Discussion](https://github.com/Vidur7/AmpUp-Search/discussions)
- Open an [Issue](https://github.com/Vidur7/AmpUp-Search/issues)
- Email us at support@ampupsearch.com

Thank you for contributing to AmpUp Search! 🚀 