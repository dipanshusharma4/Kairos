from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from pathlib import Path
import os
import sys

# Find .env file - look in app directory first, then parent directory
app_dir = Path(__file__).parent.parent
env_file_app = app_dir / ".env"
env_file_parent = app_dir.parent / ".env"
env_file = env_file_app if env_file_app.exists() else env_file_parent

# Check if .env file exists, if not provide helpful error
if not env_file.exists():
    print("\n" + "="*60)
    print("[ERROR] .env file not found!")
    print("="*60)
    print(f"Looking for .env file in:")
    print(f"  1. {env_file_app}")
    print(f"  2. {env_file_parent}")
    print("\nTo fix this:")
    print("  1. Run the setup script: python setup.py")
    print("  2. Or create a .env file manually in Backend/app/.env")
    print("  3. See README.md for required environment variables")
    print("="*60 + "\n")
    sys.exit(1)

class Settings(BaseSettings):
    # --- Existing Settings ---
    secret_key: str = Field(..., alias="SECRET_KEY")
    algorithm: str = Field("HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(60 * 24 * 7, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    mongodb_url: str = Field("mongodb://localhost:27017", alias="MONGODB_URL")
    mongodb_db: str = Field("mental_wellness", alias="MONGODB_DB")
    redis_url: str = Field("redis://localhost:6379/0", alias="REDIS_URL")
    fernet_key: str = Field(..., alias="FERNET_KEY")
    
    # Groq API Configuration
    groq_api_key: str = Field(..., alias="GROQ_API_KEY")
    groq_model: str = Field("mixtral-8x7b-32768", alias="GROQ_MODEL")

    # --- Google OAuth Settings (Optional for development) ---
    google_client_id: str = Field("", alias="GOOGLE_CLIENT_ID")
    google_client_secret: str = Field("", alias="GOOGLE_CLIENT_SECRET")

    # --- Pydantic V2 Style Config ---
    model_config = SettingsConfigDict(
        env_file=str(env_file),
        env_file_encoding="utf-8",
        populate_by_name=True,  # allow using field names
        case_sensitive=False,   # allow uppercase in .env
        extra="ignore",  # ignore extra fields in .env
    )

try:
    settings = Settings()
except Exception as e:
    print("\n" + "="*60)
    print("[ERROR] Failed to load settings from .env file!")
    print("="*60)
    print(f"Error: {e}")
    print(f"\n.env file location: {env_file}")
    print("\nRequired environment variables:")
    print("  - SECRET_KEY")
    print("  - FERNET_KEY")
    print("  - GROQ_API_KEY")
    print("  - GOOGLE_CLIENT_ID (optional)")
    print("  - GOOGLE_CLIENT_SECRET (optional)")
    print("\nTo fix this:")
    print("  1. Run the setup script: python setup.py")
    print("  2. Or check your .env file has all required variables")
    print("="*60 + "\n")
    sys.exit(1)
