import logging
import asyncio
import aiohttp
from aiohttp import (
    ClientError,
    ClientResponseError,
    ClientConnectionError,
    ClientTimeout,
)
from aiohttp.http_exceptions import ContentEncodingError
from bs4 import BeautifulSoup
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime
from urllib.parse import urljoin, urlparse
import random
import re
import json
import os

logger = logging.getLogger(__name__)

# Default timeout configuration
DEFAULT_TIMEOUT = ClientTimeout(total=10)  # 10 seconds total timeout

# Common user agents to rotate
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
]

# ScrapingBee API configuration
SCRAPINGBEE_API_KEY = os.getenv(
    "SCRAPINGBEE_API_KEY", "YOUR_FREE_API_KEY"
)  # Replace with your free API key
SCRAPINGBEE_API_URL = "https://app.scrapingbee.com/api/v1/"


def extract_recommendations(*issues_lists):
    """
    Safely extract and deduplicate recommendations from various issue lists.
    Handles both string recommendations and dict-based issues.
    """
    recommendations = []
    for issues in issues_lists:
        for issue in issues:
            if isinstance(issue, dict):
                # Extract recommendation from dict-based issue
                if issue.get("recommendation"):
                    recommendations.append(issue["recommendation"])
                elif issue.get("message"):
                    # Fallback to message if no recommendation field
                    recommendations.append(issue["message"])
            elif isinstance(issue, str):
                # Handle string-based recommendations
                recommendations.append(issue)
    # Remove None values and deduplicate while preserving order
    seen = set()
    unique_recommendations = []
    for rec in recommendations:
        if rec and rec not in seen:
            seen.add(rec)
            unique_recommendations.append(rec)
    return unique_recommendations


