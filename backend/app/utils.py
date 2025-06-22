"""
Utility functions for the LLMO backend.
"""


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
