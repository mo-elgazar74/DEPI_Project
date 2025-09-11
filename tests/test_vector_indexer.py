"""
Test suite for vector indexing module.
"""

import pytest
import json
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import sys

# Add src to path for testing
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from src.indexing.vector_indexer import VectorIndexer


class TestVectorIndexer:
    """Test cases for VectorIndexer class."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        
        # Mock the embedding model to avoid downloading during tests
        with patch('src.indexing.vector_indexer.HuggingFaceEmbedding'):
            self.indexer = VectorIndexer(
                embedding_model="test-model",
                normalize_embeddings=True,
                index_type="cosine",
                output_dir=self.temp_dir,
                index_name="test_index"
            )
    
    def test_initialization(self):
        """Test VectorIndexer initialization."""
        assert self.indexer.embedding_model == "test-model"
        assert self.indexer.normalize_embeddings == True
        assert self.indexer.index_type == "cosine"
        assert self.indexer.index_name == "test_index"
        assert Path(self.indexer.output_dir).exists()
    
    @patch('src.indexing.vector_indexer.faiss.IndexFlatIP')
    def test_create_faiss_index_cosine(self, mock_index):
        """Test FAISS index creation for cosine similarity."""
        # Mock embedding dimension
        self.indexer.embed_model = Mock()
        self.indexer.embed_model.get_query_embedding.return_value = [0.1] * 384  # 384D
        
        # Create index
        index = self.indexer._create_faiss_index()
        
        # Verify correct index type was created
        mock_index.assert_called_once_with(384)
    
    @patch('src.indexing.vector_indexer.faiss.IndexFlatL2')
    def test_create_faiss_index_euclidean(self, mock_index):
        """Test FAISS index creation for Euclidean distance."""
        self.indexer.index_type = "euclidean"
        self.indexer.embed_model = Mock()
        self.indexer.embed_model.get_query_embedding.return_value = [0.1] * 384
        
        index = self.indexer._create_faiss_index()
        mock_index.assert_called_once_with(384)
    
    def test_load_text_chunks(self):
        """Test loading text chunks from JSONL file."""
        # Create test JSONL file
        test_data = [
            {
                "text": "مرحبا بكم في الرياضيات",
                "metadata": {"page": 1, "subject": "Math"}
            },
            {
                "text": "x + y = z",
                "metadata": {"page": 2, "subject": "Math"}
            },
            # Invalid JSON line (should be skipped)
            "invalid json",
            {
                "text": "",  # Empty text (should be skipped)
                "metadata": {"page": 3}
            }
        ]
        
        input_file = Path(self.temp_dir) / "test_chunks.jsonl"
        with open(input_file, 'w', encoding='utf-8') as f:
            for item in test_data:
                if isinstance(item, dict):
                    f.write(json.dumps(item, ensure_ascii=False) + '\n')
                else:
                    f.write(item + '\n')
        
        # Load documents
        documents = self.indexer.load_text_chunks(str(input_file))
        
        # Should load only valid documents with non-empty text
        assert len(documents) == 2
        assert documents[0].text == "مرحبا بكم في الرياضيات"
        assert documents[1].text == "x + y = z"
        assert documents[0].metadata["page"] == 1
        assert documents[1].metadata["subject"] == "Math"
    
    def test_load_text_chunks_file_not_found(self):
        """Test error handling for non-existent JSONL file."""
        with pytest.raises(FileNotFoundError):
            self.indexer.load_text_chunks("nonexistent.jsonl")
    
    @patch('src.indexing.vector_indexer.VectorStoreIndex.from_documents')
    @patch('src.indexing.vector_indexer.FaissVectorStore')
    @patch('src.indexing.vector_indexer.StorageContext.from_defaults')
    def test_create_index(self, mock_storage, mock_vector_store, mock_index_create):
        """Test vector index creation from documents."""
        # Mock dependencies
        mock_documents = [Mock(), Mock()]
        mock_index = Mock()
        mock_index_create.return_value = mock_index
        
        # Mock FAISS index creation
        self.indexer.embed_model = Mock()
        self.indexer.embed_model.get_query_embedding.return_value = [0.1] * 384
        
        # Create index
        result = self.indexer.create_index(mock_documents)
        
        # Verify index was created
        mock_index_create.assert_called_once()
        assert result == mock_index
    
    def test_create_index_empty_documents(self):
        """Test error handling for empty document list."""
        with pytest.raises(ValueError, match="No documents provided"):
            self.indexer.create_index([])
    
    @patch('src.indexing.vector_indexer.json.dump')
    def test_save_index(self, mock_json_dump):
        """Test index saving functionality."""
        # Mock index with storage context
        mock_index = Mock()
        mock_index.storage_context.persist = Mock()
        mock_index.docstore.docs = {"doc1": Mock(), "doc2": Mock()}
        
        # Save index
        result = self.indexer.save_index(mock_index)
        
        # Verify persistence was called
        mock_index.storage_context.persist.assert_called_once()
        
        # Verify metadata was saved
        mock_json_dump.assert_called_once()
        
        # Verify return path
        expected_path = str(self.indexer.index_dir)
        assert result == expected_path
    
    def test_get_index_stats_existing(self):
        """Test getting statistics for existing index."""
        # Create mock metadata file
        metadata = {
            "embedding_model": "test-model",
            "total_documents": 100,
            "created_at": "2023-01-01"
        }
        
        metadata_file = Path(self.temp_dir) / "test_index" / "index_metadata.json"
        metadata_file.parent.mkdir(exist_ok=True)
        
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f)
        
        # Get stats
        stats = self.indexer.get_index_stats(str(metadata_file.parent))
        
        assert stats["embedding_model"] == "test-model"
        assert stats["total_documents"] == 100
        assert "index_files" in stats
        assert "index_size_mb" in stats
    
    def test_get_index_stats_missing(self):
        """Test getting statistics for non-existent index."""
        stats = self.indexer.get_index_stats("nonexistent_path")
        assert "error" in stats


class TestVectorIndexerIntegration:
    """Integration tests for VectorIndexer."""
    
    def setup_method(self):
        """Setup for integration tests."""
        self.temp_dir = tempfile.mkdtemp()
    
    @patch('src.indexing.vector_indexer.HuggingFaceEmbedding')
    @patch('src.indexing.vector_indexer.VectorStoreIndex.from_documents')
    def test_build_index_from_file_complete(self, mock_index_create, mock_embedding):
        """Test complete index building pipeline."""
        # Setup mocks
        mock_embed_model = Mock()
        mock_embed_model.get_query_embedding.return_value = [0.1] * 384
        mock_embedding.return_value = mock_embed_model
        
        mock_index = Mock()
        mock_index.storage_context.persist = Mock()
        mock_index.docstore.docs = {"doc1": Mock()}
        mock_index_create.return_value = mock_index
        
        # Create test input file
        test_data = [
            {
                "text": "مرحبا بكم في الرياضيات",
                "metadata": {"page": 1}
            },
            {
                "text": "العدد ٥ + العدد ٣ = ٨",
                "metadata": {"page": 2}
            }
        ]
        
        input_file = Path(self.temp_dir) / "test_input.jsonl"
        with open(input_file, 'w', encoding='utf-8') as f:
            for item in test_data:
                f.write(json.dumps(item, ensure_ascii=False) + '\n')
        
        # Create indexer
        indexer = VectorIndexer(
            embedding_model="test-model",
            output_dir=self.temp_dir,
            index_name="test_index"
        )
        
        # Build index
        result_path = indexer.build_index_from_file(str(input_file))
        
        # Verify result
        assert Path(result_path).exists()
        mock_index.storage_context.persist.assert_called_once()
    
    def test_different_index_types(self):
        """Test initialization with different index types."""
        index_types = ["cosine", "euclidean", "dot_product", "unknown"]
        
        for index_type in index_types:
            with patch('src.indexing.vector_indexer.HuggingFaceEmbedding'):
                indexer = VectorIndexer(
                    embedding_model="test-model",
                    index_type=index_type,
                    output_dir=self.temp_dir
                )
                assert indexer.index_type == index_type


if __name__ == "__main__":
    pytest.main([__file__])