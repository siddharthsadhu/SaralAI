"""
services/text_utils.py — Text Cleaning Utilities for Sarvam AI Pipeline
------------------------------------------------------------------------
Two essential functions that must be called around sarvam-m and Bulbul v3:

1. clean_llm_output()   — strip <think>...</think> blocks that sarvam-m (a
                           reasoning model) sometimes emits before its answer.
2. clean_text_for_tts() — strip markdown, URLs, rupee symbols etc. so that
                           Bulbul v3 reads the text naturally instead of
                           reading punctuation aloud literally.

Ported directly from the Yojana Voice production services layer.
"""
import re


def clean_llm_output(text: str) -> str:
    """
    Remove internal reasoning blocks from sarvam-m output.

    sarvam-m is a reasoning model. Before giving its final answer it sometimes
    emits a <think>...</think> block (or the Hindi variant <सोचिए>...</think>).
    These must be stripped before storing or translating the summary.

    Args:
        text: Raw response string from sarvam-m

    Returns:
        Clean text with all reasoning artifacts removed.
    """
    if not text:
        return ""

    # Remove standard <think>...</think> blocks (multiline)
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE)

    # Remove Hindi variant <सोचिए>...</think>
    text = re.sub(r"<सोचिए>.*?</think>", "", text, flags=re.DOTALL)

    # Remove any stray opening/closing tags left behind
    text = re.sub(r"</?think>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"</?सोचिए>", "", text)

    # Collapse 3+ consecutive blank lines into 2
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def clean_text_for_tts(text: str) -> str:
    """
    Prepare text for Bulbul v3 TTS.

    TTS engines read everything literally. If markdown symbols are present,
    Bulbul will say "asterisk asterisk bold asterisk asterisk" instead of
    reading the word naturally. This function removes all such symbols.

    Transformations applied (in order):
      - Markdown links [visible](url)  → visible text only
      - Bare https:// URLs             → removed entirely
      - **bold** / *italic*            → plain text
      - __underline__                  → plain text
      - # Heading                      → Heading (hash removed)
      - Bullet dashes/dots (- / •)     → removed
      - ₹ symbol                       → "rupees " (spoken naturally)
      - `backtick` code                → plain text
      - Multiple spaces                → single space
      - 3+ blank lines                 → 2 blank lines

    Args:
        text: Translated text ready for TTS

    Returns:
        Clean, symbol-free text suitable for Bulbul v3.
    """
    if not text:
        return ""

    # 1. Markdown links: [visible text](url) → visible text
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)

    # 2. Bare URLs (http/https)
    text = re.sub(r'https?://\S+', '', text)

    # 3. Bold (**text** or __text__)
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'__(.+?)__', r'\1', text)

    # 4. Italic (*text* or _text_)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'_(.+?)_', r'\1', text)

    # 5. Markdown headings (# Heading)
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)

    # 6. Bullet points (lines starting with - or •)
    text = re.sub(r'^[\-•]\s+', '', text, flags=re.MULTILINE)

    # 7. Rupee symbol → spoken form
    text = text.replace('₹', 'rupees ')

    # 8. Backtick code spans
    text = re.sub(r'`(.+?)`', r'\1', text)

    # 9. Collapse multiple spaces
    text = re.sub(r'  +', ' ', text)

    # 10. Collapse 3+ blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)

    return text.strip()
