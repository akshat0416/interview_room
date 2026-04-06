"""
Model Serving API — FastAPI microservice

Exposes AI model inference (object detection) as a REST API.
Runs independently on port 8002.

Usage:
    uvicorn app:app --host 0.0.0.0 --port 8002 --reload
"""

import sys
import os
import time
import asyncio
import importlib.util

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Load the object-detection module (hyphenated directory name requires importlib)
_AI_MODELS_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DETECTOR_PATH = os.path.join(_AI_MODELS_DIR, "object-detection", "detector.py")
_spec = importlib.util.spec_from_file_location("detector", _DETECTOR_PATH)
if _spec is None or _spec.loader is None:
    raise ImportError(f"Cannot load object-detection module from {_DETECTOR_PATH}")
_detector_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_detector_module)
ObjectDetector = _detector_module.ObjectDetector

# Initialize detector (yolov8s.pt with GPU support for accurate inference)
detector = ObjectDetector(model_path="yolov8s.pt", confidence_threshold=0.5)

# FastAPI app
app = FastAPI(
    title="AI Model Serving API",
    description="Microservice for AI model inference — Object Detection",
    version="1.0.0",
)

# CORS — allow requests from the backend and frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "model-serving",
        "model_loaded": detector._model is not None,
        "mode": "production" if detector._model else "placeholder",
    }


@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    """
    Run object detection on an uploaded image.

    Accepts: image file (JPEG, PNG, BMP, etc.) via multipart/form-data.
    Returns: JSON list of detected objects.

    Response format:
    {
        "detections": [
            {
                "label": "person",
                "confidence": 0.95,
                "bbox": [x, y, w, h]
            }
        ],
        "flags": ["NO_FACE", "PHONE_DETECTED"],
        "count": 1,
        "inference_time_ms": 12.5
    }
    """
    # Validate content type
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{content_type}'. Expected an image file (JPEG, PNG, etc.).",
        )

    try:
        image_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {e}")

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Run detection (offloaded to thread so it doesn't block the async event loop)
    start_time = time.time()
    try:
        detection_result = await asyncio.to_thread(detector.detect, image_bytes)
        detections = detection_result.get("detections", [])
        flags = detection_result.get("flags", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {e}")
    inference_time_ms = round((time.time() - start_time) * 1000, 2)

    return {
        "detections": detections,
        "flags": flags,
        "count": len(detections),
        "inference_time_ms": inference_time_ms,
    }


@app.get("/")
def root():
    """Root endpoint with service info."""
    return {
        "service": "AI Model Serving API",
        "version": "1.0.0",
        "endpoints": {
            "POST /detect": "Run object detection on an image",
            "GET /health": "Health check",
        },
    }
