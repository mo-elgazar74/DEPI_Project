import os
import json
import re
import unicodedata
from pdf2image import convert_from_path
from PIL import Image
import pytesseract
from llama_index.core import Document
from PyPDF2 import PdfReader
from pathlib import Path

# =================
DPI = 300
APPLY_PREPROCESS = False
# =================

if APPLY_PREPROCESS:
    import cv2
    import numpy as np

def preprocess(img: Image.Image) -> Image.Image:
    if not APPLY_PREPROCESS:
        return img
    img_np = np.array(img)
    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
    gray = cv2.bilateralFilter(gray, 9, 75, 75)
    thr = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 35, 11
    )
    return Image.fromarray(thr)

def clean_text_ar(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r'[^\u0600-\u06FF0-9\s.,،؛؟:\'\"\-\n]', '', text)
    text = re.sub(r'[ \t]+', ' ', text)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n".join(lines)

def clean_text_en(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r'[^A-Za-z\u0600-\u06FF0-9\s.,،؛؟:\'\"\-\n()]', '', text)
    text = re.sub(r'[ \t]+', ' ', text)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n".join(lines)

def save_doc_line(doc: Document, out_f):
    obj = {"text": doc.text, "metadata": doc.metadata}
    out_f.write(json.dumps(obj, ensure_ascii=False) + "\n")

def get_page_count(pdf_path: str) -> int:
    return len(PdfReader(pdf_path).pages)

def extract_pdf_text_page(pdf_path: str, page_index: int) -> str:
    try:
        reader = PdfReader(pdf_path)
        if page_index < 0 or page_index >= len(reader.pages):
            return ""
        raw = reader.pages[page_index].extract_text() or ""
        return raw if len(raw.strip()) >= 30 else ""
    except Exception:
        return ""

def ocr_page_to_doc_ar(pdf_path: str, page_index: int, meta: dict) -> Document:
    images = convert_from_path(pdf_path, dpi=DPI,
                                first_page=page_index+1, last_page=page_index+1)
    img = preprocess(images[0])
    text_raw = pytesseract.image_to_string(img, lang="ara", config="--oem 1 --psm 6")
    cleaned = clean_text_ar(text_raw)
    return Document(text=cleaned, metadata={"page": page_index + 1, **meta })

def ocr_page_to_doc_en(pdf_path: str, page_index: int, meta: dict) -> Document:
    direct = extract_pdf_text_page(pdf_path, page_index)
    if direct:
        cleaned = clean_text_en(direct)
        return Document(text=cleaned, metadata={"page": page_index + 1, **meta })

    images = convert_from_path(pdf_path, dpi=DPI,
                                first_page=page_index+1, last_page=page_index+1)
    img = preprocess(images[0])
    text_raw = pytesseract.image_to_string(img, lang="eng", config="--oem 3 --psm 6")
    cleaned = clean_text_en(text_raw)
    return Document(text=cleaned, metadata={"page": page_index + 1, **meta })

def process_pdf(PDF_PATH: Path):
    SUBJECT = PDF_PATH.parts[-4]
    GRADE = PDF_PATH.parts[-3]
    TERM = PDF_PATH.parts[-2]

    is_english = (SUBJECT == "english")
    ocr_func = ocr_page_to_doc_en if is_english else ocr_page_to_doc_ar

    base_name = os.path.splitext(os.path.basename(PDF_PATH))[0] + ".jsonl"
    output_path = os.path.join("Data", "Extracted_Books", "Basic", SUBJECT, GRADE, TERM, base_name)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    total_pages = get_page_count(str(PDF_PATH))
    print("Extracting text from", PDF_PATH.parts[-1])
    print(f"📄 PDF: {PDF_PATH} | Pages: {total_pages} | Output: {output_path}")

    meta_common = {
        "subject": SUBJECT,
        "grade": GRADE,
        "term": TERM,
        "source": os.path.basename(str(PDF_PATH)),
    }

    with open(output_path, "w", encoding="utf-8") as out_f:
        for i in range(total_pages):
            try:
                doc = ocr_func(str(PDF_PATH), i, meta_common)
                if doc.text.strip():
                    save_doc_line(doc, out_f)
                    print(f"✅ Page {i+1}/{total_pages} saved")
                else:
                    print(f"⚠️ Page {i+1} empty or failed OCR")
            except Exception as e:
                print(f"❌ Error on page {i+1}: {e}")

    print(f"\n📦 Output saved to: {output_path}")

if __name__ == "__main__":
    for pdf in Path(r"D:\Data Science\DEPI\DEPI_Project\Data\Books").rglob("*.pdf"):
        process_pdf(pdf)
