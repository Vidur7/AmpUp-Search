from setuptools import setup, find_packages

setup(
    name="llmo-backend",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "uvicorn",
        "sqlalchemy",
        "pydantic",
        "python-multipart",
        "python-jose[cryptography]",
        "passlib[bcrypt]",
        "aiohttp",
        "beautifulsoup4",
        "validators",
        "python-dotenv",
    ],
)
