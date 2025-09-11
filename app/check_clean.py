#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os, json
from pathlib import Path

# ====== الإعدادات ======
ROOT = Path("/home/mohamed/DEPI_Project/Data/Extracted_Books/Basic")

# العتبات (تقدر تعدّلها)
AR_AVG_MIN            = 0.25   # متوسط نسبة العربي الدنيا للمواد العربية
LOW_AR_CHUNK_RATIO_MAX= 0.10   # أقصى نسبة مقاطع قليلة العربي (<0.3) للمواد العربية
HIGH_DIGIT_CHUNK_GT   = 0.60   # المقطع يُعد رقميًا بحتًا لو > 60% أرقام
HIGH_DIGIT_RATIO_MAX  = 0.05   # أقصى نسبة المقاطع الرقمية البحتة
AVG_LEN_MIN_AR        = 120    # أقل متوسط طول للمقطع المقبول للمواد العربية
AVG_LEN_MIN_EN        = 80     # أقل متوسط طول للمقطع المقبول للإنجليزي
# =======================

def arabic_ratio(text: str) -> float:
    if not text: return 0.0
    total = len(text)
    if total == 0: return 0.0
    arabic_chars = sum(1 for ch in text if '\u0600' <= ch <= '\u06FF')
    return arabic_chars / total

def digit_ratio(text: str) -> float:
    if not text: return 0.0
    total = len(text)
    if total == 0: return 0.0
    digits = sum(ch.isdigit() for ch in text)
    return digits / total

def analyze_file(path: Path):
    # حاول تحديد المادة من المسار: .../Basic/<subject>/<grade>/<term>/<file.jsonl>
    try:
        subject = path.parts[-4].lower()
    except Exception:
        subject = "unknown"

    is_english = (subject == "english")

    total = 0
    empty_texts = 0
    sum_len = 0
    ar_ratios = []
    digit_ratios = []
    high_digit_chunks = 0
    low_ar_chunks = 0

    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line: 
                continue
            try:
                obj = json.loads(line)
            except Exception:
                continue
            txt = (obj.get("text") or "").strip()
            total += 1
            if not txt:
                empty_texts += 1
                continue
            sum_len += len(txt)
            ar = arabic_ratio(txt)
            dr = digit_ratio(txt)
            ar_ratios.append(ar)
            digit_ratios.append(dr)
            if dr > HIGH_DIGIT_CHUNK_GT:
                high_digit_chunks += 1
            if not is_english and ar < 0.30:
                low_ar_chunks += 1

    if total == 0:
        return {
            "file": str(path),
            "subject": subject,
            "total": 0,
            "avg_len": 0.0,
            "avg_ar": 0.0,
            "avg_dr": 0.0,
            "high_digit_ratio": 0.0,
            "low_ar_ratio": 0.0,
            "needs_cleaning": True,
            "reason": "ملف بدون سجلات"
        }

    avg_len = sum_len / total if total else 0.0
    avg_ar = sum(ar_ratios) / len(ar_ratios) if ar_ratios else 0.0
    avg_dr = sum(digit_ratios) / len(digit_ratios) if digit_ratios else 0.0
    high_digit_ratio = high_digit_chunks / total
    low_ar_ratio = low_ar_chunks / total

    # قرار التنظيف (بسيط وواضح):
    needs = False
    reasons = []

    if empty_texts > 0:
        needs = True
        reasons.append(f"{empty_texts} نص/نصوص فاضية")

    if is_english:
        # للإنجليزي: ما نهتمش بنسبة العربي، لكن نهتم بالطول والضوضاء الرقمية
        if avg_len < AVG_LEN_MIN_EN:
            needs = True
            reasons.append(f"متوسط الطول منخفض ({avg_len:.0f} < {AVG_LEN_MIN_EN})")
        if high_digit_ratio > HIGH_DIGIT_RATIO_MAX:
            needs = True
            reasons.append(f"مقاطع رقمية كثيرة ({high_digit_ratio:.1%})")
    else:
        # للعربي/علوم/رياضيات/دراسات
        if avg_ar < AR_AVG_MIN:
            needs = True
            reasons.append(f"متوسط العربي منخفض ({avg_ar:.2f} < {AR_AVG_MIN})")
        if low_ar_ratio > LOW_AR_CHUNK_RATIO_MAX:
            needs = True
            reasons.append(f"مقاطع قليلة العربي كثيرة ({low_ar_ratio:.1%} > {LOW_AR_CHUNK_RATIO_MAX:.0%})")
        if avg_len < AVG_LEN_MIN_AR:
            needs = True
            reasons.append(f"متوسط الطول منخفض ({avg_len:.0f} < {AVG_LEN_MIN_AR})")
        if high_digit_ratio > HIGH_DIGIT_RATIO_MAX:
            needs = True
            reasons.append(f"مقاطع رقمية كثيرة ({high_digit_ratio:.1%})")

    return {
        "file": str(path),
        "subject": subject,
        "total": total,
        "avg_len": round(avg_len, 1),
        "avg_ar": round(avg_ar, 3),
        "avg_dr": round(avg_dr, 3),
        "high_digit_ratio": round(high_digit_ratio, 3),
        "low_ar_ratio": round(low_ar_ratio, 3),
        "needs_cleaning": needs,
        "reason": "، ".join(reasons) if reasons else "سليم"
    }

def main():
    jsonl_files = list(ROOT.rglob("*.jsonl"))
    if not jsonl_files:
        print(f"❌ لا توجد ملفات JSONL داخل: {ROOT}")
        return

    print(f"Found {len(jsonl_files)} file(s) under {ROOT}\n")
    problems = 0
    for p in sorted(jsonl_files):
        r = analyze_file(p)
        verdict = "✅ لا يحتاج Cleaning" if not r["needs_cleaning"] else "⚠️ يحتاج Cleaning"
        print(f"- {p.name} [{r['subject']}] → {verdict}")
        print(f"  total={r['total']}, avg_len={r['avg_len']}, avg_ar={r['avg_ar']}, "
              f"avg_dr={r['avg_dr']}, hiDigit%={r['high_digit_ratio']*100:.1f}%, "
              f"lowAr%={r['low_ar_ratio']*100:.1f}%")
        print(f"  سبب: {r['reason']}\n")
        if r["needs_cleaning"]:
            problems += 1

    print(f"\nملخص: {problems} / {len(jsonl_files)} ملف يحتاج Cleaning.")

if __name__ == "__main__":
    main()
