# SEBI RAG Chat System

A comprehensive Retrieval-Augmented Generation (RAG) system for querying SEBI (Securities and Exchange Board of India) documents with both CLI and web interfaces, featuring interactive workflows for intermediary registration and compliance guidance.

## 🏛️ Overview

This system provides intelligent querying capabilities for SEBI regulatory documents through multiple interfaces:

- **Web Interface**: Modern browser-based application with interactive chatbot and workflow guidance
- **CLI Interface**: Command-line tool for direct queries and batch processing
- **RAG System**: AI-powered responses based on official SEBI documents
- **Workflow Assistant**: Step-by-step guidance for SEBI registration and compliance

The system uses:
- **Local embeddings** (BAAI/bge-large-en-v1.5) for privacy and cost-efficiency
- **ChromaDB** vector database for document storage and retrieval
- **Groq API** for fast LLM inference (Llama 3.3 70B model)
- **LangChain** framework for RAG pipeline orchestration
- **Flask** web framework for the web interface

## 📁 Project Structure

```
sebi-rag-system/
├── app.py                          # Flask web server
├── run.py                          # Application launcher
├── index.html                      # Main web interface
├── complete_flow.png               # System architecture diagram
├── README.md                       # This file (comprehensive documentation)
├── WEB_README.md                   # Web interface specific documentation
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variables template
├── .env                            # Environment variables (create from template)
├── .gitignore                      # Git ignore rules
├── .gitattributes                  # Git attributes for LFS
├── css/
│   └── styles.css                  # Web interface styling
├── js/
│   ├── chatbot.js                  # Interactive chatbot functionality
│   ├── rag-integration.js          # RAG system integration
│   └── workflows.js                # Workflow interactions and forms
├── src/
│   ├── __init__.py                 # Package initialization
│   ├── sebi_chat_full.py           # CLI chat interface
│   ├── sebi_rag_system.py          # Core RAG system implementation
│   ├── sebi_document_loader.py     # Document loading and processing
│   └── setup_rag.py                # Setup and testing script
├── data/
│   ├── outputs/                    # Processed document chunks
│   │   ├── sebi_texts_chunked.jsonl    # Main chunked data
│   │   ├── sebi_texts_cleaned_final.jsonl
│   │   └── [other processing outputs]
│   ├── sebi_annual_reports/        # Annual report data
│   │   ├── annual_reports.csv
│   │   └── annual_reports.json
│   ├── sebi_faqs/                  # FAQ data
│   │   ├── faq_metadata.csv
│   │   └── faq_metadata.json
│   ├── sebi_mastercirculars/       # Master circular data
│   │   ├── master_circulars.csv
│   │   └── master_circulars.json
│   └── sebi_chroma_db/             # Vector database (Git LFS)
│       ├── chroma.sqlite3
│       ├── [uuid]/
│       └── [other ChromaDB files]
└── docs/                           # Additional documentation
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**
- **Git** (for cloning and LFS support)
- **Web Browser** (for web interface)
- **Git LFS** (for large database files)

### 1. Clone and Setup Repository

```bash
# Clone the repository
git clone https://github.com/shivin4/RAGSebi.git
cd sebi-rag-system

# If using Git LFS for large files
git lfs install
git lfs pull
```

### 2. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt
```

### 3. Get Groq API Key

