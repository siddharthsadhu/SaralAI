from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from database import AsyncSessionLocal
from models.db_models import Feedback, User

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

class FeedbackRequest(BaseModel):
    user_id: int
    user_email: str
    text: str

@router.post("")
async def submit_feedback(request: FeedbackRequest, db: AsyncSession = Depends(get_db)):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Feedback text cannot be empty.")
        
    feedback = Feedback(
        user_id=request.user_id,
        user_email=request.user_email,
        text=request.text
    )
    db.add(feedback)
    
    try:
        await db.commit()
        return {"status": "success", "message": "Feedback submitted successfully."}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save feedback.")
