import aiohttp
from bs4 import BeautifulSoup
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from urllib.parse import urljoin
import logging
import asyncio
from aiohttp import ClientTimeout
from xml.etree.ElementTree import ParseError

logger = logging.getLogger(__name__)

# Constants
DEFAULT_TIMEOUT = ClientTimeout(total=10)  # 10 seconds total timeout
CONCURRENT_REQUESTS_LIMIT = 3  # Limit concurrent requests


class LLMOAnalyzer:
    def __init__(self, url: str):
        self.url = url
        self.soup: Optional[BeautifulSoup] = None
        self.text_content: str = ""
        self._session: Optional[aiohttp.ClientSession] = None
        self._semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS_LIMIT)

    async def __aenter__(self):
        self._session = aiohttp.ClientSession(
            headers={"User-Agent": "LLMO-Analyzer/0.1.0 (https://llmo-analyzer.com)"},
            timeout=DEFAULT_TIMEOUT,
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._session:
            await self._session.close()

    async def _safe_request(self, url: str) -> Tuple[bool, str]:
        """Make a safe HTTP request with timeout and error handling"""
        try:
            # Clean the URL by removing problematic query parameters
            clean_url = url.split("?")[0] if "?" in url else url

            async with self._semaphore:  # Limit concurrent requests
                async with self._session.get(url, ssl=False) as response:
                    if response.status == 200:
                        return True, await response.text()
                    elif response.status == 403:
                        logger.warning(f"Access forbidden for {url}")
                        return False, "Access forbidden"
                    elif response.status == 404:
                        logger.warning(f"Page not found for {url}")
                        return False, "Page not found"
                    else:
                        logger.warning(
                            f"Request failed with status {response.status} for {url}"
                        )
                        return False, f"HTTP {response.status}"
        except aiohttp.ClientConnectorError as e:
            logger.warning(f"Connection error for {url}: {str(e)}")
            return False, "Connection failed"
        except aiohttp.ClientTimeout as e:
            logger.warning(f"Request timed out for {url}: {str(e)}")
            return False, "Request timed out"
        except Exception as e:
            logger.warning(f"Request failed for {url}: {str(e)}")
            return False, str(e)

    async def fetch_page(self) -> None:
        """Fetch the webpage and create BeautifulSoup object"""
        if not self._session:
            raise RuntimeError(
                "Session not initialized. Use async with LLMOAnalyzer() as analyzer:"
            )

        success, result = await self._safe_request(self.url)
        if not success:
            raise Exception(f"Failed to fetch page: {result}")

        try:
            self.soup = BeautifulSoup(result, "lxml")
            self.text_content = self.soup.get_text()
        except Exception as e:
            logger.error(f"Failed to parse HTML for {self.url}: {str(e)}")
            raise Exception(f"Failed to parse HTML: {str(e)}")

    async def analyze_crawlability(self) -> Tuple[float, List[str]]:
        """Analyze robots.txt and llms.txt"""
        score = 0.0
        issues = []

        robots_url = urljoin(self.url, "/robots.txt")
        success, robots_text = await self._safe_request(robots_url)

        if success:
            score += 50
            if "GPTBot" in robots_text or "Google-Extended" in robots_text:
                score += 50
            else:
                issues.append("No explicit AI bot permissions in robots.txt")
        else:
            issues.append("No robots.txt found")

        return score, issues

    async def analyze_structured_data(self) -> Tuple[float, List[str], List[str]]:
        """Analyze schema.org structured data"""
        if not self.soup:
            return 0.0, ["Page not loaded"], []

        schema_tags = self.soup.find_all("script", type="application/ld+json")
        if schema_tags:
            return 100.0, [], ["Found schema.org data"]
        return 0.0, ["No structured data found"], []

    async def analyze_content_structure(self) -> Tuple[float, List[str]]:
        """Analyze content structure and clarity"""
        if not self.soup:
            return 0.0, ["Page not loaded"]

        score = 0.0
        issues = []

        # Perform all checks at once
        elements = {
            "headings": self.soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"]),
            "lists": self.soup.find_all(["ul", "ol"]),
            "tables": self.soup.find_all("table"),
            "paragraphs": self.soup.find_all("p"),
        }

        for element_type, found_elements in elements.items():
            if found_elements:
                score += 25
            else:
                issues.append(f"No {element_type} found")

        return score, issues

    async def analyze_eeat(self) -> Tuple[float, List[str]]:
        """Analyze E-E-A-T signals"""
        if not self.soup:
            return 0.0, ["Page not loaded"]

        score = 0.0
        issues = []

        # Perform all checks at once
        checks = {
            "author": bool(self.soup.find(["author", 'meta[name="author"]'])),
            "date": bool(
                self.soup.find(["time", 'meta[property="article:published_time"]'])
            ),
            "links": bool(self.soup.find_all("a")),
            "research": any(
                word in self.text_content.lower()
                for word in ["study", "research", "data", "survey"]
            ),
        }

        for check_type, passed in checks.items():
            if passed:
                score += 25
            else:
                issues.append(f"No {check_type} found")

        return score, issues

    async def analyze_page(self) -> Dict:
        """Main analysis function"""
        try:
            async with self:
                # Fetch page first
                try:
                    await self.fetch_page()
                except Exception as e:
                    logger.error(f"Failed to fetch page: {str(e)}")
                    return {
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
                        "timestamp": datetime.utcnow(),
                    }

                # Run all analyses concurrently
                analyses_tasks = [
                    self.analyze_crawlability(),
                    self.analyze_structured_data(),
                    self.analyze_content_structure(),
                    self.analyze_eeat(),
                ]

                results = await asyncio.gather(*analyses_tasks, return_exceptions=True)

                # Handle results and any exceptions
                crawl_score, crawl_issues = self._handle_result(
                    results[0], "crawlability"
                )
                struct_data = self._handle_result(results[1], "structured_data")
                struct_score, struct_issues, schema_types = (
                    struct_data
                    if isinstance(struct_data, tuple)
                    else (0.0, ["Analysis failed"], [])
                )
                content_score, content_issues = self._handle_result(
                    results[2], "content"
                )
                eeat_score, eeat_issues = self._handle_result(results[3], "eeat")

                # Calculate overall score
                overall_score = (
                    crawl_score + struct_score + content_score + eeat_score
                ) / 4

                return {
                    "url": self.url,
                    "overall_score": overall_score,
                    "crawlability": {
                        "robots_txt_score": crawl_score,
                        "llms_txt_score": 0.0,  # Future implementation
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
                        "heading_score": content_score * 0.25,
                        "list_table_score": content_score * 0.25,
                        "conciseness_score": content_score * 0.25,
                        "qa_format_score": content_score * 0.25,
                        "total_score": content_score,
                        "issues": content_issues,
                    },
                    "eeat": {
                        "author_score": eeat_score * 0.25,
                        "citation_score": eeat_score * 0.25,
                        "originality_score": eeat_score * 0.25,
                        "date_score": eeat_score * 0.25,
                        "total_score": eeat_score,
                        "issues": eeat_issues,
                    },
                    "recommendations": list(
                        set(crawl_issues + struct_issues + content_issues + eeat_issues)
                    ),
                    "timestamp": datetime.utcnow(),
                }
        except Exception as e:
            logger.error(f"Analysis failed: {str(e)}")
            return {
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
                "timestamp": datetime.utcnow(),
            }

    def _handle_result(self, result: any, analysis_type: str) -> any:
        """Handle potentially failed analysis results"""
        if isinstance(result, Exception):
            logger.error(f"{analysis_type} analysis failed: {str(result)}")
            if analysis_type == "structured_data":
                return 0.0, [f"Analysis failed: {str(result)}"], []
            return 0.0, [f"Analysis failed: {str(result)}"]
        return result
