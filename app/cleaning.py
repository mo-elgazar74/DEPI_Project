#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Arabic + English cleaning (improved):
- يلف على كل JSONL في Extracted_Books
- يعمل cleaning + chunking
- يشيل التشكيل + الأسطر القصيرة + OCR الضايع
- يحفظ بنفس هيكل الفولدر جوه Data/Cleaned
"""

import json, re, unicodedata
from pathlib import Path

# ========= CONFIG =========
INPUT_BASE   = Path(r"D:\Data Science\DEPI\DEPI_Project\Data\Extracted_Books\Basic")
OUTPUT_BASE  = Path(r"D:\Data Science\DEPI\DEPI_Project\Data\Extracted_Books\Cleaned")
OUTPUT_SUFFIX = "_clean_chunked.jsonl"

MIN_PAGE_LEN      = 100
MIN_ARABIC_RATIO  = 0.20

NORMALIZE_DIGITS  = True
COLLAPSE_SPACES   = True

CHUNK_MIN = 400
CHUNK_MAX = 700
SENT_END  = r"[\.!\?؟،؛:\n]"

MAX_BARE_DIGIT_RUN     = 5
DROP_LINE_IF_DIGIT_RATIO_GT = 0.60
CHUNK_DROP_ARABIC_RATIO_LT  = 0.40
CHUNK_DROP_DIGIT_RATIO_GT   = 0.40
MIN_WORDS_PER_CHUNK         = 5

# ========= HELPERS =========
ARABIC_RANGES = (
    (0x0600, 0x06FF), (0x0750, 0x077F),
    (0x08A0, 0x08FF), (0xFB50, 0xFDFF), (0xFE70, 0xFEFF),
)

AR2EN = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")
ZW_RE = re.compile(r'[\u200B-\u200F\u202A-\u202E\u2066-\u2069]')
SPACE_RE = re.compile(r"[ \t\u00A0]+")
LINE_RE = re.compile(r"[ \t]*\n[ \t]*")
MATH_SIGNS_RE = re.compile(r"[+\-×÷*/=%(){}\[\]^<>]|[.,](?=\d)")
LATIN_NOISE_SEQ = re.compile(r"^(?:[A-Za-z]\s*){3,}$")
DIGIT_RUN_RE = re.compile(r"\d{"+str(MAX_BARE_DIGIT_RUN)+r",}")
TASHKEEL_RE = re.compile(r'[\u0617-\u061A\u064B-\u0652]')

def arabic_ratio(s: str) -> float:
    total = arabic = 0
    for ch in s:
        if ch.isspace():
            continue
        total += 1
        if any(lo <= ord(ch) <= hi for lo, hi in ARABIC_RANGES):
            arabic += 1
    return arabic / total if total else 0.0

def digit_ratio(s: str) -> float:
    if not s:
        return 0.0
    digits = sum(ch.isdigit() for ch in s)
    total = sum(not ch.isspace() for ch in s)
    return digits / total if total else 0.0

def has_math_context(s: str) -> bool:
    return bool(MATH_SIGNS_RE.search(s))

def normalize_text(s: str) -> str:
    s = unicodedata.normalize("NFKC", s)
    s = ZW_RE.sub("", s)
    s = TASHKEEL_RE.sub("", s)   # remove tashkeel
    if COLLAPSE_SPACES:
        s = SPACE_RE.sub(" ", s)
        s = LINE_RE.sub("\n", s)
    s = s.strip()
    if NORMALIZE_DIGITS:
        s = s.translate(AR2EN)
    return s

def clean_number_noise(line: str) -> str:
    ln = line.strip()
    if not ln:
        return ""
    if len(ln) < 5:  # short/noisy line
        return ""
    if LATIN_NOISE_SEQ.fullmatch(ln):
        return ""
    if not has_math_context(ln):
        if digit_ratio(ln) > DROP_LINE_IF_DIGIT_RATIO_GT and arabic_ratio(ln) < 0.25:
            return ""
        ln = DIGIT_RUN_RE.sub("", ln)
    ln = re.sub(r'([\-ـ\.،؛:!؟])\1{2,}', r'\1', ln)
    return ln if len(ln.strip()) > 1 else ""

def soft_sentence_split(text: str):
    parts, buf = [], []
    for token in re.split(f"({SENT_END})", text):
        if not token:
            continue
        buf.append(token)
        if re.fullmatch(SENT_END, token):
            parts.append("".join(buf).strip())
            buf = []
    if buf:
        parts.append("".join(buf).strip())
    if not parts:
        parts = [text]

    chunks, cur = [], ""
    for sent in parts:
        if not cur:
            cur = sent
            continue
        if len(cur) + 1 + len(sent) <= CHUNK_MAX:
            cur = f"{cur} {sent}".strip()
        else:
            if len(cur) < CHUNK_MIN and len(cur) + 1 + len(sent) <= CHUNK_MAX + 150:
                cur = f"{cur} {sent}".strip()
                continue
            chunks.append(cur.strip())
            cur = sent
    if cur:
        chunks.append(cur.strip())
    if len(chunks) >= 2 and len(chunks[-1]) < CHUNK_MIN:
        chunks[-2] = f"{chunks[-2]} {chunks[-1]}".strip()
        chunks.pop()
    return [c for c in chunks if c and len(c) >= min(80, CHUNK_MIN//2)]

def should_drop_chunk(ch: str) -> bool:
    ar, dr = arabic_ratio(ch), digit_ratio(ch)
    words = len(ch.split())
    if ar < CHUNK_DROP_ARABIC_RATIO_LT:
        return True
    if dr > CHUNK_DROP_DIGIT_RATIO_GT and not has_math_context(ch):
        return True
    if words < MIN_WORDS_PER_CHUNK:
        return True
    return False

def process_jsonl(input_path: str, output_path: str):
    total_pages = kept_pages = total_chunks = 0
    with open(input_path, "r", encoding="utf-8") as fin, open(output_path, "w", encoding="utf-8") as fout:
        for line in fin:
            if not line.strip():
                continue
            total_pages += 1
            try:
                obj = json.loads(line)
            except Exception:
                continue
            text = obj.get("text") or ""
            page = obj.get("page") or (obj.get("metadata", {}) or {}).get("page")
            subject = (obj.get("metadata", {}) or {}).get("subject")
            grade = (obj.get("metadata", {}) or {}).get("grade")
            source = (obj.get("metadata", {}) or {}).get("source")

            txt = normalize_text(text)
            if not txt or len(txt) < MIN_PAGE_LEN:
                continue

            cleaned_lines = [clean_number_noise(ln) for ln in txt.split("\n")]
            cleaned_lines = [ln for ln in cleaned_lines if ln]
            if not cleaned_lines:
                continue

            cleaned_page_text = "\n".join(cleaned_lines).strip()
            if not cleaned_page_text:
                continue
            kept_pages += 1

            chunks = soft_sentence_split(cleaned_page_text)
            for idx, ch in enumerate(chunks, 1):
                quality = "ok"
                if should_drop_chunk(ch):
                    quality = "low"
                rec = {
                    "text": ch,
                    "metadata": {
                        "page": page,
                        "chunk_id": idx,
                        "subject": subject,
                        "grade": grade,
                        "source": source,
                        "quality": quality
                    }
                }
                fout.write(json.dumps(rec, ensure_ascii=False) + "\n")
                if quality == "ok":
                    total_chunks += 1
    print(f"✅ {input_path} | Pages: {total_pages} → kept {kept_pages} | OK chunks: {total_chunks}")

# ========= MAIN LOOP =========
def main():
    for in_file in INPUT_BASE.rglob("*.jsonl"):
        rel_path = in_file.relative_to(INPUT_BASE)
        out_dir = OUTPUT_BASE / rel_path.parent
        out_dir.mkdir(parents=True, exist_ok=True)
        out_file = out_dir / (in_file.stem + OUTPUT_SUFFIX)
        print(f"🔄 Cleaning: {in_file} → {out_file}")
        process_jsonl(str(in_file), str(out_file))

if __name__ == "__main__":
    main()
