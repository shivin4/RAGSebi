#!/usr/bin/env python3
"""
SCORES Complaint Management System
Flask backend for handling complaint registration, lodging, tracking, and resolution
"""

import os
import sys
import json
import hashlib
import secrets
import sqlite3
import logging
from datetime import datetime, timedelta
from pathlib import Path
import uuid
from typing import Optional, Dict, List, Any
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Add parent directory to path for RAG system imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from src.sebi_rag_system import SEBIRAGSystem
except ImportError as e:
    print(f"Warning: RAG system not available: {e}")
    SEBIRAGSystem = None

# Try to import MongoDB
try:
    from pymongo import MongoClient
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False
    print("MongoDB not available, using SQLite fallback")

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, 
            static_folder='.', 
            template_folder='.')
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(32))
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024  # 200MB max total upload
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx'}

# Create upload folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Global database connection and RAG system
db_connection = None
rag_system = None

class DatabaseManager:
    """Database manager with MongoDB primary and SQLite fallback"""
    
    def __init__(self):
        self.mongo_client = None
        self.mongo_db = None
        self.sqlite_conn = None
        self.use_mongodb = False
        self.init_database()
    
    def init_database(self):
        """Initialize database connection"""
        # Try MongoDB first
        if MONGODB_AVAILABLE:
            try:
                mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
                self.mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
                # Test connection
                self.mongo_client.admin.command('ismaster')
                self.mongo_db = self.mongo_client.scores_db
                self.use_mongodb = True
                logger.info("Connected to MongoDB")
                return
            except Exception as e:
                logger.warning(f"MongoDB connection failed: {e}")
        
        # Fall back to SQLite
        self.init_sqlite()
    
    def init_sqlite(self):
        """Initialize SQLite database"""
        db_path = os.path.join(os.path.dirname(__file__), 'scores.db')
        self.sqlite_conn = sqlite3.connect(db_path, check_same_thread=False)
        self.sqlite_conn.row_factory = sqlite3.Row
        
        # Create tables
        self.sqlite_conn.executescript('''
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                pan TEXT UNIQUE NOT NULL,
                email TEXT NOT NULL,
                mobile TEXT NOT NULL,
                dob TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS complaints (
                complaint_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                files TEXT,  -- JSON array of file paths
                status TEXT DEFAULT 'submitted',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                atr_date TEXT,
                escalation_level INTEGER DEFAULT 1,
                feedback TEXT,
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            );
            
            CREATE TABLE IF NOT EXISTS complaint_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                complaint_id TEXT NOT NULL,
                status TEXT NOT NULL,
                notes TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (complaint_id) REFERENCES complaints (complaint_id)
            );
        ''')
        self.sqlite_conn.commit()
        logger.info("Connected to SQLite database")
    
    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, str]:
        """Create a new user"""
        user_id = f"SCR{datetime.now().strftime('%Y%m%d')}{secrets.token_hex(3).upper()}"
        password = secrets.token_urlsafe(8)
        password_hash = generate_password_hash(password)
        
        user_data.update({
            'user_id': user_id,
            'password_hash': password_hash,
            'created_at': datetime.now().isoformat()
        })
        
        if self.use_mongodb:
            self.mongo_db.users.insert_one(user_data)
        else:
            self.sqlite_conn.execute('''
                INSERT INTO users (user_id, name, pan, email, mobile, dob, password_hash, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, user_data['name'], user_data['pan'], user_data['email'],
                  user_data['mobile'], user_data['dob'], password_hash, user_data['created_at']))
            self.sqlite_conn.commit()
        
        return {'user_id': user_id, 'password': password}
    
    def authenticate_user(self, user_id: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user credentials"""
        if self.use_mongodb:
            user = self.mongo_db.users.find_one({'user_id': user_id})
            if user and check_password_hash(user['password_hash'], password):
                return dict(user)
        else:
            cursor = self.sqlite_conn.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
            user = cursor.fetchone()
            if user and check_password_hash(user['password_hash'], password):
                return dict(user)
        return None
    
    def create_complaint(self, complaint_data: Dict[str, Any]) -> str:
        """Create a new complaint"""
        complaint_id = f"SCR{datetime.now().strftime('%Y%m%d%H%M%S')}{secrets.token_hex(2).upper()}"
        
        complaint_data.update({
            'complaint_id': complaint_id,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'status': 'submitted'
        })
        
        if self.use_mongodb:
            self.mongo_db.complaints.insert_one(complaint_data)
            # Add to history
            self.mongo_db.complaint_history.insert_one({
                'complaint_id': complaint_id,
                'status': 'submitted',
                'notes': 'Complaint submitted',
                'created_at': datetime.now().isoformat()
            })
        else:
            files_json = json.dumps(complaint_data.get('files', []))
            self.sqlite_conn.execute('''
                INSERT INTO complaints (complaint_id, user_id, entity_type, category, description, files, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (complaint_id, complaint_data['user_id'], complaint_data['entity_type'],
                  complaint_data['category'], complaint_data['description'], files_json,
                  'submitted', complaint_data['created_at'], complaint_data['updated_at']))
            
            # Add to history
            self.sqlite_conn.execute('''
                INSERT INTO complaint_history (complaint_id, status, notes, created_at)
                VALUES (?, ?, ?, ?)
            ''', (complaint_id, 'submitted', 'Complaint submitted', datetime.now().isoformat()))
            
            self.sqlite_conn.commit()
        
        return complaint_id
    
    def get_complaint(self, complaint_id: str) -> Optional[Dict[str, Any]]:
        """Get complaint by ID"""
        if self.use_mongodb:
            complaint = self.mongo_db.complaints.find_one({'complaint_id': complaint_id})
            if complaint:
                return dict(complaint)
        else:
            cursor = self.sqlite_conn.execute('SELECT * FROM complaints WHERE complaint_id = ?', (complaint_id,))
            complaint = cursor.fetchone()
            if complaint:
                complaint_dict = dict(complaint)
                # Parse files JSON
                if complaint_dict.get('files'):
                    complaint_dict['files'] = json.loads(complaint_dict['files'])
                return complaint_dict
        return None
    
    def update_complaint_status(self, complaint_id: str, status: str, notes: str = None) -> bool:
        """Update complaint status"""
        current_time = datetime.now().isoformat()
        
        if self.use_mongodb:
            self.mongo_db.complaints.update_one(
                {'complaint_id': complaint_id},
                {'$set': {'status': status, 'updated_at': current_time}}
            )
            # Add to history
            self.mongo_db.complaint_history.insert_one({
                'complaint_id': complaint_id,
                'status': status,
                'notes': notes,
                'created_at': current_time
            })
        else:
            self.sqlite_conn.execute('''
                UPDATE complaints SET status = ?, updated_at = ? WHERE complaint_id = ?
            ''', (status, current_time, complaint_id))
            
            self.sqlite_conn.execute('''
                INSERT INTO complaint_history (complaint_id, status, notes, created_at)
                VALUES (?, ?, ?, ?)
            ''', (complaint_id, status, notes, current_time))
            
            self.sqlite_conn.commit()
        
        return True
    
    def get_user_complaints(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all complaints for a user"""
        complaints = []
        
        if self.use_mongodb:
            cursor = self.mongo_db.complaints.find({'user_id': user_id}).sort('created_at', -1)
            complaints = [dict(complaint) for complaint in cursor]
        else:
            cursor = self.sqlite_conn.execute(
                'SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC',
                (user_id,)
            )
            for row in cursor.fetchall():
                complaint = dict(row)
                if complaint.get('files'):
                    complaint['files'] = json.loads(complaint['files'])
                complaints.append(complaint)
        
        return complaints

# Initialize database
db = DatabaseManager()

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def init_rag_system():
    """Initialize RAG system for query forwarding"""
    global rag_system
    
    if SEBIRAGSystem is None:
        return False
    
    try:
        groq_api_key = os.getenv('GROQ_API_KEY')
        if not groq_api_key:
            logger.warning("GROQ_API_KEY not found")
            return False
        
        rag_system = SEBIRAGSystem(groq_api_key)
        
        # Load and setup RAG system
        documents = rag_system.load_documents(min_word_count=50)
        rag_system.setup_embeddings()
        rag_system.create_vector_store()
        rag_system.setup_llm()
        rag_system.create_qa_chain()
        
        logger.info("RAG system initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"Failed to initialize RAG system: {e}")
        return False

# API Routes

@app.route('/')
def index():
    """Serve the SCORES homepage"""
    return send_from_directory('.', 'index.html')

@app.route('/styles.css')
def serve_css():
    """Serve CSS file"""
    return send_from_directory('.', 'styles.css')

@app.route('/script.js')
def serve_js():
    """Serve JavaScript file"""
    return send_from_directory('.', 'script.js')

@app.route('/index.html')
def serve_main_index():
    """Redirect to main RAG app running on port 5000"""
    from flask import redirect
    return redirect('http://127.0.0.1:5000/', code=302)

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'database': 'mongodb' if db.use_mongodb else 'sqlite',
        'rag_system_available': rag_system is not None
    })

@app.route('/api/register', methods=['POST'])
def register_user():
    """User registration endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'pan', 'email', 'mobile', 'dob']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'{field} is required'
                }), 400
        
        # Validate PAN format (basic)
        pan = data['pan'].upper().strip()
        if len(pan) != 10:
            return jsonify({
                'success': False,
                'error': 'PAN must be 10 characters long'
            }), 400
        
        # Create user
        credentials = db.create_user(data)
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'user_id': credentials['user_id'],
            'password': credentials['password']
        })
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({
            'success': False,
            'error': 'Registration failed',
            'message': str(e)
        }), 500

