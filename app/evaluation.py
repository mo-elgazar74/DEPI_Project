
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Zero-arg batch evaluator with STRICT mode + SELFTEST.
# Usage:
#   python eval_quality_strict.py
# Optional env:
#   EVAL_SAMPLE_N=0|N      # default 30
#   EVAL_STRICT=1          # tighten thresholds automatically
#   EVAL_SELFTEST=1        # run synthetic-noise sensitivity check

import csv, json, re, statistics, unicodedata, hashlib, random, os
from pathlib import Path
from collections import defaultdict, Counter
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).resolve().parents[0] / ".env")
# ----------------------- Character classes & regexes -----------------------
ARABIC_RANGES = (
    (0x0600, 0x06FF), (0x0750, 0x077F),
    (0x08A0, 0x08FF), (0xFB50, 0xFDFF), (0xFE70, 0xFEFF),
)
MATH_SIGNS_RE = re.compile(r"[+\-×÷*/=%(){}\[\]^<>]|[.,](?=\d)")
SPACE_RE = re.compile(r"\s+")

def arabic_ratio(s: str) -> float:
    total = 0; arabic = 0
    for ch in s:
        if ch.isspace(): continue
        total += 1
        cp = ord(ch)
        if any(lo <= cp <= hi for lo, hi in ARABIC_RANGES): arabic += 1
    return (arabic / total) if total else 0.0

def digit_ratio(s: str) -> float:
    total = 0; digits = 0
    for ch in s:
        if ch.isspace(): continue
        total += 1
        if ch.isdigit(): digits += 1
    return (digits / total) if total else 0.0

def latin_ratio(s: str) -> float:
    total = 0; latin = 0
    for ch in s:
        if ch.isspace(): continue
        total += 1
        if 'A' <= ch <= 'Z' or 'a' <= ch <= 'z': latin += 1
    return (latin / total) if total else 0.0

def punctuation_ratio(s: str) -> float:
    total = 0; punct = 0
    for ch in s:
        if ch.isspace(): continue
        total += 1
        if not ch.isalnum() and not ('\u0600' <= ch <= '\u06FF'):
            punct += 1
    return (punct / total) if total else 0.0

def has_math_context(s: str) -> bool:
    return bool(MATH_SIGNS_RE.search(s))

def normalize_for_hash(s: str) -> str:
    s = unicodedata.normalize("NFKC", s).lower()
    s = SPACE_RE.sub(" ", s).strip()
    return s

def get_domain_cfg(domain: str):
    domain = (domain or "textual").lower()
    if domain == "math":
        cfg = {
            "LOW_ARABIC_LT": 0.20,
            "DIGIT_HEAVY_GT": 0.65,
            "DIGIT_HEAVY_AR_LT": 0.30,
            "LATIN_NOISE_GT": 0.05,
            "PUNCT_HEAVY_GT": 0.20,
            "MIN_CHARS": 200,
            "W_ARABIC": 40.0,
            "W_DIGIT_NO_MATH": 60.0,
            "W_DIGIT_WITH_MATH": 30.0,
            "W_LATIN": 60.0,
            "W_PUNCT": 20.0,
            "SHORT_PENALTY": 10.0,
            "DIGIT_BASELINE": 0.35,
        }
    elif domain == "science":
        cfg = {
            "LOW_ARABIC_LT": 0.20,
            "DIGIT_HEAVY_GT": 0.55,
            "DIGIT_HEAVY_AR_LT": 0.25,
            "LATIN_NOISE_GT": 0.10,
            "PUNCT_HEAVY_GT": 0.25,
            "MIN_CHARS": 180,
            "W_ARABIC": 35.0,
            "W_DIGIT_NO_MATH": 45.0,
            "W_DIGIT_WITH_MATH": 25.0,
            "W_LATIN": 45.0,
            "W_PUNCT": 20.0,
            "SHORT_PENALTY": 8.0,
            "DIGIT_BASELINE": 0.30,
        }
    else:
        cfg = {
            "LOW_ARABIC_LT": 0.25,
            "DIGIT_HEAVY_GT": 0.50,
            "DIGIT_HEAVY_AR_LT": 0.35,
            "LATIN_NOISE_GT": 0.03,
            "PUNCT_HEAVY_GT": 0.25,
            "MIN_CHARS": 200,
            "W_ARABIC": 45.0,
            "W_DIGIT_NO_MATH": 55.0,
            "W_DIGIT_WITH_MATH": 25.0,
            "W_LATIN": 50.0,
            "W_PUNCT": 15.0,
            "SHORT_PENALTY": 8.0,
            "DIGIT_BASELINE": 0.25,
        }
    # STRICT mode? tighten thresholds & penalties a bit
    if os.getenv("EVAL_STRICT", "0") == "1":
        cfg = dict(cfg)
        cfg["LOW_ARABIC_LT"] = min(0.30, cfg["LOW_ARABIC_LT"] + 0.05)
        cfg["DIGIT_BASELINE"] = max(0.20, cfg["DIGIT_BASELINE"] - 0.05)
        cfg["DIGIT_HEAVY_GT"] = max(0.45, cfg["DIGIT_HEAVY_GT"] - 0.10)
        cfg["LATIN_NOISE_GT"] = max(0.02, cfg["LATIN_NOISE_GT"] - 0.01)
        cfg["W_LATIN"] += 5.0
        cfg["W_DIGIT_NO_MATH"] += 5.0
        cfg["SHORT_PENALTY"] += 2.0
    return cfg

