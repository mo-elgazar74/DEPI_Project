"""
Test suite for PDF extraction module.
"""

import pytest
import json
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import sys

# Add src to path for testing
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from src.data_ingestion.pdf_extractor import PDFExtractor


class TestPDFExtractor:
    """Test cases for PDFExtractor class."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.extractor = PDFExtractor(
            lang="ara",
            dpi=150,  # Lower DPI for faster tests
            apply_preprocessing=False,
            output_dir=self.temp_dir
        )
    
    def test_initialization(self):
        """Test PDFExtractor initialization."""
        assert self.extractor.lang == "ara"
        assert self.extractor.dpi == 150
        assert self.extractor.apply_preprocessing == False
        assert Path(self.extractor.output_dir).exists()
    
    def test_clean_extracted_text(self):
        """Test text cleaning functionality."""
        # Test basic cleaning
        dirty_text = "Hello\u200B\u200Cworld   with\t\textra\n\n\nspaces"
        clean_text = self.extractor.clean_extracted_text(dirty_text)
        assert "\u200B" not in clean_text
        assert "  " not in clean_text
        
        # Test Arabic text preservation
        arabic_text = "مرحبا بك في الرياضيات ١٢٣ + ٤٥٦ = ٥٧٨"
        clean_arabic = self.extractor.clean_extracted_text(arabic_text)
        assert "مرحبا" in clean_arabic
        assert "+" in clean_arabic
        
        # Test mathematical symbols preservation
        math_text = "x² + y² = z² (a + b) × [c ÷ d] = 100%"
        clean_math = self.extractor.clean_extracted_text(math_text)
        assert "²" in clean_math
        assert "×" in clean_math
        assert "÷" in clean_math
        assert "%" in clean_math
    
    @patch('src.data_ingestion.pdf_extractor.convert_from_path')
    @patch('src.data_ingestion.pdf_extractor.pytesseract.image_to_string')
    def test_extract_page_success(self, mock_ocr, mock_convert):
        """Test successful page extraction."""
        # Mock dependencies
        mock_image = Mock()
        mock_convert.return_value = [mock_image]
        mock_ocr.return_value = "مرحبا بالرياضيات"
        
        # Test extraction
        result = self.extractor.extract_page("dummy.pdf", 0, {"subject": "Math"})
        
        assert result["text"] == "مرحبا بالرياضيات"
        assert result["metadata"]["page"] == 1
        assert result["metadata"]["subject"] == "Math"
        assert result["metadata"]["extraction_method"] == "ocr"
    
    @patch('src.data_ingestion.pdf_extractor.convert_from_path')
    def test_extract_page_failure(self, mock_convert):
        """Test page extraction error handling."""
        # Mock conversion failure
        mock_convert.side_effect = Exception("Conversion failed")
        
        result = self.extractor.extract_page("dummy.pdf", 0)
        
        assert result["text"] == ""
        assert "error" in result["metadata"]
        assert "Conversion failed" in result["metadata"]["error"]
    
    def test_preprocess_image_without_opencv(self):
        """Test image preprocessing when OpenCV is not available."""
        mock_image = Mock()
        result = self.extractor.preprocess_image(mock_image)
        
        # Should return original image when preprocessing is disabled
        assert result is mock_image
    
    @patch('src.data_ingestion.pdf_extractor.PdfReader')
    @patch('src.data_ingestion.pdf_extractor.convert_from_path')
    @patch('src.data_ingestion.pdf_extractor.pytesseract.image_to_string')
    def test_extract_pdf_complete(self, mock_ocr, mock_convert, mock_reader):
        """Test complete PDF extraction process."""
        # Setup mocks
        mock_reader.return_value.pages = [Mock(), Mock()]  # 2 pages
        mock_convert.return_value = [Mock()]
        mock_ocr.side_effect = ["صفحة واحد", "صفحة اثنان"]
        
        # Create temporary PDF file
        temp_pdf = Path(self.temp_dir) / "test.pdf"
        temp_pdf.write_bytes(b"dummy pdf content")
        
        # Extract PDF
        output_file = self.extractor.extract_pdf(str(temp_pdf), "Math", "5")
        
        # Verify output file exists
        assert Path(output_file).exists()
        
        # Verify content
        with open(output_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            assert len(lines) == 2
            
            page1 = json.loads(lines[0])
            assert page1["text"] == "صفحة واحد"
            assert page1["metadata"]["subject"] == "Math"
            assert page1["metadata"]["grade"] == "5"
    
    def test_extract_pdf_file_not_found(self):
        """Test PDF extraction with non-existent file."""
        with pytest.raises(FileNotFoundError):
            self.extractor.extract_pdf("nonexistent.pdf")


class TestPDFExtractorIntegration:
    """Integration tests for PDF extraction."""
    
    def setup_method(self):
        """Setup for integration tests."""
        self.temp_dir = tempfile.mkdtemp()
    
    def test_initialization_with_defaults(self):
        """Test extractor initialization with default parameters."""
        extractor = PDFExtractor(output_dir=self.temp_dir)
        
        assert extractor.lang == "ara"
        assert extractor.dpi == 300
        assert extractor.apply_preprocessing == False
    
    def test_text_cleaning_edge_cases(self):
        """Test text cleaning with various edge cases."""
        extractor = PDFExtractor(output_dir=self.temp_dir)
        
        # Empty text
        assert extractor.clean_extracted_text("") == ""
        
        # Only whitespace
        assert extractor.clean_extracted_text("   \n\t  ") == ""
        
        # Mixed scripts
        mixed_text = "Hello مرحبا 123 ١٢٣"
        cleaned = extractor.clean_extracted_text(mixed_text)
        assert "Hello" in cleaned
        assert "مرحبا" in cleaned
        assert "123" in cleaned


if __name__ == "__main__":
    pytest.main([__file__])