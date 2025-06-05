from .base import BaseAnalyzer
from typing import Dict, Any, List
import extruct
import json
from w3lib.html import get_base_url


class StructuredDataAnalyzer(BaseAnalyzer):
    async def analyze(self, url: str) -> Dict[str, Any]:
        html, soup = await self._fetch_url(url)
        issues = []

        # Extract all types of structured data
        base_url = get_base_url(html, url)
        data = extruct.extract(html, base_url=base_url)

        # Check JSON-LD
        json_ld = data.get("json-ld", [])
        if json_ld:
            issues.append(
                {
                    "type": "check-pass",
                    "text": "JSON-LD structured data found",
                    "recommendation": "Ensure all relevant content is properly marked up",
                }
            )
        else:
            issues.append(
                {
                    "type": "check-fail",
                    "text": "No JSON-LD structured data found",
                    "recommendation": "Add JSON-LD markup for better content understanding",
                }
            )

        # Check microdata
        microdata = data.get("microdata", [])
        if microdata:
            issues.append(
                {
                    "type": "check-pass",
                    "text": "Microdata markup found",
                    "recommendation": "Consider converting to JSON-LD for better maintainability",
                }
            )

        # Check RDFa
        rdfa = data.get("rdfa", [])
        if rdfa:
            issues.append(
                {
                    "type": "check-pass",
                    "text": "RDFa markup found",
                    "recommendation": "Consider converting to JSON-LD for better maintainability",
                }
            )

        # Check for specific schema types
        all_data = json_ld + microdata + rdfa
        found_types = set()
        for item in all_data:
            if isinstance(item, dict):
                item_type = item.get("@type")
                if item_type:
                    if isinstance(item_type, list):
                        found_types.update(item_type)
                    else:
                        found_types.add(item_type)

        # Check for essential schema types
        essential_types = {
            "Article": "Article markup for content pages",
            "WebPage": "WebPage markup for basic page information",
            "Organization": "Organization markup for site ownership",
            "Person": "Person markup for authorship",
            "BreadcrumbList": "Breadcrumb markup for navigation structure",
        }

        for schema_type, description in essential_types.items():
            if schema_type in found_types:
                issues.append(
                    {
                        "type": "check-pass",
                        "text": f"{schema_type} schema markup found",
                        "recommendation": f"Ensure {description} is complete",
                    }
                )
            else:
                issues.append(
                    {
                        "type": "check-warn",
                        "text": f"No {schema_type} schema markup found",
                        "recommendation": f"Consider adding {description}",
                    }
                )

        # Check meta description
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc and meta_desc.get("content", "").strip():
            issues.append(
                {
                    "type": "check-pass",
                    "text": "Meta description found",
                    "recommendation": "Ensure it accurately summarizes the page content",
                }
            )
        else:
            issues.append(
                {
                    "type": "check-fail",
                    "text": "No meta description found",
                    "recommendation": "Add a descriptive meta description",
                }
            )

        return {"total_score": self._calculate_score(issues), "issues": issues}
