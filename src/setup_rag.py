#!/usr/bin/env python3
"""
Setup script for SEBI RAG system
Tests all components and provides setup instructions
"""

import os
import sys
import subprocess
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def check_python_version():
    """Check Python version compatibility"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ is required")
        print(f"   Current version: {version.major}.{version.minor}")
        return False
    
    print(f"✅ Python {version.major}.{version.minor} - Compatible")
    return True

def check_required_files():
    """Check if required data files exist"""
    required_files = [
        "data/outputs/sebi_texts_chunked.jsonl",
        "src/sebi_document_loader.py",
        "src/sebi_rag_system.py",
        "src/sebi_chat_full.py"
    ]
    
    missing_files = []
    for file_path in required_files:
        if not Path(file_path).exists():
            missing_files.append(file_path)
        else:
            print(f"✅ Found: {file_path}")
    
    if missing_files:
        print(f"\n❌ Missing required files:")
        for file in missing_files:
            print(f"   - {file}")
        return False
    
    return True

def install_dependencies():
    """Install required Python packages"""
    print("\n📦 Installing dependencies...")
    
    try:
        # Install from requirements.txt
        result = subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ], capture_output=True, text=True, check=True)
        
        print("✅ Dependencies installed successfully")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        print(f"   Output: {e.stdout}")
        print(f"   Error: {e.stderr}")
        return False

def test_imports():
    """Test if all required libraries can be imported"""
    print("\n🧪 Testing imports...")
    
    test_imports = [
        ("json", "json"),
        ("langchain", "langchain"),
        ("sentence_transformers", "sentence-transformers"),
        ("chromadb", "chromadb"),
        ("groq", "groq"),
    ]
    
    failed_imports = []
    
    for module, package in test_imports:
        try:
            __import__(module)
            print(f"✅ {module}")
        except ImportError as e:
            print(f"❌ {module} - {e}")
            failed_imports.append(package)
    
    if failed_imports:
        print(f"\n❌ Failed to import: {', '.join(failed_imports)}")
        print("   Try running: pip install " + " ".join(failed_imports))
        return False
    
    return True

def test_document_loader():
    """Test the document loader"""
    print("\n🧪 Testing document loader...")
    
    try:
        from src.sebi_document_loader import SEBIDocumentLoader

        loader = SEBIDocumentLoader("data/outputs/sebi_texts_chunked.jsonl", min_word_count=50)
        
        # Load a small subset for testing
        documents = loader.load()
        
        if documents:
            print(f"✅ Loaded {len(documents):,} documents")
            print(f"   Sample document: {len(documents[0].page_content)} characters")
            return True
        else:
            print("❌ No documents loaded")
            return False
            
    except Exception as e:
        print(f"❌ Error testing document loader: {e}")
        return False

def test_data_quality():
    """Analyze the quality of the chunked data"""
    print("\n🧪 Testing data quality...")
    
    try:
        chunk_file = "data/outputs/sebi_texts_chunked.jsonl"
        
        if not Path(chunk_file).exists():
            print(f"❌ Chunk file not found: {chunk_file}")
            return False
        
        # Count chunks and analyze
        total_chunks = 0
        good_chunks = 0
        doc_types = {}
        
        with open(chunk_file, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    chunk = json.loads(line.strip())
                    total_chunks += 1
                    
                    # Count good quality chunks
                    if chunk.get('chunk_word_count', 0) >= 50:
                        good_chunks += 1
                    
                    # Count doc types
                    pdf_path = chunk.get('original_pdf_path', '').lower()
                    if 'annual_report' in pdf_path:
                        doc_types['annual_reports'] = doc_types.get('annual_reports', 0) + 1
                    elif 'mastercircular' in pdf_path:
                        doc_types['master_circulars'] = doc_types.get('master_circulars', 0) + 1
                    elif 'faq' in pdf_path:
                        doc_types['faqs'] = doc_types.get('faqs', 0) + 1
                    
                except json.JSONDecodeError:
                    continue
        
        print(f"✅ Data quality analysis:")
        print(f"   Total chunks: {total_chunks:,}")
        print(f"   Good quality chunks (50+ words): {good_chunks:,}")
        print(f"   Quality rate: {(good_chunks/total_chunks*100):.1f}%")
        print(f"   Document types: {doc_types}")
        
        return good_chunks > 0
        
    except Exception as e:
        print(f"❌ Error analyzing data quality: {e}")
        return False

def setup_environment():
    """Guide user through environment setup"""
    print("\n🔧 Environment Setup")
    print("=" * 30)
    
    # Check for .env file
    env_file = Path(".env")
    if not env_file.exists():
        print("Creating .env file...")
        with open(".env", "w") as f:
            f.write("# SEBI RAG System Environment Variables\n")
            f.write("# Get your free Groq API key from: https://console.groq.com/\n")
            f.write("GROQ_API_KEY=your_groq_api_key_here\n")
        print("✅ Created .env file")
    else:
        print("✅ .env file exists")
    
    # Check for Groq API key
    groq_key = os.getenv('GROQ_API_KEY')
    if not groq_key or groq_key == 'your_groq_api_key_here':
        print("\n⚠️  Groq API Key needed:")
        print("   1. Visit https://console.groq.com/")
        print("   2. Sign up for a free account")
        print("   3. Get your API key")
        print("   4. Add it to your .env file: GROQ_API_KEY=your_actual_key")
        return False
    else:
        print("✅ Groq API key configured")
        return True

def main():
    """Main setup function"""
    print("🏛️  SEBI RAG System Setup")
    print("=" * 40)
    
    # Run all checks
    checks = [
        ("Python Version", check_python_version),
        ("Required Files", check_required_files),
        ("Dependencies", install_dependencies),
        ("Import Tests", test_imports),
        ("Document Loader", test_document_loader),
        ("Data Quality", test_data_quality),
        ("Environment", setup_environment),
    ]
    
    all_passed = True
    
    for check_name, check_func in checks:
        print(f"\n{check_name}:")
        print("-" * len(check_name))
        
        try:
            success = check_func()
            if not success:
                all_passed = False
        except Exception as e:
            print(f"❌ {check_name} failed: {e}")
            all_passed = False
    
    # Final status
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 SETUP COMPLETED SUCCESSFULLY!")
        print("=" * 50)
        print("\n🚀 Ready to use! Run the following to start:")
        print("   python -m src.sebi_chat_full")
        print("\n📖 Or test with specific queries:")
        print("   python -m src.setup_rag")
    else:
        print("❌ SETUP INCOMPLETE")
        print("=" * 50)
        print("\n🔧 Please fix the issues above and run setup again.")
    
    return all_passed

if __name__ == "__main__":
    main()
