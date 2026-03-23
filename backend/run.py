"""
Entry point for running the AI Interview Room backend server.
"""
import sys
import os

# Ensure the backend directory is in the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn
from app.main import socket_app

if __name__ == "__main__":
    uvicorn.run(socket_app, host="0.0.0.0", port=8001, ws="websockets")
