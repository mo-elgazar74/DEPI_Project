import os
import json
import re
import unicodedata
from pdf2image import convert_from_path
from PIL import Image
import pytesseract
from llama_index.core import Document
from PyPDF2 import PdfReader

# === CONFIG ===
PDF_PATH = r"D:\Data Science\DEPI\DEPI_Project\Data\Books\maths\g2\t1\Math_AR_Prim2_TR1.pdf"
LANG = "ara"
DPI = 300
SUBJECT = "Maths"
GRADE = "2"
APPLY_PREPROCESS = False # Set True if you want OpenCV filters
# =================

# Optional: OpenCV filters (can be disabled to save CPU)
if APPLY_PREPROCESS:
    import cv2
    import numpy as np

def preprocess(img: Image.Image) -> Image.Image:
    if not APPLY_PREPROCESS:
        return img
    img_np = np.array(img)
    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
    gray = cv2.bilateralFilter(gray, 9, 75, 75)
    thr = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                cv2.THRESH_BINARY, 35, 11)
    return Image.fromarray(thr)

def clean_text(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r'[^\u0600-\u06FF0-9\s.,،؛؟:!\'\"\-\n]', '', text)
    text = re.sub(r'[ \t]+', ' ', text)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n".join(lines)

def save_doc_line(doc: Document, out_f):
    obj = {
        "text": doc.text,
        "metadata": doc.metadata
    }
    out_f.write(json.dumps(obj, ensure_ascii=False) + "\n")

def ocr_page_to_doc(pdf_path: str, page_index: int) -> Document:
    images = convert_from_path(pdf_path, dpi=DPI, first_page=page_index+1, last_page=page_index+1)
    img = images[0]
    img = preprocess(img)

    text_raw = pytesseract.image_to_string(img, lang=LANG, config="--oem 1 --psm 6")
    cleaned = clean_text(text_raw)

    return Document(
        text=cleaned,
        metadata={
            "page": page_index + 1,
            "subject": SUBJECT,
            "grade": GRADE,
            "source": os.path.basename(pdf_path)
        }
    )

def get_page_count(pdf_path: str) -> int:
    return len(PdfReader(pdf_path).pages)

def main():
    base_name = os.path.splitext(os.path.basename(PDF_PATH))[0] + ".jsonl"
    output_path = os.path.join("Data", "Extracted_Books", "Basic", base_name)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    total_pages = get_page_count(PDF_PATH)

    with open(output_path, "w", encoding="utf-8") as out_f:
        for i in range(total_pages):
            try:
                doc = ocr_page_to_doc(PDF_PATH, i)
                if doc.text.strip():
                    save_doc_line(doc, out_f)
                    print(f"✅ Page {i+1}/{total_pages} saved")
                else:
                    print(f"⚠️ Page {i+1} empty or failed OCR")
            except Exception as e:
                print(f"❌ Error on page {i+1}: {e}")

    print(f"\n📦 Output saved to: {output_path}")

if __name__ == "__main__":
    main()
