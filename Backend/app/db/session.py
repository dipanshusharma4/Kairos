import motor.motor_asyncio
from beanie import init_beanie
from ..core.config import settings
from .models import User, ChatMessage, ConversationState # Import all your models

async def init_db():
    """
    Initializes the Beanie ODM with the MongoDB client and registers all Document models.
    This function should be called on application startup.
    """
    print("Attempting to connect to the database...")
    
    try:
        # Create the MongoDB client
        client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongodb_url, serverSelectionTimeoutMS=5000)
        
        # Test the connection
        await client.admin.command('ping')
        
        # Get the database object
        database = client[settings.mongodb_db]

        # Initialize beanie with the database and all your models
        await init_beanie(
            database=database,
            document_models=[
                User,
                ChatMessage,
                ConversationState
            ]
        )
        print("[OK] Database initialized successfully.")
    except Exception as e:
        print(f"[ERROR] Failed to connect to MongoDB: {e}")
        print(f"       MongoDB URL: {settings.mongodb_url}")
        print(f"       Database: {settings.mongodb_db}")
        print("\n       Make sure MongoDB is running:")
        print("       - On Windows: Start MongoDB service or run 'mongod'")
        print("       - On Linux/Mac: Run 'mongod' or 'sudo systemctl start mongod'")
        print("       - Or check your MONGODB_URL in .env file")
        raise