@app.route('/api/lodge', methods=['POST'])
def lodge_complaint():
    """Lodge a new complaint"""
    try:
        # Handle both form data and JSON
        if request.content_type.startswith('multipart/form-data'):
            user_id = request.form.get('user_id')
            password = request.form.get('password')
            entity_type = request.form.get('entity_type')
            category = request.form.get('category')
            description = request.form.get('description')
            files = request.files.getlist('files')
        else:
            data = request.get_json()
            user_id = data.get('user_id')
            password = data.get('password')
            entity_type = data.get('entity_type')
            category = data.get('category')
            description = data.get('description')
            files = []
        
        # Validate authentication
        user = db.authenticate_user(user_id, password)
        if not user:
            return jsonify({
                'success': False,
                'error': 'Invalid credentials'
            }), 401
        
        # Validate required fields
        if not all([entity_type, category, description]):
            return jsonify({
                'success': False,
                'error': 'Entity type, category, and description are required'
            }), 400
        
        # Handle file uploads
        uploaded_files = []
        if len(files) > 10:
            return jsonify({
                'success': False,
                'error': 'Maximum 10 files allowed'
            }), 400
        
        for file in files:
            if file and file.filename:
                if not allowed_file(file.filename):
                    return jsonify({
                        'success': False,
                        'error': f'File type not allowed: {file.filename}'
                    }), 400
                
                if len(file.read()) > 20 * 1024 * 1024:  # 20MB limit per file
                    return jsonify({
                        'success': False,
                        'error': f'File too large: {file.filename} (max 20MB per file)'
                    }), 400
                
                file.seek(0)  # Reset file pointer after read
                filename = secure_filename(file.filename)
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                unique_filename = f"{timestamp}_{filename}"
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                file.save(file_path)
                uploaded_files.append(unique_filename)
        
        # Create complaint
        complaint_data = {
            'user_id': user_id,
            'entity_type': entity_type,
            'category': category,
            'description': description,
            'files': uploaded_files
        }
        
        complaint_id = db.create_complaint(complaint_data)
        
        return jsonify({
            'success': True,
            'message': 'Complaint lodged successfully',
            'complaint_id': complaint_id
        })
        
    except Exception as e:
        logger.error(f"Lodge complaint error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to lodge complaint',
            'message': str(e)
        }), 500

