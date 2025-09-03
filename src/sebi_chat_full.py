#!/usr/bin/env python3
"""
SEBI RAG Chat Interface - Full Dataset
Interactive CLI for querying ALL SEBI documents using RAG pipeline
"""

import os
import sys
import json
import time
from typing import Optional, Dict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    from src.sebi_rag_system import SEBIRAGSystem
except ImportError as e:
    print(f"Error importing RAG system: {e}")
    print("Please install the required dependencies first:")
    print("pip install -r requirements.txt")
    sys.exit(1)

def main():
    """Main function to run the full dataset chat interface"""
    
    print("🏛️  SEBI RAG Chat System - Full Dataset")
    print("=" * 60)
    print("Loading ALL SEBI documents (Annual Reports, FAQs, Master Circulars)")
    print("This provides the most comprehensive coverage but takes longer to set up.")
    print()
    
    # Get API key
    groq_api_key = os.getenv('GROQ_API_KEY')
    
    if not groq_api_key:
        print("❌ GROQ_API_KEY not found in environment variables")
        print("Please run setup_rag.py first to configure your API key")
        return
    
    try:
        print("🚀 Initializing SEBI RAG System...")
        print("=" * 50)
        
        # Initialize RAG system
        rag_system = SEBIRAGSystem(groq_api_key)
        
        # Load ALL documents
        print("📚 Loading all documents...")
        print("   This will include Annual Reports, FAQs, and Master Circulars")
        documents = rag_system.load_documents(min_word_count=50)  # All document types
        
        # Setup embeddings
        print("🧠 Setting up embeddings...")
        rag_system.setup_embeddings()
        
        # Create vector store
        print("💾 Creating vector database...")
        rag_system.create_vector_store()
        
        # Setup LLM and QA chain
        print("🤖 Setting up Groq LLM...")
        rag_system.setup_llm()
        rag_system.create_qa_chain()
        
        # Show comprehensive stats
        stats = rag_system.get_stats()
        print(f"\n✅ Full RAG System Ready!")
        print(f"   📊 Total documents: {stats['total_documents']:,}")
        print(f"   📁 Document types: {stats['doc_types']}")
        print(f"   📅 Years covered: {len(stats['years_available'])} different years")
        print(f"   💬 Total words: {stats['total_words']:,}")
        
        print("\n🏛️  SEBI RAG Chat System - Full Dataset")
        print("=" * 60)
        print("Welcome! This system can answer questions about SEBI regulations,")
        print("policies, and procedures based on ALL official SEBI documents.")
        print()
        print("Available document types:")
        for doc_type, count in stats['doc_types'].items():
            print(f"  - {doc_type.replace('_', ' ').title()}: {count:,} chunks")
        print()
        print("Type 'help' for commands or ask any question about SEBI.")
        print("Type 'quit' or 'exit' to end the session.")
        
        session_history = []
        
        while True:
            try:
                # Get user input
                user_input = input("\n💭 Ask me about SEBI: ").strip()
                
                if not user_input:
                    continue
                
                # Handle commands
                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("\n👋 Thanks for using SEBI RAG Chat! Goodbye!")
                    break
                    
                elif user_input.lower() == 'help':
                    print("\n📖 SEBI RAG Chat - Help")
                    print("=" * 40)
                    print("Commands:")
                    print("  help          - Show this help message")
                    print("  stats         - Show system statistics")
                    print("  examples      - Show example queries")
                    print("  history       - Show query history")
                    print("  clear         - Clear screen")
                    print("  quit/exit     - Exit the chat")
                    print()
                    print("Query Examples:")
                    print("  - What are SEBI's IPO disclosure requirements?")
                    print("  - Explain mutual fund regulations in India")
                    print("  - What are the foreign investment guidelines?")
                    print("  - What changed in SEBI policies in 2022?")
                    print("  - What are the compliance requirements for stock brokers?")
                    continue
                    
                elif user_input.lower() == 'examples':
                    examples = [
                        "What are the disclosure requirements for IPOs?",
                        "What are SEBI's mutual fund regulations?", 
                        "Explain the foreign portfolio investment guidelines",
                        "What are the compliance requirements for stock exchanges?",
                        "What are the penalties for insider trading?",
                        "How does SEBI regulate credit rating agencies?",
                        "What are the requirements for delisting securities?",
                        "Explain SEBI's corporate governance norms",
                        "What are the margin requirements for derivatives trading?",
                        "How are investor grievances handled by SEBI?"
                    ]
                    
                    print("\n💡 Example Queries")
                    print("=" * 40)
                    for i, example in enumerate(examples, 1):
                        print(f"{i:2}. {example}")
                    continue
                    
                elif user_input.lower() == 'stats':
                    stats = rag_system.get_stats()
                    print(f"\n📊 System Statistics:")
                    print(f"   Documents loaded: {stats['total_documents']:,}")
                    print(f"   Total words: {stats['total_words']:,}")
                    print(f"   Document types: {stats['doc_types']}")
                    print(f"   Years available: {len(stats['years_available'])}")
                    continue
                    
                elif user_input.lower() == 'history':
                    if session_history:
                        print(f"\n📝 Session History ({len(session_history)} queries):")
                        for i, query in enumerate(session_history[-5:], 1):  # Show last 5
                            print(f"{i}. {query['question']}")
                    else:
                        print("No queries in history yet.")
                    continue
                    
                elif user_input.lower() == 'clear':
                    os.system('cls' if os.name == 'nt' else 'clear')
                    continue
                
                # Process the query
                print("\n🔍 Searching ALL SEBI documents...")
                start_time = time.time()
                
                result = rag_system.query(user_input)
                response_time = time.time() - start_time
                result['response_time'] = response_time
                
                # Add to session history
                session_history.append(result)
                
                if 'error' in result:
                    print(f"❌ Error: {result['error']}")
                else:
                    # Display result
                    print(f"\n💬 Question: {result['question']}")
                    print("=" * 60)
                    print(f"🤖 Answer:")
                    print(result['answer'])
                    
                    if result.get('sources'):
                        print(f"\n📚 Sources ({result['source_count']} documents):")
                        print("-" * 40)
                        
                        for i, source in enumerate(result['sources'][:5], 1):  # Show top 5 sources
                            print(f"{i}. {source['doc_type'].replace('_', ' ').title()} ({source.get('year', 'N/A')})")
                            print(f"   File: {source['source_file'].split('/')[-1] if '/' in source['source_file'] else source['source_file'].split('\\\\')[-1]}")
                            print(f"   Quality Score: {source['quality_score']:.1f}")
                            print(f"   Preview: {source['content_preview']}")
                            print()
                    
                    print(f"⏱️  Response time: {response_time:.2f} seconds")
                
            except KeyboardInterrupt:
                print("\n\n👋 Session interrupted. Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
    
    except Exception as e:
        print(f"❌ Error setting up RAG system: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
