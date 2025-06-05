import httpx
from bs4 import BeautifulSoup
from typing import Dict, Any, List
import logging


class BaseAnalyzer:
    def __init__(self):
        self.client = None
        self.logger = logging.getLogger(self.__class__.__name__)

    async def _ensure_client(self):
        if self.client is None:
            self.client = httpx.AsyncClient()

    async def _fetch_url(self, url: str) -> tuple[str, BeautifulSoup]:
        """Fetch URL and return both raw HTML and parsed BeautifulSoup object"""
        await self._ensure_client()

        try:
            response = await self.client.get(url)
            if response.status_code != 200:
                raise Exception(f"HTTP {response.status_code}: Failed to fetch {url}")

            html = response.text
            soup = BeautifulSoup(html, "lxml")
            return html, soup
        except Exception as e:
            self.logger.error(f"Error fetching {url}: {str(e)}")
            raise

    def _calculate_score(self, checks: List[Dict[str, Any]]) -> float:
        """Calculate score based on passed/failed checks"""
        if not checks:
            return 0.0

        passed = sum(1 for check in checks if check.get("type") == "check-pass")
        total = len(checks)
        return round((passed / total) * 100, 2)

    async def analyze(self, url: str) -> Dict[str, Any]:
        """
        Base analyze method to be implemented by subclasses.
        Should return a dict with at least:
        {
            'total_score': float,
            'issues': List[str]
        }
        """
        raise NotImplementedError("Subclasses must implement analyze()")
