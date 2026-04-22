# SaralAI Backend — One-Click Setup Script
# Run this once to set up your Python environment
# Usage: .\setup.ps1

Write-Host "
╔══════════════════════════════════════╗
║  SaralAI Backend Setup               ║
╚══════════════════════════════════════╝
" -ForegroundColor Cyan

# ── Step 1: Check Python version ──────────────────────────────────────────────
Write-Host "► Checking Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Python not found. Install Python 3.12 from python.org" -ForegroundColor Red
    exit 1
}
Write-Host "✓ $pythonVersion" -ForegroundColor Green

# ── Step 2: Create virtual environment ────────────────────────────────────────
Write-Host "► Creating virtual environment..." -ForegroundColor Yellow
if (-not (Test-Path "venv")) {
    python -m venv venv
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "✓ Virtual environment already exists" -ForegroundColor Green
}

# ── Step 3: Activate and install dependencies ──────────────────────────────────
Write-Host "► Installing dependencies..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt --quiet
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# ── Step 4: Check for .env file ────────────────────────────────────────────────
Write-Host "► Checking .env file..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "⚠  .env created from template. EDIT IT NOW — add your GEMINI_API_KEY!" -ForegroundColor Red
    Write-Host "   Open: c:\Users\siddh\Desktop\SaralAI\backend\.env" -ForegroundColor Yellow
    Write-Host "   Get API key: https://aistudio.google.com" -ForegroundColor Yellow
} else {
    Write-Host "✓ .env file exists" -ForegroundColor Green
}

# ── Step 5: Check if schemes.json is in place ─────────────────────────────────
if (-not (Test-Path "data/schemes.json")) {
    Write-Host "► Copying Schemes.json from frontend..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "data" -Force | Out-Null
    Copy-Item "../src/Schemes.json" "data/schemes.json"
    Write-Host "✓ schemes.json ready" -ForegroundColor Green
} else {
    Write-Host "✓ schemes.json already in place" -ForegroundColor Green
}

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host "
✅ Setup complete!

Next steps:
  1. Edit .env and add your GEMINI_API_KEY
     Get it at: https://aistudio.google.com

  2. Start the server:
     uvicorn main:app --reload --port 8000

  3. Open Swagger UI:
     http://localhost:8000/docs

  4. Run tests:
     pytest tests/ -v
" -ForegroundColor Cyan
