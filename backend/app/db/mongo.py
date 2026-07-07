import os
from motor.motor_asyncio import AsyncIOMotorClient

client = None
db = None

async def init_db():
    global client, db
    mongo_uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
    db_name = os.environ.get("MONGODB_DB_NAME", "interviewai")
    
    client = AsyncIOMotorClient(mongo_uri)
    db = client[db_name]
    
    # Create indexes
    await db.sessions.create_index("_id")
    await db.transcripts.create_index("session_id")
    
async def close_db():
    global client
    if client:
        client.close()
