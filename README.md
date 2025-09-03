# SEBI RAG Chat System

A comprehensive Retrieval-Augmented Generation (RAG) system for querying SEBI (Securities and Exchange Board of India) documents using open-source models and local embeddings.

## 🏛️ Overview

This system allows you to ask questions about SEBI regulations, policies, and procedures based on official SEBI documents including:

- **Annual Reports** - Comprehensive yearly regulatory reports
- **Master Circulars** - Detailed regulatory guidelines and procedures
- **FAQs** - Frequently asked questions about SEBI regulations

The system uses:
- **Local embeddings** (BAAI/bge-large-en-v1.5) for privacy and cost-efficiency
- **ChromaDB** vector database for document storage and retrieval
- **Groq API** for fast LLM inference (Llama 3.3 70B model)
- **LangChain** framework for RAG pipeline orchestration

## 📁 Project Structure

```
sebi-rag-system/
├── src/                          # Source code
│   ├── sebi_chat_full.py        # Main chat interface
│   ├── sebi_rag_system.py       # Core RAG system implementation
│   ├── sebi_document_loader.py  # Document loading and processing
│   └── setup_rag.py            # Setup and testing script
├── data/                        # Data files
│   ├── outputs/                 # Processed document chunks
│   ├── sebi_annual_reports/     # Annual report data
│   ├── sebi_faqs/               # FAQ data
│   ├── sebi_mastercirculars/    # Master circular data
│   └── sebi_chroma_db/          # Vector database
├── docs/                        # Documentation
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variables template
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**
- **Git** (for cloning the repository)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd sebi-rag-system

# Install dependencies
pip install -r requirements.txt
```

### 2. Get Groq API Key

1. Visit [Groq Console](https://console.groq.com/)
2. Sign up for a free account
3. Generate an API key
4. Copy the API key

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file and add your Groq API key
# GROQ_API_KEY=your_actual_api_key_here
```

### 4. Run Setup Script

```bash
# Run the setup script to verify everything is working
python src/setup_rag.py
```

### 5. Start the Chat System

```bash
# Launch the interactive chat interface
python -m src.sebi_chat_full
```

## 💬 Usage

Once the system is running, you can ask questions like:

- "What are SEBI's IPO disclosure requirements?"
- "Explain mutual fund regulations in India"
- "What are the foreign investment guidelines?"
- "What changed in SEBI policies in 2022?"
- "What are the compliance requirements for stock brokers?"

### Available Commands

- `help` - Show available commands
- `stats` - Display system statistics
- `examples` - Show example queries
- `history` - View query history
- `clear` - Clear the screen
- `quit` or `exit` - Exit the chat

## 🔧 System Architecture

### Core Components

1. **Document Loader** (`sebi_document_loader.py`)
   - Loads processed SEBI document chunks from JSONL files
   - Filters by word count and document type
   - Converts to LangChain Document objects

2. **RAG System** (`sebi_rag_system.py`)
   - Manages the complete RAG pipeline
   - Handles embeddings, vector storage, and LLM integration
   - Provides query interface with source attribution

3. **Chat Interface** (`sebi_chat_full.py`)
   - Interactive CLI for user queries
   - Session management and command handling
   - Formatted output with sources and statistics

### Data Processing Pipeline

1. **Raw Documents** → PDF extraction and text processing
2. **Text Chunking** → Documents split into semantic chunks
3. **Embedding Generation** → Local embeddings for semantic search
4. **Vector Storage** → ChromaDB for efficient retrieval
5. **Query Processing** → Retrieval + Generation pipeline

## 📊 Data Sources

The system includes processed data from:

- **SEBI Annual Reports**: Comprehensive regulatory reports from multiple years
- **Master Circulars**: Detailed regulatory guidelines and procedures
- **FAQs**: Official answers to common regulatory questions

### Data Statistics

- **Total Documents**: ~10,000+ processed chunks
- **Document Types**: Annual Reports, Master Circulars, FAQs
- **Years Covered**: Multiple years of regulatory data
- **Quality Filtering**: Minimum 50 words per chunk

## 🛠️ Technical Details

### Dependencies

- **langchain** - RAG framework
- **chromadb** - Vector database
- **sentence-transformers** - Local embeddings
- **groq** - LLM API client
- **python-dotenv** - Environment management

### Model Configuration

- **Embedding Model**: BAAI/bge-large-en-v1.5 (local, ~1.3GB)
- **LLM**: Llama 3.3 70B Versatile (via Groq API)
- **Vector DB**: ChromaDB with cosine similarity
- **Chunk Strategy**: Semantic text splitting

### Performance

- **Setup Time**: ~2-3 minutes for first run
- **Query Response**: ~3-5 seconds per query
- **Memory Usage**: ~2-3GB RAM during operation
- **Storage**: ~500MB for vector database

## 🔍 Query Examples

### Regulatory Questions
- "What are the disclosure requirements for IPOs?"
- "What are SEBI's mutual fund regulations?"
- "Explain the foreign portfolio investment guidelines"

### Compliance Questions
- "What are the requirements for stock exchange compliance?"
- "What are the penalties for insider trading?"
- "How does SEBI regulate credit rating agencies?"

### Procedural Questions
- "What are the requirements for delisting securities?"
- "Explain SEBI's corporate governance norms"
- "What are the margin requirements for derivatives trading?"
- "How are investor grievances handled by SEBI?"

## 🐛 Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   # Reinstall dependencies
   pip install -r requirements.txt
   ```

2. **API Key Issues**
   - Verify your Groq API key in `.env` file
   - Check API key validity at [Groq Console](https://console.groq.com/)

3. **Memory Issues**
   - Ensure at least 4GB RAM available
   - Close other memory-intensive applications

4. **Data Loading Issues**
   - Verify data files exist in `data/` directory
   - Run setup script: `python src/setup_rag.py`

### Getting Help

- Check the setup script output for detailed diagnostics
- Verify all files are in correct locations
- Ensure Python 3.8+ is being used

## 📈 Advanced Usage

### Custom Data Integration

To add new SEBI documents:

1. Process PDFs into text chunks
2. Save as JSONL format in `data/outputs/`
3. Update document loader if needed
4. Rebuild vector database

### Model Customization

Modify `sebi_rag_system.py` to:
- Change embedding models
- Adjust chunk sizes
- Modify retrieval parameters
- Update LLM prompts

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational and research purposes. Please ensure compliance with SEBI's terms of use for their official documents.

## 🙏 Acknowledgments

- **SEBI** for providing comprehensive regulatory documents
- **Groq** for fast LLM inference
- **HuggingFace** for open-source embedding models
- **LangChain** for RAG framework

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Run the setup script for diagnostics
3. Verify your environment setup
4. Check GitHub issues for similar problems

---

**Note**: This system is designed for informational purposes and should not be considered as official legal or regulatory advice. Always consult official SEBI sources and qualified professionals for regulatory compliance matters.