1. Visit [Groq Console](https://console.groq.com/)
2. Sign up for a free account
3. Generate an API key
4. Copy the API key

### 4. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file and add your Groq API key
# GROQ_API_KEY=your_actual_api_key_here
```

### 5. Run Setup Script

```bash
# Run the setup script to verify everything is working
python src/setup_rag.py
```

### 6. Choose Your Interface

#### Option A: Web Interface (Recommended)
```bash
# Launch the web application
python run.py
# Or directly: python app.py

# Open your browser to: http://localhost:5000
```

#### Option B: CLI Interface
```bash
# Launch the CLI chat system
python -m src.sebi_chat_full
```

## 💬 Usage

### Web Interface Features

#### Interactive Chatbot
- **Regulatory Queries**: Ask questions about SEBI regulations
- **Context-Aware Responses**: Responses based on official SEBI documents
- **Quick Actions**: Pre-built buttons for common queries
- **Fallback Mode**: Works even when RAG system is unavailable

#### Workflow Guidance
- **Registration Process**: Step-by-step guide for intermediary registration
- **Eligibility Checker**: Verify requirements based on intermediary type
- **Document Checklist**: Comprehensive list of required documents
- **Application Simulator**: Mock application process

#### Compliance Management
- **Centralized Platforms**: Information about Samuhik Prativedan Manch
- **Category-Specific Reporting**: Detailed requirements for different intermediary types
- **Monitoring & Inspections**: Guidelines for SEBI audits and compliance

### CLI Interface Features

#### Available Commands
- `help` - Show available commands
- `stats` - Display system statistics
- `examples` - Show example queries
- `history` - View query history
- `clear` - Clear the screen
- `quit` or `exit` - Exit the chat

#### Query Examples
```bash
💭 Ask me about SEBI: What are SEBI's IPO disclosure requirements?
💭 Ask me about SEBI: Explain mutual fund regulations in India
💭 Ask me about SEBI: What are the foreign investment guidelines?
💭 Ask me about SEBI: What changed in SEBI policies in 2022?
💭 Ask me about SEBI: What are the compliance requirements for stock brokers?
```

## 🔧 System Architecture

### System Flow Diagram

![Complete System Flow](complete_flow.png)

### Core Components

#### 1. Document Processing Pipeline
- **Raw Documents** → PDF extraction and text processing
- **Text Chunking** → Documents split into semantic chunks
- **Embedding Generation** → Local embeddings for semantic search
- **Vector Storage** → ChromaDB for efficient retrieval
- **Query Processing** → Retrieval + Generation pipeline

#### 2. RAG System (`sebi_rag_system.py`)
- Manages the complete RAG pipeline
- Handles embeddings, vector storage, and LLM integration
- Provides query interface with source attribution
- Supports both web and CLI interfaces

#### 3. Document Loader (`sebi_document_loader.py`)
- Loads processed SEBI document chunks from JSONL files
- Filters by word count and document type
- Converts to LangChain Document objects
- Supports metadata extraction (year, doc_type, quality_score)

#### 4. Web Interface (`app.py`, `index.html`, JS files`)
- Flask server providing REST API endpoints
- Modern HTML/CSS interface with responsive design
- Interactive chatbot with workflow guidance
- Real-time RAG integration

#### 5. CLI Interface (`sebi_chat_full.py`)
- Interactive command-line interface
- Session management and command handling
- Formatted output with sources and statistics
- Batch processing capabilities

### Data Sources

The system includes processed data from:

- **SEBI Annual Reports**: Comprehensive yearly regulatory reports
- **Master Circulars**: Detailed regulatory guidelines and procedures
- **FAQs**: Official answers to common regulatory questions

### Data Statistics

- **Total Documents**: ~10,000+ processed chunks
- **Document Types**: Annual Reports, Master Circulars, FAQs
- **Years Covered**: Multiple years of regulatory data
- **Quality Filtering**: Minimum 50 words per chunk

## 📊 Technical Details

### Dependencies

#### Core RAG Dependencies
- **langchain** - RAG framework and document processing
- **langchain-community** - Community integrations
- **langchain-groq** - Groq API integration
- **chromadb** - Vector database
- **sentence-transformers** - Local embeddings
- **numpy** - Numerical computations

#### Web Interface Dependencies
- **flask** - Web framework
- **flask-cors** - Cross-origin resource sharing
- **python-dotenv** - Environment management

#### Data Processing Dependencies
- **requests** - HTTP requests
- **beautifulsoup4** - HTML parsing
- **trafilatura** - Web content extraction
- **pdfminer.six** - PDF text extraction
- **tqdm** - Progress bars
- **llama-parse** - Advanced document parsing

### Model Configuration

- **Embedding Model**: BAAI/bge-large-en-v1.5 (local, ~1.3GB)
- **LLM**: Llama 3.3 70B Versatile (via Groq API)
- **Vector DB**: ChromaDB with cosine similarity
- **Chunk Strategy**: Semantic text splitting
- **Retrieval**: Top-k similarity search (k=20)

### Performance Metrics

- **Setup Time**: ~2-3 minutes for first run
- **Query Response**: ~3-5 seconds per query
- **Memory Usage**: ~2-3GB RAM during operation
- **Storage**: ~500MB for vector database
- **Concurrent Users**: Supports multiple web users

## 🔍 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main website |
| `/api/health` | GET | System health check |
| `/api/stats` | GET | RAG system statistics |
| `/api/query` | POST | Query the RAG system |
| `/api/log` | POST | Log query analytics |

### API Usage Examples

#### Health Check
```bash
curl http://localhost:5000/api/health
```

#### Query RAG System
```bash
curl -X POST http://localhost:5000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What are SEBI IPO requirements?"}'
```

#### Get System Stats
```bash
curl http://localhost:5000/api/stats
```

## 🛠️ Advanced Usage

### Custom Data Integration

To add new SEBI documents:

1. Process PDFs into text chunks using the data processing pipeline
2. Save as JSONL format in `data/outputs/`
3. Update document loader if needed
4. Rebuild vector database

