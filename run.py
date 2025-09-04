#!/usr/bin/env python3
"""
SEBI RAG Web Application Launcher
Simple script to run the Flask web application
"""

import os
import sys
import subprocess

def check_requirements():
    """Check if required packages are installed"""
    try:
        import flask
        import flask_cors
        print("✅ Flask dependencies found")
        return True
    except ImportError as e:
        print(f"❌ Missing Flask dependencies: {e}")
        print("Installing required packages...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "flask", "flask-cors"])
            print("✅ Flask dependencies installed")
            return True
        except subprocess.CalledProcessError:
            print("❌ Failed to install Flask dependencies")
            return False

def main():
    """Main launcher function"""
    print("🏛️  SEBI RAG Web Application Launcher")
    print("=" * 50)

    # Check if we're in the right directory
    if not os.path.exists('app.py'):
        print("❌ app.py not found. Please run this script from the project root directory.")
        sys.exit(1)

    # Check requirements
    if not check_requirements():
        print("❌ Cannot proceed without required dependencies.")
        print("Please install manually: pip install flask flask-cors")
        sys.exit(1)

    # Check for .env file
    if not os.path.exists('.env'):
        print("⚠️  .env file not found.")
        print("   Please create a .env file with your GROQ_API_KEY")
        print("   Example: GROQ_API_KEY=your_api_key_here")
        print()

    # Run the Flask application
    print("🚀 Starting SEBI RAG Web Application...")
    print("   Open your browser to: http://localhost:5000")
    print("   Press Ctrl+C to stop the server")
    print()

    try:
        # Run app.py
        subprocess.run([sys.executable, 'app.py'], check=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running application: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
