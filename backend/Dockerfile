# ─────────────────────────────────────────────────────────────────────────────
# SaralAI Backend — Production Dockerfile for Render
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# System dependencies for PostgreSQL + health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
# NOTE: Any edit to this file busts the Docker cache for pip install
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    python -c "import google.auth; import jwt; import sqlalchemy; import asyncpg; print('✅ All packages installed')"

# Copy application code
COPY . .

# Render sets PORT env var; default to 8000 if not set
ENV PORT=8000

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Use shell form so $PORT is expanded at runtime
# Single worker for free-tier memory; 0.0.0.0 is mandatory for containers
CMD uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
