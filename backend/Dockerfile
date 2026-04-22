# ─────────────────────────────────────────────────────────────────────────────
# SaralAI Backend Dockerfile
# Build: docker build -t saralai-backend .
# Run:   docker run -p 8000:8000 --env-file .env saralai-backend
# ─────────────────────────────────────────────────────────────────────────────

# Start from the official Python 3.12 slim image (small, secure, no bloat)
FROM python:3.12-slim

# Set working directory inside the container
WORKDIR /app

# ── Install system dependencies ───────────────────────────────────────────────
# libpq-dev: needed for psycopg2 (PostgreSQL adapter)
# curl: used by Railway's health check
# We clean up apt cache to keep the image small
RUN apt-get update && apt-get install -y \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ── Copy requirements first (Docker cache optimization) ───────────────────────
# If only code changes but not requirements.txt, Docker uses cached pip install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Copy all backend code ─────────────────────────────────────────────────────
COPY . .

# ── Expose port 8000 ──────────────────────────────────────────────────────────
EXPOSE 8000

# ── Health check: Railway polls this to decide if the app is healthy ──────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# ── Start the server ──────────────────────────────────────────────────────────
# --host 0.0.0.0  → listen on all interfaces (required in containers)
# --port 8000     → match the EXPOSE above
# --workers 2     → 2 Uvicorn worker processes (for multi-CPU handling)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