def quality_score(ar: float, dr: float, lr: float, pr: float, has_math: bool,
                  length_chars: int, cfg: dict) -> float:
    score = 100.0
    score -= max(0.0, (1.0 - ar)) * cfg["W_ARABIC"]
    over = max(0.0, dr - cfg["DIGIT_BASELINE"])
    if over > 0:
        score -= over * (cfg["W_DIGIT_WITH_MATH"] if has_math else cfg["W_DIGIT_NO_MATH"])
    score -= lr * cfg["W_LATIN"]
    score -= pr * cfg["W_PUNCT"]
    if length_chars < cfg["MIN_CHARS"]:
        score -= cfg["SHORT_PENALTY"]
    return round(max(0.0, min(100.0, score)), 2)

SCIENCE_KEYS = ["science", "sci", "علوم", "biology", "chem", "physics"]
MATH_KEYS    = ["math", "maths", "رياض", "رياضيات", "algebra", "geometry"]

def detect_domain_from_path(path: Path) -> str:
    p = str(path).lower()
    if any(k in p for k in MATH_KEYS): return "math"
    if any(k in p for k in SCIENCE_KEYS): return "science"
    return "textual"

def evaluate_file(in_path: Path, out_dir: Path, domain: str, sample_n: int = 30, seed: int = 42):
    cfg = get_domain_cfg(domain)
    per_rows = []
    pages = defaultdict(list)
    exact_hashes = Counter()
    nodigit_hashes = Counter()

    out_dir.mkdir(parents=True, exist_ok=True)

    with in_path.open("r", encoding="utf-8") as fin:
        for line in fin:
            line = line.strip()
            if not line: continue
            try:
                obj = json.loads(line)
            except Exception:
                continue

            text = (obj.get("text") or "").strip()
            meta = (obj.get("metadata") or {})
            if not text: continue

            L  = len(text)
            ar = arabic_ratio(text)
            dr = digit_ratio(text)
            lr = latin_ratio(text)
            pr = punctuation_ratio(text)
            mc = has_math_context(text)

            flags = []
            if ar < cfg["LOW_ARABIC_LT"]: flags.append("LOW_ARABIC")
            if (dr > cfg["DIGIT_HEAVY_GT"]) and not mc and (ar < cfg["DIGIT_HEAVY_AR_LT"]):
                flags.append("DIGIT_HEAVY_NO_MATH")
            if lr > cfg["LATIN_NOISE_GT"]: flags.append("LATIN_NOISE")
            if pr > cfg["PUNCT_HEAVY_GT"]: flags.append("PUNCT_HEAVY")
            if L < cfg["MIN_CHARS"]: flags.append("TOO_SHORT")

            q = quality_score(ar, dr, lr, pr, mc, L, cfg)

            norm = normalize_for_hash(text)
            h_exact = hashlib.md5(norm.encode("utf-8")).hexdigest()
            h_nodigit = hashlib.md5(re.sub(r"\d+", "", norm).encode("utf-8")).hexdigest()
            exact_hashes[h_exact] += 1
            nodigit_hashes[h_nodigit] += 1

            page = meta.get("page")
            row = {
                "page": page,
                "chunk_id": meta.get("chunk_id"),
                "chars": L,
                "words": len(text.split()),
                "arabic_ratio": round(ar, 4),
                "digit_ratio": round(dr, 4),
                "latin_ratio": round(lr, 4),
                "punct_ratio": round(pr, 4),
                "has_math": int(mc),
                "quality": q,
                "flags": "|".join(flags),
                "text": text.replace("\n", " ").strip()
            }
            per_rows.append(row)
            if page is not None:
                pages[str(page)].append(row)

    # ----- aggregates -----
    def agg(values):
        if not values: return {"count": 0, "mean": 0, "median": 0, "min": 0, "max": 0, "stdev": 0}
        return {
            "count": len(values),
            "mean": round(statistics.mean(values), 4),
            "median": round(statistics.median(values), 4),
            "min": round(min(values), 4),
            "max": round(max(values), 4),
            "stdev": round(statistics.pstdev(values), 4) if len(values) > 1 else 0.0,
        }

    # Noise/quality
    qualities = [r["quality"] for r in per_rows]
    ar_list = [r["arabic_ratio"] for r in per_rows]
    dr_list = [r["digit_ratio"] for r in per_rows]
    lr_list = [r["latin_ratio"] for r in per_rows]
    pr_list = [r["punct_ratio"] for r in per_rows]
    lens_list = [r["chars"] for r in per_rows]

    noisy = [r for r in per_rows if ("LOW_ARABIC" in r["flags"]) or ("DIGIT_HEAVY_NO_MATH" in r["flags"])
             or ("LATIN_NOISE" in r["flags"]) or ("PUNCT_HEAVY" in r["flags"]) or (r["quality"] < 70)]
    noise_rate = round(len(noisy) / max(1, len(per_rows)), 4)
    data_cleanliness = round((1.0 - noise_rate) * 100.0, 2)

    # Flag counts
    flag_counts = Counter()
    for r in per_rows:
        if r["flags"]:
            for f in r["flags"].split("|"):
                if f: flag_counts[f] += 1

    # Duplicates
    exact_dups = sum(c-1 for c in Counter([hashlib.md5(normalize_for_hash(r["text"]).encode("utf-8")).hexdigest() for r in per_rows]).values() if c>1)
    nodigit_dups = sum(c-1 for c in Counter([hashlib.md5(re.sub(r"\d+", "", normalize_for_hash(r["text"])).encode("utf-8")).hexdigest() for r in per_rows]).values() if c>1)
    exact_dup_rate = round(exact_dups / max(1, len(per_rows)), 4)
    nodigit_dup_rate = round(nodigit_dups / max(1, len(per_rows)), 4)

    # Histograms
    def hist_buckets(values, edges):
        buckets = {f"{edges[i]}-{edges[i+1]}": 0 for i in range(len(edges)-1)}
        for v in values:
            for i in range(len(edges)-1):
                if edges[i] <= v < edges[i+1]:
                    buckets[f"{edges[i]}-{edges[i+1]}"] += 1
                    break
        return buckets
    quality_hist = hist_buckets(qualities, [0,50,60,70,80,90,101])

    # Worst samples TSV
    worst = sorted(per_rows, key=lambda r: r["quality"])[:20]
    worst_tsv = out_dir / "worst_samples.tsv"
    with worst_tsv.open("w", encoding="utf-8", newline="") as fout:
        writer = csv.writer(fout, delimiter="\t")
        writer.writerow(["quality","flags","page","chunk_id","chars","arabic_ratio","digit_ratio","latin_ratio","punct_ratio","has_math","text"])
        for r in worst:
            writer.writerow([r["quality"], r["flags"], r["page"], r["chunk_id"], r["chars"],
                             r["arabic_ratio"], r["digit_ratio"], r["latin_ratio"], r["punct_ratio"],
                             r["has_math"], r["text"]])

    # Per-file CSV
    csv_path = out_dir / "chunks_metrics.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as fout:
        fieldnames = ["page","chunk_id","chars","words","arabic_ratio","digit_ratio",
                      "latin_ratio","punct_ratio","has_math","quality","flags","text"]
        writer = csv.DictWriter(fout, fieldnames=fieldnames)
        writer.writeheader()
        for r in per_rows:
            writer.writerow(r)

    # Optional SELFTEST: synthetic noise sensitivity
    selftest = None
    if os.getenv("EVAL_SELFTEST", "0") == "1" and per_rows:
        random.seed(123)
        sample_rows = random.sample(per_rows, min(30, len(per_rows)))
        noisy_scores = []
        for r in sample_rows:
            txt = r["text"]
            # Drop Arabic letters, keep digits/punct, add ASCII noise
            corrupted = re.sub(r"[\u0600-\u06FF]", "", txt)
            corrupted = corrupted + " " + (" ".join(["lorem", "ipsum", "12345"])) * 2
            L  = len(corrupted)
            ar = arabic_ratio(corrupted)
            dr = digit_ratio(corrupted)
            lr = latin_ratio(corrupted)
            pr = punctuation_ratio(corrupted)
            mc = has_math_context(corrupted)
            q  = quality_score(ar, dr, lr, pr, mc, L, cfg)
            noisy_scores.append(q)
        below70 = sum(1 for q in noisy_scores if q < 70)
        selftest = {
            "tested_samples": len(sample_rows),
            "noisy_quality_mean": round(statistics.mean(noisy_scores), 2) if noisy_scores else 0.0,
            "below70_rate": round(below70 / max(1, len(noisy_scores)), 4)
        }

    # Summary JSON
    summary = {
        "input_file": str(in_path),
        "domain": domain,
        "strict_mode": os.getenv("EVAL_STRICT", "0") == "1",
        "total_chunks": len(per_rows),
        "noise_rate": noise_rate,
        "data_cleanliness_percent": data_cleanliness,
        "flag_counts": dict(flag_counts),
        "exact_duplicate_rate": exact_dup_rate,
        "near_duplicate_rate_no_digits": nodigit_dup_rate,
        "aggregates": {
            "quality": {
                "count": len(qualities),
                "mean": round(statistics.mean(qualities), 4) if qualities else 0.0,
                "median": round(statistics.median(qualities), 4) if qualities else 0.0,
                "min": round(min(qualities), 4) if qualities else 0.0,
                "max": round(max(qualities), 4) if qualities else 0.0,
            }
        },
        "histograms": {"quality": quality_hist},
        "selftest": selftest,
        "notes": [
            "QualityScore is heuristic (0..100). <70 is likely noisy and needs review.",
            "DataCleanliness% = (1 - noise_rate) * 100.",
            "STRICT mode tightens thresholds; enable via EVAL_STRICT=1.",
            "SELFTEST introduces synthetic noise; enable via EVAL_SELFTEST=1."
        ]
    }
    json_path = out_dir / "summary.json"
    with json_path.open("w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    return {
        "file": str(in_path),
        "domain": domain,
        "total_chunks": len(per_rows),
        "noise_rate": noise_rate,
        "data_cleanliness_percent": data_cleanliness,
        "quality_mean": summary["aggregates"]["quality"]["mean"],
        "out_dir": str(out_dir)
    }

