import fitz  
import re
import os
import pytesseract
from PIL import Image
import io

def detect_math_symbols(text):
    """Detect mathematical symbols and equations in text"""
    math_patterns = [
        r'[+\-×÷*/=<>≤≥≠±√∑∏∫]',  # Basic math symbols
        r'\d+[/]\d+',  # Fractions like 1/2
        r'\d+\^\d+',  # Powers like 2^3
        r'[xy]\s*[=]',  # Variables with equals
        r'\([^)]*[+\-*/][^)]*\)',  # Expressions in parentheses
        r'\b(sin|cos|tan|log|ln)\b',  # Mathematical functions
        r'\d+\s*[°]',  # Degrees
        r'[αβγδθπλμσφψω]',  # Greek letters
    ]
    
    math_content = []
    for pattern in math_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            math_content.extend(matches)
    
    return math_content

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF using PyMuPDF with OCR for scanned documents"""
    print(f"Processing: {pdf_path}")
    
    # Check if this is a math book
    filename = os.path.basename(pdf_path).lower()
    is_math_book = 'math' in filename
    
    doc = fitz.open(pdf_path)
    text = ""
    total_math_elements = []
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        
        # First try to extract regular text
        page_text = page.get_text()
        
        # If no text extracted, use OCR (for scanned PDFs)
        if not page_text.strip():
            try:
                # Convert page to image and apply OCR
                mat = fitz.Matrix(200/72, 200/72)  # 200 DPI
                pix = page.get_pixmap(matrix=mat)
                img_data = pix.tobytes("png")
                img = Image.open(io.BytesIO(img_data))
                
                # OCR with Arabic language
                page_text = pytesseract.image_to_string(img, lang='ara')
            except Exception as e:
                print(f"OCR failed for page {page_num + 1}: {e}")
                page_text = ""
        
        if page_text.strip():
            text += f"\n--- Page {page_num + 1} ---\n"
            
            # For math books, detect and mark mathematical content
            if is_math_book:
                math_elements = detect_math_symbols(page_text)
                if math_elements:
                    text += f"[MATH_DETECTED: {len(math_elements)} elements]\n"
                    total_math_elements.extend(math_elements)
            
            # Add the actual text
            text += page_text
            
            # For math books, try to extract drawings/diagrams as well
            if is_math_book:
                # Check for drawings (geometric shapes, diagrams)
                drawings = page.get_drawings()
                if drawings:
                    text += f"\n[DIAGRAM_DETECTED: {len(drawings)} geometric elements]\n"
    
    doc.close()
    
    # Add summary for math books
    if is_math_book and total_math_elements:
        text = f"[MATH_BOOK_SUMMARY: {len(total_math_elements)} total math elements detected]\n" + text
        print(f"  📐 Math elements detected: {len(total_math_elements)}")
    
    return text