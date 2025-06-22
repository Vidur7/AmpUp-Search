from .base import BaseAnalyzer
from typing import Dict, Any, List
import re


class ContentAnalyzer(BaseAnalyzer):
    async def analyze(self, url: str) -> Dict[str, Any]:
        html, soup = await self._fetch_url(url)
        issues = []

        # Check main content area
        main_content = soup.find(["main", "article"]) or soup.find(
            "div", {"role": "main"}
        )
        if main_content:
            issues.append(
                {
                    "type": "check-pass",
                    "text": "Main content area is properly marked",
                    "recommendation": "Ensure it contains the primary content",
                }
            )
        else:
            issues.append(
                {
                    "type": "check-warn",
                    "text": "No main content area marked",
                    "recommendation": "Use <main> or <article> tags to mark the primary content",
                }
            )

        # Check heading structure
        headings = soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"])
        if headings:
            # Check for H1
            h1_tags = soup.find_all("h1")
            if len(h1_tags) == 1:
                issues.append(
                    {
                        "type": "check-pass",
                        "text": "Single H1 heading found",
                        "recommendation": "Ensure it describes the main topic",
                    }
                )
            elif len(h1_tags) == 0:
                issues.append(
                    {
                        "type": "check-fail",
                        "text": "No H1 heading found",
                        "recommendation": "Add an H1 heading for the main topic",
                    }
                )
            else:
                issues.append(
                    {
                        "type": "check-fail",
                        "text": "Multiple H1 headings found",
                        "recommendation": "Use only one H1 heading per page",
                    }
                )

            # Check heading hierarchy
            prev_level = 0
            for heading in headings:
                current_level = int(heading.name[1])
                if current_level - prev_level > 1:
                    issues.append(
                        {
                            "type": "check-warn",
                            "text": f"Skipped heading level (H{prev_level} to H{current_level})",
                            "recommendation": "Maintain proper heading hierarchy",
                        }
                    )
                prev_level = current_level
        else:
            issues.append(
                {
                    "type": "check-fail",
                    "text": "No headings found",
                    "recommendation": "Add proper heading structure to organize content",
                }
            )

        # Check paragraphs
        paragraphs = soup.find_all("p")
        if paragraphs:
            # Check paragraph length
            long_paragraphs = 0
            for p in paragraphs:
                words = len(re.findall(r"\w+", p.get_text()))
                if words > 150:  # Assuming 150 words is too long for easy scanning
                    long_paragraphs += 1

            if long_paragraphs > 0:
                issues.append(
                    {
                        "type": "check-warn",
                        "text": f"Found {long_paragraphs} long paragraphs",
                        "recommendation": "Break down long paragraphs for better readability",
                    }
                )
            else:
                issues.append(
                    {"type": "check-pass", "text": "Paragraph lengths are appropriate"}
                )
        else:
            issues.append(
                {
                    "type": "check-fail",
                    "text": "No paragraphs found",
                    "recommendation": "Structure content into proper paragraphs",
                }
            )

        # Check lists
        lists = soup.find_all(["ul", "ol"])
        if lists:
            issues.append(
                {
                    "type": "check-pass",
                    "text": "Lists are used to organize information",
                    "recommendation": "Ensure lists are used appropriately for related items",
                }
            )
        else:
            issues.append(
                {
                    "type": "check-warn",
                    "text": "No lists found",
                    "recommendation": "Consider using lists to organize related information",
                }
            )

        # Check tables
        tables = soup.find_all("table")
        if tables:
            # Check for table headers
            for table in tables:
                if not table.find("th"):
                    issues.append(
                        {
                            "type": "check-warn",
                            "text": "Table without headers found",
                            "recommendation": "Add proper headers to tables",
                        }
                    )
                    break
            else:
                issues.append(
                    {"type": "check-pass", "text": "Tables are properly structured"}
                )

        # Check images
        images = soup.find_all("img")
        for img in images:
            if not img.get("alt"):
                issues.append(
                    {
                        "type": "check-warn",
                        "text": "Image without alt text found",
                        "recommendation": "Add descriptive alt text to images",
                    }
                )
                break
        else:
            if images:
                issues.append(
                    {"type": "check-pass", "text": "All images have alt text"}
                )

        return {"total_score": self._calculate_score(issues), "issues": issues}
