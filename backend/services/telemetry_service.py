import asyncio
import logging
import asyncpg
from datetime import datetime

logger = logging.getLogger(__name__)

class TelemetryService:
    def __init__(self, db_uri: str):
        self.db_uri = db_uri
        self.pool = None

    async def connect(self):
        """Initializes the connection pool and creates the telemetry table if it doesn't exist."""
        try:
            self.pool = await asyncpg.create_pool(self.db_uri)
            async with self.pool.acquire() as conn:
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS analysis_telemetry (
                        id SERIAL PRIMARY KEY,
                        latitude DOUBLE PRECISION NOT NULL,
                        longitude DOUBLE PRECISION NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                """)
            logger.info("Telemetry database connected and table ensured.")
        except Exception as e:
            logger.error(f"Failed to connect to telemetry database: {e}")
            # raise

    async def log_analysis(self, lat: float, lng: float):
        """Logs the coordinates of an analysis request."""
        if not self.pool:
            logger.warning("Telemetry pool not initialized. Skipping log.")
            return

        try:
            async with self.pool.acquire() as conn:
                await conn.execute(
                    "INSERT INTO analysis_telemetry (latitude, longitude) VALUES ($1, $2)",
                    lat, lng
                )
            logger.info(f"Logged telemetry: lat={lat}, lng={lng}")
        except Exception as e:
            logger.error(f"Error logging telemetry: {e}")

    async def close(self):
        """Closes the connection pool."""
        if self.pool:
            await self.pool.close()
            logger.info("Telemetry database connection closed.")
