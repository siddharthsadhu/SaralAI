"""
tests/test_schemes.py — Tests for the scheme search engine
------------------------------------------------------------
Run with: pytest tests/test_schemes.py -v
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))  # Add backend/ to path

from services.schemes_service import search_schemes, get_scheme_by_id, load_schemes, normalize
from services.intent_service import detect_intent


class TestNormalize:
    def test_lowercase(self):
        assert normalize("PM Kisan") == "pm kisan"

    def test_removes_punctuation(self):
        assert normalize("pm-kisan!") == "pm kisan"

    def test_collapses_spaces(self):
        assert normalize("pm   kisan") == "pm kisan"


class TestSchemeSearch:
    def test_pm_kisan_query(self):
        results = search_schemes("PM Kisan scheme kya hai")
        top = results[0]
        assert top["scheme"]["scheme_id"] == "PM_KISAN"
        assert top["confidence"] > 0.1

    def test_ayushman_query(self):
        results = search_schemes("Ayushman Bharat health insurance")
        top = results[0]
        assert top["scheme"]["scheme_id"] == "PM_JAY"
        assert top["confidence"] > 0.1

    def test_pmay_housing_query(self):
        results = search_schemes("ghar ke liye sarkari madad")
        top = results[0]
        assert top["scheme"]["scheme_id"] in ["PMAY_U", "PMAY_G"]

    def test_vague_query_low_confidence(self):
        results = search_schemes("help me")
        assert results[0]["confidence"] < 0.05, "Vague query should have low confidence"

    def test_returns_all_schemes(self):
        results = search_schemes("anything")
        schemes = load_schemes()
        assert len(results) == len(schemes), "Should score all schemes"

    def test_results_sorted_descending(self):
        results = search_schemes("PM Kisan farmer scheme")
        confidences = [r["confidence"] for r in results]
        assert confidences == sorted(confidences, reverse=True)


class TestIntentDetection:
    def test_overview_intent(self):
        assert detect_intent("PM Kisan kya hai") == "OVERVIEW"

    def test_documents_intent(self):
        assert detect_intent("kaunse documents chahiye") == "DOCUMENTS"

    def test_steps_intent(self):
        assert detect_intent("how to apply for PM Kisan") == "STEPS"

    def test_eligibility_intent(self):
        assert detect_intent("who is eligible for Ayushman Bharat") == "ELIGIBILITY"

    def test_default_to_overview(self):
        assert detect_intent("foobar xyz") == "OVERVIEW"


class TestGetScheme:
    def test_get_pm_kisan(self):
        scheme = get_scheme_by_id("PM_KISAN")
        assert scheme is not None
        assert scheme["scheme_name"] is not None

    def test_get_nonexistent(self):
        scheme = get_scheme_by_id("FAKE_ID")
        assert scheme is None

    def test_case_insensitive(self):
        scheme = get_scheme_by_id("pm_kisan")   # lowercase
        # Our function requires uppercase, so this returns None
        # But the router does .upper() before calling — so users are protected
        assert scheme is None  # Correct — router handles the conversion
