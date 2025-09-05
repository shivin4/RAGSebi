#!/usr/bin/env python3
"""
SEBI RAG Web Application
Flask server to serve the website and provide API endpoints for RAG queries
"""

import os
import sys
import json
import time
import logging
from datetime import datetime
from flask import Flask, request, jsonify, render_template, send_from_directory, redirect
from flask_cors import CORS
from dotenv import load_dotenv

# Add src directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

try:
    from src.sebi_rag_system import SEBIRAGSystem
except ImportError as e:
    print(f"Error importing RAG system: {e}")
    print("Please ensure the src directory is properly set up")
    SEBIRAGSystem = None

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__,
            static_folder='.',
            template_folder='.')

# Enable CORS for API endpoints
CORS(app)

# Global RAG system instance
rag_system = None

def initialize_rag_system():
    """Initialize the RAG system"""
    global rag_system

    try:
        # Get API key
        groq_api_key = os.getenv('GROQ_API_KEY')
        if not groq_api_key:
            logger.warning("GROQ_API_KEY not found. RAG system will not be available.")
            return False

        logger.info("Initializing SEBI RAG System...")

        # Initialize RAG system
        rag_system = SEBIRAGSystem(groq_api_key)

        # Load documents
        logger.info("Loading documents...")
        documents = rag_system.load_documents(min_word_count=50)

        # Setup embeddings and vector store
        logger.info("Setting up embeddings and vector store...")
        rag_system.setup_embeddings()
        rag_system.create_vector_store()

        # Setup LLM and QA chain
        logger.info("Setting up LLM and QA chain...")
        rag_system.setup_llm()
        rag_system.create_qa_chain()

        logger.info("SEBI RAG System initialized successfully!")
        return True

    except Exception as e:
        logger.error(f"Failed to initialize RAG system: {e}")
        return False

@app.route('/')
def index():
    """Serve the main website"""
    return send_from_directory('.', 'index.html')

@app.route('/css/<path:filename>')
def serve_css(filename):
    """Serve CSS files"""
    return send_from_directory('css', filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    """Serve JavaScript files"""
    return send_from_directory('js', filename)

@app.route('/images/<path:filename>')
def serve_images(filename):
    """Serve image files"""
    return send_from_directory('images', filename)

@app.route('/scores/<path:filename>')
def serve_scores(filename):
    """Redirect to SCORES app running on port 5001"""
    if filename == 'index.html':
        return redirect('http://127.0.0.1:5001/', code=302)
    return redirect(f'http://127.0.0.1:5001/{filename}', code=302)

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'rag_system_available': rag_system is not None
    })

@app.route('/api/stats')
def get_stats():
    """Get system statistics"""
    if not rag_system:
        return jsonify({
            'error': 'RAG system not available',
            'message': 'The RAG system is currently unavailable. Please try again later.'
        }), 503

    try:
        stats = rag_system.get_stats()
        return jsonify({
            'success': True,
            'stats': stats,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return jsonify({
            'error': 'Failed to get statistics',
            'message': str(e)
        }), 500

@app.route('/api/query', methods=['POST'])
def query_rag():
    """Query the RAG system"""
    if not rag_system:
        return jsonify({
            'success': False,
            'error': 'RAG system not available',
            'message': 'The RAG system is currently unavailable. Please try again later.',
            'fallback_response': get_fallback_response(request.json.get('question', '') if request.json else '')
        }), 503

    try:
        data = request.get_json()

        if not data or 'question' not in data:
            return jsonify({
                'success': False,
                'error': 'Invalid request',
                'message': 'Question is required'
            }), 400

        question = data['question'].strip()
        if not question:
            return jsonify({
                'success': False,
                'error': 'Empty question',
                'message': 'Please provide a valid question'
            }), 400

        logger.info(f"Processing query: {question}")

        # Start timing
        start_time = time.time()

        # Query the RAG system
        result = rag_system.query(question)

        # Calculate processing time
        processing_time = time.time() - start_time

        # Format response
        response_data = {
            'success': True,
            'question': result['question'],
            'answer': result['answer'],
            'sources': result['sources'],
            'source_count': result['source_count'],
            'processing_time': processing_time,
            'timestamp': result['timestamp']
        }

        logger.info(f"Query processed successfully in {processing_time:.2f}s")
        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Error processing query: {e}")
        return jsonify({
            'success': False,
            'error': 'Query processing failed',
            'message': str(e),
            'fallback_response': get_fallback_response(request.json.get('question', '') if request.json else '')
        }), 500

@app.route('/api/log', methods=['POST'])
def log_query():
    """Log query for analytics"""
    try:
        data = request.get_json()
        if data:
            logger.info(f"Query logged: {data.get('question', 'N/A')} - Success: {data.get('success', False)}")
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error logging query: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

def get_fallback_response(question):
    """Provide fallback responses when RAG system is unavailable"""
    if not question:
        return "I'm sorry, but the system is currently unavailable. Please try again later or contact SEBI directly."

    question_lower = question.lower()

    if 'registration' in question_lower or 'apply' in question_lower:
        return "For SEBI registration information, please visit the official SEBI website at www.sebi.gov.in or contact SEBI's intermediary registration department. The registration process typically involves eligibility verification, document submission, and approval from SEBI."

    if 'compliance' in question_lower or 'reporting' in question_lower:
        return "SEBI compliance requirements are detailed in various master circulars available on the official SEBI website. Intermediaries must maintain proper records, submit periodic reports, and adhere to regulatory guidelines. Please refer to the latest SEBI circulars for specific requirements."

    if 'eligibility' in question_lower:
        return "Eligibility criteria for SEBI registration vary by intermediary type. Please check the specific requirements for your category on the SEBI website or consult with a regulatory expert. Common requirements include minimum net worth, qualified personnel, and proper infrastructure."

    return "I'm currently unable to access detailed regulatory information. Please visit the official SEBI website (www.sebi.gov.in) for the most current regulations and guidelines, or consult with qualified regulatory professionals for specific advice."

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested resource was not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {error}")
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred'
    }), 500

def main():
    """Main function to run the Flask application"""
    print("🏛️  SEBI RAG Web Application")
    print("=" * 50)

    # Try to initialize RAG system
    rag_available = initialize_rag_system()

    if rag_available:
        print("✅ RAG system initialized successfully")
    else:
        print("⚠️  RAG system not available - running in fallback mode")
        print("   Make sure GROQ_API_KEY is set in your .env file")

    print("\n🚀 Starting Flask server...")
    print("   Website: http://localhost:5000")
    print("   API endpoints:")
    print("   - GET  /api/health")
    print("   - GET  /api/stats")
    print("   - POST /api/query")
    print("   - POST /api/log")

    # Run the Flask application
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=False,  # Set to False for production
        threaded=True
    )

if __name__ == '__main__':
    main()
