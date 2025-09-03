import os
import json
import logging
from typing import List, Dict, Optional
from datetime import datetime
from dotenv import load_dotenv

# Core imports
from langchain.schema import Document
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.callbacks import StreamingStdOutCallbackHandler

# Local imports
from src.sebi_document_loader import SEBIDocumentLoader

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SEBIRAGSystem:
    """Complete RAG system for SEBI documents using open-source models"""
    
    def __init__(self, groq_api_key: str, data_file: str = "data/outputs/sebi_texts_chunked_v2.jsonl"):
        """
        Initialize the SEBI RAG system
        
        Args:
            groq_api_key: Groq API key for LLM access
            data_file: Path to the chunked SEBI data
        """
        self.groq_api_key = groq_api_key
        self.data_file = data_file
        self.documents = []
        self.vectorstore = None
        self.qa_chain = None
        
        # Set up Groq API key
        os.environ["GROQ_API_KEY"] = groq_api_key
        
    def setup_embeddings(self, model_name: str = "BAAI/bge-large-en-v1.5"):
        """
        Set up local embedding model
        
        Args:
            model_name: HuggingFace model name for embeddings
        """
        logger.info(f"Initializing embedding model: {model_name}")
        
        # Use HuggingFace embeddings (free, local)
        self.embeddings = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs={'device': 'cpu'},  # Use CPU for compatibility
            encode_kwargs={'normalize_embeddings': True}
        )
        
        return self.embeddings
    
    def load_documents(self, min_word_count: int = 50, doc_types: Optional[List[str]] = None):
        """
        Load SEBI documents using custom loader
        
        Args:
            min_word_count: Minimum words per chunk to include
            doc_types: List of document types to include (None for all)
        """
        logger.info("Loading SEBI documents...")
        
        # Load all documents
        loader = SEBIDocumentLoader(self.data_file, min_word_count=min_word_count)
        all_documents = loader.load()
        
        # Filter by document types if specified
        if doc_types:
            self.documents = [
                doc for doc in all_documents 
                if doc.metadata.get('doc_type') in doc_types
            ]
            logger.info(f"Filtered to {len(self.documents)} documents of types: {doc_types}")
        else:
            self.documents = all_documents
        
        logger.info(f"Loaded {len(self.documents)} document chunks")
        return self.documents
    
    def create_vector_store(self, persist_directory: str = "data/sebi_chroma_db",
                          collection_name: str = "sebi_documents"):
        """
        Create Chroma vector store from documents
        
        Args:
            persist_directory: Directory to persist the vector database
            collection_name: Name of the collection in Chroma
        """
        logger.info("Creating vector store...")
        
        if not hasattr(self, 'embeddings'):
            self.setup_embeddings()
        
        if not self.documents:
            raise ValueError("No documents loaded. Call load_documents() first.")
        
        # Create or load Chroma vector store
        self.vectorstore = Chroma(
            collection_name=collection_name,
            embedding_function=self.embeddings,
            persist_directory=persist_directory
        )
        
        # Check if database already exists and has data
        existing_count = self.vectorstore._collection.count()
        
        if existing_count == 0:
            logger.info(f"Creating new vector store with {len(self.documents)} documents...")
            
            # Add documents in batches to avoid memory issues
            batch_size = 100
            for i in range(0, len(self.documents), batch_size):
                batch = self.documents[i:i + batch_size]
                logger.info(f"Processing batch {i//batch_size + 1}/{(len(self.documents)-1)//batch_size + 1}")
                
                self.vectorstore.add_documents(batch)
            
            logger.info(f"Vector store created with {len(self.documents)} documents")
        else:
            logger.info(f"Using existing vector store with {existing_count} documents")
        
        return self.vectorstore
    
    def setup_llm(self, model_name: str = "llama-3.3-70b-versatile", temperature: float = 0.1):
        """
        Set up Groq LLM
        
        Args:
            model_name: Groq model name
            temperature: Temperature for response generation
        """
        logger.info(f"Initializing Groq LLM: {model_name}")
        
        self.llm = ChatGroq(
            model=model_name,
            temperature=temperature,
            max_tokens=2048,
            api_key=self.groq_api_key,
            streaming=True,
            callbacks=[StreamingStdOutCallbackHandler()]
        )
        
        return self.llm
    
    def create_qa_chain(self):
        """Create the RAG QA chain"""
        
        if not self.vectorstore:
            raise ValueError("Vector store not created. Call create_vector_store() first.")
        
        if not hasattr(self, 'llm'):
            self.setup_llm()
        
        # Create custom prompt template
        prompt_template = """You are an expert assistant for SEBI (Securities and Exchange Board of India) regulations and policies. 
        Use the provided context from SEBI documents to answer questions accurately and comprehensively.

        Context from SEBI documents:
        {context}

        Question: {question}

        Instructions:
        1. Answer based primarily on the provided SEBI document context
        2. If the context doesn't contain enough information, clearly state this
        3. Cite specific document types when possible (Annual Report, Master Circular, FAQ)
        4. Provide year information when available
        5. Be precise and regulatory-focused in your responses
        6. If asked about recent changes, focus on the most recent documents in the context

        Answer:"""
        
        PROMPT = PromptTemplate(
            template=prompt_template,
            input_variables=["context", "question"]
        )
        
        # Create retriever with better parameters
        retriever = self.vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={
                "k": 20,  # Retrieve top 20 most similar chunks
            }
        )
        
        # Create QA chain
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=retriever,
            chain_type_kwargs={"prompt": PROMPT},
            return_source_documents=True,
            verbose=True
        )
        
        logger.info("QA chain created successfully")
        return self.qa_chain
    
    def query(self, question: str, filter_doc_type: Optional[str] = None) -> Dict:
        """
        Query the RAG system
        
        Args:
            question: The question to ask
            filter_doc_type: Optional filter by document type
            
        Returns:
            Dictionary with answer and source information
        """
        if not self.qa_chain:
            self.create_qa_chain()
        
        logger.info(f"Processing query: {question}")
        
        try:
            # Execute the query
            result = self.qa_chain({"query": question})
            
            # Process source documents
            sources = []
            for doc in result.get('source_documents', []):
                sources.append({
                    'source_file': doc.metadata.get('source', 'Unknown'),
                    'doc_type': doc.metadata.get('doc_type', 'Unknown'),
                    'year': doc.metadata.get('year', 'Unknown'),
                    'chunk_id': doc.metadata.get('chunk_id', 'Unknown'),
                    'word_count': doc.metadata.get('word_count', 0),
                    'quality_score': doc.metadata.get('original_quality_score', 0),
                    'content_preview': doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content
                })
            
            return {
                'question': question,
                'answer': result.get('result', 'No answer generated'),
                'sources': sources,
                'source_count': len(sources),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return {
                'question': question,
                'answer': f"Error processing query: {str(e)}",
                'sources': [],
                'source_count': 0,
                'timestamp': datetime.now().isoformat()
            }
    
    def get_stats(self) -> Dict:
        """Get statistics about the loaded documents"""
        
        if not self.documents:
            return {"error": "No documents loaded"}
        
        doc_types = {}
        years = {}
        total_words = 0
        
        for doc in self.documents:
            # Count by type
            doc_type = doc.metadata.get('doc_type', 'unknown')
            doc_types[doc_type] = doc_types.get(doc_type, 0) + 1
            
            # Count by year
            year = doc.metadata.get('year', 'unknown')
            if year != 'unknown' and year is not None:
                years[str(year)] = years.get(str(year), 0) + 1
            
            # Sum word counts
            total_words += doc.metadata.get('word_count', 0)
        
        return {
            'total_documents': len(self.documents),
            'total_words': total_words,
            'avg_words_per_doc': total_words / len(self.documents) if self.documents else 0,
            'doc_types': doc_types,
            'years_available': sorted(years.keys()) if years else [],
            'vector_store_ready': self.vectorstore is not None,
            'qa_chain_ready': self.qa_chain is not None
        }

def main():
    """Example usage of the SEBI RAG system"""
    
    # Load environment variables from .env file
    load_dotenv()
    
    # You'll need to set your Groq API key
    groq_api_key = os.getenv('GROQ_API_KEY')
    
    if not groq_api_key:
        print("Please set your GROQ_API_KEY environment variable")
        print("You can get a free API key from: https://console.groq.com/")
        return
    
    # Initialize RAG system
    rag = SEBIRAGSystem(groq_api_key)
    
    # Load documents (start with a subset for testing)
    print("Loading documents...")
    documents = rag.load_documents(min_word_count=50)  # Filter out very small chunks
    
    # Show stats
    stats = rag.get_stats()
    print(f"\nDataset Stats:")
    print(f"  Total documents: {stats['total_documents']:,}")
    print(f"  Document types: {stats['doc_types']}")
    print(f"  Years available: {stats['years_available'][:10]}...")  # Show first 10 years
    
    # Set up embeddings and vector store
    print("\nSetting up embeddings and vector store...")
    rag.setup_embeddings()
    rag.create_vector_store()
    
    # Create QA chain
    print("\nCreating QA chain...")
    rag.create_qa_chain()
    
    print("\n" + "="*60)
    print("🚀 SEBI RAG System Ready!")
    print("="*60)
    print("You can now query the system about SEBI regulations, policies, and procedures.")
    print("Example queries:")
    print("  - What are the requirements for IPO disclosure?")
    print("  - What are SEBI's policies on mutual funds?")
    print("  - What are the regulations for foreign investment?")

if __name__ == "__main__":
    main()
