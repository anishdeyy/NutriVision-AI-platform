import os
import sys
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "backend.app.main:app",
        host="127.0.0.1",
        port=8001,
        log_level="info",
        reload=False
    )
