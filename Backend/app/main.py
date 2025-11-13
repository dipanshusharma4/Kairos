from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.cors import CORSMiddleware
import sys
from pathlib import Path

# Handle imports for both running as module (app.main) and as script (main)
# When running from app directory with "uvicorn main:app", __package__ is None
# When running from Backend directory with "uvicorn app.main:app", __package__ is "app"
try:
    # Try relative imports first (works when run as app.main)
    from .api import auth as auth_router
    from .api import chat as chat_router
    from .api import users as users_router
    from .core.config import settings
    from .db.session import init_db
except (ImportError, ValueError):
    # Relative imports failed - we're running from app directory
    # Add parent directory to path to allow absolute imports
    app_dir = Path(__file__).parent
    backend_dir = app_dir.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    
    from app.api import auth as auth_router
    from app.api import chat as chat_router
    from app.api import users as users_router
    from app.core.config import settings
    from app.db.session import init_db

app = FastAPI(title="Kairos Wellness Companion")

# --- CORS Middleware ---
origins = [
    "http://localhost:3000",
    "http://34.56.91.122:3000",
    "https://kairos-wine.vercel.app",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ----------------------

app.add_middleware(SessionMiddleware, secret_key=settings.secret_key)

@app.on_event("startup")
async def startup_event():
    print("--- Application is starting up... ---")
    await init_db()
    print("--- Application startup complete. ---")

app.include_router(auth_router.router)
app.include_router(chat_router.router)
app.include_router(users_router.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Kairos API"}

