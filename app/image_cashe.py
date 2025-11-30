
import json
import hashlib
from pathlib import Path
from typing import Optional

# Define cache file path
# ROOT is parent of app/ (i.e., DEPI_Project)
CACHE_DIR = Path(__file__).resolve().parents[1] / "cache_store"
CACHE_FILE = CACHE_DIR / "image_descriptions.json"

def _load_cache() -> dict:
    if not CACHE_FILE.exists():
        return {}
    try:
        return json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}

def _save_cache(cache: dict):
    CACHE_DIR.mkdir(exist_ok=True)
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")

def get_image_hash(image_base64: str) -> str:
    """Generate MD5 hash of the image base64 string."""
    return hashlib.md5(image_base64.encode("utf-8")).hexdigest()

def get_cached_description(image_base64: str) -> Optional[str]:
    """Retrieve description from cache if exists."""
    if not image_base64:
        return None
    
    cache = _load_cache()
    img_hash = get_image_hash(image_base64)
    return cache.get(img_hash)

def cache_description(image_base64: str, description: str):
    """Save description to cache."""
    if not image_base64 or not description:
        return
        
    cache = _load_cache()
    img_hash = get_image_hash(image_base64)
    cache[img_hash] = description
    _save_cache(cache)
