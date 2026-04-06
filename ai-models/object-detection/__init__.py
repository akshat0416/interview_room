"""
Object Detection Module — AI Interview System

Provides a pluggable object detection interface.
Swap the placeholder with a real model (YOLOv8, TensorFlow, etc.) for production.
"""

from .detector import ObjectDetector

__all__ = ["ObjectDetector"]
