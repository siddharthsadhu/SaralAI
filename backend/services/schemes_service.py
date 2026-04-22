"""
services/schemes_service.py — Scheme Search Engine (Python port of ai.js)
---------------------------------------------------------------------------
Loads Schemes.json and provides:
1. search_schemes(query) → ranked list of matching schemes
2. get_scheme(scheme_id)  → single scheme by ID
3. list_schemes()         → all scheme summaries

This is a Python port of the frontend's src/ai.js searchSchemes() function.
"""
import json
import re
from pathlib import Path
from typing import Optional
from functools import lru_cache


# ── Keyword map: which words relate to which scheme ───────────────────────────
# This mirrors SCHEME_KEYWORDS in frontend/src/ai.js
SCHEME_KEYWORDS: dict[str, list[str]] = {
    "PMAY_U": [
        "pmay", "awas", "housing", "urban", "city", "shahar", "ghar", "house",
        "home", "pradhan mantri awas", "pmay-u", "makan", "residential",
        "flat", "apartment", "slum", "pucca"
    ],
    "PMAY_G": [
        "pmay", "awas", "housing", "rural", "gaon", "village", "gram", "ghar",
        "house", "home", "pradhan mantri awas", "pmay-g", "gramin", "makan",
        "kutcha", "kachcha", "pucca", "panchayat"
    ],
    "PM_KISAN": [
        "kisan", "farmer", "farm", "kheti", "agriculture", "kisaan", "krishi",
        "pm kisan", "samman nidhi", "kisan samman", "income support", "land",
        "kheti badi", "instalment", "money farmer"
    ],
    "PM_JAY": [
        "ayushman", "health", "hospital", "medical", "insurance", "jan arogya",
        "pmjay", "treatment", "cashless", "sehat", "bimari", "ilaaj",
        "ab-pmjay", "ayushman bharat", "health card", "e-card", "swasthya"
    ],
    "NFSA_PDS": [
        "ration", "ration card", "food", "grain", "pds", "nfsa", "anaj",
        "chawal", "gehu", "wheat", "rice", "fair price shop", "rasan",
        "antyodaya", "subsidised", "bhoj", "khana"
    ],
    "PMJDY": [
        "jan dhan", "jandhan", "bank", "account", "banking", "khata",
        "bank account", "savings", "zero balance", "rupay", "financial",
        "unbanked", "pmjdy", "khaata", "dbt"
    ],
    "SSY": [
        "sukanya", "girl", "daughter", "beti", "samriddhi", "savings",
        "child", "ladki", "bachi", "female", "women", "education",
        "marriage", "tax", "80c", "post office"
    ],
    "PMUY": [
        "ujjwala", "lpg", "gas", "cylinder", "cooking", "kitchen", "chulha",
        "rasoi", "gas connection", "pmuy", "women", "mahila", "fuel",
        "clean cooking", "smoke", "gas stove", "connection"
    ],
    "NSAP": [
        "pension", "old age", "widow", "disability", "nsap", "elderly",
        "senior", "budhapa", "vidhwa", "viklang", "handicapped",
        "social assistance", "bujurg", "monthly", "allowance"
    ],
    "PMKVY": [
        "skill", "training", "job", "employment", "kaushal", "pmkvy",
        "course", "certificate", "certification", "youth", "yuva",
        "rojgar", "naukri", "work", "learn", "trade", "rozgar"
    ],
    "NSP": [
        "scholarship", "nsp", "student", "education", "college", "university",
        "school", "study", "scholarship portal", "national scholarship",
        "padhai", "fee", "stipend", "sc", "st", "obc", "minority"
    ],
}

# ── Category emoji for clarification cards ────────────────────────────────────
CATEGORY_EMOJIS: dict[str, str] = {
    "Housing": "🏠",
    "Farmers / Income Support": "🌾",
    "Health Assurance": "🏥",
    "Food Security / Subsidy": "🍚",
    "Financial Inclusion": "🏦",
    "Savings / Child Benefit": "👧",
    "Clean Cooking / Energy": "🔥",
    "Social Assistance / Pensions": "👴",
    "Skill Development / Employment": "🎓",
    "Education / Scholarships": "📚",
}


def normalize(text: str) -> str:
    """Lowercase, remove punctuation, collapse spaces."""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ── Load schemes.json once at startup (cached in memory) ─────────────────────
@lru_cache(maxsize=1)
def load_schemes() -> list[dict]:
    """
    Load Schemes.json from disk. @lru_cache ensures this happens only once
    even if called thousands of times — the result is cached in memory.
    """
    data_path = Path(__file__).parent.parent / "data" / "schemes.json"
    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)


def score_scheme(query_normalized: str, scheme_id: str, scheme: dict) -> float:
    """
    Score a single scheme against the query.
    Returns a float 0.0–1.0 representing confidence.
    """
    keywords = SCHEME_KEYWORDS.get(scheme_id, [])
    if not keywords:
        return 0.0

    score = 0.0
    total_weight = 0.0

    # 1. Direct keyword match (primary signal)
    for kw in keywords:
        total_weight += 1.0
        if normalize(kw) in query_normalized:
            score += 1.0

    # 2. Scheme name word matches (bonus)
    scheme_name_words = normalize(scheme.get("scheme_name", "")).split()
    query_words = [w for w in query_normalized.split() if len(w) > 2]
    for word in query_words:
        if word in scheme_name_words:
            score += 0.5
            total_weight += 0.5

    # 3. Category match (small bonus)
    category = normalize(scheme.get("category", ""))
    for word in query_words:
        if word in category:
            score += 0.3
            total_weight += 0.3

    return score / total_weight if total_weight > 0 else 0.0


def search_schemes(query: str) -> list[dict]:
    """
    Search all schemes and return them ranked by confidence.
    Returns: [{"scheme": {...}, "confidence": 0.82}, ...]
    """
    all_schemes = load_schemes()
    query_normalized = normalize(query)

    results = []
    for scheme in all_schemes:
        scheme_id = scheme.get("scheme_id", "")
        confidence = score_scheme(query_normalized, scheme_id, scheme)
        results.append({"scheme": scheme, "confidence": round(confidence, 4)})

    # Sort highest confidence first
    results.sort(key=lambda x: x["confidence"], reverse=True)
    return results


def get_scheme_by_id(scheme_id: str) -> Optional[dict]:
    """Get a single scheme by its ID (e.g., 'PM_KISAN')."""
    all_schemes = load_schemes()
    for scheme in all_schemes:
        if scheme.get("scheme_id") == scheme_id:
            return scheme
    return None


def get_all_schemes_summary() -> list[dict]:
    """Returns a brief summary of all schemes (for listing endpoint)."""
    all_schemes = load_schemes()
    return [
        {
            "scheme_id": s.get("scheme_id"),
            "scheme_name": s.get("scheme_name"),
            "category": s.get("category"),
            "who_for_short": s.get("who_is_it_for", {}).get("short", ""),
            "emoji": CATEGORY_EMOJIS.get(s.get("category", ""), "📋"),
        }
        for s in all_schemes
    ]


def get_emoji(category: str) -> str:
    return CATEGORY_EMOJIS.get(category, "📋")
