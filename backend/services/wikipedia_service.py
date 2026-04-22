"""
services/wikipedia_service.py — Wikipedia Grounding (Free, No API Key)
-----------------------------------------------------------------------
Fetches a plain-text Wikipedia article about a government scheme so the
LLM can explain it from verified facts instead of hallucinating amounts,
dates, or eligibility rules.

This is only called as a FALLBACK when the scheme is NOT found in our
local schemes.json database.  The local DB is primary; Wikipedia is the
safety net for schemes we haven't curated yet.

Ported and adapted from the Yojana Voice production services layer.
"""
import requests
from typing import Optional


# Wikipedia REST API base URL
_WIKI_BASE = "https://en.wikipedia.org/w/api.php"

# Identify our bot politely (Wikipedia best practice)
_WIKI_HEADERS = {
    "User-Agent": "SaralAI/1.0 (Indian government scheme assistant; educational)"
}

# Quality thresholds
_MIN_CONTENT_LENGTH = 250   # Ignore stubs shorter than this
_MAX_CONTENT_LENGTH = 4000  # Truncate to this before passing to LLM

# Number of search results to try fetching
_MAX_SEARCH_RESULTS = 5
_MAX_FETCH_ATTEMPTS = 3


def fetch_scheme_from_wikipedia(scheme_name: str) -> Optional[dict]:
    """
    Search Wikipedia for a government scheme and return a plain-text extract.

    Two-step process:
      Step 1 — Search: find page IDs matching "{scheme_name} India government scheme"
      Step 2 — Fetch:  get the plain-text extract from the best matching page

    Quality guards applied:
      - Skip disambiguation pages (title contains "disambiguation" or "may refer to")
      - Skip stubs (content shorter than 250 characters)
      - Truncate content to 4000 characters before returning

    Args:
        scheme_name: The name of the scheme (e.g. "PM Kisan", "Ayushman Bharat")

    Returns:
        {
            "title":   str,   # Wikipedia article title
            "content": str,   # Plain-text extract (max 4000 chars)
            "url":     str,   # Full Wikipedia URL for attribution
        }
        Returns None if no suitable article is found.
    """
    # ── Step 1: Search Wikipedia ──────────────────────────────────────────────
    try:
        search_resp = requests.get(
            _WIKI_BASE,
            params={
                "action":   "query",
                "list":     "search",
                "srsearch": f"{scheme_name} India government scheme",
                "srlimit":  _MAX_SEARCH_RESULTS,
                "format":   "json",
                "utf8":     1,
            },
            headers=_WIKI_HEADERS,
            timeout=10,
        )
        search_resp.raise_for_status()
        search_data = search_resp.json()
    except Exception as e:
        print(f"[Wikipedia] Search failed for '{scheme_name}': {e}")
        return None

    search_results = search_data.get("query", {}).get("search", [])
    if not search_results:
        return None

    # ── Step 2: Fetch extract from best matching page ─────────────────────────
    for result in search_results[:_MAX_FETCH_ATTEMPTS]:
        page_id = result.get("pageid")
        title = result.get("title", "")

        # Skip disambiguation pages
        if "disambiguation" in title.lower():
            continue

        try:
            extract_resp = requests.get(
                _WIKI_BASE,
                params={
                    "action":      "query",
                    "prop":        "extracts",
                    "pageids":     page_id,
                    "explaintext": True,
                    "exlimit":     1,
                    "format":      "json",
                },
                headers=_WIKI_HEADERS,
                timeout=10,
            )
            extract_resp.raise_for_status()
            extract_data = extract_resp.json()
        except Exception as e:
            print(f"[Wikipedia] Fetch failed for page {page_id}: {e}")
            continue

        pages = extract_data.get("query", {}).get("pages", {})
        page = pages.get(str(page_id), {})
        content = page.get("extract", "").strip()

        # Quality guards
        if len(content) < _MIN_CONTENT_LENGTH:
            continue
        if "may refer to" in content[:300].lower():
            continue  # Disambiguation page content

        # Truncate to LLM-safe length
        if len(content) > _MAX_CONTENT_LENGTH:
            content = content[:_MAX_CONTENT_LENGTH]

        wiki_url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"

        print(f"[Wikipedia] Found article: '{title}' ({len(content)} chars)")
        return {
            "title":   title,
            "content": content,
            "url":     wiki_url,
        }

    print(f"[Wikipedia] No suitable article found for '{scheme_name}'")
    return None
