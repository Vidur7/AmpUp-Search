// LLMO Configuration Namespace
(function(global) {
    global.LLMO_CONFIG = {
        API: {
            BASE_URL: 'http://localhost:8000',
            TIMEOUT: 15000, // 15 seconds in milliseconds
        },
        
        CACHE: {
            DURATION: 1000 * 60 * 30, // 30 minutes in milliseconds
        },
        
        NOTIFICATION_TYPES: {
            ERROR: 'error',
            SUCCESS: 'success',
            WARNING: 'warning',
            INFO: 'info',
        },
        
        SCORE_RANGES: {
            GOOD: { min: 80, class: 'score-good', text: 'Good' },
            WARNING: { min: 60, class: 'score-warning', text: 'Needs Improvement' },
            CRITICAL: { min: 0, class: 'score-critical', text: 'Critical Issues' },
        },
        
        SECTION_TEMPLATE: {
            technical: {
                title: 'Technical Crawlability',
                description: null,
            },
            structured: {
                title: 'Structured Data & Schema',
                description: null,
            },
            content: {
                title: 'Content Structure & AI Readability',
                description: null,
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
})(typeof window !== 'undefined' ? window : self); 