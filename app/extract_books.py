import os
import json
import time
from pathlib import Path

import fitz
import re
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


def extract_text_from_pdf(pdf_path: Path):
    """
    Extract text from PDF using PyMuPDF with OCR fallback.
    Returns (pages_text_list, total_pages).
    """
    print(f"Processing: {pdf_path}")
    filename = pdf_path.name.lower()
    is_math_book = 'math' in filename

    doc = fitz.open(str(pdf_path))
    total_pages = len(doc)
    pages_text = []
    total_math_elements = []

    for i in range(total_pages):
        page = doc.load_page(i)
        try:
            # Try regular text extraction first
            page_text = page.get_text()

            # If empty, OCR the rendered image
            if not page_text.strip():
                try:
                    mat = fitz.Matrix(200/72, 200/72)  # 200 DPI
                    pix = page.get_pixmap(matrix=mat)
                    img_data = pix.tobytes("png")
                    img = Image.open(io.BytesIO(img_data))
                    page_text = pytesseract.image_to_string(img, lang='ara')
                except Exception as ocr_e:
                    print(f"⚠️ Page {i+1} empty or failed OCR")
                    pages_text.append("")  # keep alignment
                    continue

            # Math markers (preserved behavior)
            if is_math_book:
                math_elements = detect_math_symbols(page_text)
                if math_elements:
                    page_text = f"[MATH_DETECTED: {len(math_elements)} elements]\n" + page_text
                    total_math_elements.extend(math_elements)
                drawings = page.get_drawings()
                if drawings:
                    page_text += f"\n[DIAGRAM_DETECTED: {len(drawings)} geometric elements]\n"

            pages_text.append(page_text)
            print(f"✅ Page {i+1}/{total_pages} saved")
        except Exception as e:
            print(f"❌ Error on page {i+1}: {e}")
            pages_text.append("")  # keep alignment

    doc.close()
    return pages_text, total_pages


# Text cleaning module
import re

def clean_text(text):
    """Simple text cleaning for Arabic content with math preservation"""
    # Preserve mathematical notations first
    math_markers = []
    math_pattern = r'\[MATH_DETECTED:.*?\]|\[DIAGRAM_DETECTED:.*?\]|\[MATH_BOOK_SUMMARY:.*?\]'
    for match in re.finditer(math_pattern, text):
        placeholder = f"__MATH_MARKER_{len(math_markers)}__"
        math_markers.append(match.group())
        text = text.replace(match.group(), placeholder)

    # Normalize Arabic digits
    text = text.translate(str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789"))

    # Preserve mathematical symbols while cleaning
    math_symbols = r'[+\-×÷*/=<>≤≥≠±√∑∏∫°αβγδθπλμσφψω\^\(\)\[\]]'

    # Remove extra spaces and empty lines but preserve math content
    lines = []
    for line in text.split('\n'):
        line = line.strip()
        # Keep lines with math markers, math symbols, or meaningful content
        if (line and
            (len(line) > 2 or
             '__MATH_MARKER_' in line or
             re.search(math_symbols, line) or
             re.search(r'\d+[/\^]\d+', line))):
            lines.append(line)

    cleaned_text = '\n'.join(lines)

    # Restore math markers
    for i, marker in enumerate(math_markers):
        placeholder = f"__MATH_MARKER_{i}__"
        cleaned_text = cleaned_text.replace(placeholder, marker)

    return cleaned_text


def create_chunks(text, chunk_size=500):
    """Split text into chunks"""
    sentences = re.split(r'[.!?؟]\s+', text)
    chunks = []
    current_chunk = ""

    for sentence in sentences:
        if len(current_chunk) + len(sentence) < chunk_size:
            current_chunk += sentence + ". "
        else:
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
            current_chunk = sentence + ". "

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks


def process_all_books():
    """
    تحديثات:
    1) نحفظ بامتداد .json (وليس jsonl).
    2) الآوتبوت = مسار ملف فقط (بدون مجلد باسم الكتاب).
    3) اسم الملف: base_name مأخوذ من اسم الـ PDF + '.json'
       ثم: Data/Extracted_Books/Basic/SUBJECT/GRADE/TERM/base_name.json
    """
    # Input root EXACTLY as requested earlier
    INPUT_ROOT = Path(r"/home/mohamed/DEPI_Project/Data/Books/arabic/g5/t1")

    print("🚀 Starting Book Processing")
    print("=" * 50)

    for pdf_path in INPUT_ROOT.rglob("*.pdf"):
        pdf_path = Path(pdf_path)

        # Derive metadata from path
        SUBJECT = pdf_path.parts[-4].lower()
        GRADE = pdf_path.parts[-3]
        TERM = pdf_path.parts[-2]
        
        # File name directly (no extra folder for the book)
        base_name = os.path.splitext(os.path.basename(pdf_path))[0] + "_cleaned.json"  
        output_path = os.path.join("Data", "Extracted_Books", SUBJECT, GRADE, TERM, base_name)

        # Create ONLY the parent directories; not a folder named after the book
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        print(f"\n=== Book: {pdf_path.name} ===")
        print(f"Subject: {SUBJECT} | Grade: {GRADE} | Term: {TERM}")
        start_time = time.time()

        try:
            # Extract per page
            pages_text, total_pages = extract_text_from_pdf(pdf_path)

            # Collect chunks, then save as a single JSON array
            all_records = []
            for i, page_text in enumerate(pages_text):
                if not page_text.strip():
                    continue
                cleaned_text = clean_text(page_text)
                if not cleaned_text.strip():
                    continue
                page_chunks = create_chunks(cleaned_text)
                for idx, chunk in enumerate(page_chunks, 1):
                    rec = {
                        "text": chunk,
                        "metadata": {
                            "page": i + 1,
                            "subject": SUBJECT,
                            "grade": GRADE,
                            "term": TERM,
                            "source": pdf_path.name,
                            "chunk_id": idx
                        }
                    }
                    all_records.append(rec)

            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(all_records, f, ensure_ascii=False, indent=2)

            process_time = (time.time() - start_time) / 60
            print(f"  ✅ Saved {len(all_records)} chunks → {output_path}")
            print(f"  ⏱️ Done in {process_time:.2f} minutes")

        except Exception as e:
            print(f"  ❌ Error processing {pdf_path.name}: {e}")


def main():
    process_all_books()


if __name__ == "__main__":
    main()
