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
        """Calculate score based on check types with weighted scoring"""
        if not checks:
            return 0.0

        # Define weights for different check types
        weights = {
            "check-pass": 1.0,  # Full points for passing checks
            "check-warn": 0.5,  # Half points for warnings
            "check-fail": 0.0,  # No points for failures
        }

        # Calculate weighted score
        total_weight = 0
        earned_weight = 0

        for check in checks:
            check_type = check.get("type", "check-fail")
            weight = weights.get(check_type, 0.0)
            total_weight += 1.0  # Each check contributes equally to total
            earned_weight += weight

        if total_weight == 0:
            return 0.0

        # Calculate percentage score
        score = (earned_weight / total_weight) * 100
        return round(score, 2)

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
