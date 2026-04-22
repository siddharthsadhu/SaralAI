"""
services/gemini_service.py — Sarvam AI LLM Integration (sarvam-m)
------------------------------------------------------------------
NOTE: This file was previously the Google Gemini integration.
      It has been fully rewritten to use Sarvam AI's sarvam-m model.
      The filename is kept as gemini_service.py to minimise import changes
      across the codebase — the public function `simplify_scheme()` has
      the same signature as before.

Pipeline position: STAGE 2 of 4
  Input:  Scheme name + scheme data (from local DB or Wikipedia) + intent
  Output: English prose explanation (250-320 words), no markdown, no bullets

Two grounding strategies (decided at runtime):
  Path A — Local DB found   : inject scheme JSON as context, wiki_grounding=false
  Path B — DB miss + Wiki   : inject Wikipedia article as context, wiki_grounding=false
  Path C — DB miss + no Wiki: let sarvam-m use its training knowledge, wiki_grounding=true

Auth: Authorization: Bearer {SARVAM_API_KEY}
      (Different from STT/TTS/Translate which use api-subscription-key!)

IMPORTANT: Always call clean_llm_output() on the response before using it.
           sarvam-m is a reasoning model and may emit <think>...</think> blocks.
"""
import json
import requests
from config import settings
from services.text_utils import clean_llm_output
from services.wikipedia_service import fetch_scheme_from_wikipedia


# ── API Configuration ─────────────────────────────────────────────────────────
_CHAT_URL = "https://api.sarvam.ai/v1/chat/completions"
_MODEL    = "sarvam-m"

# ── System Prompts ────────────────────────────────────────────────────────────

_SYSTEM_PROMPT_LOCAL = """You are a kind, patient government scheme helper sitting with ordinary
Indian citizens — farmers, daily wage workers, homemakers, and elderly people — in their village.
These are honest, hardworking people who may not have studied much but absolutely deserve to
know their rights and the benefits they are entitled to.

Your job is to explain the given government scheme in simple, warm, conversational English —
the way a caring elder would explain it to a younger family member.

Follow these rules carefully:
- Write in flowing paragraphs, exactly like spoken words — DO NOT use bullet points, dashes,
  asterisks, or any markdown formatting whatsoever
- DO NOT use abbreviations — write "Pradhan Mantri" not "PM", write "rupees" not "₹"
- State amounts clearly and relatably: say "six thousand rupees every year" not "6,000 p.a."
- Use warm, simple words. If there is an eligibility rule, explain it like: "So, for example,
  if you are a farmer who owns land in your family's name..."
- End with a helpful, encouraging sentence about how to apply or where to get help
- DO NOT include any website URLs or links in the body of the text
- Write between 250 and 320 words — enough to be informative but easy to listen to
- ALWAYS refer to the scheme by its actual real name in the text. DO NOT use generic phrases like "this scheme" or "the scheme".

MOST IMPORTANT RULE: You MUST use ONLY the information provided in the scheme data. Do not
add, guess, assume, or invent ANY detail that is not in the provided data. If something is
not mentioned, do not mention it."""

_SYSTEM_PROMPT_WIKI = """You are a kind, patient government helper sitting with ordinary 
Indian citizens — farmers, daily wage workers, homemakers, and elderly people — in their village.

Your job is to explain the given government scheme in simple, warm, conversational English —
the way a caring elder would explain it to a younger family member.

Follow these rules carefully:
- Write in flowing paragraphs — DO NOT use bullet points, dashes, asterisks, or markdown
- DO NOT use abbreviations — write "Pradhan Mantri" not "PM", write "rupees" not "₹"
- State amounts clearly: say "six thousand rupees every year" not "₹6,000 p.a."
- Use warm, simple words and end with encouragement about how to apply
- DO NOT include any website URLs or links in the body of the text
- Write between 250 and 320 words

MOST IMPORTANT RULE: You MUST use ONLY the information in the Wikipedia article provided.
Do not add, guess, assume, or invent ANY detail not written in that article."""

