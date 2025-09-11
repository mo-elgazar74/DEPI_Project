"""
Test suite for query engine module.
"""

import pytest
import json
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import sys

# Add src to path for testing
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from src.querying.query_engine import QueryEngine


class TestQueryEngine:
    """Test cases for QueryEngine class."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.index_dir = Path(self.temp_dir) / "test_index"
        self.index_dir.mkdir()
        
        # Create mock metadata file
        metadata = {
            "embedding_model": "test-model",
            "total_documents": 10
        }
        with open(self.index_dir / "index_metadata.json", 'w') as f:
            json.dump(metadata, f)
    
    @patch('src.querying.query_engine.load_index_from_storage')
    @patch('src.querying.query_engine.FaissVectorStore.from_persist_dir')
    @patch('src.querying.query_engine.HuggingFaceEmbedding')
    def test_initialization(self, mock_embedding, mock_vector_store, mock_load_index):
        """Test QueryEngine initialization."""
        # Setup mocks
        mock_index = Mock()
        mock_query_engine = Mock()
        mock_index.as_query_engine.return_value = mock_query_engine
        mock_load_index.return_value = mock_index
        
        # Initialize query engine
        engine = QueryEngine(
            index_dir=str(self.index_dir),
            embedding_model="test-model",
            similarity_top_k=3
        )
        
        assert engine.similarity_top_k == 3
        assert engine.embedding_model == "test-model"
        mock_load_index.assert_called_once()
    
    def test_query_normalization(self):
        """Test query text normalization."""
        with patch('src.querying.query_engine.load_index_from_storage'), \
             patch('src.querying.query_engine.FaissVectorStore.from_persist_dir'), \
             patch('src.querying.query_engine.HuggingFaceEmbedding'):
            
            engine = QueryEngine(index_dir=str(self.index_dir))
            
            # Test Arabic digit conversion
            query_with_arabic_digits = "العدد ١٢٣٤٥"
            normalized = engine.normalize_query(query_with_arabic_digits)
            assert "12345" in normalized
            assert "١٢٣٤٥" not in normalized
            
            # Test whitespace normalization
            messy_query = "مرحبا    بكم\t\tفي   الرياضيات"
            normalized = engine.normalize_query(messy_query)
            assert "    " not in normalized
            assert "\t\t" not in normalized
    
    def test_mathematical_expression_extraction(self):
        """Test extraction of mathematical expressions."""
        with patch('src.querying.query_engine.load_index_from_storage'), \
             patch('src.querying.query_engine.FaissVectorStore.from_persist_dir'), \
             patch('src.querying.query_engine.HuggingFaceEmbedding'):
            
            engine = QueryEngine(index_dir=str(self.index_dir))
            
            # Test numerical expressions
            query1 = "احسب ٥ + ٣"
            expressions = engine.extract_mathematical_expressions(query1)
            assert len(expressions) > 0
            
            # Test equations
            query2 = "x + y = 10"
            expressions = engine.extract_mathematical_expressions(query2)
            assert any("=" in expr for expr in expressions)
            
            # Test no mathematical content
            query3 = "مرحبا بكم"
            expressions = engine.extract_mathematical_expressions(query3)
            assert len(expressions) == 0
    
    def test_mathematical_evaluation(self):
        """Test mathematical expression evaluation with SymPy."""
        with patch('src.querying.query_engine.load_index_from_storage'), \
             patch('src.querying.query_engine.FaissVectorStore.from_persist_dir'), \
             patch('src.querying.query_engine.HuggingFaceEmbedding'):
            
            engine = QueryEngine(index_dir=str(self.index_dir))
            
            # Test simple arithmetic
            query = "5 + 3"
            result = engine.evaluate_mathematical_expressions(query)
            
            assert len(result['expressions']) > 0
            assert len(result['evaluations']) > 0
            
            # Test invalid expression handling
            query_invalid = "invalid math expression @#$"
            result = engine.evaluate_mathematical_expressions(query_invalid)
            # Should handle gracefully without crashing
            assert 'expressions' in result
            assert 'evaluations' in result
            assert 'errors' in result
    
    def test_query_enhancement_with_math_context(self):
        """Test query enhancement with mathematical context."""
        with patch('src.querying.query_engine.load_index_from_storage'), \
             patch('src.querying.query_engine.FaissVectorStore.from_persist_dir'), \
             patch('src.querying.query_engine.HuggingFaceEmbedding'):
            
            engine = QueryEngine(index_dir=str(self.index_dir))
            
            # Test Arabic mathematical terms
            query = "كيف أحسب الجمع"
            enhanced = engine.enhance_query_with_math_context(query)
            # Should add English mathematical terms
            assert len(enhanced) > len(query)
            
            # Test query with mathematical expressions
            query_with_math = "x + y = 10"
            enhanced = engine.enhance_query_with_math_context(query_with_math)
            # Should add mathematical context terms
            assert "mathematics" in enhanced or "calculation" in enhanced
    
    @patch('src.querying.query_engine.load_index_from_storage')
    @patch('src.querying.query_engine.FaissVectorStore.from_persist_dir')
    @patch('src.querying.query_engine.HuggingFaceEmbedding')
    def test_query_with_context_success(self, mock_embedding, mock_vector_store, mock_load_index):
        """Test successful query execution with context."""
        # Setup mocks
        mock_response = Mock()
        mock_response.__str__ = Mock(return_value="Test response")
        mock_response.source_nodes = []
        
        mock_query_engine = Mock()
        mock_query_engine.query.return_value = mock_response
        
        mock_index = Mock()
        mock_index.as_query_engine.return_value = mock_query_engine
        mock_load_index.return_value = mock_index
        
        # Test query
        engine = QueryEngine(index_dir=str(self.index_dir))
        result = engine.query_with_context("ما هو ٥ + ٣؟")
        
        assert result['success'] == True
        assert 'response' in result
        assert 'original_query' in result
        assert 'normalized_query' in result
        assert 'mathematical_evaluation' in result
    
    @patch('src.querying.query_engine.load_index_from_storage')
    @patch('src.querying.query_engine.FaissVectorStore.from_persist_dir')
    @patch('src.querying.query_engine.HuggingFaceEmbedding')
    def test_query_with_context_error(self, mock_embedding, mock_vector_store, mock_load_index):
        """Test query execution error handling."""
        # Setup mocks to raise exception
        mock_query_engine = Mock()
        mock_query_engine.query.side_effect = Exception("Query failed")
        
        mock_index = Mock()
        mock_index.as_query_engine.return_value = mock_query_engine
        mock_load_index.return_value = mock_index
        
        # Test query
        engine = QueryEngine(index_dir=str(self.index_dir))
        result = engine.query_with_context("test query")
        
        assert result['success'] == False
        assert 'error' in result
        assert "Query failed" in result['error']
    
    def test_batch_query(self):
        """Test batch query processing."""
        with patch('src.querying.query_engine.load_index_from_storage'), \
             patch('src.querying.query_engine.FaissVectorStore.from_persist_dir'), \
             patch('src.querying.query_engine.HuggingFaceEmbedding'):
            
            engine = QueryEngine(index_dir=str(self.index_dir))
            
            # Mock query_with_context to avoid actual querying
            with patch.object(engine, 'query_with_context') as mock_query:
                mock_query.return_value = {"success": True, "response": "Test"}
                
                queries = ["سؤال أول", "سؤال ثاني"]
                results = engine.batch_query(queries)
                
                assert len(results) == 2
                assert mock_query.call_count == 2
    
    def test_index_directory_not_found(self):
        """Test error handling for non-existent index directory."""
        with pytest.raises(FileNotFoundError):
            QueryEngine(index_dir="nonexistent_directory")


class TestQueryEngineEdgeCases:
    """Test edge cases and boundary conditions."""
    
    def setup_method(self):
        """Setup for edge case tests."""
        self.temp_dir = tempfile.mkdtemp()
        self.index_dir = Path(self.temp_dir) / "test_index"
        self.index_dir.mkdir()
    
    def test_empty_query_handling(self):
        """Test handling of empty queries."""
        with patch('src.querying.query_engine.load_index_from_storage'), \
             patch('src.querying.query_engine.FaissVectorStore.from_persist_dir'), \
             patch('src.querying.query_engine.HuggingFaceEmbedding'):
            
            engine = QueryEngine(index_dir=str(self.index_dir))
            
            # Test empty query
            normalized = engine.normalize_query("")
            assert normalized == ""
            
            # Test whitespace only query
            normalized = engine.normalize_query("   \t\n  ")
            assert normalized == ""
    
    def test_query_with_special_characters(self):
        """Test queries with special characters and Unicode."""
        with patch('src.querying.query_engine.load_index_from_storage'), \
             patch('src.querying.query_engine.FaissVectorStore.from_persist_dir'), \
             patch('src.querying.query_engine.HuggingFaceEmbedding'):
            
            engine = QueryEngine(index_dir=str(self.index_dir))
            
            # Test query with mathematical symbols
            query = "x² + y² = z²"
            normalized = engine.normalize_query(query)
            assert "²" in normalized  # Should preserve mathematical symbols
            
            # Test query with mixed scripts
            query = "Hello مرحبا 123 ١٢٣"
            normalized = engine.normalize_query(query)
            assert "Hello" in normalized
            assert "مرحبا" in normalized
            assert "123" in normalized


if __name__ == "__main__":
    pytest.main([__file__])