@app.route('/api/submit', methods=['POST'])
def submit_complaint():
    """Submit complaint (alias for lodge - complaints are auto-submitted)"""
    return lodge_complaint()

@app.route('/api/track', methods=['POST'])
def track_complaint():
    """Track complaint status"""
    try:
        data = request.get_json()
        complaint_id = data.get('complaint_id')
        user_id = data.get('user_id')
        password = data.get('password')
        
        # Validate authentication
        user = db.authenticate_user(user_id, password)
        if not user:
            return jsonify({
                'success': False,
                'error': 'Invalid credentials'
            }), 401
        
        # Get complaint
        complaint = db.get_complaint(complaint_id)
        if not complaint:
            return jsonify({
                'success': False,
                'error': 'Complaint not found'
            }), 404
        
        # Check ownership
        if complaint['user_id'] != user_id:
            return jsonify({
                'success': False,
                'error': 'Access denied'
            }), 403
        
        # Calculate days since submission
        created_at = datetime.fromisoformat(complaint['created_at'])
        days_elapsed = (datetime.now() - created_at).days
        
        # Determine reminders and next actions
        reminders = []
        if days_elapsed >= 10 and complaint['status'] == 'submitted':
            reminders.append("Day 10: Initial response period completed")
        if days_elapsed >= 15 and complaint['status'] in ['submitted', 'under_review']:
            reminders.append("Day 15: First escalation trigger")
        if days_elapsed >= 21 and complaint['status'] != 'resolved':
            reminders.append("Day 21: Second escalation available")
        
        return jsonify({
            'success': True,
            'complaint': {
                'complaint_id': complaint['complaint_id'],
                'entity_type': complaint['entity_type'],
                'category': complaint['category'],
                'description': complaint['description'],
                'status': complaint['status'],
                'created_at': complaint['created_at'],
                'updated_at': complaint['updated_at'],
                'days_elapsed': days_elapsed,
                'reminders': reminders
            }
        })
        
    except Exception as e:
        logger.error(f"Track complaint error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to track complaint',
            'message': str(e)
        }), 500