### Model Customization

Modify `src/sebi_rag_system.py` to:
- Change embedding models
- Adjust chunk sizes and retrieval parameters
- Modify LLM prompts and temperature
- Update similarity search configurations

### Batch Processing

For processing multiple queries:

```python
from src.sebi_rag_system import SEBIRAGSystem

# Initialize system
rag = SEBIRAGSystem(groq_api_key)

# Load and setup
rag.load_documents()
rag.setup_embeddings()
rag.create_vector_store()
rag.setup_llm()
rag.create_qa_chain()

# Process queries
queries = ["Query 1", "Query 2", "Query 3"]
for query in queries:
    result = rag.query(query)
    print(f"Q: {result['question']}")
    print(f"A: {result['answer']}")
```

### Web Interface Customization

Modify the web interface by editing:
- `index.html` - Main page structure
- `css/styles.css` - Styling and responsive design
- `js/chatbot.js` - Chatbot behavior and workflows
- `js/rag-integration.js` - RAG system integration
- `js/workflows.js` - Form interactions and eligibility checking

## 🔒 Security & Privacy

### Data Protection
- **Local Processing**: All data stays on your local machine
- **No External APIs**: Sensitive data never leaves your system (except Groq API for LLM)
- **Secure Storage**: Environment variables for API keys
- **Input Validation**: Client and server-side validation

### Privacy Features
- **No Data Collection**: No user data is stored or transmitted
- **Session-Based**: No persistent user tracking
- **Local Storage**: Chat history stays in browser only
- **API Key Protection**: Keys stored securely in environment variables

## 🐛 Troubleshooting

### Common Issues

#### 1. Import Errors
```bash
# Reinstall dependencies
pip install -r requirements.txt

# Check Python version
python --version
```

#### 2. API Key Issues
- Verify your Groq API key in `.env` file
- Check API key validity at [Groq Console](https://console.groq.com/)
- Ensure no extra spaces or characters in the key

#### 3. Memory Issues
- Ensure at least 4GB RAM available
- Close other memory-intensive applications
- Consider using smaller embedding models

#### 4. Data Loading Issues
- Verify data files exist in `data/` directory
- Run setup script: `python src/setup_rag.py`
- Check file permissions

#### 5. Web Interface Issues
- Clear browser cache
- Check console for JavaScript errors
- Verify Flask server is running on port 5000
- Try different browser

#### 6. ChromaDB Issues
- Delete `data/sebi_chroma_db/` and rebuild
- Check available disk space
- Ensure write permissions to data directory

### Debug Mode

Enable debug logging in Flask:
```python
# In app.py, change:
app.run(debug=True)
```

### Getting Help

- Check the setup script output for detailed diagnostics
- Verify all files are in correct locations
- Ensure Python 3.8+ is being used
- Check GitHub issues for similar problems

## 📈 Performance Optimization

### System Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB for application and data
- **Network**: Internet connection for Groq API
- **Browser**: Modern browser with JavaScript enabled

### Optimization Tips
- **Use SSD storage** for faster vector database operations
- **Pre-load models** to reduce first-query latency
- **Batch queries** for multiple questions
- **Monitor memory usage** during operation
- **Use connection pooling** for multiple users

## 🤝 Contributing

### Development Setup
```bash
# Clone repository
git clone https://github.com/shivin4/RAGSebi.git
cd sebi-rag-system

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
python run.py
```

### Code Style
- Follow PEP 8 for Python code
- Use descriptive variable names
- Add comments for complex logic
- Test all new features

### Adding New Features
1. **RAG System**: Modify `src/sebi_rag_system.py`
2. **Web Interface**: Update HTML/CSS/JS files
3. **CLI Interface**: Modify `src/sebi_chat_full.py`
4. **Data Processing**: Update document loader and processing scripts

## 📄 License

This project is for educational and research purposes. Please ensure compliance with SEBI's terms of use for their official documents.

## 🙏 Acknowledgments

- **SEBI** for providing comprehensive regulatory documents
- **Groq** for fast LLM inference
- **HuggingFace** for open-source embedding models
- **LangChain** for RAG framework
- **ChromaDB** for vector database
- **Flask** for the web framework

## 📞 Support

For technical issues:
1. Check the troubleshooting section
2. Review Flask server logs
3. Check browser developer console
4. Verify all dependencies are installed

### Community Support
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check WEB_README.md for web-specific issues
- **Setup Script**: Run `python src/setup_rag.py` for diagnostics

---

**Note**: This system is designed for informational purposes and should not be considered as official legal or regulatory advice. Always consult official SEBI sources and qualified professionals for regulatory compliance matters.
