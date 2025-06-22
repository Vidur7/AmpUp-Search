import pytest
from app.services import LLMOAnalyzer
import aiohttp
from bs4 import BeautifulSoup


@pytest.mark.asyncio
async def test_analyzer_initialization():
    analyzer = LLMOAnalyzer("https://example.com")
    assert analyzer.url == "https://example.com"
    assert analyzer.soup is None
    assert analyzer.text_content == ""


@pytest.mark.asyncio
async def test_analyzer_context_manager():
    async with LLMOAnalyzer("https://example.com") as analyzer:
        assert isinstance(analyzer._session, aiohttp.ClientSession)


@pytest.mark.asyncio
async def test_analyze_content_structure_empty():
    """Test that analyzing content structure without initialized BeautifulSoup returns 0 score"""
    analyzer = LLMOAnalyzer("https://example.com")
    score, issues = await analyzer.analyze_content_structure()
    assert score == 0.0
    assert "BeautifulSoup object not initialized" in str(issues)


@pytest.mark.asyncio
async def test_analyze_content_structure_with_content():
    """Test that analyzing content structure with valid HTML returns correct score"""
    analyzer = LLMOAnalyzer("https://example.com")
    analyzer.soup = BeautifulSoup(
        """
        <html>
            <body>
                <h1>Test Title</h1>
                <p>Test paragraph</p>
                <ul><li>List item</li></ul>
                <table><tr><td>Table cell</td></tr></table>
            </body>
        </html>
    """,
        "lxml",
    )

    score, issues = await analyzer.analyze_content_structure()
    assert score == 100.0
    assert len(issues) == 0
