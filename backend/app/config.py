import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "blue-planet-solutions-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# AI Model Serving microservice URL
MODEL_SERVING_URL = os.getenv("MODEL_SERVING_URL", "http://localhost:8002")

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://localhost:8001",
    "http://127.0.0.1:8001",
]
