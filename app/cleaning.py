#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ultra-light post-clean + chunking for Arabic OCR JSONL.
- Streams line-by-line (low RAM)
- Page-level filtering
- Number-noise cleanup (keeps real math)
- Normalizes digits/spaces/zero-width
- Splits into 400–700 char chunks with soft sentence boundaries
- Drops digit-heavy noisy chunks
- Outputs JSONL: one chunk per line with page/chunk metadata
"""

import json, re, os, unicodedata
from pathlib import Path

# ========= CONFIG =========
INPUT_JSONL   = "/home/mohamed/DEPI_Project/Data/Extracted_Books/Basic/maths/g5/t1/Maths_grade_5_first_term.jsonl"  # <-- غيّر ده لمسارك
OUTPUT_SUFFIX = "_clean_chunked.jsonl"

# فلاتر جودة الصفحة
MIN_PAGE_LEN      = 120      # استبعد الصفحة لو النص أقصر من كده
MIN_ARABIC_RATIO  = 0.25     # استبعد الصفحة لو نسبة العربية أقل من كده

# إعدادات التنظيف
NORMALIZE_DIGITS  = True     # حوّل الأرقام العربية -> اللاتينية
COLLAPSE_SPACES   = True     # دمج المسافات المتكررة

# إعدادات التقسيم
CHUNK_MIN = 400
CHUNK_MAX = 700
SENT_END  = r"[\.!\?؟،؛:\n]"  # حدود لينة للجمل

# فلاتر أرقام/ضوضاء (قابلة للتعديل)
MAX_BARE_DIGIT_RUN     = 5     # أي رقم متتابع >=5 أرقام بدون سياق → غالبًا ضوضاء
DROP_LINE_IF_DIGIT_RATIO_GT = 0.60  # لو السطر كله أرقام تقريبًا ومفيش رياضيات → اسقطه
DROP_CHUNK_IF_DIGIT_HEAVY   = True
CHUNK_DROP_ARABIC_RATIO_LT  = 0.30  # اسقط المقطع لو العربي قليل جدًا
CHUNK_DROP_DIGIT_RATIO_GT   = 0.65  # واسقطه لو الأرقام عالية جدًا بدون سياق
# ==========================

ARABIC_RANGES = (
    (0x0600, 0x06FF), (0x0750, 0x077F),
    (0x08A0, 0x08FF), (0xFB50, 0xFDFF), (0xFE70, 0xFEFF),
)

# خرائط الأرقام العربية -> اللاتينية
AR2EN = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")

ZW_RE = re.compile(r'[\u200B-\u200F\u202A-\u202E\u2066-\u2069]')  # zero-width
SPACE_RE = re.compile(r"[ \t\u00A0]+")
LINE_RE = re.compile(r"[ \t]*\n[ \t]*")

MATH_SIGNS_RE = re.compile(r"[+\-×÷*/=%(){}\[\]^<>]|[.,](?=\d)")
LATIN_NOISE_SEQ = re.compile(r"^(?:[A-Za-z]\s*){3,}$")  # a b c d...

DIGIT_RE     = re.compile(r"\d")
DIGIT_RUN_RE = re.compile(r"\d{"+str(MAX_BARE_DIGIT_RUN)+r",}")  # 5+ digits


def arabic_ratio(s: str) -> float:
    if not s:
        return 0.0
    total = 0
    arabic = 0
    for ch in s:
        if ch.isspace():
            continue
        total += 1
        cp = ord(ch)
        if any(lo <= cp <= hi for lo, hi in ARABIC_RANGES):
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
    # Unicode normalize + remove zero-width + collapse spaces/newlines
    s = unicodedata.normalize("NFKC", s)
    s = ZW_RE.sub("", s)
    if COLLAPSE_SPACES:
        s = SPACE_RE.sub(" ", s)
        s = LINE_RE.sub("\n", s)
    s = s.strip()
    if NORMALIZE_DIGITS:
        s = s.translate(AR2EN)
    return s


def clean_number_noise(line: str) -> str:
    """
    يحذف الضوضاء الرقمية الواضحة:
    - أسطر كلها أرقام تقريبًا بدون سياق رياضي
    - تسلسلات أرقام طويلة (>= MAX_BARE_DIGIT_RUN) بدون سياق
    - تسلسلات لاتينية عشوائية منفصلة
    """
    ln = line.strip()
    if not ln:
        return ""

    # أسطر لاتينية مشتتة زي "a b c d"
    if LATIN_NOISE_SEQ.fullmatch(ln):
        return ""

    # لو السطر أرقامه كتير ومافيش رموز رياضية → غالباً ضوضاء
    if not has_math_context(ln):
        if digit_ratio(ln) > DROP_LINE_IF_DIGIT_RATIO_GT and arabic_ratio(ln) < 0.20:
            return ""

    # احذف جزر أرقام طويلة جدًا بدون سياق (بس سيبها لو فيه سياق رياضي عام)
    if not has_math_context(ln):
        ln = DIGIT_RUN_RE.sub("", ln)

    # قلّل تكرارات العلامات
    ln = re.sub(r'([\-ـ\.،؛:!؟])\1{2,}', r'\1', ln)

    # لو بقى قصير جدًا بعد التنضيف
    ln = ln.strip()
    if len(ln) <= 1:
        return ""
    return ln


def soft_sentence_split(text: str):
    """
    تقسيم لين للجمل: نقسم على علامات الوقف مع الاحتفاظ بها،
    ثم نعيد التجميع لمقاطع بالحجم المطلوب.
    """
    parts = []
    buf = []
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

    chunks = []
    cur = ""
    for sent in parts:
        if not sent:
            continue
        if not cur:
            cur = sent
            continue
        if len(cur) + 1 + len(sent) <= CHUNK_MAX:
            cur = f"{cur} {sent}".strip()
        else:
            if len(cur) < CHUNK_MIN:
                if len(cur) + 1 + len(sent) <= CHUNK_MAX + 150:
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
    """اسقط المقطع لو رقمي جدًا ومن غير سياق عربي/رياضي."""
    if not DROP_CHUNK_IF_DIGIT_HEAVY:
        return False
    ar = arabic_ratio(ch)
    dr = digit_ratio(ch)
    if ar < CHUNK_DROP_ARABIC_RATIO_LT and dr > CHUNK_DROP_DIGIT_RATIO_GT and not has_math_context(ch):
        return True
    return False


def process_jsonl(input_path: str, output_path: str):
    total_pages = 0
    kept_pages = 0
    total_chunks = 0

    with open(input_path, "r", encoding="utf-8") as fin, \
         open(output_path, "w", encoding="utf-8") as fout:

        for line in fin:
            line = line.strip()
            if not line:
                continue
            total_pages += 1

            try:
                obj = json.loads(line)
            except Exception:
                continue

            # دعم شكلين: {"text":..., "metadata":{"page":..}} أو {"page":..,"text":..}
            text = obj.get("text") or ""
            page = obj.get("page") or (obj.get("metadata", {}) or {}).get("page")
            subject = (obj.get("metadata", {}) or {}).get("subject")
            grade = (obj.get("metadata", {}) or {}).get("grade")
            source = (obj.get("metadata", {}) or {}).get("source")

            # Normalize
            txt = normalize_text(text)
            if not txt:
                continue

            # صفحة ضعيفة؟
            if len(txt) < MIN_PAGE_LEN:
                continue
            if arabic_ratio(txt) < MIN_ARABIC_RATIO:
                continue

            # سطر-بسطر: أشيل ضوضاء الأرقام واللاتيني التائه
            cleaned_lines = []
            for raw_ln in txt.split("\n"):
                ln = clean_number_noise(raw_ln)
                if ln:
                    cleaned_lines.append(ln)
            if not cleaned_lines:
                continue

            cleaned_page_text = "\n".join(cleaned_lines).strip()
            if not cleaned_page_text:
                continue

            kept_pages += 1

            # تقسيم لمقاطع
            chunks = soft_sentence_split(cleaned_page_text)

            # فلترة مقاطع رقمية جدًا بدون سياق
            filtered_chunks = [c for c in chunks if not should_drop_chunk(c)]

            for idx, ch in enumerate(filtered_chunks, 1):
                rec = {
                    "text": ch,
                    "metadata": {
                        "page": page,
                        "chunk_id": int(idx),
                        "subject": subject,
                        "grade": grade,
                        "source": source
                    }
                }
                fout.write(json.dumps(rec, ensure_ascii=False) + "\n")
                total_chunks += 1

    print(f"Pages total: {total_pages} | kept after filters: {kept_pages}")
    print(f"Chunks written: {total_chunks}")
    print(f"Output → {output_path}")


def main():
    in_path = Path(INPUT_JSONL)
    if not in_path.exists():
        print("❌ Input file not found:", in_path)
        return
    out_dir = Path("Data/Extracted_Books/Cleaned")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / (in_path.stem + OUTPUT_SUFFIX)
    process_jsonl(str(in_path), str(out_path))


if __name__ == "__main__":
    main()