class LLMOAnalyzer:
    def __init__(self, url: str):
        self.original_url = url
        self.url = self._clean_url(url)
        self.soup: Optional[BeautifulSoup] = None
        self.text_content: str = ""
        self._session: Optional[aiohttp.ClientSession] = None
        self._semaphore = asyncio.Semaphore(5)  # Limit concurrent requests
        logger.info(f"Initialized LLMOAnalyzer for URL: {self.url}")

    def _clean_url(self, url: str) -> str:
        """Clean URL by removing UTM parameters and other unnecessary query parameters"""
        try:
            # Parse the URL
            parsed = urlparse(url)

            # Remove common tracking parameters
            if parsed.query:
                # Split query parameters
                params = parsed.query.split("&")
                # Keep only non-tracking parameters
                clean_params = [
                    p
                    for p in params
                    if not any(
                        p.startswith(prefix)
                        for prefix in ["utm_", "fb_", "gclid", "_ga", "ref_", "source"]
                    )
                ]
                # Reconstruct URL
                if clean_params:
                    clean_query = "&".join(clean_params)
                    return (
                        f"{parsed.scheme}://{parsed.netloc}{parsed.path}?{clean_query}"
                    )
                else:
                    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

            return url
        except Exception as e:
            logger.warning(f"Error cleaning URL {url}: {str(e)}")
            return url

    def _is_shopify_store(self, url: str) -> bool:
        """Check if the URL is a Shopify store"""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()

            # Check for common Shopify patterns
            shopify_patterns = [
                r"\.myshopify\.com$",
                r"\.shopify\.com$",
                r"\.myshopify\.io$",
                r"\.myshopify\.store$",
            ]

            return any(re.search(pattern, domain) for pattern in shopify_patterns)
        except Exception as e:
            logger.warning(f"Error checking Shopify store: {str(e)}")
            return False

    async def __aenter__(self):
        logger.info(f"Creating aiohttp session for {self.url}")
        self._session = aiohttp.ClientSession(
            headers={"User-Agent": random.choice(USER_AGENTS)},
            timeout=aiohttp.ClientTimeout(total=30),
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._session:
            logger.info(f"Closing aiohttp session for {self.url}")
            await self._session.close()

    async def _safe_request(self, url: str, max_retries: int = 3) -> str:
        """Make a request with retry logic and proper error handling"""
        retry_count = 0
        last_error = None

        # Standard headers that mimic a real browser
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",  # Remove br to avoid Brotli issues
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Cache-Control": "max-age=0",
        }

        while retry_count < max_retries:
            try:
                logger.info(f"Making request to {url}")
                async with self._session.get(
                    url,
                    headers=headers,
                    ssl=False,
                    timeout=aiohttp.ClientTimeout(total=30),
                ) as response:
                    if response.status == 200:
                        try:
                            content = await response.text()
                            if not content:
                                raise Exception("Empty response received")
                            return content
                        except Exception as e:
                            last_error = f"Failed to decode response: {str(e)}"
                            logger.error(f"Error decoding response: {str(e)}")
                    else:
                        last_error = (
                            f"HTTP Error: {response.status} - {response.reason}"
                        )
                        logger.error(
                            f"HTTP error: {response.status} - {response.reason}"
                        )

            except aiohttp.ClientError as e:
                last_error = f"Client error: {str(e)}"
                logger.error(f"Client error for {url}: {str(e)}")
            except asyncio.TimeoutError:
                last_error = "Request timed out"
                logger.error(f"Request timed out for {url}")
            except Exception as e:
                last_error = f"Unexpected error: {str(e)}"
                logger.error(f"Unexpected error for {url}: {str(e)}")

            retry_count += 1
            if retry_count < max_retries:
                wait_time = 2**retry_count  # Exponential backoff
                logger.info(
                    f"Retrying in {wait_time} seconds... (Attempt {retry_count + 1}/{max_retries})"
                )
                await asyncio.sleep(wait_time)

        error_msg = f"Failed to fetch page after {max_retries} attempts: {last_error}"
        logger.error(error_msg)
        raise Exception(error_msg)

    async def fetch_page(self) -> None:
        """Fetch the webpage and create BeautifulSoup object"""
        logger.info(f"Fetching page for {self.url}")
        if not self._session:
            error_msg = (
                "Session not initialized. Use async with LLMOAnalyzer() as analyzer:"
            )
            logger.error(error_msg)
            raise RuntimeError(error_msg)

        try:
            result = await self._safe_request(self.url)
            if not result:
                error_msg = f"Failed to fetch page: {result}"
                logger.error(error_msg)
                raise Exception(error_msg)

            try:
                logger.info(f"Parsing HTML for {self.url}")

                # Try multiple parsers with fallbacks
                try:
                    self.soup = BeautifulSoup(result, "lxml")
                except Exception as e:
                    logger.warning(f"lxml parser failed: {e}, trying html.parser")
                    try:
                        self.soup = BeautifulSoup(result, "html.parser")
                    except Exception as e:
                        logger.warning(f"html.parser failed: {e}, trying html5lib")
                        self.soup = BeautifulSoup(result, "html5lib")

                if not self.soup:
                    raise Exception("Failed to parse HTML: BeautifulSoup returned None")

                # Get text content with fallback
                try:
                    self.text_content = self.soup.get_text()
                except Exception as e:
                    logger.warning(
                        f"get_text() failed: {e}, trying alternative text extraction"
                    )
                    # Alternative text extraction
                    self.text_content = " ".join(
                        [text.strip() for text in self.soup.stripped_strings]
                    )

                if not self.text_content or len(self.text_content.strip()) == 0:
                    # Last resort - try to get any text from the raw HTML
                    self.text_content = (
                        result[:1000] if result else "No content available"
                    )
                    logger.warning("Using fallback text content extraction")

                logger.info(
                    f"Successfully parsed HTML for {self.url}, text content length: {len(self.text_content)}"
                )
            except Exception as e:
                error_msg = f"Failed to parse HTML: {str(e)}"
                logger.error(error_msg, exc_info=True)
                raise Exception(error_msg)

        except asyncio.TimeoutError:
            error_msg = "Request timed out while fetching page"
            logger.error(error_msg)
            raise Exception(error_msg)
        except aiohttp.ClientError as e:
            error_msg = f"Network error while fetching page: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise Exception(error_msg)
        except Exception as e:
            error_msg = f"Unexpected error while fetching page: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise Exception(error_msg)

    async def analyze_crawlability(self) -> Tuple[float, List[str]]:
        """Analyze robots.txt and llms.txt"""
        issues = []
        score = 0.0

        # Check robots.txt
        robots_url = urljoin(self.url, "/robots.txt")
        result = await self._safe_request(robots_url)

        if result:
            issues.append(
                {
                    "type": "check-pass",
                    "text": "robots.txt found",
                    "recommendation": None,
                }
            )
            score += 25  # Base points for having robots.txt

            # Check for AI bot permissions
            if "GPTBot" in result or "Google-Extended" in result:
                issues.append(
                    {
                        "type": "check-pass",
                        "text": "AI bot permissions found in robots.txt",
                        "recommendation": None,
                    }
                )
                score += 25
            else:
                issues.append(
                    {
                        "type": "check-warn",
                        "text": "No explicit AI bot permissions in robots.txt",
                        "recommendation": "Add GPTBot and Google-Extended to robots.txt",
                    }
                )
                score += 10
        else:
            issues.append(
                {
                    "type": "check-fail",
                    "text": "No robots.txt found",
                    "recommendation": "Create a robots.txt file",
                }
            )

        # Check llms.txt
        llms_url = urljoin(self.url, "/llms.txt")
        result = await self._safe_request(llms_url)

        if result:
            issues.append(
                {"type": "check-pass", "text": "llms.txt found", "recommendation": None}
            )
            score += 25  # Base points for having llms.txt

            # Check for basic llms.txt content
            if "allow" in result.lower() or "disallow" in result.lower():
                issues.append(
                    {
                        "type": "check-pass",
                        "text": "llms.txt has proper directives",
                        "recommendation": None,
                    }
                )
                score += 25
            else:
                issues.append(
                    {
                        "type": "check-warn",
                        "text": "llms.txt lacks proper directives",
                        "recommendation": "Add allow/disallow directives to llms.txt",
                    }
                )
                score += 10
        else:
            issues.append(
                {
                    "type": "check-warn",
                    "text": "No llms.txt found",
                    "recommendation": "Create an llms.txt file to guide AI crawlers",
                }
            )

        return score, issues

    async def analyze_structured_data(self) -> Tuple[float, List[str], List[str]]:
        """Analyze schema.org structured data"""
        if not self.soup:
            return 0.0, ["Page not loaded"], []

        issues = []
        schema_types = []
        score = 0.0

        # Find all schema.org data
        schema_tags = self.soup.find_all("script", type="application/ld+json")
        if not schema_tags:
            return 0.0, ["No structured data found"], []

        # Analyze each schema tag
        for tag in schema_tags:
            try:
                schema_data = json.loads(tag.string)
                if isinstance(schema_data, list):
                    schema_data = schema_data[0]  # Take first item if array

                # Check schema type
                schema_type = schema_data.get("@type", "")
                if schema_type:
                    schema_types.append(schema_type)
                    score += 25  # Base points for having schema

                    # Check for required properties based on type
                    if schema_type == "Article":
                        if all(
                            prop in schema_data
                            for prop in ["headline", "author", "datePublished"]
                        ):
                            score += 25
                        else:
                            issues.append("Article schema missing required properties")
                    elif schema_type == "Product":
                        if all(
                            prop in schema_data
                            for prop in ["name", "description", "offers"]
                        ):
                            score += 25
                        else:
                            issues.append("Product schema missing required properties")
                    elif schema_type == "Organization":
                        if all(prop in schema_data for prop in ["name", "url", "logo"]):
                            score += 25
                        else:
                            issues.append(
                                "Organization schema missing required properties"
                            )
                    else:
                        # Generic schema type
                        if len(schema_data) > 3:  # Has more than basic properties
                            score += 15
                        else:
                            issues.append(
                                f"{schema_type} schema has minimal properties"
                            )

            except json.JSONDecodeError:
                issues.append("Invalid JSON in schema.org data")
            except Exception as e:
                issues.append(f"Error parsing schema: {str(e)}")

        # Normalize score
        if schema_types:
            score = min(100, score)  # Cap at 100
        else:
            score = 0

        return score, issues, schema_types

    async def analyze_content_structure(self) -> Tuple[float, List[str]]:
        """Analyze content structure and clarity"""
        if not self.soup:
            return 0.0, ["Page not loaded"]

        score = 0.0
        issues = []

        # Check headings hierarchy
        headings = self.soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"])
        if headings:
            # Check for proper heading hierarchy
            prev_level = 0
            has_h1 = False
            hierarchy_issues = []

            for heading in headings:
                level = int(heading.name[1])
                if level == 1:
                    has_h1 = True
                if level - prev_level > 1:
                    hierarchy_issues.append(
                        f"Jump in heading level from h{prev_level} to h{level}"
                    )
                prev_level = level

            if not has_h1:
                issues.append(
                    {
                        "type": "check-fail",
                        "text": "No H1 heading found",
                        "recommendation": "Add a main H1 heading to the page",
                    }
                )
            elif hierarchy_issues:
                issues.append(
                    {
                        "type": "check-warn",
                        "text": "Heading hierarchy issues found",
                        "recommendation": "Maintain proper heading hierarchy (h1 -> h2 -> h3, etc.)",
                    }
                )
            else:
                issues.append(
                    {
                        "type": "check-pass",
                        "text": "Good heading hierarchy",
                        "recommendation": None,
                    }
                )
        else:
            issues.append(
                {
                    "type": "check-fail",
                    "text": "No headings found",
                    "recommendation": "Add headings to structure your content",
                }
            )

        # Check content elements
        elements = {
            "lists": self.soup.find_all(["ul", "ol"]),
            "tables": self.soup.find_all("table"),
            "paragraphs": self.soup.find_all("p"),
        }

        for element_type, found_elements in elements.items():
            if found_elements:
                # Check quality of elements
                if element_type == "lists":
                    # Check for nested lists
                    has_nested = any(li.find(["ul", "ol"]) for li in found_elements)
                    if has_nested:
                        issues.append(
                            {
                                "type": "check-pass",
                                "text": "Found nested lists",
                                "recommendation": None,
                            }
                        )
                    else:
                        issues.append(
                            {
                                "type": "check-pass",
                                "text": "Lists found",
                                "recommendation": None,
                            }
                        )
                elif element_type == "tables":
                    # Check for table headers
                    has_headers = any(table.find("th") for table in found_elements)
                    if has_headers:
                        issues.append(
                            {
                                "type": "check-pass",
                                "text": "Tables with headers found",
                                "recommendation": None,
                            }
                        )
                    else:
                        issues.append(
                            {
                                "type": "check-warn",
                                "text": "Tables without headers found",
                                "recommendation": "Add headers to tables for better structure",
                            }
                        )
                else:  # paragraphs
                    # Check paragraph length
                    long_paras = [
                        p for p in found_elements if len(p.get_text().split()) > 50
                    ]
                    if long_paras:
                        issues.append(
                            {
                                "type": "check-warn",
                                "text": "Some paragraphs are too long",
                                "recommendation": "Break long paragraphs into shorter ones",
                            }
                        )
                    else:
                        issues.append(
                            {
                                "type": "check-pass",
                                "text": "Good paragraph length",
                                "recommendation": None,
                            }
                        )
            else:
                issues.append(
                    {
                        "type": "check-fail",
                        "text": f"No {element_type} found",
                        "recommendation": f"Add {element_type} to improve content structure",
                    }
                )

        # Calculate score based on issues
        total_checks = len(issues)
        passed_checks = sum(1 for issue in issues if issue["type"] == "check-pass")
        warning_checks = sum(1 for issue in issues if issue["type"] == "check-warn")

        if total_checks == 0:
            return 0.0, issues

        score = ((passed_checks + (warning_checks * 0.5)) / total_checks) * 100
        return round(score, 2), issues

    async def analyze_eeat(self) -> Tuple[float, List[str]]:
        """Analyze E-E-A-T signals"""
        if not self.soup:
            return 0.0, ["Page not loaded"]

        issues = []

        # Check author information
        author_elements = self.soup.find_all(["author", 'meta[name="author"]'])
        if author_elements:
            # Check for author details
            author_text = (
                author_elements[0].get_text()
                if author_elements[0].name != "meta"
                else author_elements[0].get("content", "")
            )
            if len(author_text.split()) > 2:  # More than just a name
                issues.append(
                    {
                        "type": "check-pass",
                        "text": "Detailed author information found",
                        "recommendation": None,
                    }
                )
            else:
                issues.append(
                    {
                        "type": "check-warn",
                        "text": "Basic author information found",
                        "recommendation": "Add more author details (credentials, experience, etc.)",
                    }
                )
        else:
            issues.append(
                {
                    "type": "check-fail",
                    "text": "No author information found",
                    "recommendation": "Add author information with credentials",
                }
            )

        # Check publication date
        date_elements = self.soup.find_all(
            ["time", 'meta[property="article:published_time"]']
        )
        if date_elements:
            # Check if date is recent
            date_text = (
                date_elements[0].get_text()
                if date_elements[0].name != "meta"
                else date_elements[0].get("content", "")
            )
            try:
                from datetime import datetime

                date = datetime.fromisoformat(date_text.replace("Z", "+00:00"))
                if (datetime.now() - date).days < 365:  # Less than a year old
                    issues.append(
                        {
                            "type": "check-pass",
                            "text": "Recent publication date found",
                            "recommendation": None,
                        }
                    )
                else:
                    issues.append(
                        {
                            "type": "check-warn",
                            "text": "Content is over a year old",
                            "recommendation": "Update content or add last modified date",
                        }
                    )
            except:
                issues.append(
                    {
                        "type": "check-warn",
                        "text": "Publication date found but format unclear",
                        "recommendation": "Use standard date format (ISO 8601)",
                    }
                )
        else:
            issues.append(
                {
                    "type": "check-fail",
                    "text": "No publication date found",
                    "recommendation": "Add publication date",
                }
            )

        # Check citations and references
        citations = self.soup.find_all(
            "a",
            href=re.compile(r"reference|citation|source|study|research|paper", re.I),
        )
        if citations:
            # Check citation quality
            external_citations = [
                c for c in citations if not c.get("href", "").startswith(("#", "/"))
            ]
            if external_citations:
                issues.append(
                    {
                        "type": "check-pass",
                        "text": "External citations found",
                        "recommendation": None,
                    }
                )
            else:
                issues.append(
                    {
                        "type": "check-warn",
                        "text": "Only internal citations found",
                        "recommendation": "Add external citations to authoritative sources",
                    }
                )
        else:
            issues.append(
                {
                    "type": "check-fail",
                    "text": "No citations found",
                    "recommendation": "Add citations to support claims",
                }
            )

        # Check for about/bio page
        about_links = self.soup.find_all(
            "a", href=re.compile(r"about|bio|team|author", re.I)
        )
        if about_links:
            issues.append(
                {
                    "type": "check-pass",
                    "text": "About/Bio page link found",
                    "recommendation": None,
                }
            )
        else:
            issues.append(
                {
                    "type": "check-warn",
                    "text": "No About/Bio page link found",
                    "recommendation": "Add an About page with credentials",
                }
            )

        # Calculate score based on issues
        total_checks = len(issues)
        passed_checks = sum(1 for issue in issues if issue["type"] == "check-pass")
        warning_checks = sum(1 for issue in issues if issue["type"] == "check-warn")

        if total_checks == 0:
            return 0.0, issues

        score = ((passed_checks + (warning_checks * 0.5)) / total_checks) * 100
        return round(score, 2), issues

    async def analyze_page(self) -> Dict:
        """Main analysis function"""
        logger.info(f"Starting full page analysis for {self.url}")
        try:
            async with self:
                # Fetch page first
                try:
                    await self.fetch_page()
                except Exception as e:
                    logger.error(f"Failed to fetch page: {str(e)}", exc_info=True)
                    return {
                        "success": False,
                        "error": "Failed to fetch page",
                        "message": str(e),
                        "data": {
                            "url": self.url,
                            "overall_score": 0,
                            "crawlability": {
                                "robots_txt_score": 0,
                                "llms_txt_score": 0,
                                "total_score": 0,
                                "issues": ["Failed to access page"],
                            },
                            "structured_data": {
                                "schema_types": [],
                                "implementation_score": 0,
                                "total_score": 0,
                                "issues": ["Failed to access page"],
                            },
                            "content_structure": {
                                "heading_score": 0,
                                "list_table_score": 0,
                                "conciseness_score": 0,
                                "qa_format_score": 0,
                                "total_score": 0,
                                "issues": ["Failed to access page"],
                            },
                            "eeat": {
                                "author_score": 0,
                                "citation_score": 0,
                                "originality_score": 0,
                                "date_score": 0,
                                "total_score": 0,
                                "issues": ["Failed to access page"],
                            },
                            "recommendations": [f"Failed to access page: {str(e)}"],
                            "timestamp": datetime.utcnow().isoformat(),
                        },
                    }

                # Run all analyses concurrently
                logger.info(f"Starting concurrent analyses for {self.url}")
                analyses_tasks = [
                    self.analyze_crawlability(),
                    self.analyze_structured_data(),
                    self.analyze_content_structure(),
                    self.analyze_eeat(),
                ]

                results = await asyncio.gather(*analyses_tasks, return_exceptions=True)
                logger.info(f"Completed concurrent analyses for {self.url}")

                # Handle results and any exceptions
                crawl_score, crawl_issues = self._handle_result(
                    results[0], "crawlability"
                )
                struct_score, struct_issues, schema_types = self._handle_result(
                    results[1], "structured_data"
                )
                content_score, content_issues = self._handle_result(
                    results[2], "content"
                )
                eeat_score, eeat_issues = self._handle_result(results[3], "eeat")

                # Calculate weighted scores
                weights = {
                    "crawlability": 0.25,
                    "structured_data": 0.25,
                    "content_structure": 0.25,
                    "eeat": 0.25,
                }

                weighted_scores = [
                    crawl_score * weights["crawlability"],
                    struct_score * weights["structured_data"],
                    content_score * weights["content_structure"],
                    eeat_score * weights["eeat"],
                ]

                overall_score = round(sum(weighted_scores))

                # Log the scores
                logger.info(f"Analysis scores for {self.url}:")
                logger.info(f"Crawlability: {crawl_score}")
                logger.info(f"Structured Data: {struct_score}")
                logger.info(f"Content Structure: {content_score}")
                logger.info(f"EEAT: {eeat_score}")
                logger.info(f"Overall Score: {overall_score}")

                return {
                    "success": True,
                    "data": {
                        "url": self.url,
                        "overall_score": overall_score,
                        "crawlability": {
                            "robots_txt_score": crawl_score,
                            "llms_txt_score": 0,  # Implement if needed
                            "total_score": crawl_score,
                            "issues": crawl_issues,
                        },
                        "structured_data": {
                            "schema_types": schema_types,
                            "implementation_score": struct_score,
                            "total_score": struct_score,
                            "issues": struct_issues,
                        },
                        "content_structure": {
                            "heading_score": content_score,
                            "list_table_score": 0,  # Implement if needed
                            "conciseness_score": 0,  # Implement if needed
                            "qa_format_score": 0,  # Implement if needed
                            "total_score": content_score,
                            "issues": content_issues,
                        },
                        "eeat": {
                            "author_score": eeat_score,
                            "citation_score": 0,  # Implement if needed
                            "originality_score": 0,  # Implement if needed
                            "date_score": 0,  # Implement if needed
                            "total_score": eeat_score,
                            "issues": eeat_issues,
                        },
                        "recommendations": extract_recommendations(
                            crawl_issues, struct_issues, content_issues, eeat_issues
                        ),
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                }
        except Exception as e:
            logger.error(f"Analysis failed for {self.url}: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": "Analysis failed",
                "message": str(e),
                "data": {
                    "url": self.url,
                    "overall_score": 0,
                    "crawlability": {
                        "robots_txt_score": 0,
                        "llms_txt_score": 0,
                        "total_score": 0,
                        "issues": ["Analysis failed"],
                    },
                    "structured_data": {
                        "schema_types": [],
                        "implementation_score": 0,
                        "total_score": 0,
                        "issues": ["Analysis failed"],
                    },
                    "content_structure": {
                        "heading_score": 0,
                        "list_table_score": 0,
                        "conciseness_score": 0,
                        "qa_format_score": 0,
                        "total_score": 0,
                        "issues": ["Analysis failed"],
                    },
                    "eeat": {
                        "author_score": 0,
                        "citation_score": 0,
                        "originality_score": 0,
                        "date_score": 0,
                        "total_score": 0,
                        "issues": ["Analysis failed"],
                    },
                    "recommendations": [f"Analysis failed: {str(e)}"],
                    "timestamp": datetime.utcnow().isoformat(),
                },
            }

    def _handle_result(self, result: any, analysis_type: str) -> any:
        """Handle potentially failed analysis results"""
        if isinstance(result, Exception):
            logger.error(
                f"{analysis_type} analysis failed: {str(result)}", exc_info=True
            )
            if analysis_type == "structured_data":
                return 0.0, [f"Analysis failed: {str(result)}"], []
            return 0.0, [f"Analysis failed: {str(result)}"]

        # Handle structured data result which has 3 return values
        if analysis_type == "structured_data":
            if isinstance(result, tuple) and len(result) == 3:
                score, issues, schema_types = result
                # Convert string issues to dict format if needed
                if issues and isinstance(issues[0], str):
                    issues = [{"type": "check-fail", "text": issue} for issue in issues]
                return score, issues, schema_types
            return (
                0.0,
                [{"type": "check-fail", "text": "Invalid structured data result"}],
                [],
            )

        # Handle other results which have 2 return values
        if isinstance(result, tuple) and len(result) == 2:
            score, issues = result
            # Convert string issues to dict format if needed
            if issues and isinstance(issues[0], str):
                issues = [{"type": "check-fail", "text": issue} for issue in issues]
            return score, issues

        return 0.0, [{"type": "check-fail", "text": "Invalid analysis result"}]