def main():
    ROOT = Path.cwd()
    cleaned_root = ROOT / "Data" / "Extracted_Books" / "Cleaned"
    eval_root = ROOT / "eval_reports_strict"
    eval_root.mkdir(parents=True, exist_ok=True)

    files = sorted(cleaned_root.rglob("*_clean_chunked.jsonl"))
    if not files:
        print(f"❌ No files found under: {cleaned_root} matching *_clean_chunked.jsonl")
        return

    print(f"🔎 Found {len(files)} cleaned files. Evaluating (STRICT={os.getenv('EVAL_STRICT','1')}, SELFTEST={os.getenv('EVAL_SELFTEST','0')})...")
    results = []
    for f in files:
        domain = detect_domain_from_path(f)
        out_dir = eval_root / f.stem
        print(f"  • {f.name}  [domain={domain}] → {out_dir}")
        res = evaluate_file(f, out_dir, domain=domain, sample_n=None, seed=42)
        results.append(res)

    all_csv = eval_root / "ALL_results.csv"
    with all_csv.open("w", encoding="utf-8", newline="") as fout:
        fieldnames = ["file","domain","total_chunks","noise_rate","data_cleanliness_percent","quality_mean","out_dir"]
        writer = csv.DictWriter(fout, fieldnames=fieldnames)
        writer.writeheader()
        for r in results:
            writer.writerow(r)

    all_json = eval_root / "ALL_results.json"
    with all_json.open("w", encoding="utf-8") as f:
        json.dump({"results": results}, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Done. Global summary:\n  CSV: {all_csv}\n  JSON: {all_json}")
    print("Hints: EVAL_STRICT=1 for tighter thresholds, EVAL_SELFTEST=1 to verify sensitivity.")

if __name__ == "__main__":
    main()
