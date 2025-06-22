# 📡 API Documentation

AmpUp Search backend provides a RESTful API for analyzing website content and managing user data.

## 🔗 Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://api.ampupsearch.com`

## 📋 API Overview

The API follows REST conventions and returns JSON responses. All endpoints support CORS for browser-based requests.

### Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {...},
  "message": "Request processed successfully"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

## 🔐 Authentication

### Google OAuth
```http
POST /api/v1/auth/google
Content-Type: application/json

{
  "token": "google_oauth_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "jwt_token",
    "token_type": "bearer",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

### Token Usage
Include the JWT token in the Authorization header:

```http
Authorization: Bearer jwt_token
```

## 📊 Analysis Endpoints

### Analyze Website
Analyze a website's content for AI optimization.

```http
POST /api/v1/analyze
Content-Type: application/json
Authorization: Bearer jwt_token

{
  "url": "https://example.com",
  "anonymous_id": "optional_anonymous_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "analysis_id",
    "url": "https://example.com",
    "overall_score": 75,
    "scores": {
      "crawlability": 80,
      "structured_data": 70,
      "content_structure": 75,
      "eeat": 75
    },
    "recommendations": [
      {
        "category": "crawlability",
        "message": "Add robots.txt file",
        "priority": "high"
      }
    ],
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

### Get Analysis by ID
```http
GET /api/v1/analysis/{analysis_id}
Authorization: Bearer jwt_token
```

### Get User Analyses
```http
GET /api/v1/analyses?limit=10&offset=0
Authorization: Bearer jwt_token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analyses": [...],
    "total": 25,
    "has_more": true
  }
}
```

## 👤 User Endpoints

### Get Current User
```http
GET /api/v1/user/me
Authorization: Bearer jwt_token
```

### Link Chrome Extension
```http
POST /api/v1/user/link-extension
Content-Type: application/json
Authorization: Bearer jwt_token

{
  "extension_anonymous_id": "anonymous_id_from_extension"
}
```

### Get Usage Statistics
```http
GET /api/v1/user/stats
Authorization: Bearer jwt_token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_analyses": 50,
    "this_week": 5,
    "average_score": 72.5,
    "recent_analyses": [...]
  }
}
```

## 🎯 Analysis Categories

### Crawlability Score
Evaluates technical accessibility for AI crawlers:

- **robots.txt**: Presence and configuration
- **llms.txt**: AI-specific crawling directives
- **Meta tags**: Title, description, viewport
- **Site structure**: Navigation and internal linking
- **Performance**: Page load speed and Core Web Vitals

### Structured Data Score
Assesses Schema.org markup and rich data:

- **Schema types**: Organization, Article, Product, etc.
- **JSON-LD**: Proper structured data format
- **Open Graph**: Social media metadata
- **Breadcrumbs**: Navigation structure markup
- **Rich snippets**: Enhanced search result appearance

### Content Structure Score
Analyzes content organization for AI understanding:

- **Headings**: Proper H1-H6 hierarchy
- **Lists**: Ordered and unordered content organization
- **Tables**: Structured data presentation
- **Q&A format**: Question-answer pairs
- **Content length**: Appropriate depth and detail

### E-E-A-T Score
Evaluates Expertise, Experience, Authoritativeness, Trustworthiness:

- **Author information**: Clear authorship attribution
- **Contact details**: Accessible contact information
- **About pages**: Company and author background
- **Credentials**: Professional qualifications
- **External links**: Quality and relevance of outbound links

## 📈 Rate Limiting

- **Authenticated users**: 100 requests per minute
- **Anonymous users**: 10 requests per minute
- **Analysis endpoint**: 20 analyses per hour per user

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

## ❌ Error Codes

| Code | Description |
|------|-------------|
| `INVALID_URL` | URL format is invalid |
| `URL_NOT_ACCESSIBLE` | Cannot access the provided URL |
| `ANALYSIS_FAILED` | Analysis processing failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `UNAUTHORIZED` | Invalid or missing authentication |
| `USER_NOT_FOUND` | User account not found |
| `ANALYSIS_NOT_FOUND` | Analysis ID not found |

## 🧪 Testing the API

### Using cURL

```bash
# Analyze a website
curl -X POST http://localhost:8000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{"url": "https://example.com"}'

# Get user analyses
curl -X GET http://localhost:8000/api/v1/analyses \
  -H "Authorization: Bearer your_jwt_token"
```

### Using Postman

1. Import the API collection (coming soon)
2. Set the base URL variable
3. Add your JWT token to authorization
4. Test endpoints

### Using the Frontend

The easiest way to test is through the web dashboard at `http://localhost:3000`

## 📝 OpenAPI Specification

The complete OpenAPI (Swagger) specification is available at:
- **Development**: `http://localhost:8000/docs`
- **Production**: `https://api.ampupsearch.com/docs`

## 🔧 SDK Development

SDKs are planned for:
- [ ] Python
- [ ] JavaScript/Node.js
- [ ] PHP
- [ ] WordPress Plugin

## 🐛 Reporting Issues

Found a bug in the API? Please report it:
1. Check [existing issues](https://github.com/Vidur7/AmpUp-Search/issues)
2. Create a new issue with:
   - Request/response details
   - Expected vs actual behavior
   - Environment information

## 📚 Additional Resources

- [Installation Guide](INSTALLATION.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Chrome Extension Development](EXTENSION.md)
- [Deployment Guide](DEPLOYMENT.md) 