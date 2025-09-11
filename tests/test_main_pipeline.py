"""
Test suite for main pipeline orchestrator.
"""

import pytest
import json
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import sys

# Add src to path for testing
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import RAGPipeline


class TestRAGPipeline:
    """Test cases for RAGPipeline class."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        
        # Create test config
        self.test_config = {
            "output_dir": self.temp_dir,
            "pdf_extraction": {
                "lang": "ara",
                "dpi": 150,
                "apply_preprocessing": False
            },
            "text_processing": {
                "min_page_length": 50,
                "min_arabic_ratio": 0.2,
                "chunk_min": 100,
                "chunk_max": 200,
                "normalize_digits": True
            },
            "indexing": {
                "embedding_model": "test-model",
                "normalize_embeddings": True,
                "index_type": "cosine",
                "index_name": "test_index"
            },
            "querying": {
                "similarity_top_k": 3,
                "response_mode": "compact"
            }
        }
    
    def test_initialization_with_default_config(self):
        """Test pipeline initialization with default configuration."""
        pipeline = RAGPipeline()
        
        assert "output_dir" in pipeline.config
        assert "pdf_extraction" in pipeline.config
        assert "text_processing" in pipeline.config
        assert "indexing" in pipeline.config
        assert "querying" in pipeline.config
    
    def test_initialization_with_custom_config(self):
        """Test pipeline initialization with custom configuration."""
        # Create config file
        config_file = Path(self.temp_dir) / "test_config.json"
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(self.test_config, f)
        
        pipeline = RAGPipeline(str(config_file))
        
        assert pipeline.config["output_dir"] == self.temp_dir
        assert pipeline.config["pdf_extraction"]["dpi"] == 150
        assert pipeline.config["indexing"]["embedding_model"] == "test-model"
    
    def test_initialization_with_invalid_config(self):
        """Test pipeline initialization with invalid config file."""
        # Non-existent config file should fall back to defaults
        pipeline = RAGPipeline("nonexistent_config.json")
        
        # Should use defaults
        assert "output_dir" in pipeline.config
        assert pipeline.config["pdf_extraction"]["lang"] == "ara"
    
    @patch('main.PDFExtractor')
    def test_stage_1_extraction(self, mock_extractor_class):
        """Test PDF extraction stage."""
        # Setup mock
        mock_extractor = Mock()
        mock_extractor.extract_pdf.return_value = "test_output.jsonl"
        mock_extractor_class.return_value = mock_extractor
        
        pipeline = RAGPipeline()
        result = pipeline.run_stage_1_extraction("test.pdf", "Math", "5")
        
        assert result == "test_output.jsonl"
        mock_extractor.extract_pdf.assert_called_once_with("test.pdf", "Math", "5")
    
    @patch('main.TextProcessor')
    def test_stage_2_processing(self, mock_processor_class):
        """Test text processing stage."""
        # Setup mock
        mock_processor = Mock()
        mock_processor.process_jsonl_file.return_value = "processed_output.jsonl"
        mock_processor_class.return_value = mock_processor
        
        pipeline = RAGPipeline()
        result = pipeline.run_stage_2_processing("input.jsonl")
        
        assert result == "processed_output.jsonl"
        mock_processor.process_jsonl_file.assert_called_once_with("input.jsonl", "_clean_chunked")
    
    @patch('main.VectorIndexer')
    def test_stage_3_indexing(self, mock_indexer_class):
        """Test vector indexing stage."""
        # Setup mock
        mock_indexer = Mock()
        mock_indexer.build_index_from_file.return_value = "index_path"
        mock_indexer_class.return_value = mock_indexer
        
        pipeline = RAGPipeline()
        result = pipeline.run_stage_3_indexing("processed.jsonl")
        
        assert result == "index_path"
        mock_indexer.build_index_from_file.assert_called_once_with("processed.jsonl")
    
    @patch('main.QueryEngine')
    def test_stage_4_query_setup(self, mock_engine_class):
        """Test query engine setup stage."""
        # Setup mock
        mock_engine = Mock()
        mock_engine_class.return_value = mock_engine
        
        pipeline = RAGPipeline()
        result = pipeline.run_stage_4_query_setup("index_path")
        
        assert result == mock_engine
        mock_engine_class.assert_called_once()
    
    @patch('main.PDFExtractor')
    @patch('main.TextProcessor')
    @patch('main.VectorIndexer')
    @patch('main.QueryEngine')
    def test_full_pipeline_success(self, mock_engine, mock_indexer, mock_processor, mock_extractor):
        """Test successful execution of full pipeline."""
        # Setup mocks
        mock_extractor_instance = Mock()
        mock_extractor_instance.extract_pdf.return_value = "extracted.jsonl"
        mock_extractor.return_value = mock_extractor_instance
        
        mock_processor_instance = Mock()
        mock_processor_instance.process_jsonl_file.return_value = "processed.jsonl"
        mock_processor.return_value = mock_processor_instance
        
        mock_indexer_instance = Mock()
        mock_indexer_instance.build_index_from_file.return_value = "index_path"
        mock_indexer.return_value = mock_indexer_instance
        
        mock_engine_instance = Mock()
        mock_engine.return_value = mock_engine_instance
        
        # Run pipeline
        pipeline = RAGPipeline()
        result = pipeline.run_full_pipeline("test.pdf", "Math", "5", start_interactive=False)
        
        # Verify success
        assert result["success"] == True
        assert len(result["stages_completed"]) == 4
        assert "extraction" in result["stages_completed"]
        assert "processing" in result["stages_completed"]
        assert "indexing" in result["stages_completed"]
        assert "query_setup" in result["stages_completed"]
    
    @patch('main.PDFExtractor')
    def test_full_pipeline_failure(self, mock_extractor):
        """Test pipeline failure handling."""
        # Setup mock to raise exception
        mock_extractor_instance = Mock()
        mock_extractor_instance.extract_pdf.side_effect = Exception("Extraction failed")
        mock_extractor.return_value = mock_extractor_instance
        
        # Run pipeline
        pipeline = RAGPipeline()
        result = pipeline.run_full_pipeline("test.pdf", start_interactive=False)
        
        # Verify failure handling
        assert result["success"] == False
        assert len(result["errors"]) > 0
        assert "Extraction failed" in result["errors"][0]
    
    def test_single_stage_execution(self):
        """Test execution of individual pipeline stages."""
        pipeline = RAGPipeline()
        
        # Test invalid stage
        with pytest.raises(ValueError, match="Unknown stage"):
            pipeline.run_single_stage("invalid_stage", "input.txt")
    
    def test_save_pipeline_config(self):
        """Test saving pipeline configuration."""
        pipeline = RAGPipeline()
        config_path = Path(self.temp_dir) / "saved_config.json"
        
        pipeline.save_pipeline_config(str(config_path))
        
        # Verify config was saved
        assert config_path.exists()
        
        with open(config_path, 'r', encoding='utf-8') as f:
            saved_config = json.load(f)
        
        assert "output_dir" in saved_config
        assert "pdf_extraction" in saved_config


class TestRAGPipelineIntegration:
    """Integration tests for RAGPipeline."""
    
    def setup_method(self):
        """Setup for integration tests."""
        self.temp_dir = tempfile.mkdtemp()
    
    def test_config_loading_precedence(self):
        """Test configuration loading and merging."""
        # Create partial config (should merge with defaults)
        partial_config = {
            "pdf_extraction": {
                "dpi": 200
            },
            "custom_setting": "test_value"
        }
        
        config_file = Path(self.temp_dir) / "partial_config.json"
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(partial_config, f)
        
        pipeline = RAGPipeline(str(config_file))
        
        # Should have custom DPI but default language
        assert pipeline.config["pdf_extraction"]["dpi"] == 200
        assert pipeline.config["pdf_extraction"]["lang"] == "ara"  # Default
        assert pipeline.config["custom_setting"] == "test_value"
    
    def test_output_directory_creation(self):
        """Test automatic output directory creation."""
        custom_output = Path(self.temp_dir) / "custom_output"
        
        config = {"output_dir": str(custom_output)}
        config_file = Path(self.temp_dir) / "config.json"
        
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f)
        
        pipeline = RAGPipeline(str(config_file))
        
        # Output directory should be created
        assert custom_output.exists()
        assert pipeline.output_dir == custom_output


if __name__ == "__main__":
    pytest.main([__file__])