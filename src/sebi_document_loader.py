import json
import logging
from typing import List, Dict, Optional
from langchain.schema import Document
from pathlib import Path

logger = logging.getLogger(__name__)

class SEBIDocumentLoader:
    """Custom document loader for SEBI chunked data"""
    
    def __init__(self, file_path: str, min_word_count: int = 30):
        """
        Initialize the SEBI document loader
        
        Args:
            file_path: Path to the chunked JSONL file
            min_word_count: Minimum word count to include a chunk
        """
        self.file_path = file_path
        self.min_word_count = min_word_count
        self.documents = []
        
    def load(self) -> List[Document]:
        """Load and convert JSONL chunks to LangChain Documents"""
        
        logger.info(f"Loading documents from {self.file_path}")
        
        if not Path(self.file_path).exists():
            raise FileNotFoundError(f"File not found: {self.file_path}")
        
        documents = []
        total_chunks = 0
        filtered_chunks = 0
        
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    try:
                        chunk_data = json.loads(line.strip())
                        total_chunks += 1
                        
                        # Filter by minimum word count
                        if chunk_data.get('chunk_word_count', 0) < self.min_word_count:
                            filtered_chunks += 1
                            continue
                        
                        # Create LangChain Document
                        doc = self._create_document(chunk_data)
                        if doc:
                            documents.append(doc)
                            
                    except json.JSONDecodeError as e:
                        logger.error(f"JSON decode error at line {line_num}: {e}")
                        continue
                    except Exception as e:
                        logger.error(f"Error processing chunk at line {line_num}: {e}")
                        continue
        
        except Exception as e:
            logger.error(f"Error reading file {self.file_path}: {e}")
            raise
        
        logger.info(f"Loaded {len(documents)} documents from {total_chunks} total chunks")
        logger.info(f"Filtered out {filtered_chunks} chunks below {self.min_word_count} words")
        
        self.documents = documents
        return documents
    
    def _create_document(self, chunk_data: Dict) -> Optional[Document]:
        """Convert chunk data to LangChain Document"""
        
        text = chunk_data.get('chunk_text', '').strip()
        if not text:
            return None
        
        # Extract document type from path
        pdf_path = chunk_data.get('original_pdf_path', '')
        doc_type = self._extract_doc_type(pdf_path)
        
        # Extract year from path (for annual reports)
        year = self._extract_year(pdf_path)
        
        # Create metadata
        metadata = {
            'source': pdf_path,
            'chunk_id': chunk_data.get('chunk_id', ''),
            'chunk_index': chunk_data.get('chunk_index', 0),
            'word_count': chunk_data.get('chunk_word_count', 0),
            'char_count': chunk_data.get('chunk_char_count', 0),
            'doc_type': doc_type,
            'year': year,
            'original_quality_score': chunk_data.get('processing_metadata', {}).get('original_quality_score', 0),
            'file_size_bytes': chunk_data.get('original_file_size_bytes', 0)
        }
        
        return Document(
            page_content=text,
            metadata=metadata
        )
    
    def _extract_doc_type(self, pdf_path: str) -> str:
        """Extract document type from PDF path"""
        pdf_path_lower = pdf_path.lower()
        
        if 'annual_report' in pdf_path_lower:
            return 'annual_report'
        elif 'mastercircular' in pdf_path_lower:
            return 'master_circular'
        elif 'faq' in pdf_path_lower:
            return 'faq'
        else:
            return 'other'
    
    def _extract_year(self, pdf_path: str) -> Optional[str]:
        """Extract year from PDF path (mainly for annual reports)"""
        import re
        
        # Look for year patterns like 2020-21, 2021-2022, etc.
        year_patterns = [
            r'(\d{4})-(\d{4})',  # 2020-2021
            r'(\d{4})-(\d{2})',   # 2020-21
            r'(\d{4})',           # 2020
        ]
        
        for pattern in year_patterns:
            match = re.search(pattern, pdf_path)
            if match:
                return match.group(1)  # Return first year
        
        return None
    
    def get_documents_by_type(self, doc_type: str) -> List[Document]:
        """Get documents filtered by type"""
        return [doc for doc in self.documents if doc.metadata.get('doc_type') == doc_type]
    
    def get_documents_by_year(self, year: str) -> List[Document]:
        """Get documents filtered by year"""
        return [doc for doc in self.documents if doc.metadata.get('year') == year]
    
    def get_high_quality_documents(self, min_quality_score: float = 70) -> List[Document]:
        """Get high-quality documents only"""
        return [doc for doc in self.documents 
                if doc.metadata.get('original_quality_score', 0) >= min_quality_score]

# Example usage and testing
if __name__ == "__main__":
    # Test the loader
    loader = SEBIDocumentLoader("outputs/sebi_texts_chunked.jsonl", min_word_count=50)
    documents = loader.load()
    
    print(f"Loaded {len(documents)} documents")
    
    # Show some examples
    if documents:
        print(f"\nFirst document preview:")
        print(f"Content: {documents[0].page_content[:200]}...")
        print(f"Metadata: {documents[0].metadata}")
        
        # Show breakdown by type
        doc_types = {}
        for doc in documents:
            doc_type = doc.metadata.get('doc_type', 'unknown')
            doc_types[doc_type] = doc_types.get(doc_type, 0) + 1
        
        print(f"\nDocument type breakdown:")
        for doc_type, count in doc_types.items():
            print(f"  {doc_type}: {count:,} chunks")
