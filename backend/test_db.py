import asyncio
from database import AsyncSessionLocal
from sqlalchemy import select
from models.db_models import User
async def test():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == 1))
        user = result.scalars().first()
        print(user.id, user.email)
asyncio.run(test())