_SYSTEM_PROMPT_FALLBACK = """You are a kind, patient government helper explaining a government
scheme to ordinary Indian citizens — farmers, daily wage workers, and elderly people.

Explain in simple, warm, conversational English — like a caring elder speaking to family.
No bullet points, no markdown, no rupee symbols (say "rupees" instead), no URLs.

IMPORTANT HONESTY RULE: Only mention facts you are absolutely certain about. If you are
unsure of any specific detail — amounts, dates, eligibility numbers — do NOT mention it.
If you are not confident the scheme exists or have limited information, say so plainly and
with kindness. It is better to say less accurately than more incorrectly."""


def _build_local_db_messages(scheme: dict, intent: str, user_query: str) -> list[dict]:
    """Build messages using local scheme JSON as grounding context."""
    # Extract only the fields the LLM needs (keeps token count low)
    scheme_facts = {
        "scheme_name":          scheme.get("scheme_name"),
        "category":             scheme.get("category"),
        "who_is_it_for":        scheme.get("who_is_it_for", {}),
        "benefits":             scheme.get("benefits", {}),
        "eligibility_criteria": scheme.get("eligibility_criteria", [])[:5],
        "required_documents":   scheme.get("required_documents", []),
        "application_process":  scheme.get("application_process", {}),
        "limitations_and_notes": scheme.get("limitations_and_notes", [])[:2],
    }

    intent_instruction = {
        "OVERVIEW":     f"Give a warm overview of what the {scheme.get('scheme_name')} is and who it helps.",
        "ELIGIBILITY":  f"Focus on explaining who is eligible and who is not for the {scheme.get('scheme_name')}, in simple terms.",
        "DOCUMENTS":    f"Explain what documents are needed for the {scheme.get('scheme_name')} and why each one matters.",
        "STEPS":        f"Walk through the application steps for the {scheme.get('scheme_name')} in simple, encouraging language.",
    }.get(intent, f"Give a warm overview of what the {scheme.get('scheme_name')} is and who it helps.")

    user_content = (
        f"Please explain the government scheme '{scheme.get('scheme_name')}' "
        f"based ONLY on the data below. Keep using the name '{scheme.get('scheme_name')}' instead of 'this scheme'.\n\n"
        f"INSTRUCTION: {intent_instruction}\n\n"
        f"USER'S QUESTION: \"{user_query}\"\n\n"
        f"SCHEME DATA:\n"
        f"────────────────────────────────────────────────────────────\n"
        f"{json.dumps(scheme_facts, ensure_ascii=False, indent=2)}\n"
        f"────────────────────────────────────────────────────────────"
    )

    return [
        {"role": "system", "content": _SYSTEM_PROMPT_LOCAL},
        {"role": "user",   "content": user_content},
    ]


def _build_wikipedia_messages(scheme_name: str, wiki: dict) -> list[dict]:
    """Build messages using a Wikipedia article as grounding context."""
    user_content = (
        f"Please explain the government scheme '{scheme_name}' based ONLY on the "
        f"Wikipedia article below. Do not add anything not written in this article.\n\n"
        f"Wikipedia Article: {wiki['title']}\n"
        f"────────────────────────────────────────────────────────────\n"
        f"{wiki['content']}\n"
        f"────────────────────────────────────────────────────────────"
    )

    return [
        {"role": "system", "content": _SYSTEM_PROMPT_WIKI},
        {"role": "user",   "content": user_content},
    ]


def _build_fallback_messages(scheme_name: str) -> list[dict]:
    """Build messages when no grounding context is available."""
    return [
        {"role": "system", "content": _SYSTEM_PROMPT_FALLBACK},
        {"role": "user",   "content": (
            f"Please explain the Indian government scheme '{scheme_name}' in a warm, "
            f"conversational way. Keep using the name '{scheme_name}' instead of saying 'this scheme'. "
            f"Only mention facts you are absolutely certain about."
        )},
    ]


def _call_sarvam_m(messages: list[dict], wiki_grounding: bool) -> str:
    """
    Make the API call to sarvam-m and return the cleaned response text.

    CRITICAL: LLM uses Bearer auth — different from api-subscription-key
              used by STT, Translation, and TTS endpoints.
    """
    headers = {
        "Authorization": f"Bearer {settings.sarvam_api_key}",
        "Content-Type":  "application/json",
    }

    payload = {
        "model":          _MODEL,
        "wiki_grounding": wiki_grounding,
        "messages":       messages,
    }

    response = requests.post(
        _CHAT_URL,
        json=payload,
        headers=headers,
        timeout=60,
    )

    if response.status_code == 403:
        raise ValueError("Sarvam API key invalid or missing. Check SARVAM_API_KEY in .env")
    if response.status_code == 429:
        raise ValueError("Sarvam API quota exceeded. Please check your dashboard.")

    response.raise_for_status()

    raw = response.json()["choices"][0]["message"]["content"]
    return clean_llm_output(raw)


