"""
database.py — Async Database Connection & SQLAlchemy Setup
----------------------------------------------------------
Sets up the async database engine and session factory.
All database operations in this project are async (non-blocking).

Supports both:
  - SQLite   (local dev, default)  — sqlite+aiosqlite:///./saralai_dev.db
  - PostgreSQL (production/Railway) — postgresql+asyncpg://...
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from config import settings


# ── Build engine kwargs based on DB type ──────────────────────────────────────
# pool_size / max_overflow are PostgreSQL-only; SQLite doesn't support them.
_is_postgres = settings.database_url.startswith("postgresql")

_engine_kwargs = {
    "echo": settings.debug,   # Print SQL to console in debug mode
}
if _is_postgres:
    _engine_kwargs["pool_size"]     = 5   # Keep 5 connections always open
    _engine_kwargs["max_overflow"]  = 10  # Allow 10 more if busy



# ── Create the async engine ───────────────────────────────────────────────────
engine = create_async_engine(settings.database_url, **_engine_kwargs)

# ── Session factory: creates new DB sessions for each request ─────────────────
# `expire_on_commit=False` → objects remain usable after commit (important for async)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)



# ── Base class for all ORM models ─────────────────────────────────────────────
# Any class that inherits from `Base` becomes a database table
class Base(DeclarativeBase):
    pass


# ── Utility: create all tables ────────────────────────────────────────────────
# Called once on startup (in main.py lifespan)
async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
