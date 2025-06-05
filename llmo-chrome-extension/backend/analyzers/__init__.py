from .technical_analyzer import TechnicalAnalyzer
from .structured_data_analyzer import StructuredDataAnalyzer
from .content_analyzer import ContentAnalyzer
from .eeat_analyzer import EEATAnalyzer

# Create instances
technical_analyzer = TechnicalAnalyzer()
structured_data_analyzer = StructuredDataAnalyzer()
content_analyzer = ContentAnalyzer()
eeat_analyzer = EEATAnalyzer()

__all__ = [
    "technical_analyzer",
    "structured_data_analyzer",
    "content_analyzer",
    "eeat_analyzer",
]
