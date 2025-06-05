from .base import BaseAnalyzer
from typing import Dict, Any, List
from urllib.parse import urljoin
import re


class TechnicalAnalyzer(BaseAnalyzer):
    async def analyze(self, url: str) -> Dict[str, Any]:
        html, soup = await self._fetch_url(url)
        issues = []

        # Check robots.txt
        try:
            robots_url = urljoin(url, "/robots.txt")
            await self._ensure_client()
            response = await self.client.get(robots_url)
            if response.status_code == 200:
                issues.append(
                    {
                        "type": "check-pass",
                        "text": "robots.txt is present",
                        "recommendation": "Consider adding LLM-specific directives",
                    }
                )
            else:
                issues.append(
                    {
                        "type": "check-fail",
                        "text": "No robots.txt found",
                        "recommendation": "Create a robots.txt file to guide search engine and AI crawlers",
                    }
                )
        except:
            issues.append(
                {
                    "type": "check-fail",
                    "text": "Could not check robots.txt",
                    "recommendation": "Ensure robots.txt is accessible",
                }
            )

        # Check meta robots
        meta_robots = soup.find("meta", attrs={"name": re.compile(r"robots", re.I)})
        if meta_robots:
            content = meta_robots.get("content", "").lower()
            if "noindex" in content or "nofollow" in content:
                issues.append(
                    {
                        "type": "check-fail",
                        "text": "Page has restrictive robots meta tags",
                        "recommendation": "Review robots meta tags if you want the page to be processed by LLMs",
                    }
                )
            else:
                issues.append(
                    {
                        "type": "check-pass",
                        "text": "Robots meta tags are crawler-friendly",
                    }
                )
        else:
            issues.append(
                {"type": "check-pass", "text": "No restrictive robots meta tags found"}
            )

        # Check canonical URL
        canonical = soup.find("link", attrs={"rel": "canonical"})
        if canonical:
            issues.append(
                {
                    "type": "check-pass",
                    "text": "Canonical URL is specified",
                    "recommendation": "Ensure it points to the primary version of the content",
                }
            )
        else:
            issues.append(
                {
                    "type": "check-warn",
                    "text": "No canonical URL specified",
                    "recommendation": "Consider adding a canonical URL to indicate the primary version of the content",
                }
            )

        # Check HTTP status
        try:
            response = await self.client.get(url)
            if response.status_code == 200:
                issues.append(
                    {"type": "check-pass", "text": "Page returns 200 OK status"}
                )
            else:
                issues.append(
                    {
                        "type": "check-fail",
                        "text": f"Page returns {response.status_code} status",
                        "recommendation": "Ensure the page returns a 200 OK status",
                    }
                )
        except:
            issues.append(
                {
                    "type": "check-fail",
                    "text": "Could not check HTTP status",
                    "recommendation": "Ensure the page is accessible",
                }
            )

        # Check for JavaScript dependency
        if soup.find("noscript"):
            issues.append(
                {
                    "type": "check-warn",
                    "text": "Page may require JavaScript for full functionality",
                    "recommendation": "Consider providing static fallback content for crawlers",
                }
            )
        else:
            issues.append(
                {
                    "type": "check-pass",
                    "text": "No critical JavaScript dependency detected",
                }
            )

        return {"total_score": self._calculate_score(issues), "issues": issues}
