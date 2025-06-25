// Configuration for LLMO Chrome Extension
// Check if LLMO_CONFIG is already defined to prevent duplicate declarations
if (typeof LLMO_CONFIG === 'undefined') {
    // Use let instead of const to allow global assignment
    let LLMO_CONFIG = {
        API: {
            BASE_URL: 'http://localhost:8000/api/v1',
            TIMEOUT: 15000, // 15 seconds in milliseconds
            ENDPOINTS: {
                ANALYZE: '/analyze',
                ANONYMOUS_ID: '/user/anonymous-id'
            }
        },
        
        CACHE: {
            DURATION: 5 * 60 * 1000 // 5 minutes in milliseconds
        },
        
        NOTIFICATION_TYPES: {
            SUCCESS: 'success',
            ERROR: 'error',
            INFO: 'info',
            WARNING: 'warning'
        },
        
        SCORE_RANGES: {
            GOOD: { min: 80, class: 'score-good', text: 'Good' },
            WARNING: { min: 60, class: 'score-warning', text: 'Needs Improvement' },
            CRITICAL: { min: 0, class: 'score-critical', text: 'Critical Issues' },
        },
        
        SECTION_TEMPLATE: {
            crawlability: {
                title: 'Technical Crawlability',
                description: 'How well search engines and AI can access your content',
            },
            structured_data: {
                title: 'Structured Data & Schema',
                description: 'How well your content is structured for AI understanding',
            },
            content_structure: {
                title: 'Content Structure & AI Readability',
                description: 'How well your content is organized for AI consumption',
            },
            eeat: {
                title: 'E-E-A-T',
                description: 'Experience, Expertise, Authoritativeness & Trust',
            },
        },
        
        RECOMMENDATIONS: {
            'No robots.txt found': 'Create a robots.txt file to guide search engine and AI crawlers.',
            'No llms.txt found': 'Create an llms.txt file to specify AI crawler preferences.',
            'No structured data found': 'Add relevant schema.org markup to improve content understanding.',
            'No clear author attribution': 'Add author information with proper schema markup.',
            'No clear publication date': 'Include publication and last updated dates.',
            'No external links or citations': 'Add citations to authoritative sources.',
            'No headings found': 'Structure your content with clear headings.',
            'No lists found': 'Use lists to organize related information.',
            'No tables found': 'Consider using tables for structured data presentation.',
            'No paragraphs found': 'Format your content into clear paragraphs.',
        },
        
        PLAYBOOK_REFS: {
            technical: {
                'No robots.txt found': '1.1',
                'No llms.txt found': '1.2',
            },
            structured: {
                'No structured data found': '2.1',
                'No schema.org markup': '2.2',
            },
            content: {
                'No headings found': '3.1',
                'No lists found': '3.2',
            },
            eeat: {
                'No clear author attribution': '4.1',
                'No external links or citations': '4.2',
            },
        }
    };

    // Ensure global availability in all contexts
    if (typeof globalThis !== 'undefined') {
        globalThis.LLMO_CONFIG = LLMO_CONFIG;
    }
    
    // Export for Node.js environments (if needed)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { LLMO_CONFIG };
    }

    // Make available globally for browser environments
    if (typeof window !== 'undefined') {
        window.LLMO_CONFIG = LLMO_CONFIG;
    }

    // Make available for Web Workers and Service Workers
    if (typeof self !== 'undefined' && self !== window) {
        self.LLMO_CONFIG = LLMO_CONFIG;
    }
    
    // For Chrome extension contexts
    if (typeof chrome !== 'undefined') {
        // Make it available globally
        if (typeof self !== 'undefined') {
            self.LLMO_CONFIG = LLMO_CONFIG;
        }
    }
} 