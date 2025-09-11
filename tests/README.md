# Test Configuration and Documentation

## Running Tests

To run the complete test suite:
```bash
pytest
```

To run tests for a specific module:
```bash
pytest tests/test_pdf_extractor.py
pytest tests/test_text_processor.py
pytest tests/test_vector_indexer.py
pytest tests/test_query_engine.py
pytest tests/test_main_pipeline.py
```

To run tests with coverage:
```bash
pytest --cov=src
```

## Test Structure

### Unit Tests
- `test_pdf_extractor.py`: Tests for PDF text extraction functionality
- `test_text_processor.py`: Tests for text cleaning and chunking
- `test_vector_indexer.py`: Tests for vector embedding and indexing
- `test_query_engine.py`: Tests for query processing and retrieval
- `test_main_pipeline.py`: Tests for pipeline orchestration

### Test Categories
- **Unit tests**: Test individual functions and methods
- **Integration tests**: Test component interactions
- **Mock tests**: Test with external dependencies mocked

## Dependencies for Testing

Make sure you have pytest installed:
```bash
pip install pytest pytest-cov
```

## Notes

- Tests use temporary directories to avoid affecting your workspace
- External dependencies (like embedding models) are mocked to speed up tests
- Some tests require the actual libraries to be installed but will skip gracefully if not available