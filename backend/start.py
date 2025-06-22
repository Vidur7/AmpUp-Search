#!/usr/bin/env python3
"""
Simple startup script for AmpUp Search backend.
Use this if you're experiencing uvicorn module import issues.
"""

import sys
import os

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

if __name__ == "__main__":
    try:
        import uvicorn
        from app.main import app

        print("🚀 Starting AmpUp Search Backend...")
        print("📍 API will be available at: http://localhost:8000")
        print("📖 API Documentation: http://localhost:8000/docs")
        print("🔥 Hot reload enabled for development")
        print("-" * 50)

        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            reload_dirs=[backend_dir],
            log_level="info",
        )
    except ImportError as e:
        print(f"❌ Error importing uvicorn: {e}")
        print("🔧 Try running: pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)
