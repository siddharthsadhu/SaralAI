"""
services/intent_service.py — Intent Detection
-----------------------------------------------
Classifies user queries into one of four intent buckets:
  OVERVIEW      → What is this scheme?
  ELIGIBILITY   → Who qualifies? Can I apply?
  DOCUMENTS     → What documents do I need?
  STEPS         → How do I apply? What are the steps?

Python port of the INTENT_KEYWORDS map from frontend/src/ai.js.
"""

INTENT_KEYWORDS: dict[str, list[str]] = {
    "DOCUMENTS": [
        "document", "documents", "papers", "paper", "proof", "certificate",
        "kya chahiye", "kaunse", "kaagaz", "kaagzat", "dastavez",
        "required", "need", "bring", "carry", "submit", "upload",
        "aadhaar", "voter", "ration card", "birth certificate"
    ],
    "STEPS": [
        "apply", "application", "process", "how to", "kaise", "step",
        "steps", "procedure", "register", "registration", "fill", "form",
        "where to go", "kahan", "aavedan", "apply karna", "kya karna",
        "karna hai"
    ],
    "ELIGIBILITY": [
        "eligible", "eligibility", "who can", "qualify", "criteria",
        "condition", "paatra", "paatrata", "kaun", "milega", "mil sakta",
        "who gets", "can i apply", "am i eligible", "requirements", "income"
    ],
    "OVERVIEW": [
        "what is", "kya hai", "tell me", "explain", "about", "details",
        "info", "information", "bataiye", "batao", "janakari", "samjhaiye",
        "overview", "scheme", "yojana", "help", "benefit", "faida", "labh"
    ],
}


def detect_intent(query: str) -> str:
    """
    Detect the user's intent by counting keyword matches.
    Returns one of: 'OVERVIEW', 'ELIGIBILITY', 'DOCUMENTS', 'STEPS'
    """
    query_lower = query.lower()

    scores: dict[str, int] = {intent: 0 for intent in INTENT_KEYWORDS}

    for intent, keywords in INTENT_KEYWORDS.items():
        for kw in keywords:
            if kw in query_lower:
                scores[intent] += 1

    # Find highest scoring intent
    best_intent = max(scores, key=lambda k: scores[k])

    # If nothing matched → default to OVERVIEW
    return best_intent if scores[best_intent] > 0 else "OVERVIEW"


# ── Intent → language-specific prompt modifier ────────────────────────────────
INTENT_PROMPT_MODIFIERS: dict[str, str] = {
    "OVERVIEW": "Give a simple overview of this scheme. What is it, who benefits, what are the key benefits?",
    "ELIGIBILITY": "Focus on explaining the eligibility criteria. Who qualifies? Who does not qualify?",
    "DOCUMENTS": "List all the documents the applicant needs to gather. Be very specific and practical.",
    "STEPS": "Explain the step-by-step process to apply for this scheme. Make each step actionable.",
}


def get_intent_prompt_modifier(intent: str) -> str:
    return INTENT_PROMPT_MODIFIERS.get(intent, INTENT_PROMPT_MODIFIERS["OVERVIEW"])