@app.route('/api/review', methods=['POST'])
def escalate_complaint():
    """Escalate complaint to next level"""
    try:
        data = request.get_json()
        complaint_id = data.get('complaint_id')
        user_id = data.get('user_id')
        password = data.get('password')
        
        # Validate authentication
        user = db.authenticate_user(user_id, password)
        if not user:
            return jsonify({
                'success': False,
                'error': 'Invalid credentials'
            }), 401
        
        # Get complaint
        complaint = db.get_complaint(complaint_id)
        if not complaint:
            return jsonify({
                'success': False,
                'error': 'Complaint not found'
            }), 404
        
        # Check ownership
        if complaint['user_id'] != user_id:
            return jsonify({
                'success': False,
                'error': 'Access denied'
            }), 403
        
        # Determine escalation level
        current_level = complaint.get('escalation_level', 1)
        if current_level >= 3:
            return jsonify({
                'success': False,
                'error': 'Complaint already at highest escalation level'
            }), 400
        
        new_level = current_level + 1
        status_map = {
            2: 'escalated_l2',
            3: 'escalated_sebi'
        }
        
        new_status = status_map[new_level]
        notes = f"Escalated to level {new_level}"
        
        db.update_complaint_status(complaint_id, new_status, notes)
        
        return jsonify({
            'success': True,
            'message': f'Complaint escalated to level {new_level}',
            'new_status': new_status
        })
        
    except Exception as e:
        logger.error(f"Escalate complaint error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to escalate complaint',
            'message': str(e)
        }), 500

@app.route('/api/close', methods=['POST'])
def close_complaint():
    """Close complaint with feedback"""
    try:
        data = request.get_json()
        complaint_id = data.get('complaint_id')
        user_id = data.get('user_id')
        password = data.get('password')
        feedback = data.get('feedback', '')
        
        # Validate authentication
        user = db.authenticate_user(user_id, password)
        if not user:
            return jsonify({
                'success': False,
                'error': 'Invalid credentials'
            }), 401
        
        # Get complaint
        complaint = db.get_complaint(complaint_id)
        if not complaint:
            return jsonify({
                'success': False,
                'error': 'Complaint not found'
            }), 404
        
        # Check ownership
        if complaint['user_id'] != user_id:
            return jsonify({
                'success': False,
                'error': 'Access denied'
            }), 403
        
        # Update complaint status
        notes = f"Closed by user. Feedback: {feedback}" if feedback else "Closed by user"
        db.update_complaint_status(complaint_id, 'closed', notes)
        
        return jsonify({
            'success': True,
            'message': 'Complaint closed successfully'
        })
        
    except Exception as e:
        logger.error(f"Close complaint error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to close complaint',
            'message': str(e)
        }), 500

@app.route('/api/query', methods=['POST'])
def query_rag():
    """Forward queries to RAG system"""
    try:
        data = request.get_json()
        question = data.get('question', '').strip()
        
        if not question:
            return jsonify({
                'success': False,
                'error': 'Question is required'
            }), 400
        
        if not rag_system:
            return jsonify({
                'success': False,
                'error': 'RAG system not available',
                'message': 'The SEBI knowledge system is currently unavailable. Please try again later.'
            }), 503
        
        # Query the RAG system
        result = rag_system.query(question)
        
        return jsonify({
            'success': True,
            'question': result['question'],
            'answer': result['answer'],
            'sources': result['sources'],
            'source_count': result['source_count'],
            'timestamp': result['timestamp']
        })
        
    except Exception as e:
        logger.error(f"Query error: {e}")
        return jsonify({
            'success': False,
            'error': 'Query failed',
            'message': str(e)
        }), 500

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    logger.info("Starting SCORES Flask Application...")
    
    # Initialize RAG system
    init_rag_system()
    
    # Run Flask app
    app.run(host='0.0.0.0', port=5001, debug=True)
