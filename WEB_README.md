# SEBI RAG Web Application

A modern web interface for the SEBI RAG Chat System with agentic workflows for intermediary registration and compliance.

## 🏛️ Overview

This web application combines:
- **Interactive Workflows**: Step-by-step guides for SEBI registration and compliance
- **AI-Powered Chatbot**: Integrated RAG system for SEBI regulatory queries
- **Modern UI**: Professional design inspired by SEBI's official website
- **Local Data Processing**: Keeps sensitive user data private and secure

## 📁 Project Structure

```
sebi-rag-system/
├── app.py                 # Flask web server
├── run.py                 # Application launcher
├── index.html            # Main website
├── css/
│   └── styles.css        # Styling and responsive design
├── js/
│   ├── workflows.js      # Workflow interactions
│   ├── chatbot.js        # Chatbot functionality
│   └── rag-integration.js # RAG system integration
├── src/                  # Python RAG system
├── data/                 # Document data
├── requirements.txt      # Python dependencies
└── .env                  # Environment variables
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**
- **Git**
- **Web Browser**

### 1. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt
```

### 2. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file and add your Groq API key
# GROQ_API_KEY=your_actual_api_key_here
```

### 3. Run the Application

#### Option A: Using the Launcher (Recommended)
```bash
python run.py
```

#### Option B: Direct Flask Run
```bash
python app.py
```

### 4. Access the Application

Open your web browser and go to: **http://localhost:5000**

## 💡 Features

### 🔄 Interactive Workflows

#### Registration Process
- **Eligibility Checker**: Verify requirements based on intermediary type
- **Document Checklist**: Comprehensive list of required documents
- **Step-by-Step Guide**: Visual workflow with timelines and requirements
- **Application Simulator**: Mock application process

#### Compliance Management
- **Centralized Platforms**: Information about Samuhik Prativedan Manch
- **Category-Specific Reporting**: Detailed requirements for different intermediary types
- **Monitoring & Inspections**: Guidelines for SEBI audits and compliance

### 🤖 AI Chatbot

#### Features
- **Regulatory Queries**: Ask questions about SEBI regulations
- **Context-Aware Responses**: Responses based on official SEBI documents
- **Quick Actions**: Pre-built buttons for common queries
- **Fallback Mode**: Works even when RAG system is unavailable

#### Quick Actions Available
- Check Eligibility Requirements
- View Required Documents
- Get Timeline Information
- Fee Structure Details

### 🎨 User Interface

#### Design Features
- **SEBI-Inspired Design**: Professional blue and white color scheme
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Modern Animations**: Smooth transitions and hover effects
- **Accessibility**: Screen reader friendly and keyboard navigation

#### Navigation
- **Header Navigation**: Quick access to Registration and Compliance sections
- **Smooth Scrolling**: Animated navigation between sections
- **Progress Indicators**: Visual workflow progress tracking

## 🔧 Technical Architecture

### Frontend
- **HTML5**: Semantic markup and accessibility
- **CSS3**: Modern styling with Flexbox and Grid
- **Vanilla JavaScript**: No frameworks for lightweight performance
- **Responsive Design**: Mobile-first approach

### Backend
- **Flask**: Lightweight Python web framework
- **REST API**: Clean API endpoints for RAG queries
- **CORS Support**: Cross-origin resource sharing enabled
- **Error Handling**: Comprehensive error responses

### RAG Integration
- **Real-time Queries**: Live connection to your Python RAG system
- **Fallback Responses**: Intelligent responses when system is unavailable
- **Query Logging**: Analytics and performance tracking
- **Retry Logic**: Automatic retry for failed requests

## 📊 API Endpoints

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

## 🔒 Security & Privacy

### Data Protection
- **Local Processing**: All data stays on your local machine
- **No External APIs**: Sensitive data never leaves your system
- **Secure Storage**: Environment variables for API keys
- **Input Validation**: Client and server-side validation

### Privacy Features
- **No Data Collection**: No user data is stored or transmitted
- **Session-Based**: No persistent user tracking
- **Local Storage**: Chat history stays in browser only

## 🐛 Troubleshooting

### Common Issues

#### Flask Server Won't Start
```bash
# Check Python version
python --version

# Install missing dependencies
pip install flask flask-cors

# Check port availability
netstat -an | find "5000"
```

#### RAG System Not Available
- Verify `GROQ_API_KEY` is set in `.env` file
- Check internet connection for API calls
- Review console logs for error messages

#### Chatbot Not Responding
- Check browser console for JavaScript errors
- Verify Flask server is running on port 5000
- Try refreshing the page

#### Styling Issues
- Clear browser cache
- Check CSS file paths
- Verify Font Awesome CDN connection

### Debug Mode

Enable debug logging in Flask:
```python
app.run(debug=True)
```

## 🚀 Deployment

### Local Development
```bash
# Run with debug mode
python app.py  # Edit app.py to set debug=True
```

### Production Deployment
```bash
# Use a production WSGI server
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Docker Deployment
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

## 📈 Performance

### Optimization Features
- **Lazy Loading**: Components load as needed
- **Caching**: API responses cached in memory
- **Compression**: Flask response compression
- **Async Processing**: Non-blocking API calls

### System Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB for application and data
- **Network**: Internet connection for Groq API
- **Browser**: Modern browser with JavaScript enabled

## 🤝 Contributing

### Development Setup
```bash
# Clone repository
git clone <repository-url>
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

## 📄 License

This project is for educational and research purposes. Please ensure compliance with SEBI's terms of use for their official documents.

## 🙏 Acknowledgments

- **SEBI** for providing comprehensive regulatory documents
- **Groq** for fast LLM inference
- **HuggingFace** for open-source embedding models
- **LangChain** for RAG framework
- **Flask** for the web framework

## 📞 Support

For technical issues:
1. Check the troubleshooting section
2. Review Flask server logs
3. Check browser developer console
4. Verify all dependencies are installed

---

**Note**: This is a demonstration application for educational purposes. For actual SEBI registration and compliance, please visit the official SEBI website and consult qualified professionals.
