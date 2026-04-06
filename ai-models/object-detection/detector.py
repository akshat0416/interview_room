"""
Object Detector — Placeholder Implementation

This module provides a modular, reusable object detection interface.
The current implementation returns mock detections for development/testing.

To integrate a real model:
  1. Install the model framework (e.g. `pip install ultralytics` for YOLOv8)
  2. Load the model in __init__
  3. Replace the detect() body with real inference logic
"""

import io
import random
from typing import List, Dict, Any

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False




class ObjectDetector:
    """
    Pluggable object detector.

    Usage:
        detector = ObjectDetector()
        results = detector.detect(image_bytes)
        # results → [{"label": "person", "confidence": 0.95, "bbox": [x1, y1, x2, y2]}, ...]
    """

    def __init__(self, model_path: str | None = None, confidence_threshold: float = 0.5):
        """
        Initialize the detector.

        Args:
            model_path: Path to model weights. None uses the placeholder.
            confidence_threshold: Minimum confidence to include a detection.
        """
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self._model = None

        if model_path:
            self._load_model(model_path)

    def _load_model(self, model_path: str) -> None:
        """
        Load a real model from disk utilizing GPU if available.
        """
        try:
            from ultralytics import YOLO
            import torch
            
            self._model = YOLO(model_path)
            
            # Use CUDA (GPU) if available to ensure real-time performance on heavier models
            if torch.cuda.is_available():
                print("CUDA is available! Offloading YOLO to GPU...")
                self._model.to('cuda:0')
            else:
                print("CUDA not available. Running YOLO on CPU.")
                
        except ImportError:
            print("WARNING: ultralytics or torch is not installed. Run `pip install ultralytics torch`.")
            self._model = None

    def detect(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Run object detection on an image.

        Args:
            image_bytes: Raw image bytes (JPEG, PNG, etc.)

        Returns:
            List of detection dicts, each containing:
              - label (str): object class name
              - confidence (float): 0.0 – 1.0
              - bbox (list[int]): [x1, y1, x2, y2] pixel coordinates
        """
        if self._model is not None:
            return self._run_model_inference(image_bytes)

        print("WARNING: Using empty fallback since no model is loaded.")
        return {"detections": [], "flags": []}

    def _run_model_inference(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Run real model inference. Implement when a model is loaded.
        """
        if not HAS_PIL:
            raise ImportError("Pillow (PIL) is required for real inference. Run `pip install Pillow`.")

        try:
            # Convert bytes to PIL Image
            img = Image.open(io.BytesIO(image_bytes))
            
            # Convert RGBA to RGB if needed to avoid YOLO channel issues
            if img.mode != 'RGB':
                img = img.convert('RGB')
                
            # Run inference restricted to 640px to bound GPU memory usage safely
            results = self._model.predict(source=img, conf=self.confidence_threshold, imgsz=640, verbose=False)
            
            detections = []
            flags = []
            face_count = 0
            
            for r in results:
                for box in r.boxes:
                    obj_class_id = int(box.cls)
                    label = r.names[obj_class_id]
                    
                    # Track logic for specific flags
                    if label == "cell phone":
                        label = "phone"
                        if "PHONE_DETECTED" not in flags:
                            flags.append("PHONE_DETECTED")
                    elif label == "person":
                        label = "face"
                        face_count += 1
                        
                    # Format as [x, y, width, height]
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    w = x2 - x1
                    h = y2 - y1
                        
                    detections.append({
                        "label": label,
                        "confidence": round(float(box.conf), 4),
                        "bbox": [int(x1), int(y1), int(w), int(h)],
                    })
                    
            # Apply missing/multiple face logic directly in the backend payload
            if face_count == 0:
                flags.append("NO_FACE")
            elif face_count > 1:
                flags.append("MULTIPLE_FACES")
                
            return {
                "detections": detections,
                "flags": flags
            }
            
        except Exception as e:
            print(f"Error during YOLO inference: {e}")
            return {"detections": [], "flags": []}


