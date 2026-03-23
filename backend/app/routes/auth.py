"""
Authentication routes - JWT-based login, signup, and user info.
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.models import UserCreate, UserLogin, Token, UserOut
from app.database import get_user_by_email, get_user_by_id, create_user, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/signup", response_model=Token)
def signup(user: UserCreate):
    normalized_email = user.email.lower().strip()
    existing = get_user_by_email(normalized_email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = create_user(normalized_email, user.name, user.password, user.role.value)
    token = create_access_token({"sub": new_user["id"], "role": new_user["role"]})
    return Token(access_token=token, role=new_user["role"], name=new_user["name"], user_id=new_user["id"])


@router.post("/login", response_model=Token)
def login(user: UserLogin):
    normalized_email = user.email.lower().strip()
    found = get_user_by_email(normalized_email)
    if not found or not verify_password(user.password, found["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": found["id"], "role": found["role"]})
    return Token(access_token=token, role=found["role"], name=found["name"], user_id=found["id"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: dict = Depends(get_current_user)):
    return UserOut(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
    )
