"""
LLMO Analyzers Module
Contains different analyzers for webpage LLM optimization.
"""

from .technical import TechnicalAnalyzer
from .structured_data import StructuredDataAnalyzer
from .content import ContentAnalyzer
from .eeat import EEATAnalyzer

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
