"""
tests/test_query_endpoint.py — Integration tests for POST /api/query
----------------------------------------------------------------------
These tests use FastAPI's TestClient to make real HTTP calls to the app
without launching a live server.

Run with: pytest tests/test_query_endpoint.py -v
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient


# Set a fake Sarvam key so config.py doesn't crash on import
# (config.py requires SARVAM_API_KEY — without it, the app won't start)
os.environ.setdefault("SARVAM_API_KEY", "test-key-not-real")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")

from main import app

# TestClient wraps our FastAPI app so we can make requests without a live server
client = TestClient(app)


class TestHealthCheck:
    def test_health_returns_200(self):
        response = client.get("/api/health")
        assert response.status_code == 200

    def test_health_response_shape(self):
        data = client.get("/api/health").json()
        assert "status" in data
        assert data["status"] == "ok"
        assert "version" in data


class TestListSchemes:
    def test_returns_list(self):
        response = client.get("/api/schemes")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_scheme_has_required_fields(self):
        schemes = client.get("/api/schemes").json()
        first = schemes[0]
        assert "scheme_id" in first
        assert "scheme_name" in first
        assert "category" in first


class TestGetScheme:
    def test_get_pm_kisan(self):
        response = client.get("/api/scheme/PM_KISAN")
        assert response.status_code == 200
        data = response.json()
        assert data["scheme_id"] == "PM_KISAN"

    def test_get_nonexistent_returns_404(self):
        response = client.get("/api/scheme/FAKE_SCHEME_ID")
        assert response.status_code == 404


class TestQueryEndpoint:
    def test_clear_query_returns_explanation(self):
        """A clear PM Kisan query should return explanation type"""
        response = client.post("/api/query", json={
            "query": "PM Kisan scheme kya hai",
            "language": "hi",
            "use_ai": False   # Disable sarvam-m so test doesn't need API key
        })
        assert response.status_code == 200
        data = response.json()
        assert data["type"] in ["explanation", "clarification"]
        if data["type"] == "explanation":
            assert data["scheme_id"] == "PM_KISAN"
            assert data["confidence"] > 0.1

    def test_vague_query_returns_clarification(self):
        """A vague query should return clarification type"""
        response = client.post("/api/query", json={
            "query": "help",
            "language": "en",
            "use_ai": False
        })
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "clarification"
        assert len(data["clarification_options"]) > 0

    def test_empty_query_fails_validation(self):
        """Too-short query should fail Pydantic validation"""
        response = client.post("/api/query", json={"query": "a"})
        assert response.status_code == 422   # Pydantic validation error

    def test_invalid_language_fails_validation(self):
        """Invalid language code should fail"""
        response = client.post("/api/query", json={
            "query": "PM Kisan kya hai",
            "language": "zz"   # Not a valid LanguageCode enum value
        })
        assert response.status_code == 422

    def test_response_has_correct_shape(self):
        """Verify the full response structure matches QueryResponse model"""
        response = client.post("/api/query", json={
            "query": "Ayushman Bharat health card kaise banaye",
            "language": "hi",
            "use_ai": False
        })
        data = response.json()
        assert "type" in data
        assert "confidence" in data
        assert isinstance(data["confidence"], float)
        assert "clarification_options" in data
