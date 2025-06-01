from .base import BaseAnalyzer
from typing import Dict, Any, List
import re
from urllib.parse import urljoin


class EEATAnalyzer(BaseAnalyzer):
    async def analyze(self, url: str) -> Dict[str, Any]:
        html, soup = await self._fetch_url(url)
        issues = []

        # Check author information
        author_elements = (
            soup.find("meta", attrs={"name": "author"})
            or soup.find("a", attrs={"rel": "author"})
            or soup.find(
                ["address", "div", "span", "p"],
                class_=re.compile(r"author|byline", re.I),
            )
        )

        if author_elements:
            issues.append(
                {
                    "type": "check-pass",
                    "text": "Author information found",
                    "recommendation": "Ensure author bio and credentials are included",
                }
            )
        else:
            issues.append(
                {
                    "type": "check-fail",
                    "text": "No clear author attribution",
                    "recommendation": "Add clear author information with credentials",
                }
            )

        # Check publication date
        date_elements = (
            soup.find("meta", attrs={"property": "article:published_time"})
            or soup.find("meta", attrs={"name": "date"})
            or soup.find("time")
            or soup.find(
                ["div", "span", "p"], class_=re.compile(r"date|published|posted", re.I)
            )
        )

        if date_elements:
            issues.append(
                {
                    "type": "check-pass",
                    "text": "Publication date found",
                    "recommendation": "Consider adding last updated date if content is revised",
                }
            )
        else:
            issues.append(
                {
                    "type": "check-fail",
                    "text": "No clear publication date",
                    "recommendation": "Add publication date to establish content freshness",
                }
            )

        # Check for citations and external links
        links = soup.find_all("a", href=True)
        external_links = []
        citation_patterns = re.compile(
            r"reference|citation|source|study|research|paper", re.I
        )

        base_domain = re.match(r"https?://([^/]+)", url).group(1)
        for link in links:
            href = urljoin(url, link.get("href", ""))
            if not href.startswith(("http://", "https://")):
                continue

            link_domain = re.match(r"https?://([^/]+)", href)
            if not link_domain:
                continue

            if link_domain.group(1) != base_domain:
                external_links.append(link)

        citation_links = [
            link
            for link in external_links
            if citation_patterns.search(link.get_text())
            or citation_patterns.search(link.get("href", ""))
        ]

        if citation_links:
            issues.append(
                {
                    "type": "check-pass",
                    "text": "Citations to external sources found",
                    "recommendation": "Ensure citations are from authoritative sources",
                }
            )
        elif external_links:
            issues.append(
                {
                    "type": "check-warn",
                    "text": "External links found but no clear citations",
                    "recommendation": "Consider adding explicit citations to support claims",
                }
            )
        else:
            issues.append(
                {
                    "type": "check-fail",
                    "text": "No external links or citations found",
                    "recommendation": "Add citations to authoritative sources",
                }
            )

        # Check for about/bio page link
        about_links = soup.find_all(
            "a", href=re.compile(r"about|bio|team|author", re.I)
        )
        if about_links:
            issues.append(
                {
                    "type": "check-pass",
                    "text": "About/Bio page link found",
                    "recommendation": "Ensure it contains detailed credentials and expertise information",
                }
            )
        else:
            issues.append(
                {
                    "type": "check-warn",
                    "text": "No About/Bio page link found",
                    "recommendation": "Add an About page with author/organization credentials",
                }
            )

        # Check for contact information
        contact_elements = soup.find(
            "a", href=re.compile(r"mailto:|contact", re.I)
        ) or soup.find(["div", "section"], class_=re.compile(r"contact", re.I))

        if contact_elements:
            issues.append(
                {
                    "type": "check-pass",
                    "text": "Contact information found",
                    "recommendation": "Ensure contact details are easily accessible",
                }
            )
        else:
            issues.append(
                {
                    "type": "check-warn",
                    "text": "No clear contact information",
                    "recommendation": "Add accessible contact information",
                }
            )

        # Check for social proof
        social_elements = soup.find_all(
            ["a", "div"], class_=re.compile(r"social|share|follow", re.I)
        )
        if social_elements:
            issues.append(
                {
                    "type": "check-pass",
                    "text": "Social proof elements found",
                    "recommendation": "Ensure social profiles demonstrate expertise",
                }
            )
        else:
            issues.append(
                {
                    "type": "check-warn",
                    "text": "No social proof elements found",
                    "recommendation": "Consider adding social proof elements",
                }
            )

        return {"total_score": self._calculate_score(issues), "issues": issues}
