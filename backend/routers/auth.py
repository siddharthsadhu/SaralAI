from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import jwt
import datetime

from database import AsyncSessionLocal
from models.db_models import User
from config import settings

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# Dependency to get DB session
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

class GoogleAuthRequest(BaseModel):
    credential: str

class AuthUserResponse(BaseModel):
    id: int
    email: str
    name: str | None
    picture: str | None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm="HS256")
    return encoded_jwt

@router.post("/google", response_model=AuthResponse)
async def google_auth(request: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    if not settings.google_client_id:
        raise HTTPException(status_code=500, detail="Google Client ID not configured in backend")
    
    try:
        # Verify the Google JWT token
        idinfo = id_token.verify_oauth2_token(
            request.credential, 
            requests.Request(), 
            settings.google_client_id,
            clock_skew_in_seconds=60
        )
        
        # ID token is valid. Get the user's Google Account ID
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name')
        picture = idinfo.get('picture')
        
    except ValueError as e:
        print(f"Google Auth ValueError: {e}")
        # Invalid token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google credential: {str(e)}",
        )
        
    # Check if user exists
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalars().first()
    
    if not user:
        # Create new user
        user = User(
            google_id=google_id,
            email=email,
            name=name,
            picture=picture
        )
        db.add(user)
        try:
            await db.commit()
            await db.refresh(user)
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=500, detail="Database error occurred.")
            
    # Generate local JWT
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    
    return AuthResponse(
        access_token=access_token,
        user=AuthUserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            picture=user.picture
        )
    )