async def simplify_scheme(
    scheme: dict,
    intent: str,
    language: str,
    user_query: str,
) -> dict:
    """
    Generate a warm English explanation of a government scheme using sarvam-m.

    This function has the SAME SIGNATURE as the old Gemini version so that
    query.py needs minimal changes.

    Grounding strategy (in priority order):
      1. Local scheme JSON (scheme dict with data) — primary, best quality
      2. Wikipedia article — fallback if scheme has no/minimal local data
      3. sarvam-m training knowledge — last resort, with strict honesty prompt

    NOTE: `language` parameter is accepted but NOT used here anymore.
          Translation is now handled separately by translation_service.py.
          sarvam-m always outputs English.

    Args:
        scheme:     Scheme dict from local DB (may be empty dict if not found)
        intent:     OVERVIEW | ELIGIBILITY | DOCUMENTS | STEPS
        language:   Target language code (accepted for API compat, not used here)
        user_query: The user's original question

    Returns:
        {
            "summary":     str,        # English prose, 250-320 words
            "key_points":  list[str],  # Structural points (from scheme data)
            "simple_steps": list[str], # Application steps (from scheme data)
            "ai_used":     bool,       # True = sarvam-m was called
            "source_type": str,        # "local_db" | "wikipedia" | "training_knowledge"
            "source_url":  str|None,   # Wikipedia URL if applicable
        }
    """
    scheme_name = scheme.get("scheme_name", user_query)

    # ── Determine if we have meaningful local data ─────────────────────────────
    has_local_data = bool(scheme.get("scheme_id") and scheme.get("benefits"))

    source_url  = None
    source_type = "local_db"

    try:
        if has_local_data:
            # Path A: Use local scheme JSON as context (best quality, no Wikipedia needed)
            messages      = _build_local_db_messages(scheme, intent, user_query)
            wiki_grounding = False
            source_type   = "local_db"

        else:
            # Path B/C: Scheme not found in local DB — try Wikipedia
            wiki = fetch_scheme_from_wikipedia(scheme_name)

            if wiki:
                messages       = _build_wikipedia_messages(scheme_name, wiki)
                wiki_grounding = False
                source_type    = "wikipedia"
                source_url     = wiki["url"]
            else:
                # Path C: No Wikipedia either — let sarvam-m use its own knowledge
                messages       = _build_fallback_messages(scheme_name)
                wiki_grounding = True
                source_type    = "training_knowledge"

        summary = _call_sarvam_m(messages, wiki_grounding)

        # Build structural lists from scheme data (if available)
        key_points = []
        simple_steps = []

        if has_local_data:
            key_points = scheme.get("benefits", {}).get("details", [])[:5]
            simple_steps = scheme.get("application_process", {}).get("steps", [])[:5]

        return {
            "summary":      summary,
            "key_points":   key_points,
            "simple_steps": simple_steps,
            "ai_used":      True,
            "source_type":  source_type,
            "source_url":   source_url,
        }

    except Exception as e:
        print(f"[sarvam-m] Error (falling back to scheme data): {e}")
        return _fallback_explanation(scheme, intent)


def _fallback_explanation(scheme: dict, intent: str) -> dict:
    """
    Used when sarvam-m is unavailable. Pulls data directly from scheme dict.
    Returns structured data without any AI-generated prose.
    """
    eligibility = [c.get("condition", "") for c in scheme.get("eligibility_criteria", [])]
    benefits    = scheme.get("benefits", {}).get("details",
                  [scheme.get("benefits", {}).get("short", "")])
    steps       = scheme.get("application_process", {}).get("steps", [])
    summary     = scheme.get("who_is_it_for", {}).get("short",
                  scheme.get("scheme_name", ""))

    return {
        "summary":      summary,
        "key_points":   (eligibility + benefits)[:5],
        "simple_steps": steps[:5],
        "ai_used":      False,
        "source_type":  "local_db",
        "source_url":   None,
    }
