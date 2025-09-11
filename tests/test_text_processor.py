"""
Test suite for text processing module.
"""

import pytest
import json
import tempfile
from pathlib import Path
import sys

# Add src to path for testing
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from src.processing.text_processor import TextProcessor


class TestTextProcessor:
    """Test cases for TextProcessor class."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.processor = TextProcessor(
            min_page_length=50,  # Lower for testing
            min_arabic_ratio=0.2,
            chunk_min=100,
            chunk_max=200,
            normalize_digits=True,
            output_dir=self.temp_dir
        )
    
    def test_initialization(self):
        """Test TextProcessor initialization."""
        assert self.processor.min_page_length == 50
        assert self.processor.min_arabic_ratio == 0.2
        assert self.processor.chunk_min == 100
        assert self.processor.chunk_max == 200
        assert self.processor.normalize_digits == True
        assert Path(self.processor.output_dir).exists()
    
    def test_arabic_ratio_calculation(self):
        """Test Arabic character ratio calculation."""
        # Pure Arabic text
        arabic_text = "مرحبا بكم في الرياضيات"
        ratio = self.processor.calculate_arabic_ratio(arabic_text)
        assert ratio > 0.9
        
        # Mixed text
        mixed_text = "Hello مرحبا 123"
        ratio = self.processor.calculate_arabic_ratio(mixed_text)
        assert 0.3 < ratio < 0.7
        
        # No Arabic
        english_text = "Hello World 123"
        ratio = self.processor.calculate_arabic_ratio(english_text)
        assert ratio == 0.0
        
        # Empty text
        assert self.processor.calculate_arabic_ratio("") == 0.0
    
    def test_digit_ratio_calculation(self):
        """Test digit character ratio calculation."""
        # Mostly digits
        digit_text = "123456789 abc"
        ratio = self.processor.calculate_digit_ratio(digit_text)
        assert ratio > 0.7
        
        # Few digits
        text_with_digits = "مرحبا ١٢٣"
        ratio = self.processor.calculate_digit_ratio(text_with_digits)
        assert 0.1 < ratio < 0.5
        
        # No digits
        no_digits = "مرحبا بكم"
        ratio = self.processor.calculate_digit_ratio(no_digits)
        assert ratio == 0.0
    
    def test_mathematical_context_detection(self):
        """Test mathematical context detection."""
        # Mathematical expressions
        math_expressions = [
            "x + y = z",
            "٢ × ٣ = ٦",
            "a² + b² = c²",
            "(x + y) ÷ 2",
            "x > 5",
            "f(x) = 2x + 1"
        ]
        
        for expr in math_expressions:
            assert self.processor.has_mathematical_context(expr), f"Failed for: {expr}"
        
        # Non-mathematical text
        non_math = [
            "مرحبا بكم",
            "Hello world",
            "This is a sentence"
        ]
        
        for text in non_math:
            assert not self.processor.has_mathematical_context(text), f"False positive for: {text}"
    
    def test_text_normalization(self):
        """Test text normalization functionality."""
        # Arabic digits to Latin
        text_with_arabic_digits = "العدد ١٢٣٤٥"
        normalized = self.processor.normalize_text(text_with_arabic_digits)
        assert "12345" in normalized
        assert "١٢٣٤٥" not in normalized
        
        # Zero-width character removal
        text_with_zw = "Hello\u200Bworld"
        normalized = self.processor.normalize_text(text_with_zw)
        assert "\u200B" not in normalized
        
        # Whitespace normalization
        messy_spaces = "Hello    world\t\ttest\n\n\nend"
        normalized = self.processor.normalize_text(messy_spaces)
        assert "    " not in normalized
        assert "\t\t" not in normalized
    
    def test_line_noise_cleaning(self):
        """Test line-by-line noise removal."""
        # Valid lines should be preserved
        valid_lines = [
            "مرحبا بكم في درس الرياضيات",
            "x + y = 10",
            "الجواب هو ٢٥"
        ]
        
        for line in valid_lines:
            cleaned = self.processor.clean_line_noise(line)
            assert cleaned != "", f"Valid line was removed: {line}"
        
        # Noise lines should be removed
        noise_lines = [
            "a b c d e f",  # Scattered Latin
            "123456789012345",  # Long digit sequence
            "",  # Empty
            "   ",  # Whitespace only
        ]
        
        for line in noise_lines:
            cleaned = self.processor.clean_line_noise(line)
            if line.strip():  # Only test non-empty lines
                assert cleaned == "", f"Noise line was not removed: {line}"
    
    def test_text_chunking(self):
        """Test text chunking with sentence boundaries."""
        # Long text that should be chunked
        long_text = (
            "هذا النص الأول في الفقرة الأولى. "
            "هذا النص الثاني مع أرقام ١٢٣. "
            "النص الثالث يحتوي على معادلة: x + y = z. "
            "والنص الأخير في هذه الفقرة الطويلة جداً والتي يجب أن تقسم إلى أجزاء أصغر."
        )
        
        chunks = self.processor.create_chunks(long_text)
        
        # Should create multiple chunks
        assert len(chunks) > 1
        
        # Each chunk should be within size limits (with some tolerance)
        for chunk in chunks:
            assert len(chunk) >= self.processor.chunk_min * 0.8  # Allow some tolerance
            assert len(chunk) <= self.processor.chunk_max * 1.2
    
    def test_chunk_quality_filtering(self):
        """Test chunk quality filtering."""
        # Good quality chunks
        good_chunks = [
            "مرحبا بكم في درس الرياضيات اليوم سنتعلم الجمع والطرح",
            "x + y = z حيث x = ٥ و y = ٣",
            "الحل: ٥ + ٣ = ٨"
        ]
        
        for chunk in good_chunks:
            assert not self.processor.should_drop_chunk(chunk), f"Good chunk was dropped: {chunk}"
        
        # Poor quality chunks (high digit ratio, low Arabic)
        poor_chunks = [
            "123456789 abc 987654321",  # High digits, low Arabic
            "1 2 3 4 5 6 7 8 9 0 a b",  # Scattered digits and letters
        ]
        
        for chunk in poor_chunks:
            assert self.processor.should_drop_chunk(chunk), f"Poor chunk was not dropped: {chunk}"
    
    def test_process_jsonl_file(self):
        """Test complete JSONL file processing."""
        # Create test input file
        test_data = [
            {
                "text": "مرحبا بكم في درس الرياضيات. سنتعلم اليوم عن الأرقام والعمليات الحسابية.",
                "metadata": {"page": 1, "subject": "Math"}
            },
            {
                "text": "العدد الأول هو ٥ والعدد الثاني هو ٣. مجموعهما يساوي ٨.",
                "metadata": {"page": 2, "subject": "Math"}
            }
        ]
        
        input_file = Path(self.temp_dir) / "test_input.jsonl"
        with open(input_file, 'w', encoding='utf-8') as f:
            for item in test_data:
                f.write(json.dumps(item, ensure_ascii=False) + '\n')
        
        # Process file
        output_file = self.processor.process_jsonl_file(str(input_file))
        
        # Verify output exists
        assert Path(output_file).exists()
        
        # Verify processed content
        with open(output_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            assert len(lines) > 0
            
            # Check first processed chunk
            first_chunk = json.loads(lines[0])
            assert "text" in first_chunk
            assert "metadata" in first_chunk
            assert "chunk_id" in first_chunk["metadata"]
    
    def test_file_not_found_error(self):
        """Test error handling for non-existent files."""
        with pytest.raises(FileNotFoundError):
            self.processor.process_jsonl_file("nonexistent.jsonl")


class TestTextProcessorEdgeCases:
    """Test edge cases and boundary conditions."""
    
    def setup_method(self):
        """Setup for edge case tests."""
        self.temp_dir = tempfile.mkdtemp()
        self.processor = TextProcessor(output_dir=self.temp_dir)
    
    def test_empty_input_handling(self):
        """Test handling of empty or invalid input."""
        # Empty text
        chunks = self.processor.create_chunks("")
        assert len(chunks) == 0
        
        # Whitespace only
        chunks = self.processor.create_chunks("   \n\t  ")
        assert len(chunks) == 0
    
    def test_single_chunk_text(self):
        """Test text that should remain as a single chunk."""
        short_text = "مرحبا بكم في الرياضيات"
        chunks = self.processor.create_chunks(short_text)
        assert len(chunks) == 1
        assert chunks[0] == short_text
    
    def test_mathematical_content_preservation(self):
        """Test that mathematical content is preserved during processing."""
        math_content = "x² + y² = z² حيث x = ٣ و y = ٤ و z = ٥"
        
        # Should not be dropped as noise
        assert not self.processor.should_drop_chunk(math_content)
        
        # Mathematical symbols should be preserved
        cleaned = self.processor.clean_line_noise(math_content)
        assert "²" in cleaned
        assert "=" in cleaned
        assert "+" in cleaned


if __name__ == "__main__":
    pytest.main([__file__])